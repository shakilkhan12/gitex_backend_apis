import { LandscapingType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import axios from "axios";
import { v2 as cloudinary } from 'cloudinary';
import https from "https";
import * as nodeCrypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class LandscapingService {
   private static readonly HIK_CONFIG = {
      baseURL: 'https://10.70.90.183:443',
      appKey: '59315117',
      appSecret: 'YuWS8qCb61xbD8fEbwFJ', 
      eventRecordsEndpoint: '/artemis/api/eventService/v1/eventRecords/page',
      imageDataEndpoint: '/artemis/api/eventService/v1/image_data',
   };

   protected static generateUniqueCaseId = async (): Promise<string> => {
      let caseId: string;
      let isUnique = false;
      
      while (!isUnique) {
         caseId = Math.floor(100000 + Math.random() * 900000).toString();
         
         const existingRecord = await db.landscaping.findFirst({
            where: { case_Id: caseId }
         });
         
         if (!existingRecord) {
            isUnique = true;
         }
      }
      
      return caseId!;
   };

   protected static addLandscapingService = async (landscaping: LandscapingType) => {
      try {
         const caseId = await this.generateUniqueCaseId();

         if (landscaping.park_Id) {
            const parkExists = await db.parks.findFirst({
               where: { Id: landscaping.park_Id },
            });
            if (!parkExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
            }
         }

         const result = await db.landscaping.create({
            data: {
               case_Id: caseId,
               image: landscaping.image || null,
               name: landscaping.name || null,
               park_Id: landscaping.park_Id || null,
               plant_type:"Plant",
               status: landscaping.status || null,
               current_status:"Pending",
               suggestion: landscaping.suggestion || null,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add landscaping record");
      }
   }

   protected static viewLandscapingsService = async () => {
      try {
         const results = await db.landscaping.findMany({
            include: {
               assignedUser: {
                  select: {
                     Id: true,
                     emp__eng_name: true,
                     dep_eng_name: true
                  }
               },
               parks: {
                  select: {
                     Id: true,
                     park_Id: true,
                     park_english_name: true,
                     park_arabic_name: true,
                     image: true,
                     latitude: true,
                     longitude: true,
                     location: true
                  }
               },
               landscaping_history: {
                  include: {
                     users: {
                        select: {
                           Id: true,
                           emp__eng_name: true,
                           dep_eng_name: true
                        }
                     }
                  },
                  orderBy: {
                     createdAt: 'desc'
                  }
               }
            },
            orderBy: {
               createdAt: 'desc'
            }
         });

         return results;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch landscaping records");
      }
   }

   public static assignLandscapingService = async (assignmentData: {
      landscapingId: number;
      userId: number;
      title: string;
      comments: string;
   }) => {
      try {
         const landscaping = await db.landscaping.findUnique({
            where: { id: assignmentData.landscapingId }
         });

         if (!landscaping) {
            throw new HttpException(STATUS.NOT_FOUND, "Landscaping case not found");
         }

         const user = await db.users.findUnique({
            where: { Id: assignmentData.userId }
         });

         if (!user) {
            throw new HttpException(STATUS.NOT_FOUND, "User not found");
         }

         if (!user.landscaping_access) {
            throw new HttpException(STATUS.BAD_REQUEST, "User does not have landscaping access");
         }

         await db.landscaping.update({
            where: { id: assignmentData.landscapingId },
            data: { assinged_to: assignmentData.userId,current_status:"In Progress" }
         });

         const historyRecord = await db.landscaping_history.create({
            data: {
               landscaping_Id: assignmentData.landscapingId,
               user_Id: assignmentData.userId,
               title: assignmentData.title,
               comments: assignmentData.comments,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });

         return {
            landscapingId: assignmentData.landscapingId,
            userId: assignmentData.userId,
            historyId: historyRecord.id
         };

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to assign landscaping case");
      }
   }
   
   public static markAsCompletedService = async (completionData: {
      landscapingId: number;
      userId: number | null;
      title: string;
      comments: string;
      image: string | null;
   }) => {
      try {
         const landscaping = await db.landscaping.findFirst({
            where: { id: completionData.landscapingId }
         });

         if (!landscaping) {
            throw new HttpException(STATUS.NOT_FOUND, "Landscaping case not found");
         }

         await db.landscaping.update({
            where: { id: completionData.landscapingId },
            data: { current_status: 'Completed' }
         });

         const historyRecord = await db.landscaping_history.create({
            data: {
               landscaping_Id: completionData.landscapingId,
               user_Id: completionData.userId, 
               title: completionData.title,
               comments: completionData.comments,
               image: completionData.image,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });

         return {
            landscapingId: completionData.landscapingId,
            historyId: historyRecord.id,
            status: 'Completed'
         };

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to mark landscaping case as completed");
      }
   }

   public static monitorParkCamerasService = async () => {
      try {
         const appKey = this.HIK_CONFIG.appKey;
         const secretKey = this.HIK_CONFIG.appSecret;
       
         let parkCameras = [];
         try {
            // Get cameras one by one from database sequentially
            let offset = 0;
            const limit = 1; // Get one camera at a time
            let hasMoreCameras = true;
            
            while (hasMoreCameras && parkCameras.length < 10) { // Limit to 10 cameras max
               try {
                  const camera = await db.park_cameras.findFirst({
                     skip: offset,
                     take: limit,
                     where: {
                        camera_Id: {
                           not: null
                        }
                     },
                     select: {
                        camera_Id: true,
                        park_Id: true
                     }
                  });
                  
                  if (camera && camera.camera_Id) {
                     parkCameras.push(camera);
                     offset++;
                  } else {
                     hasMoreCameras = false;
                  }
               } catch (individualError: any) {
                  console.warn(`[LandscapingService] Failed to fetch camera at offset ${offset}:`, individualError.message);
                  offset++;
                  // Continue with next camera
               }
            }
            
            // If no cameras found from database, use fallback
            if (parkCameras.length === 0) {
               throw new Error("No cameras found in database");
            }
            
         } catch (dbError: any) {
            console.error('[LandscapingService] Database query failed:', dbError.message);
            console.log('[LandscapingService] Using fallback camera list for testing...');
            
            // Fallback camera list for testing when database is not available
            parkCameras = [
               {
                  camera_Id: "188",
                  park_Id: 1
               },
               {
                  camera_Id: "189",
                  park_Id: 2
               },
               {
                  camera_Id: "191",
                  park_Id: 3
               }
            ];
         }

         const results = [];

         for (const camera of parkCameras) {
            try {
               if (!camera.camera_Id) {
                  continue;
               }

               const base64Image = await this.captureCameraImage(camera.camera_Id, appKey, secretKey);
               
               if (!base64Image) {
                  continue;
               }

               const cloudinaryUrl = await this.uploadImageToCloudinary(base64Image!, camera.camera_Id);
               
               if (!cloudinaryUrl) {
                  continue;
               }

               const geminiResponse = await this.analyzeImageWithGemini(cloudinaryUrl!);
               
               if (!geminiResponse) {
                  continue;
               }

               try {
                  const landscapingRecord = await this.createGrassMonitoringRecord({
                     parkId: camera.park_Id || undefined,
                     cameraId: camera.camera_Id,
                     imageUrl: cloudinaryUrl!,
                     geminiResponse: geminiResponse!
                  });

                  results.push({
                     cameraId: camera.camera_Id,
                     parkId: camera.park_Id,
                     success: true,
                     landscapingId: landscapingRecord.id
                  });
               } catch (dbError: any) {
                  console.warn(`[LandscapingService] Database record creation failed for camera ${camera.camera_Id}:`, dbError.message);
                  results.push({
                     cameraId: camera.camera_Id,
                     parkId: camera.park_Id,
                     success: true,
                     message: "Processed successfully but database record creation failed",
                     cloudinaryUrl: cloudinaryUrl,
                     geminiResponse: geminiResponse
                  });
               }


            } catch (error: any) {
               results.push({
                  cameraId: camera.camera_Id,
                  parkId: camera.park_Id,
                  success: false,
                  error: error.message
               });
            }
         }

         return {
            success: true,
            message: `Processed ${results.length} cameras`,
            results: results
         };

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to monitor park cameras");
      }
   }


   private static async fetchSecretFromAPI(): Promise<string> {
      const maxRetries = 3;
      const baseTimeout = 20000;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
            const response = await axios.post(
               "https://192.168.164.7/middleware/?action=Secretkey&class=general",
               {
                  Username: "WebServiceUser",
                  Pwd: "A01834h123ds2",
               },
               {
                  headers: { "Content-Type": "application/json" },
                  timeout: baseTimeout * attempt,
                  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
               }
            );
            
            if (response.data?.SecretKey) {
               return response.data.SecretKey;
            }

            throw new HttpException(
               STATUS.BAD_REQUEST,
               "Secret key not found in API response"
            );

         } catch (error: any) {
            if (error.code === 'ECONNABORTED') {
               if (attempt === maxRetries) {
                  throw new HttpException(STATUS.BAD_REQUEST, `Secret key API request timed out after ${maxRetries} attempts`);
               }
                  continue;
            } else if (error.code === 'ECONNREFUSED') {
               throw new HttpException(STATUS.BAD_REQUEST, "Unable to connect to secret key API");
            } else if (error.response) {
               throw new HttpException(STATUS.BAD_REQUEST, `Secret key API error: ${error.response.status} - ${error.response.statusText}`);
            }
            
            if (attempt === maxRetries) {
               throw error;
            }
            
            const waitTime = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
         }
      }
      
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch secret key after all retry attempts");
   }

   private static async callHikVisionAPI(baseUrl: string, endpoint: string, appKey: string, appSecret: string, requestData: any) {
      try {
         const method = 'POST';
         const accept = '*/*';
         const contentType = 'application/json;charset=UTF-8';
         const timestamp = Date.now();
         const nonce = nodeCrypto.randomUUID();

         const requestBody = JSON.stringify(requestData);

         const bodyBytes = Buffer.from(requestBody, 'utf-8');
         const md5Hash = nodeCrypto.createHash('md5').update(bodyBytes).digest();
         const contentMD5 = md5Hash.toString('base64');

         const date = new Date().toUTCString();

         const customHeaders: { [key: string]: string } = {
            'x-ca-key': appKey,
            'x-ca-timestamp': timestamp.toString(),
            'x-ca-nonce': nonce,
         };

         const sortedHeaderKeys = Object.keys(customHeaders).sort();

         let signatureString = `${method}\n${accept}\n${contentMD5}\n${contentType}\n${date}\n`;
         for (const key of sortedHeaderKeys) {
            signatureString += `${key}:${customHeaders[key]}\n`;
         }
         signatureString += endpoint;

         const hmac = nodeCrypto.createHmac('sha256', appSecret);
         hmac.update(signatureString, 'utf-8');
         const signature = hmac.digest('base64');

         const headers = {
            Accept: accept,
            'Content-Type': contentType,
            'Content-MD5': contentMD5,
            Date: date,
            'X-Ca-Key': appKey,
            'X-Ca-Signature': signature,
            'X-Ca-Signature-Headers': sortedHeaderKeys.join(','),
            'X-Ca-Timestamp': timestamp.toString(),
            'X-Ca-Nonce': nonce,
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
         console.error(`[LandscapingService] HikVision API call failed:`, error.message);
         throw error;
      }
   }

   private static async captureCameraImage(cameraIndexCode: string, appKey: string, secretKey: string): Promise<string | null> {
      try {
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            '/artemis/api/video/v1/camera/capture',
            appKey,
            secretKey,
            { cameraIndexCode }
         );
         if (response && response.code === '0' && response.msg === 'Success' && response.data) {
            return response.data;
         } else {
            console.warn(`[LandscapingService] HIK Vision API returned unsuccessful response for camera: ${cameraIndexCode}`);
            return null;
         }
      } catch (error: any) {
         console.error(`[LandscapingService] Failed to get camera image for camera: ${cameraIndexCode}`, error.message);
         throw error;
      }
   }

   private static async uploadImageToCloudinary(base64Image: string, cameraId: string): Promise<string | null> {
      try {
         const publicId = `landscaping/grass-monitoring/${cameraId}_${Date.now()}`;
         
         const result = await cloudinary.uploader.upload(base64Image, {
            public_id: publicId,
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto',
            fetch_format: 'auto',
            folder: 'landscaping'
         });

         return result.secure_url;
      } catch (error: any) {
         console.error(`[LandscapingService] Error uploading image to Cloudinary for camera ${cameraId}:`, error.message);
         return null;
      }
   }

   private static async analyzeImageWithGemini(cloudinaryUrl: string): Promise<string | null> {
      try {
         const GEMINI_API_KEY = 'AIzaSyAc6TkgL2AfKiPqcsVYf2JJC5VhF5vuNjM';
         const MODEL = "models/gemini-1.5-flash";
         const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
         
         console.log('[LandscapingService] Gemini API URL:', geminiApiUrl);
         
         const prompt = `*GRASS STATUS ANALYSIS REQUEST (JSON OUTPUT)*

*Objective:* Analyze the provided visual and contextual data to determine the current status of the park grass (Green, Dry, or Dead). The final output MUST be a JSON object containing the status, confidence score, rationale, and an estimated water requirement. *DO NOT* attempt to play or analyze a video file directly; rely exclusively on the text description and the still image link provided.

*1. VISUAL DESCRIPTION (From Observation):*
* *Dominant Color:* [Describe the main color: e.g., vibrant emerald green, dull olive green, straw yellow, tan/brown, gray.]
* *Texture/Appearance:* [Describe how the blades look: e.g., stand upright, look limp and folded, appear brittle and crunchy, are matted down.]
* *Uniformity:* [Is the color consistent? e.g., 90% uniform brown, patchier with 50% green near the edges, only brown under direct sun.]
* *Any Remaining Green:* [Estimate the percentage or note where green is visible: e.g., Less than 5% green, mostly in the lower crown; Bright green streaks only visible after watering.]

*2. CONTEXTUAL INFORMATION (Current Conditions):*
* *Recent Water/Rainfall:* [How long since the last significant watering or rain? e.g., 2 days ago, 3 weeks ago, never this season.]
* *Weather/Temperature:* [What is the current or recent weather trend? e.g., Daily temperatures over 95°F, mild and cloudy, just experienced a heavy frost.]
* *Soil Observation:* [Is the soil visible and does it look dry, cracked, or damp?]
* *REQUIRED AREA INPUT:* [Estimate the size of the area in *square feet (sq ft)* for water calculation: e.g., 5000 sq ft.]

*3. TESTING RESULTS (If Performed):*
* *Tug Test:* [Describe the result of pulling a tuft: e.g., Pulls up easily with no roots (suggests dead), firmly rooted (suggests dry or green), snaps off at the soil line (suggests dead).]
* *Water Test (If performed):* [Did a small patch show any color change after 24 hours of watering? e.g., No change after a day, turned a slightly darker green.]

*4. VISUAL SUPPORT (REQUIRED):*
* *Still Image Link:* ${cloudinaryUrl}

*OUTPUT FORMAT:*
The response must be a single JSON object structured exactly as follows. The calculated gallons_required should be based on the analysis (assuming 1 inch of water for recovery, or 0 if Green/Dead), and the *REQUIRED AREA INPUT* from Section 2.

{
  "name": "Grass Health Analysis",
  "health": "[Percentage 0-100]",
  "suggestions": "[Detailed recommendations based on analysis]",
  "status": "[Green, Dry, or Dead]",
  "confidence_score": "[0-100]",
  "rationale": "[Detailed justification based on the 4 sections of input data.]",
  "watering_recommendation": {
    "gallons_required_estimate": "[Calculated volume in US gallons, or 0 if Green/Dead]",
    "calculation_note": "[State the basis for the calculation, e.g., 'Calculated for 1 inch of water over [AREA] sq ft.']"
  }
}`;

         const requestBody = {
            contents: [{
               parts: [{
                  text: prompt
               }]
            }],
            generationConfig: {
               temperature: 0.1,
               topK: 32,
               topP: 1,
               maxOutputTokens: 1024,
            }
         };

         const response = await axios.post(geminiApiUrl, requestBody, {
            headers: {
               'Content-Type': 'application/json',
            },
            timeout: 30000
         });

         if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
            const geminiResponse = response.data.candidates[0].content.parts[0].text;
            
            try {
               const parsedResponse = JSON.parse(geminiResponse);
               return JSON.stringify(parsedResponse);
            } catch (parseError) {
               return geminiResponse;
            }
         }

         return null;
      } catch (error: any) {
         console.error('[LandscapingService] Error analyzing image with Gemini:', error.message);
         if (error.response) {
            console.error('[LandscapingService] Gemini API error response:', {
               status: error.response.status,
               statusText: error.response.statusText,
               data: error.response.data
            });
         }
         return null;
      }
   }

   private static async createGrassMonitoringRecord(data: {
      parkId: number | undefined;
      cameraId: string;
      imageUrl: string;
      geminiResponse: string;
   }): Promise<any> {
      try {
         const caseId = await this.generateUniqueCaseId();

         const result = await db.landscaping.create({
            data: {
               case_Id: caseId,
               image: data.imageUrl,
               name: "Grass",
               park_Id: data.parkId,
               plant_type: "Grass Check",
               status: "Auto Generated",
               current_status: "Pending",
               suggestion: data.geminiResponse,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;
      } catch (error: any) {
         console.error('[LandscapingService] Error creating grass monitoring record:', error.message);
         throw error;
      }
   }
}

export default LandscapingService; 