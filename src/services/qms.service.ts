import {
  QMSTriggerType,
  QMSUpdateType,
  QMSHistoryType,
  STATUS,
} from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import axios from "axios";
import { formatImageUrlsInArray, formatImageUrl } from "@/utils/imageUrl.utils";
import https from "https";
import * as nodeCrypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import EventBufferService from "./event-buffer.service";

class QMSService {
  private static readonly HIK_CONFIG = {
    baseURL: "https://10.70.90.183:443",
    appKey: "59315117",
    appSecret: "YuWS8qCb61xbD8fEbwFJ",
  };

  private static readonly API_CONFIG = {
    emotionDetectionUrl: process.env.EMOTION_DETECTION_URL as string,
    localHostUrl: process.env.LOCAL_HOST_API as string
  };

  private static readonly CAMERA_ID = "360";

  private static readonly QMS_SRC_INDEXES = ["360"];

  private static async getEventDataFromStream(): Promise<any | null> {
    try {
      const event = EventBufferService.getLatestEventFromMultipleSources(
        this.QMS_SRC_INDEXES,
        60
      );

      if (!event) {
        return null;
      }

      const faceData = event.data?.alarmResult?.faces 

      if (!faceData) {
        return null;
      }

      const candidate = faceData.identify?.candidate;
      const personName = candidate?.reserve_field?.name || null;
      const humanId = candidate?.human_id || null;
      const similarity = candidate?.similarity || 0;
      const ageGroupCode = faceData.age?.ageGroup;
      const genderCode = faceData.gender?.value;
      const gender = genderCode === 1 ? 'Male' : genderCode === 2 ? 'Female' : 'Unknown';
      const faceImageUrl = faceData.URL || candidate?.human_data?.face_pic_url || null;

      let personId = null;

      if (humanId && humanId !== "-1") {
        const user = await db.users.findFirst({
          where: { unique_id: humanId.toString() }
        });

        if (user) {
          personId = user.Id;
        } else {
          try {
            const guestUser = await this.createGuestUser(gender, faceImageUrl);
            personId = guestUser.Id;
          } catch (error: any) {
          }
        }
      } else {
        try {
          const guestUser = await this.createGuestUser(gender, faceImageUrl);
          personId = guestUser.Id;
        } catch (error: any) {
        }
      }

      return {
        person_id: personId,
        person_name: personName,
        gender: gender,
        age_group: ageGroupCode ? ageGroupCode.toString() : null,
        similarity: similarity,
        check_in_image: faceImageUrl,
        entry_date: new Date(event.timestamp).toISOString().split('T')[0],
        entry_time: new Date(event.timestamp).toISOString().split('T')[1].split('.')[0],
        srcIndex: event.srcIndex,
        srcName: event.srcName,
      };
    } catch (error: any) {
      return null;
    }
  }

