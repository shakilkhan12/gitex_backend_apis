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


   public static testingIrrigationZones = async (images: string[]) => {
      try {
         const results = [];

         for (let i = 0; i < images.length; i++) {
            const imageBase64 = images[i];
            
            try {
               const imageUrl = await this.saveImageLocally(imageBase64, `testing_${i + 1}`);
               
               if (!imageUrl) {
                  results.push({
                     imageIndex: i + 1,
                     success: false,
                     error: "Failed to save image locally"
                  });
                  continue;
               }

               const geminiResponse = await this.analyzeImageWithGemini(imageUrl);
               
               if (!geminiResponse) {
                  results.push({
                     imageIndex: i + 1,
                     success: false,
                     error: "Failed to analyze image with Gemini"
                  });
                  continue;
               }

               const geminiData = geminiResponse || {};
               const wateringRecommendation = geminiData.watering_recommendation || {};

               const testingRecord = await this.createTestingModuleRecord({
                  image: imageUrl,
                  name: `Irrigation Testing`,
                  case_type: "Irrigation Testing",
                  estimated_height: null, 
                  needs_cutting: null,
                  recommendation_note: null, 
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

   // DEPRECATED: This method is no longer used. Use monitorIrrigationSectionsService instead.
   // Zones no longer have direct camera_Id relationship - cameras are linked through irrigation sections.
   public static monitorIrrigationZones = async () => {
      try {
         return {
            success: true,
            message: 'This method is deprecated. Use monitorIrrigationSectionsService instead.',
            results: []
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

         // Fetch all irrigation sections with active cameras
         const irrigationSections = await db.cameras_irrigation_section.findMany({
            where: {
               park_cameras: {
                  status: true
               }
            },
            include: {
               park_cameras: {
                  select: {
                     Id: true,
                     camera_Id: true,
                     camera_english_name: true,
                     camera_arabic_name: true,
                     status: true
                  }
               },
               park_zones: {
                  select: {
                     Id: true,
                     zone_Id: true
                  }
               }
            }
         });

         if (!irrigationSections || irrigationSections.length === 0) {
            return {
               success: true,
               message: 'No irrigation sections with active cameras found',
               results: []
            };
         }

         // Group irrigation sections by camera
         const sectionsByCamera = new Map<number, typeof irrigationSections>();
         
         for (const section of irrigationSections) {
            if (!section.park_cameras || !section.park_cameras.camera_Id) {
               continue;
            }

            const cameraDbId = section.park_cameras.Id;
            
            if (!sectionsByCamera.has(cameraDbId)) {
               sectionsByCamera.set(cameraDbId, []);
            }
            sectionsByCamera.get(cameraDbId)!.push(section);
         }

         const cameraEntries = Array.from(sectionsByCamera.entries());
         for (const [cameraDbId, sections] of cameraEntries) {
            const camera = sections[0].park_cameras;
            
            if (!camera || !camera.camera_Id) {
               continue;
            }

            // Skip if camera is not active
            if (camera.status === false || camera.status === null) {
               continue;
            }

            try {
               const cameraIndex = camera.camera_Id;
               const cameraName = camera.camera_english_name || camera.camera_arabic_name || 'Unknown Camera';
               
               const base64Image = await this.captureCameraImage(cameraIndex, appKey, secretKey);
               
               if (!base64Image) {
                  const zoneIds = sections
                     .map(s => s.park_zones?.zone_Id)
                     .filter((id): id is string => id !== null && id !== undefined);
                  
                  results.push({
                     cameraIndex: cameraIndex,
                     cameraName: cameraName,
                     zones: zoneIds,
                     success: false,
                     error: "Failed to capture camera image"
                  });
                  continue;
               }

               const imageUrl = await this.saveImageLocally(base64Image, cameraIndex);
               
               if (!imageUrl) {
                  const zoneIds = sections
                     .map(s => s.park_zones?.zone_Id)
                     .filter((id): id is string => id !== null && id !== undefined);
                  
                  results.push({
                     cameraIndex: cameraIndex,
                     cameraName: cameraName,
                     zones: zoneIds,
                     success: false,
                     error: "Failed to save image locally"
                  });
                  continue;
               }

               const today = new Date();
               today.setHours(0, 0, 0, 0);
               const tomorrow = new Date(today);
               tomorrow.setDate(tomorrow.getDate() + 1);

               const updateResults = [];
               for (const section of sections) {
                  if (!section.park_zones || !section.park_zones.Id || !section.park_zones.zone_Id) {
                     continue;
                  }

                  const zoneDbId = section.park_zones.Id;
                  const zoneId = section.park_zones.zone_Id;

                  try {
                     const existingRecords = await db.parks_zones_job_history.findMany({
                        where: {
                           camera_Id: cameraDbId,
                           zone_Id: zoneDbId,
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
                              zone_Id: zoneDbId,
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
                           sectionId: section.id,
                           zoneId: zoneId,
                           zoneDbId: zoneDbId,
                           recordsUpdated: updateResult.count,
                           success: true
                        });
                     } else {
                        updateResults.push({
                           sectionId: section.id,
                           zoneId: zoneId,
                           zoneDbId: zoneDbId,
                           recordsUpdated: 0,
                           success: true,
                           message: `No existing records found for zone ${zoneId} created today`
                        });   
                     }
                  } catch (dbError: any) {
                     updateResults.push({
                        sectionId: section.id,
                        zoneId: zoneId,
                        zoneDbId: zoneDbId,
                        success: false,
                        error: dbError.message
                     });
                  }
               }

               const zoneIds = sections
                  .map(s => s.park_zones?.zone_Id)
                  .filter((id): id is string => id !== null && id !== undefined);

               results.push({
                  cameraIndex: cameraIndex,
                  cameraName: cameraName,
                  imageUrl: imageUrl,
                  zones: zoneIds,
                  success: true,
                  updateResults: updateResults
               });

            } catch (error: any) {
               const zoneIds = sections
                  .map(s => s.park_zones?.zone_Id)
                  .filter((id): id is string => id !== null && id !== undefined);
               
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
            message: `Updated after_image for ${results.length} cameras with irrigation sections`,
            results: results
         };

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to update irrigation zones after image");
      }
   }

   // Monitor irrigation sections for a specific working time
   public static monitorIrrigationSectionsService = async (workingTime: string) => {
      const startTime = Date.now();
      console.log(`[IrrigationService] 💧 Starting irrigation monitoring for working time: ${workingTime}`);
      
      try {
         const appKey = this.HIK_CONFIG.appKey;
         const secretKey = this.HIK_CONFIG.appSecret;

         console.log(`[IrrigationService] 📋 Fetching irrigation sections for time ${workingTime}...`);
         const irrigationSections = await db.cameras_irrigation_section.findMany({
            where: {
               working_time: workingTime,
               park_cameras: {
                  status: true // Only active cameras
               }
            },
            include: {
               park_cameras: {
                  select: {
                     Id: true,
                     camera_Id: true,
                     park_Id: true,
                     status: true,
                     parks: {
                        select: {
                           Id: true,
                           park_Id: true,
                           park_english_name: true,
                           park_arabic_name: true
                        }
                     }
                  }
               },
               park_zones: {
                  select: {
                     Id: true,
                     zone_Id: true
                  }
               }
            }
         });

         console.log(`[IrrigationService] 📊 Found ${irrigationSections.length} irrigation sections for time ${workingTime}`);

         if (irrigationSections.length === 0) {
            console.log(`[IrrigationService] ⚠️ No irrigation sections found for time ${workingTime}`);
            return {
               success: true,
               message: `No irrigation sections found for time ${workingTime}`,
               results: []
            };
         }

         const results = [];
         let processedCount = 0;
         let successCount = 0;
         let failureCount = 0;

         for (const section of irrigationSections) {
            processedCount++;
            console.log(`[IrrigationService] 🔄 Processing section ${processedCount}/${irrigationSections.length} (Section ID: ${section.id})`);
            
            try {
               if (!section.park_cameras || !section.park_cameras.camera_Id) {
                  console.log(`[IrrigationService] ❌ Section ${section.id}: Camera not found`);
                  results.push({
                     sectionId: section.id,
                     zoneId: section.zone_Id,
                     success: false,
                     error: "Camera not found for this section"
                  });
                  failureCount++;
                  continue;
               }

               const camera = section.park_cameras;
               if (!camera.camera_Id) {
                  console.log(`[IrrigationService] ❌ Section ${section.id}: Camera ID not found`);
                  results.push({
                     sectionId: section.id,
                     zoneId: section.zone_Id,
                     success: false,
                     error: "Camera ID not found"
                  });
                  failureCount++;
                  continue;
               }

               // Skip if camera is not active
               if (camera.status === false || camera.status === null) {
                  console.log(`[IrrigationService] ⚠️ Section ${section.id}: Camera ${camera.camera_Id} is not active, skipping`);
                  results.push({
                     sectionId: section.id,
                     zoneId: section.zone_Id,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Camera is not active"
                  });
                  failureCount++;
                  continue;
               }

               if (!section.park_zones || !section.park_zones.zone_Id) {
                  console.log(`[IrrigationService] ❌ Section ${section.id}: Zone not found`);
                  results.push({
                     sectionId: section.id,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Zone not found for this section"
                  });
                  failureCount++;
                  continue;
               }

               console.log(`[IrrigationService] 📷 Section ${section.id}: Capturing image from camera ${camera.camera_Id} (Zone: ${section.park_zones.zone_Id})...`);
               const base64Image = await this.captureCameraImage(camera.camera_Id, appKey, secretKey);
               
               if (!base64Image) {
                  console.log(`[IrrigationService] ❌ Section ${section.id}: Failed to capture image from camera ${camera.camera_Id}`);
                  results.push({
                     sectionId: section.id,
                     zoneId: section.park_zones.zone_Id,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Failed to capture image"
                  });
                  failureCount++;
                  continue;
               }
               console.log(`[IrrigationService] ✅ Section ${section.id}: Image captured successfully`);

               const eventId = `irrigation_${section.id}_${Date.now()}`;
               console.log(`[IrrigationService] 💾 Section ${section.id}: Saving image locally...`);
               const imageUrl = await this.saveImageLocally(base64Image, eventId);
               
               if (!imageUrl) {
                  console.log(`[IrrigationService] ❌ Section ${section.id}: Failed to save image locally`);
                  results.push({
                     sectionId: section.id,
                     zoneId: section.park_zones.zone_Id,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Failed to save image"
                  });
                  failureCount++;
                  continue;
               }
               console.log(`[IrrigationService] ✅ Section ${section.id}: Image saved at ${imageUrl}`);

               console.log(`[IrrigationService] 🤖 Section ${section.id}: Analyzing image with Gemini...`);
               const geminiResponse = await this.analyzeImageWithGemini(imageUrl);
               
               if (!geminiResponse) {
                  console.log(`[IrrigationService] ❌ Section ${section.id}: Failed to analyze image with Gemini`);
                  results.push({
                     sectionId: section.id,
                     zoneId: section.park_zones.zone_Id,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Failed to analyze image"
                  });
                  failureCount++;
                  continue;
               }
               console.log(`[IrrigationService] ✅ Section ${section.id}: Image analyzed successfully`);

               const needsWatering = this.shouldWaterGrass(geminiResponse);
               console.log(`[IrrigationService] 💧 Section ${section.id}: Watering needed: ${needsWatering ? 'YES' : 'NO'}`);
               
               const zoneId = Number(section.park_zones.zone_Id);
               let wateringTriggered = false;
               let wateringSucceeded = false;
               let wateringResult = null;
               
               if (needsWatering && zoneId) {
                  console.log(`[IrrigationService] 🚰 Section ${section.id}: Triggering watering for zone ${zoneId}...`);
                  wateringTriggered = true;
                  wateringResult = await this.triggerWatering([zoneId]);
                  wateringSucceeded = wateringResult && wateringResult.succeeded === true;
                  console.log(`[IrrigationService] ${wateringSucceeded ? '✅' : '❌'} Section ${section.id}: Watering ${wateringSucceeded ? 'succeeded' : 'failed'}`);
               }

               console.log(`[IrrigationService] 💾 Section ${section.id}: Creating job history record...`);
               try {
                  const jobRecord = await this.createJobHistoryRecord({
                     cameraIndex: camera.camera_Id!,
                     zoneId: zoneId,
                     image: imageUrl,
                     geminiResponse: geminiResponse,
                     wateringTriggered: wateringTriggered
                  });

                  console.log(`[IrrigationService] ✅ Section ${section.id}: Job history record created (ID: ${jobRecord.Id})`);
                  successCount++;
                  results.push({
                     sectionId: section.id,
                     zoneId: zoneId,
                     cameraId: camera.camera_Id,
                     parkId: camera.park_Id,
                     success: true,
                     jobHistoryId: jobRecord.Id,
                     wateringTriggered: wateringTriggered,
                     wateringSucceeded: wateringSucceeded,
                     wateringResult: wateringResult,
                     imageUrl: imageUrl,
                     reason: needsWatering ? (wateringSucceeded ? "Watering triggered and succeeded" : "Watering triggered but failed") : "Grass does not need watering"
                  });
               } catch (dbError: any) {
                  console.error(`[IrrigationService] ❌ Section ${section.id}: Database record creation failed:`, dbError.message);
                  failureCount++;
                  results.push({
                     sectionId: section.id,
                     zoneId: zoneId,
                     cameraId: camera.camera_Id,
                     parkId: camera.park_Id,
                     success: false,
                     error: "Database record creation failed",
                     message: dbError.message
                  });
               }

            } catch (error: any) {
               console.error(`[IrrigationService] ❌ Section ${section.id}: Unexpected error:`, error.message);
               failureCount++;
               results.push({
                  sectionId: section.id,
                  zoneId: section.zone_Id,
                  success: false,
                  error: error.message
               });
            }
         }

         const duration = ((Date.now() - startTime) / 1000).toFixed(2);
         console.log(`[IrrigationService] 📊 Summary for ${workingTime}:`);
         console.log(`[IrrigationService]   - Total sections: ${irrigationSections.length}`);
         console.log(`[IrrigationService]   - Processed: ${processedCount}`);
         console.log(`[IrrigationService]   - Successful: ${successCount}`);
         console.log(`[IrrigationService]   - Failed: ${failureCount}`);
         console.log(`[IrrigationService]   - Duration: ${duration}s`);
         console.log(`[IrrigationService] ✅ Completed irrigation monitoring for ${workingTime}`);

         return {
            success: true,
            message: `Processed ${results.length} irrigation sections for time ${workingTime}`,
            workingTime: workingTime,
            results: results
         };

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, `Failed to monitor irrigation sections for time ${workingTime}: ${error.message}`);
      }
   }

   // Get all unique working times from irrigation sections (only for active cameras)
   public static getAllIrrigationWorkingTimes = async (): Promise<string[]> => {
      try {
         const sections = await db.cameras_irrigation_section.findMany({
            where: {
               working_time: {
                  not: null
               },
               park_cameras: {
                  status: true // Only active cameras
               }
            },
            select: {
               working_time: true
            },
            distinct: ['working_time']
         });

         return sections
            .map(s => s.working_time)
            .filter((time): time is string => time !== null && time !== undefined && time.trim() !== '');
      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch irrigation working times");
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
            return null;
         }
      } catch (error: any) {
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
         throw error;
      }
   }

   private static detectImageFormat(base64Image: string): string {
      try {
         let cleanBase64 = base64Image.trim();
         if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
         }

         const buffer = Buffer.from(cleanBase64, 'base64');
         
         if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            return 'jpg';
         } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            return 'png';
         } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
            return 'gif';
         } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
            return 'webp';
         }
         
         return 'jpg'; 
      } catch (error) {
         return 'jpg';
      }
   }

   private static async saveImageLocally(base64Image: string, cameraId: string): Promise<string | null> {
      try {
         const uploadDir = path.join(process.cwd(), 'uploads', 'irrigation');

         let cleanBase64 = base64Image.trim();
         
         if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
         }
         
         if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
            throw new Error('Invalid base64 format detected');
         }
         
         const imageFormat = this.detectImageFormat(base64Image);
         const fileName = `irrigation_${cameraId}_${Date.now()}.${imageFormat}`;
         const filePath = path.join(uploadDir, fileName);
         
         if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
         }
         
         const imageBuffer = Buffer.from(cleanBase64, 'base64');
         
         if (imageBuffer.length === 0) {
            throw new Error('Empty image buffer after base64 decoding');
         }
         
         fs.writeFileSync(filePath, imageBuffer);
         
         const imageUrl = `/uploads/irrigation/${fileName}`;
         
         return imageUrl;
      } catch (error: any) {
         return null;
      }
   }

   private static async analyzeImageWithGemini(imageUrl: string): Promise<any> {
      const maxRetries = 3;
      const retryDelay = 2000; 
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
            
            const GEMINI_API_KEY = 'AIzaSyAc6TkgL2AfKiPqcsVYf2JJC5VhF5vuNjM';
            const MODEL = "gemini-2.5-flash";
            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
            
            let fullImageUrl = formatImageUrl(imageUrl);
            if (!fullImageUrl) {
               fullImageUrl = imageUrl;
            }
            
            // Ensure it's a full URL (if it's still a relative path, construct full URL)
            if (fullImageUrl && !fullImageUrl.startsWith('http://') && !fullImageUrl.startsWith('https://')) {
               const apiBaseUrl = process.env.API_BASE_URL || 'http://83.111.75.163:5000';
               fullImageUrl = fullImageUrl.startsWith('/') 
                  ? `${apiBaseUrl}${fullImageUrl}`
                  : `${apiBaseUrl}/${fullImageUrl}`;
            }
            
            console.log(`[IrrigationService] 🖼️ Full image URL for Gemini: ${fullImageUrl}`);
            
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
               timeout: 60000 
         });

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
                  return parsedResponse;
               } catch (parseError) {
                  return geminiResponse;
               }
            }

            return null;
         } catch (error: any) {
            if (attempt === maxRetries) {
               return null;
            }
            
            await new Promise(resolve => setTimeout(resolve, retryDelay));
         }
      }
      
      return null;
   }

   private static shouldWaterGrass(geminiResponse: any): boolean {
      try {
         const status = geminiResponse?.status?.toLowerCase();
         const suggestions = geminiResponse?.suggestions?.toLowerCase() || '';
         
         if (status === 'dry') {
            return true;
         }
         
         if (suggestions.includes('water') || suggestions.includes('watering') || suggestions.includes('irrigat')) {
            return true;
         }
         
         return false;
      } catch (error) {
         return false;
      }
   }

   private static async triggerWatering(zoneIds: number[]): Promise<any> {
  try {
    const wateringApiUrl = 'https://bms.rainbirdapi.com/api/v1/ManualOps/StartStations';

    const requestBody = {
      stationIds: zoneIds,
      seconds: zoneIds.map(() => 60) 
    };


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
         }

         let zoneDbId = null;
         try {
            const zones = await db.park_zones.findMany({
               where: {
                  park_Id: parkDbId
               },
               select: {
                  Id: true,
                  zone_Id: true
               }
            });
            
            const matchingZone = zones.find(zone => Number(zone.zone_Id) === data.zoneId);
            zoneDbId = matchingZone?.Id || null;
            
         } catch (dbError: any) {
         }

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
         throw error;
      }
   }
}