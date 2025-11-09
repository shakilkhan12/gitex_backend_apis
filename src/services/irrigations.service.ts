import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { STATUS } from "@/typescript";
import axios from "axios";
import https from "https";
import * as nodeCrypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { formatImageUrl } from "@/utils/imageUrl.utils";

export class IrrigationsService {
   private static HIK_CONFIG = {
      baseURL: 'https://10.70.90.183:443',
      appKey: '59315117',
      appSecret: 'YuWS8qCb61xbD8fEbwFJ'
   };

   // Removed hardcoded ZONES array - now fetched dynamically from database

   public static testingIrrigationZones = async (images: string[]) => {
      try {
         const results = [];

         for (let i = 0; i < images.length; i++) {
            const imageBase64 = images[i];
            
            try {
               // Save image locally
               const imageUrl = await this.saveImageLocally(imageBase64, `testing_${i + 1}`);
               
               if (!imageUrl) {
                  results.push({
                     imageIndex: i + 1,
                     success: false,
                     error: "Failed to save image locally"
                  });
                  continue;
               }

               // Analyze image with Gemini
               const geminiResponse = await this.analyzeImageWithGemini(imageUrl);
               
               if (!geminiResponse) {
                  results.push({
                     imageIndex: i + 1,
                     success: false,
                     error: "Failed to analyze image with Gemini"
                  });
                  continue;
               }

               // Extract Gemini response data (same as monitorIrrigationZones)
               const geminiData = geminiResponse || {};
               const wateringRecommendation = geminiData.watering_recommendation || {};

               // Save to testing_modules table
               const testingRecord = await this.createTestingModuleRecord({
                  image: imageUrl,
                  name: `Irrigation Testing`,
                  case_type: "Irrigation Testing",
                  estimated_height: null, // Not applicable for irrigation
                  needs_cutting: null, // Not applicable for irrigation
                  recommendation_note: null, // Not applicable for irrigation
                  health: geminiData.status || "Unknown",
                  suggestion: geminiData.suggestions || null,
                  status: geminiData.status || null,
                  confidence_score: String(geminiData.confidence_score || "0"),
                  rationale: geminiData.rationale || null,
                  gallons_required_estimate: wateringRecommendation.gallons_required_estimate || null,
                  calculation_note: wateringRecommendation.calculation_note || null
               });

               results.push({
                  imageIndex: i + 1,
                  success: true,
                  imageUrl: imageUrl,
                  testingRecordId: testingRecord.id,
                  geminiResponse: geminiResponse
               });

               console.log(`[IrrigationsService] Testing record created for image ${i + 1}:`, testingRecord.id);

            } catch (error: any) {
               results.push({
                  imageIndex: i + 1,
                  success: false,
                  error: error.message
               });
            }
         }

         const createdRecords = results
            .filter(result => result.success && result.testingRecordId)
            .map(result => result.testingRecordId);

         let records: any[] = [];
         if (createdRecords.length > 0) {
            records = await db.testing_modules.findMany({
               where: {
                  id: { in: createdRecords }
               },
               orderBy: { createdAt: 'desc' }
            });
         }

         return {
            success: true,
            message: `Processed ${images.length} testing images`,
            results: results,
            createdRecords: records
         };

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to process testing images");
      }
   }