  protected static triggerQMSVisitService = async (): Promise<{
    visit_id: number;
    visitor_id: number | null;
    gender: string | null;
    age_group: string | null;
  } | null> => {
    try {
      const eventData = await this.getEventDataFromStream();
      
      if (!eventData) {
        return null;
      }

      const base64Image = await this.captureCameraImage();
      let imageUrl = null;

      if (base64Image) {
        try {
          const eventId = `qms_${Date.now()}`;
          imageUrl = await this.saveImageLocally(base64Image, 'qms', eventId);
        } catch (error: any) {
          if (eventData?.check_in_image) {
            try {
              const imageResponse = await axios.get(eventData.check_in_image, {
                responseType: 'arraybuffer',
                timeout: 10000
              });
              if (imageResponse.status === 200) {
                const base64ImageData = Buffer.from(imageResponse.data).toString('base64');
                const dataUrl = `data:image/jpeg;base64,${base64ImageData}`;
                const eventId = `qms_${Date.now()}`;
                imageUrl = await this.saveImageLocally(dataUrl, 'qms', eventId);
              }
            } catch (fetchError: any) {
              imageUrl = null;
            }
          }
        }
      } else if (eventData?.check_in_image) {
        try {
          const imageResponse = await axios.get(eventData.check_in_image, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          if (imageResponse.status === 200) {
            const base64ImageData = Buffer.from(imageResponse.data).toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64ImageData}`;
            const eventId = `qms_${Date.now()}`;
            imageUrl = await this.saveImageLocally(dataUrl, 'qms', eventId);
          }
        } catch (fetchError: any) {
          imageUrl = null;
        }
      }

      let entrySentiment = 'neutral';
      if (imageUrl) {
        try {
          entrySentiment = await this.analyzeSentimentFromImage(imageUrl);
        } catch (error: any) {
          entrySentiment = eventData?.mood || 'neutral';
        }
      } else {
        entrySentiment = eventData?.mood || 'neutral';
      }

      const visitRecord = await db.qms_history.create({
        data: {
          visitor_id: eventData?.person_id || 123,
          gender: eventData?.gender,
          age_group: eventData?.age_group || "7",
          entry_image: imageUrl,
          entry_camera: this.CAMERA_ID,
          entry_mode: entrySentiment,
          entry_date:
            eventData?.entry_date || new Date().toISOString().split("T")[0],
          entry_time:
            eventData?.entry_time ||
            new Date().toISOString().split("T")[1].split(".")[0],
          status: "Active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        visit_id: visitRecord.visit_id,
        visitor_id: visitRecord.visitor_id,
        gender: visitRecord.gender,
        age_group: visitRecord.age_group,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Failed to trigger QMS visit"
      );
    }
  };

  protected static updateQMSVisitService = async (
    updateData: QMSUpdateType
  ) => {
    try {
      const existingVisit = await db.qms_history.findUnique({
        where: { visit_id: updateData.visit_id },
      });

      if (!existingVisit) {
        throw new HttpException(STATUS.NOT_FOUND, "Visit record not found");
      }

      const updatedVisit = await db.qms_history.update({
        where: { visit_id: updateData.visit_id },
        data: {
          ticket_number: updateData.ticket_number,
          service_english_name: updateData.service_english_name,
          service_arabic_name: updateData.service_arabic_name,
          agent_english_name: updateData.agent_english_name,
          agent_arabic_name: updateData.agent_arabic_name,
          ticket_date: updateData.ticket_date,
          issue_time: updateData.issue_time,
          processing_start_time: updateData.processing_start_time,
          processing_end_time: updateData.processing_end_time,
          waiting_time: updateData.waiting_time,
          total_processing_time: updateData.total_processing_time,
          exit_date: updateData.exit_date || '',
          exit_time: updateData.exit_time || '',
          status: "Completed",
          updatedAt: new Date(),
        },
      });

      return updatedVisit;
    } catch (error: any) {

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to update QMS visit");
    }
  };

  protected static getQMSFiltersService = async () => {
    try {
      const [services, agents, entryModes, exitModes] = await Promise.all([
        db.qms_history.findMany({
          where: { service_english_name: { not: null } },
          select: { service_english_name: true, service_arabic_name: true },
          distinct: ["service_english_name"],
          orderBy: { service_english_name: "asc" },
        }),
        db.qms_history.findMany({
          where: {
            OR: [
              { agent_english_name: { not: null } },
              { agent_arabic_name: { not: null } },
            ],
          },
          select: { agent_english_name: true, agent_arabic_name: true },
          distinct: ["agent_english_name"],
          orderBy: { agent_english_name: "asc" },
        }),
        db.qms_history.findMany({
          where: { entry_mode: { not: null } },
          select: { entry_mode: true },
          distinct: ["entry_mode"],
          orderBy: { entry_mode: "asc" },
        }),
        db.qms_history.findMany({
          where: { exit_mode: { not: null } },
          select: { exit_mode: true },
          distinct: ["exit_mode"],
          orderBy: { exit_mode: "asc" },
        }),
      ]);

      return {
        success: true,
        data: {
          services: services
            .filter((s) => s.service_english_name)
            .map((s) => ({
              english: s.service_english_name,
              arabic: s.service_arabic_name || s.service_english_name,
            })),
          agents: agents
            .filter((a) => a.agent_english_name || a.agent_arabic_name)
            .map((a) => ({
              english: a.agent_english_name || a.agent_arabic_name || "",
              arabic: a.agent_arabic_name || a.agent_english_name || "",
            })),
          entryModes: entryModes
            .filter((e) => e.entry_mode)
            .map((e) => ({ value: e.entry_mode, label: e.entry_mode })),
          exitModes: exitModes
            .filter((e) => e.exit_mode)
            .map((e) => ({ value: e.exit_mode, label: e.exit_mode })),
          statuses: [
            { value: "Active", label: "Active" },
            { value: "Completed", label: "Completed" },
          ],
        },
      };
    } catch (error: any) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Failed to fetch QMS filters"
      );
    }
  };

  protected static viewQMSHistoryService = async (filters?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    fromDateTime?: string;
    toDateTime?: string;
    entryMode?: string;
    exitMode?: string;
    service?: string;
    agent?: string;
    ticketNumber?: string;
    status?: string;
  }) => {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      const orConditions: any[] = [];

      if (filters?.search) {
        orConditions.push(
          { ticket_number: { contains: filters.search } },
          { service_english_name: { contains: filters.search } },
          { service_arabic_name: { contains: filters.search } },
          { agent_english_name: { contains: filters.search } },
          { agent_arabic_name: { contains: filters.search } }
        );
      }

      if (filters?.fromDateTime || filters?.toDateTime) {
        whereClause.entry_date = {};
        if (filters.fromDateTime) {
          whereClause.entry_date.gte = new Date(filters.fromDateTime).toISOString().split('T')[0];
        }
        if (filters.toDateTime) {
          whereClause.entry_date.lte = new Date(filters.toDateTime).toISOString().split('T')[0];
        }
      }

      if (filters?.entryMode && filters.entryMode !== 'All') {
        whereClause.entry_mode = filters.entryMode;
      }

      if (filters?.exitMode && filters.exitMode !== 'All') {
        whereClause.exit_mode = filters.exitMode;
      }

      if (filters?.service && filters.service !== 'All') {
        whereClause.service_english_name = filters.service;
      }

      if (filters?.agent && filters.agent !== 'All') {
        whereClause.OR = [
          { agent_english_name: filters.agent },
          { agent_arabic_name: filters.agent }
        ];
      }

      if (filters?.ticketNumber && filters.ticketNumber.trim() !== '') {
        whereClause.ticket_number = { contains: filters.ticketNumber };
      }

      if (filters?.status && filters.status !== 'All') {
        whereClause.status = filters.status;
      }

      if (orConditions.length > 0) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({ OR: orConditions });
      }

      const orderByClause: any = {};
      if (filters?.sortBy) {
        const sortField = filters.sortBy === 'createdAt' ? 'createdAt' : 
                         filters.sortBy === 'id' ? 'createdAt' : 
                         filters.sortBy === 'entry_date' ? 'entry_date' :
                         filters.sortBy === 'exit_date' ? 'exit_date' :
                         filters.sortBy === 'ticket_number' ? 'ticket_number' :
                         filters.sortBy === 'service_english_name' ? 'service_english_name' :
                         filters.sortBy === 'status' ? 'status' : 'createdAt';
        orderByClause[sortField] = filters.sortOrder === 'asc' ? 'asc' : 'desc';
      } else {
        orderByClause.createdAt = 'desc';
      }
      const [
        results,
        totalCount,
        totalCustomers,
        inCustomers,
        outCustomers,
        uniqueServices,
        serviceCounts,
      ] = await Promise.all([
        db.qms_history.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take: limit,
        }),
        db.qms_history.count({
          where: whereClause,
        }),
        db.qms_history
          .groupBy({
            by: ["visit_id"],
            where: whereClause,
          })
          .then((groups) => groups.length),
        db.qms_history
          .groupBy({
            by: ["visit_id"],
            where: {
              ...whereClause,
              status: "Active",
            },
          })
          .then((groups) => groups.length),
        db.qms_history
          .groupBy({
            by: ["visit_id"],
            where: {
              ...whereClause,
              status: "Completed",
            },
          })
          .then((groups) => groups.length),
        db.qms_history.findMany({
          where: {
            ...whereClause,
            service_english_name: {
              not: null,
            },
          },
          select: {
            service_english_name: true,
          },
          distinct: ["service_english_name"],
        }),
        db.qms_history.groupBy({
          by: ["service_english_name"],
          where: {
            ...whereClause,
            service_english_name: {
              not: null,
            },
          },
          _count: {
            service_english_name: true,
          },
          orderBy: {
            _count: {
              service_english_name: "desc",
            },
          },
        }),
      ]);

      const resultsWithCameraDetails = await Promise.all(
        results.map(async (record) => {
          let entryCamera = {
            camera_Id: record?.entry_camera || null,
            camera_english_name: null as string | null,
            camera_arabic_name: null as string | null
          };
          let exitCamera = {
            camera_Id: record?.exit_camera || null,
            camera_english_name: null as string | null,
            camera_arabic_name: null as string | null
          };

          if (record.entry_camera) {
            const entryCam = await db.offices_cameras.findFirst({
              where: { camera_Id: record.entry_camera },
              select: {
                camera_Id: true,
                camera_english_name: true,
                camera_arabic_name: true
              }
            });
            if (entryCam) {
              entryCamera = entryCam;
            }
          }

          if (record.exit_camera) {
            const exitCam = await db.offices_cameras.findFirst({
              where: { camera_Id: record.exit_camera },
              select: {
                camera_Id: true,
                camera_english_name: true,
                camera_arabic_name: true
              }
            });
            if (exitCam) {
              exitCamera = exitCam;
            }
          }

          // Fetch visitor/user details
          let visitor = null;
          if (record.visitor_id) {
            const visitorData = await db.users.findUnique({
              where: { Id: record.visitor_id },
              select: {
                Id: true,
                emp__eng_name: true,
                emp__arabic_name: true,
                emp_Id: true,
                image: true,
                gender: true,
                dep_eng_name: true,
                dep_arabic_name: true
              }
            });
            if (visitorData) {
              // Format visitor image URL
              const formattedImage = formatImageUrl(visitorData.image);
              visitor = {
                ...visitorData,
                image: formattedImage
              };
            }
          }

          return {
            ...record,
            entryCamera,
            exitCamera,
            visitor
          };
        })
      );

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;
      const totalServices = uniqueServices.length;
      const mostHighlightedService =
        serviceCounts.length > 0 ? serviceCounts[0] : null;

      const paginationData = {
          currentPage: page,
          totalPages,
          totalCount,
        limit: limit,
        hasNextPage,
        hasPreviousPage,
        nextPage: hasNextPage ? page + 1 : null,
        previousPage: hasPreviousPage ? page - 1 : null
      };

      const imageFields = ['entry_image', 'exit_image'];
      const formattedResultsWithImages = formatImageUrlsInArray(resultsWithCameraDetails, imageFields);
      return {
        success: true,
        data: formattedResultsWithImages,
        total: totalCount,
        pagination: paginationData,
        stats: {
          totalCustomers: totalCustomers,
          inCustomers: inCustomers,
          outCustomers: outCustomers,
          totalServices,
          mostHighlightedService: mostHighlightedService
            ? {
                serviceName: mostHighlightedService.service_english_name,
                count: mostHighlightedService._count.service_english_name,
              }
            : null,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Failed to fetch QMS history"
      );
    }
  };

  private static async captureCameraImage(): Promise<string | null> {
    try {
      const response = await this.callHikVisionAPI(
        this.HIK_CONFIG.baseURL,
        "/artemis/api/video/v1/camera/capture",
        this.HIK_CONFIG.appKey,
        this.HIK_CONFIG.appSecret,
        { cameraIndexCode: this.CAMERA_ID }
      );

      if (
        response &&
        response.code === "0" &&
        response.msg === "Success" &&
        response.data
      ) {
        return response.data;
      } else {
       
        return null;
      }
    } catch (error: any) {
      throw error;
    }
  }

  private static async callHikVisionAPI(
    baseUrl: string,
    endpoint: string,
    appKey: string,
    appSecret: string,
    requestData: any
  ) {
    try {
      const method = "POST";
      const accept = "*/*";
      const contentType = "application/json;charset=UTF-8";
      const timestamp = Date.now();
      const nonce = nodeCrypto.randomUUID();

      const requestBody = JSON.stringify(requestData);

      const bodyBytes = Buffer.from(requestBody, "utf-8");
      const md5Hash = nodeCrypto.createHash("md5").update(bodyBytes).digest();
      const contentMD5 = md5Hash.toString("base64");

      const date = new Date().toUTCString();

      const customHeaders: { [key: string]: string } = {
        "x-ca-key": appKey,
        "x-ca-timestamp": timestamp.toString(),
        "x-ca-nonce": nonce,
      };

      const sortedHeaderKeys = Object.keys(customHeaders).sort();

      let signatureString = `${method}\n${accept}\n${contentMD5}\n${contentType}\n${date}\n`;
      for (const key of sortedHeaderKeys) {
        signatureString += `${key}:${customHeaders[key]}\n`;
      }
      signatureString += endpoint;

      const hmac = nodeCrypto.createHmac("sha256", appSecret);
      hmac.update(signatureString, "utf-8");
      const signature = hmac.digest("base64");

      const headers = {
        Accept: accept,
        "Content-Type": contentType,
        "Content-MD5": contentMD5,
        Date: date,
        "X-Ca-Key": appKey,
        "X-Ca-Signature": signature,
        "X-Ca-Signature-Headers": sortedHeaderKeys.join(","),
        "X-Ca-Timestamp": timestamp.toString(),
        "X-Ca-Nonce": nonce,
      };

      const response = await axios({
        method,
        url: `${baseUrl}${endpoint}`,
        headers,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        data: requestBody,
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  private static detectImageFormat(base64Image: string): string {
    try {
      const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      if (buffer.length >= 4) {
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          return 'jpg';
        }
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          return 'png';
        }
        if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
          return 'gif';
        }
        if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
          return 'bmp';
        }
        if (buffer.length >= 12 && 
            buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
          return 'webp';
        }
      }
      
      return 'jpg';
    } catch (error: any) {
      return 'jpg'; 
    }
  }

  private static async saveImageLocally(base64Image: string, eventType: string, eventId: string): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', eventType);
      
      let cleanBase64 = base64Image.trim();
      
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }
      
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        throw new Error('Invalid base64 format detected');
      }
      
      const imageFormat = this.detectImageFormat(cleanBase64);
      const fileName = `${eventId}_${Date.now()}.${imageFormat}`;
      const filePath = path.join(uploadDir, fileName);
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const imageBuffer = Buffer.from(cleanBase64, 'base64');
      
      if (imageBuffer.length === 0) {
        throw new Error('Empty image buffer after base64 decoding');
      }
      
      fs.writeFileSync(filePath, imageBuffer);
      
      const imageUrl = `/uploads/${eventType}/${fileName}`;
      
      return imageUrl;
    } catch (error: any) {
      throw error;
    }
  }

  private static async analyzeSentimentFromImage(imageUrl: string): Promise<string> {
    try {
      const fullImageUrl = `${this.API_CONFIG.localHostUrl}${imageUrl}`;
      const emotionResponse = await axios.post(this.API_CONFIG.emotionDetectionUrl, {
        image_url: fullImageUrl
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (emotionResponse.data?.success && emotionResponse.data?.faces?.length > 0) {
        const detectedSentiment = emotionResponse.data.faces[0].emotion;
        return detectedSentiment;
      } else {
        return 'neutral';
      }
    } catch (error: any) {
      return 'neutral';
    }
  }

  private static async createGuestUser(gender: string, faceImageUrl: string | null): Promise<any> {
    try {
      const lastGuest = await db.users.findFirst({
        where: {
          emp__eng_name: {
            startsWith: 'Guest'
          }
        },
        orderBy: {
          Id: 'desc'
        }
      });

      let guestNumber = 1;
      if (lastGuest && lastGuest.emp__eng_name) {
        const match = lastGuest.emp__eng_name.match(/Guest(\d+)/);
        if (match) {
          guestNumber = parseInt(match[1]) + 1;
        }
      }

      const guestName = `Guest${guestNumber}`;

      const guestUser = await db.users.create({
        data: {
          user_Id: null,
          emp_Id: null,
          emp_code: null,
          image: null,
          gender: gender,
          emp__eng_name: guestName,
          location: null,
          telephone: null,
          email: null,
          office_extension: null,
          nationality: null,
          joining_date: null,
          date_of_birth: null,
          dep_eng_name: null,
          desig_eng_name: null,
          unit_arabic_name: null,
          is_attendance_user: false,
          is_ai_login_user: false,
          ai_engine_access: false,
          unique_id: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return guestUser;
    } catch (error: any) {
      throw error;
    }
  }

  private static async getQMSEvents(cameraId: string): Promise<any | null> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const cameraEvents = await db.offices_sentiment_analysis.findFirst({
        where: {
          entry_camera_Id: parseInt(cameraId),
          createdAt: {
            lte: now,
            gte: fifteenMinutesAgo,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      });

      if (cameraEvents) {
        return {
          gender: cameraEvents.gender || "Unknown",
          cameraId: cameraEvents.entry_camera_Id,
          check_in_image: cameraEvents.check_in_image || null,
          person_id: cameraEvents.person_Id,
          age_group: null,
          mood: cameraEvents.check_in_sentiment || "neutral",
          entry_date: cameraEvents.check_in_date
            ? new Date(cameraEvents.check_in_date).toISOString().split("T")[0]
            : null,
          entry_time: cameraEvents.check_in_time
            ? new Date(cameraEvents.check_in_time)
                .toISOString()
                .split("T")[1]
                .split(".")[0]
            : null,
          event_type: "sentiment",
        };
      }

      return null;
    } catch (error: any) {
      return null;
    }
  }
}

export default QMSService;
