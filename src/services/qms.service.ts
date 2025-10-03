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
    cameraId: "218",
  };

  protected static triggerQMSVisitService = async (): Promise<{
    visit_id: number;
    visitor_id: number | null;
    gender: string | null;
    age_group: string | null;
  }> => {
    try {
      // Step 1: Capture image from camera
      // const base64Image = await this.captureCameraImage();

      // if (!base64Image) {
      //    throw new HttpException(STATUS.BAD_REQUEST, "Failed to capture image from camera");
      // }

      // // Step 2: Upload image to Cloudinary
      // const cloudinaryUrl = await this.uploadImageToCloudinary(base64Image);

      // if (!cloudinaryUrl) {
      //    throw new HttpException(STATUS.BAD_REQUEST, "Failed to upload image to Cloudinary");
      // }

      // Step 3: Analyze image with AI to get gender and age group
      // const aiAnalysis = await this.analyzeImageWithAI(cloudinaryUrl);

      // Step 4: Check if visitor exists in system (simplified logic)
      // const visitor_id = await this.findOrCreateVisitor(aiAnalysis);

      // Step 5: Create initial visit record
      // const visitRecord = await db.qms_history.create({
      //    data: {
      //       visitor_id: visitor_id,
      //       gender: aiAnalysis.gender,
      //       age_group: aiAnalysis.age_group,
      //       entry_image: cloudinaryUrl,
      //       entry_camera: this.HIK_CONFIG.cameraId,
      //       entry_mode: "AI_Detection",
      //       entry_date: new Date(),
      //       entry_time: new Date(),
      //       status: "Active",
      //       createdAt: new Date(),
      //       updatedAt: new Date()
      //    }
      // });

      const visitRecord = await db.qms_history.create({
        data: {
          visitor_id: 123,
          gender: '1',
          age_group: '3',
          entry_image: null,
          entry_camera: '218',
          entry_mode: 'happy',
          entry_date: "2025-09-17",
          entry_time: "09:00:00",
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
          exit_date: '2025-09-17',
          exit_time: '09:00:00',
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

  protected static viewQMSHistoryService = async () => {
    try {
      const results = await db.qms_history.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return results;
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
        { cameraIndexCode: this.HIK_CONFIG.cameraId }
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
          `[QMSService] HIK Vision API returned unsuccessful response for camera: ${this.HIK_CONFIG.cameraId}`
        );
        return null;
      }
    } catch (error: any) {
      console.error(
        `[QMSService] Failed to get camera image for camera: ${this.HIK_CONFIG.cameraId}`,
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
      const publicId = `qms/visitor-entry/${
        this.HIK_CONFIG.cameraId
      }_${Date.now()}`;

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

  private static async analyzeImageWithAI(cloudinaryUrl: string): Promise<{
    gender: string | null;
    age_group: string | null;
  }> {
    try {
      const GEMINI_API_KEY = "AIzaSyAc6TkgL2AfKiPqcsVYf2JJC5VhF5vuNjM";
      const MODEL = "gemini-2.5-flash";
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      const prompt = `*VISITOR DEMOGRAPHIC ANALYSIS REQUEST (JSON OUTPUT)*

*Objective:* Analyze the provided image to determine the visitor's gender and age group. The final output MUST be a JSON object containing the gender and age group.

*Image Link:* ${cloudinaryUrl}

*OUTPUT FORMAT:*
The response must be a single JSON object structured exactly as follows:

{
  "gender": "[Male, Female, or Unknown]",
  "age_group": "[Child (0-12), Teenager (13-17), Young Adult (18-30), Middle Age (31-50), Senior (51-65), Elderly (65+), or Unknown]",
  "confidence_score": "[0-100]",
  "rationale": "[Brief explanation of the analysis]"
}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
      };

      const response = await axios.post(geminiApiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content
      ) {
        const geminiResponse =
          response.data.candidates[0].content.parts[0].text;

        try {
          let cleanResponse = geminiResponse;
          if (cleanResponse.includes("```json")) {
            cleanResponse = cleanResponse
              .split("```json")[1]
              .split("```")[0]
              .trim();
          } else if (cleanResponse.includes("```")) {
            cleanResponse = cleanResponse
              .split("```")[1]
              .split("```")[0]
              .trim();
          }

          const parsedResponse = JSON.parse(cleanResponse);
          return {
            gender: parsedResponse.gender || "Unknown",
            age_group: parsedResponse.age_group || "Unknown",
          };
        } catch (parseError) {
          console.warn(
            "[QMSService] Failed to parse Gemini response as JSON, using defaults"
          );
          return {
            gender: "Unknown",
            age_group: "Unknown",
          };
        }
      }

      return {
        gender: "Unknown",
        age_group: "Unknown",
      };
    } catch (error: any) {
      console.error(
        "[QMSService] Error analyzing image with AI:",
        error.message
      );
      return {
        gender: "Unknown",
        age_group: "Unknown",
      };
    }
  }

  private static async findOrCreateVisitor(aiAnalysis: {
    gender: string | null;
    age_group: string | null;
  }): Promise<number | null> {
    try {
      // For now, we'll return null as visitor_id since we don't have a visitor management system
      // In a real implementation, you would:
      // 1. Check if a visitor with similar demographics exists
      // 2. Create a new visitor record if not found
      // 3. Return the visitor ID

      // This is a placeholder implementation
      return null;
    } catch (error: any) {
      console.error(
        "[QMSService] Error finding or creating visitor:",
        error.message
      );
      return null;
    }
  }
}

export default QMSService;