   public static monitorIrrigationZones = async () => {
      try {
         const appKey = this.HIK_CONFIG.appKey;
         const secretKey = this.HIK_CONFIG.appSecret;
         
         const results = [];

         // Fetch all zones that have cameras linked
         const zonesWithCameras = await db.park_zones.findMany({
            where: {
               camera_Id: { not: null }
            },
            include: {
               camera: {
                  select: {
                     Id: true,
                     camera_Id: true,
                     camera_english_name: true,
                     camera_arabic_name: true
                  }
               }
            }
         });

         if (!zonesWithCameras || zonesWithCameras.length === 0) {
            return {
               success: true,
               message: 'No zones with linked cameras found',
               results: []
            };
         }

         // Group zones by camera_Id
         const zonesByCamera = new Map<number, typeof zonesWithCameras>();
         
         for (const zone of zonesWithCameras) {
            if (!zone.camera_Id || !zone.camera) {
               continue;
            }
            
            if (!zonesByCamera.has(zone.camera_Id)) {
               zonesByCamera.set(zone.camera_Id, []);
            }
            zonesByCamera.get(zone.camera_Id)!.push(zone);
         }

         // Process each camera and its linked zones
         const cameraEntries = Array.from(zonesByCamera.entries());
         for (const [cameraDbId, zones] of cameraEntries) {
            const camera = zones[0].camera;
            
            if (!camera || !camera.camera_Id) {
               console.warn(`[IrrigationsService] Camera ${cameraDbId} has no camera_Id, skipping`);
               continue;
            }

            try {
               const cameraIndex = camera.camera_Id; 
               const cameraName = camera.camera_english_name || camera.camera_arabic_name || 'Unknown Camera';
               
               // Capture image from camera
               const base64Image = await this.captureCameraImage(cameraIndex, appKey, secretKey);
               
               if (!base64Image) {
                  const zoneIdsForError = zones
                     .map((z: typeof zonesWithCameras[0]) => z.zone_Id)
                     .filter((id): id is string => id !== null && id !== undefined)
                     .map((id: string) => Number(id))
                     .filter((id: number) => !isNaN(id));
                  
                  results.push({
                     cameraIndex: cameraIndex,
                     cameraName: cameraName,
                     zones: zoneIdsForError,
                     success: false,
                     error: "Failed to capture camera image"
                  });
                  continue;
               }

               const imageUrl = await this.saveImageLocally(base64Image, cameraIndex);
               
               if (!imageUrl) {
                  const zoneIdsForError = zones
                     .map((z: typeof zonesWithCameras[0]) => z.zone_Id)
                     .filter((id): id is string => id !== null && id !== undefined)
                     .map((id: string) => Number(id))
                     .filter((id: number) => !isNaN(id));
                  
                  results.push({
                     cameraIndex: cameraIndex,
                     cameraName: cameraName,
                     zones: zoneIdsForError,
                     success: false,
                     error: "Failed to save image locally"
                  });
                  continue;
               }

               const geminiResponse = await this.analyzeImageWithGemini(imageUrl);
               
               if (!geminiResponse) {
                  const zoneIdsForError = zones
                     .map((z: typeof zonesWithCameras[0]) => z.zone_Id)
                     .filter((id): id is string => id !== null && id !== undefined)
                     .map((id: string) => Number(id))
                     .filter((id: number) => !isNaN(id));
                  
                  results.push({
                     cameraIndex: cameraIndex,
                     cameraName: cameraName,
                     zones: zoneIdsForError,
                     success: false,
                     error: "Failed to analyze image with Gemini"
                  });
                  continue;
               }

               // Check if watering is needed based on Gemini response (once per camera)
               const needsWatering = this.shouldWaterGrass(geminiResponse);
               
               // Extract zone IDs for Rainbird API (zone_Id is String, convert to Number)
               const zoneIds = zones
                  .map((z: typeof zonesWithCameras[0]) => z.zone_Id)
                  .filter((id): id is string => id !== null && id !== undefined)
                  .map((id: string) => Number(id))
                  .filter((id: number) => !isNaN(id));

               // Trigger watering once for all zones of this camera (if needed)
               let wateringTriggered = false;
               let wateringSucceeded = false;
               let wateringResult = null;
               
               if (needsWatering && zoneIds.length > 0) {
                  wateringTriggered = true;
                  wateringResult = await this.triggerWatering(zoneIds);
                  wateringSucceeded = wateringResult && wateringResult.succeeded === true;
               }

               // Create job history records for each zone linked to this camera
               // One record per zone, all using the same captured image and Gemini analysis
               const jobHistoryResults = [];
               for (const zone of zones) {
                  if (!zone.zone_Id) continue;
                  
                  try {
                     const jobRecord = await this.createJobHistoryRecord({
                        cameraIndex: cameraIndex,
                        zoneId: Number(zone.zone_Id),
                        image: imageUrl,
                        geminiResponse: geminiResponse,
                        wateringTriggered: wateringTriggered
                     });
                     
                     jobHistoryResults.push({ 
                        zoneId: Number(zone.zone_Id), 
                        success: true, 
                        recordId: jobRecord.Id 
                     });
                     console.log(`[IrrigationsService] Job history record created for zone ${zone.zone_Id}:`, jobRecord.Id);
                  } catch (dbError: any) {
                     console.error(`[IrrigationsService] Failed to create job history for zone ${zone.zone_Id}:`, dbError.message);
                     jobHistoryResults.push({ 
                        zoneId: Number(zone.zone_Id), 
                        success: false, 
                        error: dbError.message 
                     });
                  }
               }

               results.push({
                  cameraIndex: cameraIndex,
                  cameraName: cameraName,
                  zones: zoneIds,
                  success: true,
                  wateringTriggered: wateringTriggered,
                  wateringSucceeded: wateringSucceeded,
                  wateringResult: wateringResult,
                  imageUrl: imageUrl,
                  jobHistoryResults: jobHistoryResults,
                  reason: needsWatering ? (wateringSucceeded ? "Watering triggered and succeeded" : "Watering triggered but failed") : "Grass does not need watering"
               });

            } catch (error: any) {
               const zoneIds = zones
                  .map((z: typeof zonesWithCameras[0]) => z.zone_Id)
                  .filter((id): id is string => id !== null && id !== undefined)
                  .map((id: string) => Number(id))
                  .filter((id: number) => !isNaN(id));
               
               results.push({
                  cameraIndex: camera?.camera_Id || 'Unknown',
                  cameraName: camera?.camera_english_name || camera?.camera_arabic_name || 'Unknown Camera',
                  zones: zoneIds,
                  success: false,
                  error: error.message
               });
            }
         }

         return {
            success: true,
            message: `Processed ${results.length} irrigation cameras with linked zones`,
            results: results
         };

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to monitor irrigation zones");
      }
   }

