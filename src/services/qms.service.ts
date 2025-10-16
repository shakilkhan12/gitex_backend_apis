import {
  QMSTriggerType,
  QMSUpdateType,
  QMSHistoryType,
  STATUS,
} from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import https from "https";
import * as nodeCrypto from "crypto";
import EventBufferService from "./event-buffer.service";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class QMSService {
  private static readonly HIK_CONFIG = {
    baseURL: "https://10.70.90.183:443",
    appKey: "59315117",
    appSecret: "YuWS8qCb61xbD8fEbwFJ",
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

      // const faceData = event.data?.dataType === 'faceMatch' 
      //   ? event.data.alarmResult?.faces 
      //   : null;
      
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
            console.log(`[QMSService] Created guest user: ${guestUser.emp__eng_name} (ID: ${personId})`);
          } catch (error: any) {
            console.error('[QMSService] Failed to create guest user:', error.message);
          }
        }
      } else {
        try {
          const guestUser = await this.createGuestUser(gender, faceImageUrl);
          personId = guestUser.Id;
          console.log(`[QMSService] Created guest user for unknown person: ${guestUser.emp__eng_name} (ID: ${personId})`);
        } catch (error: any) {
          console.error('[QMSService] Failed to create guest user for unknown person:', error.message);
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
      let cloudinaryUrl = null;

      if (base64Image) {
        cloudinaryUrl = await this.uploadImageToCloudinary(base64Image);
        if (!cloudinaryUrl) {
          cloudinaryUrl = eventData?.check_in_image || null;
        }
      } else {
        cloudinaryUrl = eventData?.check_in_image || null;
      }

      let entrySentiment = 'neutral';
      if (cloudinaryUrl) {
        try {
          entrySentiment = await this.analyzeSentimentFromImage(cloudinaryUrl);
          console.log(`[QMSService] Entry sentiment analyzed: ${entrySentiment}`);
        } catch (error: any) {
          console.error(`[QMSService] Error analyzing entry sentiment:`, error.message);
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
          entry_image: cloudinaryUrl,
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
      // Find the existing visit record
      const existingVisit = await db.qms_history.findUnique({
        where: { visit_id: updateData.visit_id },
      });

      if (!existingVisit) {
        throw new HttpException(STATUS.NOT_FOUND, "Visit record not found");
      }

      // Update the visit record with ticket details
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
      console.log(error);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to update QMS visit");
    }
  };

  protected static viewQMSHistoryService = async (
    page: number = 1,
    limit: number = 200,
    fromDateTime?: string,
    toDateTime?: string
  ) => {
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (fromDateTime || toDateTime) {
        whereClause.createdAt = {};

        if (fromDateTime) {
          whereClause.createdAt.gte = new Date(fromDateTime);
        }

        if (toDateTime) {
          whereClause.createdAt.lte = new Date(toDateTime);
        }
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
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        db.qms_history.count({
          where: whereClause,
        }),
        // Total customers (unique visit_id count)
        db.qms_history
          .groupBy({
            by: ["visit_id"],
            where: whereClause,
          })
          .then((groups) => groups.length),
        // In customers (Active status)
        db.qms_history.count({
          where: {
            ...whereClause,
            status: "Active",
          },
        }),
        // Out customers (Completed status)
        db.qms_history.count({
          where: {
            ...whereClause,
            status: "Completed",
          },
        }),
        // Unique services
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
        // Service counts for most highlighted service
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

      // Fetch camera details for each result
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

          // Fetch entry camera details if entry_camera exists
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

          // Fetch exit camera details if exit_camera exists
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

          return {
            ...record,
            entryCamera,
            exitCamera
          };
        })
      );

      const totalPages = Math.ceil(totalCount / limit);
      const totalServices = uniqueServices.length;
      const mostHighlightedService =
        serviceCounts.length > 0 ? serviceCounts[0] : null;

      return {
        data: resultsWithCameraDetails,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        stats: {
          totalCustomer: totalCustomers,
          inCustomer: inCustomers,
          outCustomer: outCustomers,
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
        console.warn(
          `[QMSService] HIK Vision API returned unsuccessful response for camera: ${this.CAMERA_ID}`
        );
        return null;
      }
    } catch (error: any) {
      console.error(
        `[QMSService] Failed to get camera image for camera: ${this.CAMERA_ID}`,
        error.message
      );
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
      console.error(`[QMSService] HikVision API call failed:`, error.message);
      throw error;
    }
  }

  private static async uploadImageToCloudinary(
    base64Image: string
  ): Promise<string | null> {
    try {
      const publicId = `qms/visitor-entry/${this.CAMERA_ID}_${Date.now()}`;

      const result = await cloudinary.uploader.upload(base64Image, {
        public_id: publicId,
        resource_type: "image",
        format: "jpg",
        quality: "auto",
        fetch_format: "auto",
        folder: "qms",
      });

      return result.secure_url;
    } catch (error: any) {
      console.error(
        `[QMSService] Error uploading image to Cloudinary:`,
        error.message
      );
      return null;
    }
  }

  private static async analyzeSentimentFromImage(imageUrl: string): Promise<string> {
    try {
      console.log(`[QMSService] Analyzing sentiment from image: ${imageUrl}`);
      
      const emotionResponse = await axios.post('http://127.0.0.1:8001/api/emotion-detection', {
        image_url: imageUrl
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (emotionResponse.data?.success && emotionResponse.data?.faces?.length > 0) {
        const detectedSentiment = emotionResponse.data.faces[0].emotion;
        console.log(`[QMSService] Detected sentiment: ${detectedSentiment}`, {
          confidence: emotionResponse.data.faces[0].confidence,
          imageUrl: imageUrl
        });
        return detectedSentiment;
      } else {
        console.warn(`[QMSService] No sentiment detected from image: ${imageUrl}`);
        return 'neutral';
      }
    } catch (error: any) {
      console.error(`[QMSService] Error analyzing sentiment from image: ${imageUrl}`, error.message);
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
      console.error('[QMSService] Error creating guest user:', error.message);
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
      console.error(
        `[QMSService] Error fetching sentiment analysis events:`,
        error
      );
      return null;
    }
  }
}

export default QMSService;