   public static updateIrrigationZonesAfterImage = async () => {
      try {
         const appKey = this.HIK_CONFIG.appKey;
         const secretKey = this.HIK_CONFIG.appSecret;
         
         const results = [];

         // Fetch all zones that have cameras linked
         const zonesWithCameras = await db.park_zones.findMany({
            where: {
               camera_Id: { not: null }
            },
            include: {
               camera: {
                  select: {
                     Id: true,
                     camera_Id: true,
                     camera_english_name: true,
                     camera_arabic_name: true
                  }
               }
            }
         });

         if (!zonesWithCameras || zonesWithCameras.length === 0) {
            return {
               success: true,
               message: 'No zones with linked cameras found',
               results: []
            };
         }

         // Group zones by camera_Id
         const zonesByCamera = new Map<number, typeof zonesWithCameras>();
         
         for (const zone of zonesWithCameras) {
            if (!zone.camera_Id || !zone.camera) {
               continue;
            }
            
            if (!zonesByCamera.has(zone.camera_Id)) {
               zonesByCamera.set(zone.camera_Id, []);
            }
            zonesByCamera.get(zone.camera_Id)!.push(zone);
         }

         // Process each camera and its linked zones
         const cameraEntries = Array.from(zonesByCamera.entries());
         for (const [cameraDbId, zones] of cameraEntries) {
            const camera = zones[0].camera;
            
            if (!camera || !camera.camera_Id) {
               console.warn(`[IrrigationsService] Camera ${cameraDbId} has no camera_Id, skipping`);
               continue;
            }

            try {
               const cameraIndex = camera.camera_Id;
               const cameraName = camera.camera_english_name || camera.camera_arabic_name || 'Unknown Camera';
               
               // Capture image from camera
               const base64Image = await this.captureCameraImage(cameraIndex, appKey, secretKey);
               
               if (!base64Image) {
                  results.push({
                     cameraIndex: cameraIndex,
                     cameraName: cameraName,
                     zones: zones.map((z: typeof zonesWithCameras[0]) => z.zone_Id).filter((id): id is string => id !== null && id !== undefined),
                     success: false,
                     error: "Failed to capture camera image"
                  });
                  continue;
               }

               // Save image locally
               const imageUrl = await this.saveImageLocally(base64Image, cameraIndex);
               
               if (!imageUrl) {
                  results.push({
                     cameraIndex: cameraIndex,
                     cameraName: cameraName,
                     zones: zones.map((z: typeof zonesWithCameras[0]) => z.zone_Id).filter((id): id is string => id !== null && id !== undefined),
                     success: false,
                     error: "Failed to save image locally"
                  });
                  continue;
               }

               // Get today's date range (start and end of day)
               const today = new Date();
               today.setHours(0, 0, 0, 0);
               const tomorrow = new Date(today);
               tomorrow.setDate(tomorrow.getDate() + 1);

               // Update existing records for each zone linked to this camera
               const updateResults = [];
               for (const zone of zones) {
                  if (!zone.zone_Id || !zone.Id) {
                     continue;
                  }

                  try {
                     // Find existing records for this camera and zone created today
                     const existingRecords = await db.parks_zones_job_history.findMany({
                        where: {
                           camera_Id: cameraDbId,
                           zone_Id: zone.Id,
                           createdAt: {
                              gte: today,
                              lt: tomorrow
                           }
                        }
                     });

                     if (existingRecords.length > 0) {
                        const updateResult = await db.parks_zones_job_history.updateMany({
                           where: {
                              camera_Id: cameraDbId,
                              zone_Id: zone.Id,
                              createdAt: {
                                 gte: today,
                                 lt: tomorrow
                              }
                           },
                           data: {
                              after_image: imageUrl,
                              updatedAt: new Date()
                           }
                        });

                        updateResults.push({
                           zoneId: zone.zone_Id,
                           zoneDbId: zone.Id,
                           recordsUpdated: updateResult.count,
                           success: true
                        });
                        console.log(`[IrrigationsService] Updated ${updateResult.count} records for zone ${zone.zone_Id} with after_image: ${imageUrl}`);
                     } else {
                        updateResults.push({
                           zoneId: zone.zone_Id,
                           zoneDbId: zone.Id,
                           recordsUpdated: 0,
                           success: true,
                           message: `No existing records found for zone ${zone.zone_Id} created today`
                        });
                        console.log(`[IrrigationsService] No existing records found for zone ${zone.zone_Id} created today`);
                     }
                  } catch (dbError: any) {
                     console.error(`[IrrigationsService] Failed to update records for zone ${zone.zone_Id}:`, dbError.message);
                     updateResults.push({
                        zoneId: zone.zone_Id,
                        zoneDbId: zone.Id,
                        success: false,
                        error: dbError.message
                     });
                  }
               }

               results.push({
                  cameraIndex: cameraIndex,
                  cameraName: cameraName,
                  imageUrl: imageUrl,
                  zones: zones.map((z: typeof zonesWithCameras[0]) => z.zone_Id).filter((id): id is string => id !== null && id !== undefined),
                  success: true,
                  updateResults: updateResults
               });

            } catch (error: any) {
               results.push({
                  cameraIndex: camera?.camera_Id || 'Unknown',
                  cameraName: camera?.camera_english_name || camera?.camera_arabic_name || 'Unknown Camera',
                  zones: zones.map((z: typeof zonesWithCameras[0]) => z.zone_Id).filter((id): id is string => id !== null && id !== undefined),
                  success: false,
                  error: error.message
               });
            }
         }

         return {
            success: true,
            message: `Updated after_image for ${results.length} cameras with linked zones`,
            results: results
         };

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to update irrigation zones after image");
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
            console.warn(`[IrrigationsService] HIK Vision API returned unsuccessful response for camera: ${cameraIndexCode}`);
            return null;
         }
      } catch (error: any) {
         console.error(`[IrrigationsService] Failed to get camera image for camera: ${cameraIndexCode}`, error.message);
         throw error;
      }
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
         console.error(`[IrrigationsService] HikVision API call failed:`, error.message);
         throw error;
      }
   }

   private static detectImageFormat(base64Image: string): string {
      try {
         // Remove data URL prefix if present
         let cleanBase64 = base64Image.trim();
         if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
         }

         // Decode base64 to check magic bytes
         const buffer = Buffer.from(cleanBase64, 'base64');
         
         // Check magic bytes for different image formats
         if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            return 'jpg';
         } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            return 'png';
         } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
            return 'gif';
         } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
            return 'webp';
         }
         
         // Default to jpg if format cannot be determined
         return 'jpg'; 
      } catch (error) {
         console.error('[IrrigationsService] Error detecting image format:', error);
         return 'jpg';
      }
   }

   private static async saveImageLocally(base64Image: string, cameraId: string): Promise<string | null> {
      try {
         const uploadDir = path.join(process.cwd(), 'uploads', 'irrigation');
         
         // Clean and validate base64 data
         let cleanBase64 = base64Image.trim();
         
         // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
         if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
         }
         
         // Validate base64 format
         if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
            throw new Error('Invalid base64 format detected');
         }
         
         // Detect image format from cleaned base64 data
         const imageFormat = this.detectImageFormat(base64Image);
         const fileName = `irrigation_${cameraId}_${Date.now()}.${imageFormat}`;
         const filePath = path.join(uploadDir, fileName);
         
         if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`[IrrigationsService] Created directory: ${uploadDir}`);
         }
         
         // Convert cleaned base64 to buffer and save
         const imageBuffer = Buffer.from(cleanBase64, 'base64');
         
         // Additional validation: check if buffer has valid content
         if (imageBuffer.length === 0) {
            throw new Error('Empty image buffer after base64 decoding');
         }
         
         fs.writeFileSync(filePath, imageBuffer);
         
         const imageUrl = `/uploads/irrigation/${fileName}`;
         
         console.log(`[IrrigationsService] Successfully saved image locally. Path: ${imageUrl}, Size: ${imageBuffer.length} bytes`);
         return imageUrl;
      } catch (error: any) {
         console.error(`[IrrigationsService] Error saving image locally for camera ${cameraId}:`, error.message);
         return null;
      }
   }

   private static async analyzeImageWithGemini(imageUrl: string): Promise<any> {
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
            console.log(`[IrrigationsService] Gemini API attempt ${attempt}/${maxRetries} for URL: ${imageUrl}`);
            
            const GEMINI_API_KEY = 'AIzaSyAc6TkgL2AfKiPqcsVYf2JJC5VhF5vuNjM';
            const MODEL = "gemini-2.5-flash";
            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
            
            // Format image URL using utility function
            const fullImageUrl = formatImageUrl(imageUrl) || imageUrl;
            
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
* *Still Image Link:* ${fullImageUrl}

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
               maxOutputTokens: 4096,
            }
         };

         const response = await axios.post(geminiApiUrl, requestBody, {
            headers: {
               'Content-Type': 'application/json',
            },
            timeout: 60000 // Increased to 60 seconds
         });

         console.log('[IrrigationsService] Gemini API response structure:', JSON.stringify(response.data, null, 2));
            if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0]) {
               const geminiResponse = response.data.candidates[0].content.parts[0].text;
               
               try {
                  let cleanResponse = geminiResponse;
                  if (cleanResponse.includes('```json')) {
                     cleanResponse = cleanResponse.split('```json')[1].split('```')[0].trim();
                  } else if (cleanResponse.includes('```')) {
                     cleanResponse = cleanResponse.split('```')[1].split('```')[0].trim();
                  }
                  
                  const parsedResponse = JSON.parse(cleanResponse);
                  console.log(`[IrrigationsService] Gemini API successful on attempt ${attempt}`);
                  return parsedResponse;
               } catch (parseError) {
                  console.warn('[IrrigationsService] Failed to parse Gemini response as JSON, returning raw text');
                  return geminiResponse;
               }
            }

            return null;
         } catch (error: any) {
            console.error(`[IrrigationsService] Gemini API attempt ${attempt} failed:`, error.message);
            
            if (error.response) {
               console.error('[IrrigationsService] Gemini API error response:', {
                  status: error.response.status,
                  statusText: error.response.statusText,
                  data: error.response.data
               });
            }
            
            // If this is the last attempt, return null
            if (attempt === maxRetries) {
               console.error('[IrrigationsService] All Gemini API attempts failed');
               return null;
            }
            
            // Wait before retrying
            console.log(`[IrrigationsService] Waiting ${retryDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
         }
      }
      
      return null;
   }

   private static shouldWaterGrass(geminiResponse: any): boolean {
      try {
         const status = geminiResponse?.status?.toLowerCase();
         const suggestions = geminiResponse?.suggestions?.toLowerCase() || '';
         
         // Check if status indicates need for watering
         if (status === 'dry') {
            return true;
         }
         
         // Check if suggestions mention watering
         if (suggestions.includes('water') || suggestions.includes('watering') || suggestions.includes('irrigat')) {
            return true;
         }
         
         return false;
      } catch (error) {
         console.error('[IrrigationsService] Error determining watering need:', error);
         return false;
      }
   }

   // private static async triggerWatering(zoneIds: number[]): Promise<any> {
   //    try {
   //       const wateringApiUrl = 'https://bms.rainbirdapi.com/api/v1/Programs/1801299/runtimes';
         
   //       const requestBody = {
   //          ids: zoneIds,
   //          baseRunTime: 540
   //       };
         
   //       console.log(`[IrrigationsService] Sending Rainbird API request:`, {
   //          url: wateringApiUrl,
   //          body: requestBody,
   //          zoneIds: zoneIds
   //       });

   //       // Log the exact JSON string being sent
   //       const jsonString = JSON.stringify(requestBody);
   //       console.log(`[IrrigationsService] JSON payload being sent:`, jsonString);
         
   //       const response = await axios.patch(wateringApiUrl, requestBody, {
   //          headers: {
   //             'Content-Type': 'application/json',
   //             'Authorization': 'Bearer B3ECE106BE349EC07A000EB3AEC16EB539705BE8F816EE102CC6A74550127467-1',
   //             'Accept': '*/*',
   //             'Accept-Encoding': 'gzip, deflate, br',
   //             'Connection': 'keep-alive',
   //             'Cache-Control': 'no-cache'
   //          },
   //          timeout: 30000,
   //          transformRequest: [(data) => {
   //             console.log(`[IrrigationsService] Transform request data:`, data);
   //             return JSON.stringify(data);
   //          }]
   //       });

   //       console.log(`[IrrigationsService] Watering triggered for zones: ${zoneIds.join(', ')}`);
   //       console.log(`[IrrigationsService] Rainbird API response:`, response.data);
         
   //       // Check if watering was successful
   //       if (response.data && response.data.succeeded === true) {
   //          console.log(`[IrrigationsService] Watering successful for zones: ${zoneIds.join(', ')}`);
   //       } else {
   //          console.warn(`[IrrigationsService] Watering failed for zones: ${zoneIds.join(', ')}. Response:`, response.data);
   //       }
         
   //       return response.data;
   //    } catch (error: any) {
   //       console.error(`[IrrigationsService] Error triggering watering for zones ${zoneIds.join(', ')}:`, error.message);
   //       if (error.response) {
   //          console.error('[IrrigationsService] Rainbird API error response:', {
   //             status: error.response.status,
   //             statusText: error.response.statusText,
   //             data: error.response.data
   //          });
            
   //          // Log detailed validation errors if available
   //          if (error.response.data && error.response.data.errors) {
   //             console.error('[IrrigationsService] Detailed validation errors:', JSON.stringify(error.response.data.errors, null, 2));
   //          }
   //       }
         
   //       // Return a failed response object instead of throwing
   //       return {
   //          succeeded: false,
   //          errors: error.response?.data?.errors || error.message
   //       };
   //    }
   // }

   private static async triggerWatering(zoneIds: number[]): Promise<any> {
  try {
    const wateringApiUrl = 'https://bms.rainbirdapi.com/api/v1/ManualOps/StartStations';

    // Prepare request payload
    const requestBody = {
      stationIds: zoneIds,
      seconds: zoneIds.map(() => 60) 
    };

    console.log(`[IrrigationsService] Sending Rainbird API request:`, {
      url: wateringApiUrl,
      body: requestBody
    });

    const response = await axios.post(wateringApiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/*+json',
        'Authorization': 'Bearer B3ECE106BE349EC07A000EB3AEC16EB539705BE8F816EE102CC6A74550127467-1',
        'Accept': 'application/json'
      },
      validateStatus: (status) => true, 
      timeout: 30000
    });


    if (response.status === 204) {
      console.log(`[IrrigationsService] ✅ Watering successfully started for stations: ${zoneIds.join(', ')}`);
      return {
        succeeded: true,
        message: 'Watering started successfully',
        status: response.status
      };
    }

    return {
      succeeded: false,
      status: response.status,
      error: response.data?.Message || 'Unknown error from API'
    };

  } catch (error: any) {
    console.error(`[IrrigationsService] ❌ Exception while triggering watering for stations ${zoneIds.join(', ')}:`, error.message);

    if (error.response) {
      console.error('[IrrigationsService] Rainbird API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }

    return {
      succeeded: false,
      error: error.response?.data?.Message || error.message
    };
  }
}

   private static async createJobHistoryRecord(data: {
      cameraIndex: string;
      zoneId: number;
      image: string;
      geminiResponse: any;
      wateringTriggered: boolean;
   }): Promise<any> {
      try {
         // Try to find the actual database ID for this camera index
         let cameraDbId = null;
         let parkDbId = null;
         try {
            const camera = await db.park_cameras.findFirst({
               where: {
                  camera_Id: data.cameraIndex
               },
               select: {
                  Id: true,
                  park_Id: true
               }
            });
            cameraDbId = camera?.Id || null;
            parkDbId = camera?.park_Id || null;
         } catch (dbError: any) {
            console.warn(`[IrrigationsService] Could not find camera database ID for index ${data.cameraIndex}:`, dbError.message);
         }

         let zoneDbId = null;
         try {
            // Get all zones for the park and find the one that matches by comparing Number(zone_Id) with zoneId
            const zones = await db.park_zones.findMany({
               where: {
                  park_Id: parkDbId
               },
               select: {
                  Id: true,
                  zone_Id: true
               }
            });
            
            // Find the zone where Number(zone_Id) matches the zoneId
            const matchingZone = zones.find(zone => Number(zone.zone_Id) === data.zoneId);
            zoneDbId = matchingZone?.Id || null;
            
            if (!zoneDbId) {
               console.warn(`[IrrigationsService] No matching zone found for zoneId ${data.zoneId} in park ${parkDbId}`);
            }
         } catch (dbError: any) {
            console.warn(`[IrrigationsService] Could not find zone database ID for zoneId ${data.zoneId}:`, dbError.message);
         }

         // Extract Gemini response data
         const geminiData = data.geminiResponse || {};
         const wateringRecommendation = geminiData.watering_recommendation || {};
         
         const result = await db.parks_zones_job_history.create({
            data: {
               camera_Id: cameraDbId,
               park_Id: parkDbId,
               zone_Id: zoneDbId,
               job_Id: `IRRIGATION_${data.cameraIndex}_${data.zoneId}_${Date.now()}`,
               image: data.image,
               started_at: new Date(),
               start_for_time: data.wateringTriggered ? "30 seconds" : "No watering needed",
               suggestion: geminiData.suggestions || null,
               status: geminiData.status || null,
               confidence_score: geminiData.confidence_score || null,
               rationale: geminiData.rationale || null,
               gallons_required_estimate: wateringRecommendation.gallons_required_estimate || null,
               calculation_note: wateringRecommendation.calculation_note || null,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;
      } catch (error: any) {
         console.error('[IrrigationsService] Error creating job history record:', error.message);
         throw error;
      }
   }

   private static async createTestingModuleRecord(data: {
      image: string;
      name: string;
      case_type: string;
      estimated_height: string | null;
      needs_cutting: boolean | null;
      recommendation_note: string | null;
      health: string;
      suggestion: string | null;
      status: string | null;
      confidence_score: string | null;
      rationale: string | null;
      gallons_required_estimate: string | null;
      calculation_note: string | null;
   }): Promise<any> {
      try {
         const result = await db.testing_modules.create({
            data: {
               image: data.image,
               name: data.name,
               case_type: data.case_type,
               estimated_height: data.estimated_height,
               needs_cutting: data.needs_cutting,
               recommendation_note: data.recommendation_note,
               health: data.health,
               suggestion: data.suggestion,
               status: data.status,
               confidence_score: data.confidence_score,
               rationale: data.rationale,
               gallons_required_estimate: data.gallons_required_estimate,
               calculation_note: data.calculation_note,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;
      } catch (error: any) {
         console.error('[IrrigationsService] Error creating testing module record:', error.message);
         throw error;
      }
   }
}