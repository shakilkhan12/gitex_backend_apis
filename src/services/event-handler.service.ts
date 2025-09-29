import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import db from "@/prisma/client";
import axios from "axios";
import https from "https";
import * as nodeCrypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import SocketService from "./socket.service";
// Simple logger implementation
const Logger = {
   info: (message: string, data?: any) => {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
   },
   debug: (message: string, data?: any) => {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
   },
   warn: (message: string, data?: any) => {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
   },
   error: (message: string, error?: any) => {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
   }
};

class EventHandlerService {

   private static readonly HIK_CONFIG = {
      baseURL: 'https://10.70.90.183:443',
      appKey: '59315117',
      appSecret: 'YuWS8qCb61xbD8fEbwFJ',
      eventRecordsEndpoint: '/artemis/api/eventService/v1/eventRecords/page',
      imageDataEndpoint: '/artemis/api/eventService/v1/image_data',
   };

   private static readonly CLOUDINARY_CONFIG = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
      api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
      folder: 'event-images'
   };
   
   static {
      
      cloudinary.config({
         cloud_name: this.CLOUDINARY_CONFIG.cloud_name,
         api_key: this.CLOUDINARY_CONFIG.api_key,
         api_secret: this.CLOUDINARY_CONFIG.api_secret,
      });
      
   }

   private static async getEventRecords(eventIndexCode: string) {
      const startTime = Date.now();
      Logger.info(`[EventHandlerService] Starting to get event records for eventIndexCode: ${eventIndexCode}`);
      
      try {
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            this.HIK_CONFIG.eventRecordsEndpoint,
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            { eventIndexCode }
         );
         
         const duration = Date.now() - startTime;
         Logger.info(`[EventHandlerService] Successfully retrieved event records for eventIndexCode: ${eventIndexCode} in ${duration}ms`);
         Logger.debug(`[EventHandlerService] Event records response:`, { code: response?.code, dataLength: response?.data?.list?.length });
         
         return response;
      } catch (error: any) {
         const duration = Date.now() - startTime;
         Logger.error(`[EventHandlerService] Failed to get event records for eventIndexCode: ${eventIndexCode} after ${duration}ms`, error);
         throw error;
      }
   }

   private static async getImageData(picUri: string) {
      const startTime = Date.now();
      Logger.info(`[EventHandlerService] Starting to get image data for picUri: ${picUri}`);
      
      try {
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            this.HIK_CONFIG.imageDataEndpoint,
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            { picUri }
         );
         
         const duration = Date.now() - startTime;
         Logger.info(`[EventHandlerService] Successfully retrieved image data for picUri: ${picUri} in ${duration}ms`);
         Logger.debug(`[EventHandlerService] Image data response length: ${response?.length || 0} characters`);
         
         return response;
      } catch (error: any) {
         const duration = Date.now() - startTime;
         Logger.error(`[EventHandlerService] Failed to get image data for picUri: ${picUri} after ${duration}ms`, error);
         throw error;
      }
   }

   private static async uploadImageToCloudinary(base64Image: string, eventType: string, eventId: string): Promise<string> {
      const startTime = Date.now();
      Logger.info(`[EventHandlerService] Starting to upload image to Cloudinary for eventType: ${eventType}, eventId: ${eventId}`);
      
      try {
         const publicId = `${this.CLOUDINARY_CONFIG.folder}/${eventType}/${eventId}_${Date.now()}`;
         Logger.debug(`[EventHandlerService] Generated publicId: ${publicId}`);
         
         const result = await cloudinary.uploader.upload(base64Image, {
            public_id: publicId,
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto',
            fetch_format: 'auto'
         });
         
         const duration = Date.now() - startTime;
         Logger.info(`[EventHandlerService] Successfully uploaded image to Cloudinary in ${duration}ms. URL: ${result.secure_url}`);
         
         return result.secure_url;
      } catch (error: any) {
         const duration = Date.now() - startTime;
         Logger.error(`[EventHandlerService] Failed to upload image to Cloudinary for eventType: ${eventType}, eventId: ${eventId} after ${duration}ms`, error);
         throw error;
      }
   }

   private static async callHikVisionAPI(baseUrl: string, endpoint: string, appKey: string, appSecret: string, requestData: any) {
      const startTime = Date.now();
      Logger.info(`[EventHandlerService] Starting HikVision API call to ${baseUrl}${endpoint}`);
      Logger.debug(`[EventHandlerService] Request data:`, requestData);
      
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

         Logger.debug(`[EventHandlerService] Making HTTP request with headers:`, { 
            'X-Ca-Key': appKey, 
            'X-Ca-Timestamp': timestamp.toString(),
            'X-Ca-Nonce': nonce 
         });

         const response = await axios({
            method,
            url: `${baseUrl}${endpoint}`,
            headers,
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            data: requestBody,
            timeout: 30000,
         });

         const duration = Date.now() - startTime;
         Logger.info(`[EventHandlerService] HikVision API call successful in ${duration}ms. Status: ${response.status}`);
         Logger.debug(`[EventHandlerService] Response data:`, { 
            code: response.data?.code, 
            message: response.data?.msg,
            dataLength: response.data?.data?.list?.length || 0 
         });

         return response.data;
      } catch (error: any) {
         const duration = Date.now() - startTime;
         Logger.error(`[EventHandlerService] HikVision API call failed after ${duration}ms`, error);
         
         if (error.response) {
            const errorMsg = `HikVision API Error: ${error.response.status} - ${error.response.statusText}`;
            Logger.error(`[EventHandlerService] ${errorMsg}`, { 
               status: error.response.status, 
               statusText: error.response.statusText,
               responseData: error.response.data 
            });
            throw new Error(errorMsg);
         } else {
            const errorMsg = `Error: ${error.message}`;
            Logger.error(`[EventHandlerService] ${errorMsg}`, error);
            throw new Error(errorMsg);
         }
      }
   }

  public static handleEventService = async (eventData: any) => {
      const startTime = Date.now();
      Logger.info(`[EventHandlerService] Starting event processing`, { 
         timestamp: eventData?.timestamp,
         hasEventData: !!eventData 
      });
      
      try { 
        // Fetch camera IDs from database
        const office_cameras = await this.getOfficeCameraIds();
        const park_cameras = await this.getParkCameraIds();
         let intrusion_detection_code=131585
         let attendance_code=131659
         let bevaviour_code=[131593,131605,131592,131677,131596,192515]
         
         Logger.debug(`[EventHandlerService] Event type codes configured:`, {
            intrusion_detection_code,
            attendance_code,
            bevaviour_code,
            office_cameras_count: office_cameras.length,
            park_cameras_count: park_cameras.length
         });
         
         
         const age_groups = [
            { code: 'UNKNOWN', name: 'Unknown.', remarks: 0 },
            { code: 'CHILD', name: 'Teenager.', remarks: 3 },
            { code: 'YOUNG', name: 'Youth.', remarks: 5 },
            { code: 'MIDDLE', name: 'Middle age.', remarks: 7 },
            { code: 'OLD', name: 'Elderly.', remarks: 9 },
            { code: 'INFANT', name: 'Infant.', remarks: 1 },
            { code: 'KID', name: 'Child.', remarks: 2 },
            { code: 'TEENAGER', name: 'Early youth.', remarks: 4 },
            { code: 'PRIME', name: 'Prime.', remarks: 6 },
            { code: 'MIDDLEAGED', name: 'Middle to old age.', remarks: 8 }
         ]
         
         const gender_types = [
            { code: 0, name: 'Unknown.' },
            { code: 1, name: 'Male.' },
            { code: 2, name: 'Female.' }
         ]

          if(eventData){
             Logger.debug(`[EventHandlerService] Processing event data:`, { 
                hasEventData: !!eventData.event,
                hasLogData: !!eventData.logData,
                eventKeys: eventData.event ? Object.keys(eventData.event) : [],
                logDataKeys: eventData.logData ? Object.keys(eventData.logData) : []
             });
             
             const extractEventData = (data: any) => {
                // Check for direct event structure (Format 2)
                if (data.event?.params?.events?.[0]) {
                   Logger.debug(`[EventHandlerService] Extracting event data from event.params.events[0]`);
                   return data.event.params.events[0];
                }
                
                // Check for deeply nested logData structure (Format 1)
                // This handles: data.logData.logData.logData.params.events[0]
                let currentLevel = data.logData;
                let depth = 0;
                const maxDepth = 10; // Prevent infinite loops
                
                while (currentLevel && depth < maxDepth) {
                   // Check if current level has the event data
                   if (currentLevel.params?.events?.[0]) {
                      Logger.debug(`[EventHandlerService] Extracting event data from logData at depth ${depth}`);
                      return currentLevel.params.events[0];
                   }
                   
                   // Check if current level has nested logData
                   if (currentLevel.logData) {
                      currentLevel = currentLevel.logData;
                      depth++;
                   } else {
                      break;
                   }
                }
                
                // Check for legacy logData structure (backward compatibility)
                if (data.logData?.event?.params?.events?.[0]) {
                   Logger.debug(`[EventHandlerService] Extracting event data from logData.event.params.events[0]`);
                   return data.logData.event.params.events[0];
                }
                
                Logger.warn(`[EventHandlerService] No valid event data found in expected structure`);
                Logger.debug(`[EventHandlerService] Available data structure:`, {
                   hasEvent: !!data.event,
                   hasLogData: !!data.logData,
                   logDataDepth: depth,
                   eventKeys: data.event ? Object.keys(data.event) : [],
                   logDataKeys: data.logData ? Object.keys(data.logData) : []
                });
                return null;
             };
             
             const eventInfo = extractEventData(eventData);
             if (!eventInfo) {
                Logger.error(`[EventHandlerService] Invalid event data structure`, eventData);
                throw new HttpException(STATUS.BAD_REQUEST, "Invalid event data structure");
             }
             
             let eventType = eventInfo.eventType
             Logger.info(`[EventHandlerService] Extracted event info:`, {
                eventType,
                eventId: eventInfo.eventId,
                srcIndex: eventInfo.srcIndex,
                srcName: eventInfo.srcName,
                happenTime: eventInfo.happenTime
             });
             
             if (eventType === intrusion_detection_code) {
                Logger.info(`[EventHandlerService] Processing intrusion detection event`);
             } else if (eventType === attendance_code) {
                Logger.info(`[EventHandlerService] Processing attendance event`);
             } else if (bevaviour_code.includes(eventType)) {
                Logger.info(`[EventHandlerService] Processing behavior detection event`);
             } else {
                Logger.warn(`[EventHandlerService] Unknown event type: ${eventType}`);
             }
             
             if(eventType===intrusion_detection_code){
                Logger.info(`[EventHandlerService] Processing intrusion detection for camera: ${eventInfo.srcIndex}`);
                let park_Id;

                let parkcamera=await db.park_cameras.findFirst({
                   where:{
                      camera_Id: eventInfo.srcIndex
                   }
                })
                
                if(parkcamera){
                   Logger.info(`[EventHandlerService] Found park camera:`, {
                      cameraId: parkcamera.Id,
                      parkId: parkcamera.park_Id,
                      cameraIndex: eventInfo.srcIndex
                   });
                   
                   park_Id=parkcamera.park_Id
                   let imageUrl = null;
                   
                   try {
                      const eventIndexCode = eventInfo.eventId;
                      Logger.debug(`[EventHandlerService] Attempting to retrieve image for intrusion event: ${eventIndexCode}`);
                      
                      const eventRecordsResponse = await this.getEventRecords(eventIndexCode);
                      
                      if (eventRecordsResponse && eventRecordsResponse.code === '0' && eventRecordsResponse.data?.list?.length > 0) {
                         const eventRecord = eventRecordsResponse.data.list[0];
                         const eventPicUri = eventRecord.eventPicUri;
                         Logger.debug(`[EventHandlerService] Found event record with picUri: ${eventPicUri ? 'Yes' : 'No'}`);
                         
                         if (eventPicUri) {
                            const imageDataResponse = await this.getImageData(eventPicUri);
                            
                            if (imageDataResponse) {
                               // The response is directly the base64 string, not wrapped in a data object
                               const base64Image = imageDataResponse;
                               
                               // Upload to Cloudinary
                               imageUrl = await this.uploadImageToCloudinary(base64Image, 'intrusion', eventIndexCode);
                               Logger.info(`[EventHandlerService] Successfully uploaded intrusion image to Cloudinary`);
                            }
                         } else {
                            Logger.warn(`[EventHandlerService] No eventPicUri found for intrusion event`);
                         }
                      } else {
                         Logger.warn(`[EventHandlerService] No valid event records found for intrusion event`);
                      }
                   } catch (imageError: any) {
                      Logger.error(`[EventHandlerService] Failed to process intrusion image:`, imageError);
                   }

                   const intrusionData = {
                      park_Id:park_Id,
                      camera_Id:parkcamera.Id,
                      occurrence_date:eventInfo.happenTime,
                      occurrence_time:eventInfo.happenTime,
                      snap_shot:imageUrl,
                      detection_Id:eventInfo.eventId,
                      detection_date:eventInfo.happenTime,
                      detection_time:eventInfo.happenTime,
                      is_employee:false,
                      description: `Intrusion detected at ${eventInfo.srcName} camera`
                   }
                   
                   Logger.info(`[EventHandlerService] Creating intrusion detection record:`, {
                      parkId: intrusionData.park_Id,
                      cameraId: intrusionData.camera_Id,
                      detectionId: intrusionData.detection_Id,
                      hasImage: !!imageUrl
                   });
                   
                   // Check if intrusion detection with same detection_Id already exists
                   const existingIntrusion = await db.parks_intrusion_detection.findFirst({
                      where: {
                         detection_Id: intrusionData.detection_Id
                      }
                   });
                   
                   if (existingIntrusion) {
                      Logger.warn(`[EventHandlerService] Intrusion detection with detection_Id ${intrusionData.detection_Id} already exists. Skipping duplicate creation.`);
                      return;
                   }
                   
                   const new_intrusion_detection=await db.parks_intrusion_detection.create({
                      data: intrusionData
                   })
                   
                   Logger.info(`[EventHandlerService] Successfully created intrusion detection record with ID: ${new_intrusion_detection.Id}`);

                   const parkExists = await db.parks.findFirst({
                      where: { Id: parkcamera.park_Id || 0},
                   });

                   let intranetHistory = null;
                   let intranetResponse = null;
                   let intranetSuccess = false;
                   let intranetError: any = null;
                   
                   try {
                      intranetResponse = await this.postToIntranetAPI(parkExists, intrusionData);
                      intranetSuccess = true;
                   } catch (error: any) {
                      intranetError = error;
                      intranetSuccess = false;
                   }

                   try {
                      intranetHistory = await db.intranet_posting_history.create({
                         data: {
                            intrusionDetectionId: new_intrusion_detection.Id,
                            title: `Alert Posted to Intranet`,
                            intranet_id: intranetSuccess ? intranetResponse?.ApplicationNumber : null,
                            comments: intranetSuccess 
                               ? `Intrusion detected at ${intrusionData.description} - Posted successfully to intranet`
                               : ``,
                            date: new Date(),
                            time: new Date(),
                         }
                      });

                      if (intranetSuccess) {
                         const updatedResult = await db.parks_intrusion_detection.update({
                            where: { Id: new_intrusion_detection.Id },
                            data: {
                               posted_to_intranet_date: intranetHistory.date,
                               posted_to_intranet_time: intranetHistory.time,
                               updatedAt: new Date()
                            }
                         });
                         Logger.info(`[EventHandlerService] Intrusion detection record updated with intranet details`);
                      } else {
                         Logger.info(`[EventHandlerService] Intrusion detection record saved without intranet details due to API failure`);
                      }

                   } catch (historyError: any) {
                      Logger.error(`[EventHandlerService] Failed to create intranet posting history:`, historyError.message);
                   }
                }
                else{
                   Logger.error(`[EventHandlerService] Park camera not found for camera index: ${eventInfo.srcIndex}`);
                   return new HttpException(STATUS.NOT_FOUND, "Park camera not found")
                }
             }
             else if(eventType===attendance_code){
                Logger.info(`[EventHandlerService] Processing attendance event for camera: ${eventInfo.srcIndex} (${eventInfo.srcName})`);
                const isOfficeCamera = office_cameras.includes(eventInfo.srcIndex)
                const isParkCamera = park_cameras.includes(eventInfo.srcIndex)
                
                Logger.info(`[EventHandlerService] Camera type detection:`, {
                   srcIndex: eventInfo.srcIndex,
                   srcName: eventInfo.srcName,
                   isOfficeCamera,
                   isParkCamera,
                   officeCamerasList: office_cameras,
                   parkCamerasList: park_cameras
                });
                
                if(isOfficeCamera){
                   Logger.info(`[EventHandlerService] Processing office camera attendance - Camera: ${eventInfo.srcName} (${eventInfo.srcIndex})`);
                   const officeCamera = await db.offices_cameras.findFirst({
                      where: {
                         camera_Id: eventInfo.srcIndex
                      }
                   })
                   
                   Logger.info(`[EventHandlerService] Office camera lookup result:`, {
                      found: !!officeCamera,
                      cameraId: officeCamera?.Id,
                      officeId: officeCamera?.office_Id,
                      cameraName: officeCamera?.camera_english_name
                   });
                   
                   if(officeCamera && officeCamera.office_Id){
                      Logger.info(`[EventHandlerService] Found office camera:`, {
                         cameraId: officeCamera.Id,
                         officeId: officeCamera.office_Id,
                         cameraIndex: eventInfo.srcIndex
                      });
                      
                      const office_Id = officeCamera.office_Id
                      const isEntry = eventInfo.srcName.toLowerCase().includes("entry") || eventInfo.srcName.toLowerCase().includes("test")
                      const isExit = eventInfo.srcName.toLowerCase().includes("exit")
                      
                      Logger.info(`[EventHandlerService] Office attendance type:`, {
                         srcName: eventInfo.srcName,
                         isEntry,
                         isExit,
                         officeId: office_Id,
                         srcIndex: eventInfo.srcIndex
                      });
                      
                      let genderName = 'Unknown';
                      let isChild = false;
                      let person_Id = null;
                      let faceData = null;
                      
                      if (eventInfo.data?.alarmResult?.faces) {
                         Logger.debug(`[EventHandlerService] Processing face recognition data for office attendance`);
                         const genderValue = eventInfo.data.alarmResult.faces.gender.value
                         const ageGroup = eventInfo.data.alarmResult.faces.age.ageGroup
                         genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                         isChild = ageGroup <= 2 // INFANT, KID, CHILD
                         
                         const similarity = eventInfo.data.alarmResult.faces.identify.candidate.similarity
                         const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id
                         
                         Logger.debug(`[EventHandlerService] Face recognition details:`, {
                            genderValue,
                            ageGroup,
                            genderName,
                            isChild,
                            similarity,
                            humanId
                         });
                         
                         if (humanId) {
                            const user = await db.users.findFirst({
                               where: { unique_id: humanId.toString() }
                            });
                            if (user) {
                               person_Id = user.Id;
                               Logger.info(`[EventHandlerService] Identified employee:`, {
                                  personId: person_Id,
                                  empId: humanId,
                                  similarity
                               });
                            } else {
                               Logger.warn(`[EventHandlerService] Employee not found in database for empId: ${humanId}`);
                               Logger.info(`[EventHandlerService] 👤 Employee not found, creating guest user for office attendance`, {
                                  empId: humanId,
                                  similarity,
                                  gender: genderName
                               });
                               
                               try {
                                  // Get faceData URL from event data
                                  let faceData = null;
                                  if (eventInfo.data?.alarmResult?.faces?.URL) {
                                     faceData = eventInfo.data.alarmResult.faces.URL;
                                     Logger.debug(`[EventHandlerService] 📸 Extracted face data URL for guest user`, {
                                        faceDataUrl: faceData
                                     });
                                     } else {
                                     Logger.warn(`[EventHandlerService] ⚠️ No face data URL available for guest user creation`);
                                  }
                                  
                                  const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData);
                                  person_Id = guestUser.Id;
                                  
                                  Logger.info(`[EventHandlerService] ✅ Successfully created guest user for office attendance`, {
                                     guestUserId: person_Id,
                                     guestName: guestUser.emp__eng_name,
                                     gender: genderName,
                                     unique_id: guestUser.unique_id,
                                     originalEmpId: humanId
                                  });
                               } catch (guestError: any) {
                                  Logger.error(`[EventHandlerService] ❌ Failed to create guest user for office attendance`, {
                                     error: guestError.message,
                                     empId: humanId,
                                     gender: genderName,
                                     hasFaceData: !!faceData
                                  });
                               }
                            }
                         } else {
                           console.log('No Human')
                            Logger.debug(`[EventHandlerService] No valid employee identification (similarity: ${similarity}, humanId: ${humanId})`);
                            Logger.info(`[EventHandlerService] 👤 Unknown person detected, creating guest user for office attendance`, {
                               similarity,
                               humanId,
                               gender: genderName
                            });
                            
                            try {
                               // Get faceData URL from event data
                               let faceData = null;
                               if (eventInfo.data?.alarmResult?.faces?.URL) {
                                  faceData = eventInfo.data.alarmResult.faces.URL;
                                  Logger.debug(`[EventHandlerService] 📸 Extracted face data URL for unknown visitor`, {
                                     faceDataUrl: faceData
                                  });
                                  } else {
                                  Logger.warn(`[EventHandlerService] ⚠️ No face data URL available for unknown visitor guest creation`);
                               }
                               
                               const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData);
                                  person_Id = guestUser.Id;
                               
                               Logger.info(`[EventHandlerService] ✅ Successfully created guest user for unknown office visitor`, {
                                  guestUserId: person_Id,
                                     guestName: guestUser.emp__eng_name,
                                  gender: genderName,
                                  unique_id: guestUser.unique_id,
                                  originalHumanId: humanId
                                  });
                               } catch (guestError: any) {
                                Logger.error(`[EventHandlerService] ❌ Failed to create guest user for unknown office visitor`, {
                                   error: guestError.message,
                                   humanId,
                                   gender: genderName,
                                   hasFaceData: !!faceData
                                });
                             }
                         }
                      } else {
                         Logger.debug(`[EventHandlerService] No face recognition data available for office attendance`);
                      }
                      
                      const officeFootfallData = {
                         office_Id: office_Id,
                         detection_Id: eventInfo.eventId,
                         person_Id: person_Id,
                         gender: genderName,
                         is_child: isChild,
                         time: eventInfo.happenTime,
                         detected_camera_Id: eventInfo.srcIndex,
                         detected_camera_name: eventInfo.srcName
                      }
                      
                      // Only create footfall records for entry events, not exit events
                      Logger.info(`[EventHandlerService] Checking if should create footfall record:`, {
                         isEntry,
                         srcName: eventInfo.srcName,
                         officeId: officeFootfallData.office_Id,
                         personId: officeFootfallData.person_Id
                      });
                      
                      if(isEntry){
                         Logger.info(`[EventHandlerService] ✅ Creating office footfall record for entry:`, {
                         officeId: officeFootfallData.office_Id,
                         personId: officeFootfallData.person_Id,
                         gender: officeFootfallData.gender,
                         isChild: officeFootfallData.is_child,
                         detectionId: officeFootfallData.detection_Id,
                         srcName: eventInfo.srcName
                      });
                      
                        const officeFootfallRecord = await db.offices_footfall_analysis.create({
                           data: officeFootfallData
                        })
                        
                        Logger.info(`[EventHandlerService] Successfully created office footfall record with ID: ${officeFootfallRecord.id}`);

                        let userDetails = null;
                        if (person_Id) {
                           const user = await db.users.findFirst({ where: { Id: person_Id } });
                           if (user) {
                              userDetails = {
                                 Id: user.Id,
                                 user_Id: user.user_Id,
                                 emp_Id: user.emp_Id,
                                 emp__eng_name: user.emp__eng_name,
                                 emp__arabic_name: user.emp__arabic_name,
                                 gender: user.gender,
                                 image: user.image
                              };
                           }
                        }

                        const officeDetails = await db.offices.findFirst({ where: { Id: office_Id } });
                        
                        const officeCamera = await db.offices_cameras.findFirst({ where: { camera_Id: eventInfo.srcIndex } });

                        const socketData = {
                           type: 'new_entry',
                           data: {
                              id: officeFootfallRecord.id,
                              office_Id: officeFootfallData.office_Id,
                              detection_Id: officeFootfallData.detection_Id,
                              person_Id: officeFootfallData.person_Id,
                              gender: officeFootfallData.gender,
                              is_child: officeFootfallData.is_child,
                              detected_camera_Id: officeFootfallData.detected_camera_Id,
                              detected_camera_name: officeFootfallData.detected_camera_name,
                              time: formatDate(officeFootfallData.time),
                              createdAt: new Date(),
                              updatedAt: new Date(),
                              person: userDetails,
                              office: officeDetails ? {
                                 Id: officeDetails.Id,
                                 office_english_name: officeDetails.office_english_name,
                                 office_arabic_name: officeDetails.office_arabic_name
                              } : null,
                              offices_cameras: officeCamera ? {
                                 Id: officeCamera.Id,
                                 camera_english_name: officeCamera.camera_english_name,
                                 camera_arabic_name: officeCamera.camera_arabic_name,
                                 ip_address: officeCamera.ip_address
                              } : null
                           }
                        };
                        
                        SocketService.emitOfficeFootfallUpdate(socketData);
                      } else {
                         Logger.info(`[EventHandlerService] ❌ Skipping office footfall record creation for exit event:`, {
                            srcName: eventInfo.srcName,
                            isEntry,
                            isExit
                         });
                      }

                      // Create sentiment analysis record for both entry and exit events
                      let sentimentImageUrl = null;
                      let detectedSentiment = 'neutral'; // Default sentiment
                      
                      // Get faceData URL from event data (same as guest user creation)
                      if (eventInfo.data?.alarmResult?.faces?.URL) {
                         try {
                            Logger.info(`[EventHandlerService] Processing sentiment analysis image for office`);
                            const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                            const imageDataResponse = await this.getImageData(faceDataUrl);
                            
                            if (imageDataResponse) {
                               // The response is directly the base64 string, not wrapped in a data object
                               const base64Image = imageDataResponse;
                               
                               // Upload to Cloudinary
                               sentimentImageUrl = await this.uploadImageToCloudinary(base64Image, 'sentiment', eventInfo.eventId);
                               Logger.info(`[EventHandlerService] Successfully uploaded sentiment image to Cloudinary for office`);
                               
                               // Get emotion detection from the uploaded image
                               if (sentimentImageUrl) {
                                  try {
                                     Logger.info(`[EventHandlerService] Calling emotion detection API for office sentiment`);
                                     const emotionResponse = await axios.post('http://127.0.0.1:8000/api/emotion-detection', {
                                        image_url: sentimentImageUrl
                                     }, {
                                        timeout: 10000,
                                        headers: { 'Content-Type': 'application/json' }
                                     });
                                     
                                     if (emotionResponse.data?.success && emotionResponse.data?.faces?.length > 0) {
                                        detectedSentiment = emotionResponse.data.faces[0].emotion;
                                        Logger.info(`[EventHandlerService] Detected office sentiment: ${detectedSentiment}`, {
                                           confidence: emotionResponse.data.faces[0].confidence,
                                           processingTime: emotionResponse.data.processing_time
                                        });
                                     } else {
                                        Logger.warn(`[EventHandlerService] No emotion detected for office image, using default: neutral`);
                                     }
                                  } catch (emotionError: any) {
                                     if (emotionError.code === 'ECONNREFUSED') {
                                        Logger.warn(`[EventHandlerService] Emotion detection service is not available (ECONNREFUSED). Using default sentiment: neutral`);
                                     } else if (emotionError.code === 'ETIMEDOUT') {
                                        Logger.warn(`[EventHandlerService] Emotion detection service timed out. Using default sentiment: neutral`);
                                     } else {
                                        Logger.error(`[EventHandlerService] Failed to detect emotion for office image:`, emotionError.message);
                                        Logger.info(`[EventHandlerService] Using default sentiment: neutral`);
                                     }
                                  }
                               }
                            }
                         } catch (imageError: any) {
                            Logger.error(`[EventHandlerService] Failed to process office sentiment image:`, imageError);
                         }
                      }

                      // Get user details for sentiment analysis (same structure as office sentiment service)
                      let personName = 'Unknown';
                      let personImage = null;
                      let sentimentOf = 'visitor';
                      let userDetails = null;
                      
                      if (person_Id) {
                         const user = await db.users.findUnique({
                            where: { Id: person_Id },
                            include: {
                               users_roles: {
                                  select: {
                                     role_name: true
                                  }
                               }
                            }
                         });
                         
                         if (user) {
                            personName = user.emp__eng_name || user.emp__arabic_name || 'Unknown';
                            personImage = user.image;
                            
                            // Determine if employee or visitor (same logic as office sentiment service)
                            const isEmployee = (user.emp_Id && user.emp_Id.trim() !== '') ||
                                             (user.emp_code && user.emp_code.trim() !== '') ||
                                             user.is_attendance_user === true;
                            sentimentOf = isEmployee ? 'employee' : 'visitor';
                            
                            // Create user details object (same structure as office sentiment service)
                            userDetails = {
                               Id: user.Id,
                               user_Id: user.user_Id,
                               emp_Id: user.emp_Id,
                               emp__eng_name: user.emp__eng_name,
                               emp__arabic_name: user.emp__arabic_name,
                               gender: user.gender,
                               country_code: user.country_code,
                               phone: user.phone,
                               email: user.email,
                               dep_eng_name: user.dep_eng_name,
                               dep_arabic_name: user.dep_arabic_name,
                               desig_eng_name: user.desig_eng_name,
                               desig_arabic_name: user.desig_arabic_name,
                               unit_eng_name: user.unit_eng_name,
                               unit_arabic_name: user.unit_arabic_name,
                               committe_eng_name: user.committe_eng_name,
                               committe_arabic_name: user.committe_arabic_name,
                               ai_engine_access: user.ai_engine_access,
                               last_login: user.last_login,
                               role: user.users_roles?.role_name,
                               createdAt: user.createdAt,
                               updatedAt: user.updatedAt
                            };
                            
                            Logger.debug(`[EventHandlerService] Office sentiment analysis user details:`, {
                               personName,
                               sentimentOf,
                               hasPersonImage: !!personImage
                            });
                         }
                      }

                      const officeSentimentData = {
                         office_Id: office_Id,
                         person_Id: person_Id?.toString() || null,
                         detection_Id: eventInfo.eventId,
                         person_name: personName,
                         person_image: personImage,
                         gender: genderName,
                         check_in_image: isEntry ? sentimentImageUrl : null,
                         sentiment_of: sentimentOf as 'employee' | 'visitor',
                         check_in_date: isEntry ? eventInfo.happenTime: null,
                         check_in_time: isEntry ?eventInfo.happenTime : null,
                         check_in_sentiment: isEntry ? detectedSentiment : null,
                         entry_camera_Id: isEntry ? officeCamera.Id : null,
                         check_out_date: isExit ? eventInfo.happenTime : null,
                         check_out_time: isExit ? eventInfo.happenTime : null,
                         check_out_capture: isExit ? sentimentImageUrl : null,
                         check_out_sentiment: isExit ? detectedSentiment : null,
                         exit_camera_Id: isExit ? officeCamera.Id : null
                      }
                    
                      if(isEntry){
                         // Create new sentiment analysis record for entry
                         Logger.info(`[EventHandlerService] Creating office sentiment analysis record for entry:`, {
                            officeId: officeSentimentData.office_Id,
                            personId: officeSentimentData.person_Id,
                            personName: officeSentimentData.person_name,
                            sentimentOf: officeSentimentData.sentiment_of,
                            hasImage: !!sentimentImageUrl
                         });
                         
                         const officeSentimentRecord = await db.offices_sentiment_analysis.create({
                            data: officeSentimentData
                         });
                         
                         Logger.info(`[EventHandlerService] Successfully created office sentiment analysis record with ID: ${officeSentimentRecord.Id}`);
                         
                         try {
                            SocketService.emitOfficeSentimentUpdate({
                               type: 'new_entry',
                               data: {
                                  id: officeSentimentRecord.Id,
                                  person_Id: officeSentimentData.person_Id,
                                  detection_Id: officeSentimentData.detection_Id,
                                  sentiment_of: officeSentimentData.sentiment_of,
                                  person_name: personName,
                                  person_image: personImage,
                                  gender: officeSentimentData.gender,
                                  check_in_image: officeSentimentData.check_in_image,
                                  check_in_date: formatDate(officeSentimentData.check_in_date),
                                  check_in_time: formatTime(officeSentimentData.check_in_time),
                                  check_in_sentiment: officeSentimentData.check_in_sentiment,
                                  entry_camera_Id: officeSentimentData.entry_camera_Id,
                                  check_out_date: officeSentimentData.check_out_date ? formatDate(officeSentimentData.check_out_date) : null,
                                  check_out_time: officeSentimentData.check_out_time ? formatTime(officeSentimentData.check_out_time) : null,
                                  check_out_capture: officeSentimentData.check_out_capture,
                                  check_out_sentiment: officeSentimentData.check_out_sentiment,
                                  exit_camera_Id: officeSentimentData.exit_camera_Id,
                                  createdAt: officeSentimentRecord.createdAt,
                                  updatedAt: officeSentimentRecord.updatedAt,
                                  user: userDetails, // Complete user details (same as office sentiment service)
                                  // Camera details (same structure as office sentiment service)
                                  offices_cameras_offices_sentiment_analysis_entry_camera_IdTooffices_cameras: isEntry ? {
                                     camera_english_name: officeCamera.camera_english_name,
                                     camera_arabic_name: officeCamera.camera_arabic_name,
                                     ip_address: officeCamera.ip_address
                                  } : null,
                                  offices_cameras_offices_sentiment_analysis_exit_camera_IdTooffices_cameras: isExit ? {
                                     camera_english_name: officeCamera.camera_english_name,
                                     camera_arabic_name: officeCamera.camera_arabic_name,
                                     ip_address: officeCamera.ip_address
                                  } : null
                               }
                            });
                         } catch (socketError) {
                            Logger.error(`[EventHandlerService] Failed to emit socket event:`, socketError);
                         }
                      } else if(isExit){
                         // Find existing sentiment analysis record for exit (similar to attendance logic)
                         Logger.info(`[EventHandlerService] Processing office exit sentiment analysis`);
                         
                         // Process exit sentiment image and detection
                         let exitSentimentImageUrl = null;
                         let exitDetectedSentiment = 'neutral'; // Default sentiment
                         
                         // Get faceData URL from event data for exit sentiment
                         if (eventInfo.data?.alarmResult?.faces?.URL) {
                            try {
                               Logger.info(`[EventHandlerService] Processing exit sentiment analysis image for office`);
                               const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                               const imageDataResponse = await this.getImageData(faceDataUrl);
                               
                               if (imageDataResponse) {
                                  // The response is directly the base64 string, not wrapped in a data object
                                  const base64Image = imageDataResponse;
                                  
                                  // Upload to Cloudinary
                                  exitSentimentImageUrl = await this.uploadImageToCloudinary(base64Image, 'sentiment', eventInfo.eventId);
                                  Logger.info(`[EventHandlerService] Successfully uploaded exit sentiment image to Cloudinary for office`);
                                  
                                  // Get emotion detection from the uploaded image
                                  if (exitSentimentImageUrl) {
                                     try {
                                        Logger.info(`[EventHandlerService] Calling emotion detection API for office exit sentiment`);
                                        const emotionResponse = await axios.post('http://127.0.0.1:8000/api/emotion-detection', {
                                           image_url: exitSentimentImageUrl
                                        }, {
                                           timeout: 10000,
                                           headers: { 'Content-Type': 'application/json' }
                                        });
                                        
                                        if (emotionResponse.data?.success && emotionResponse.data?.faces?.length > 0) {
                                           exitDetectedSentiment = emotionResponse.data.faces[0].emotion;
                                           Logger.info(`[EventHandlerService] Detected office exit sentiment: ${exitDetectedSentiment}`, {
                                              confidence: emotionResponse.data.faces[0].confidence,
                                              processingTime: emotionResponse.data.processing_time
                                           });
                                        } else {
                                           Logger.warn(`[EventHandlerService] No emotion detected for office exit image, using default: neutral`);
                                        }
                                     } catch (emotionError: any) {
                                        if (emotionError.code === 'ECONNREFUSED') {
                                           Logger.warn(`[EventHandlerService] Emotion detection service is not available (ECONNREFUSED). Using default exit sentiment: neutral`);
                                        } else if (emotionError.code === 'ETIMEDOUT') {
                                           Logger.warn(`[EventHandlerService] Emotion detection service timed out. Using default exit sentiment: neutral`);
                                        } else {
                                           Logger.error(`[EventHandlerService] Failed to detect emotion for office exit image:`, emotionError.message);
                                           Logger.info(`[EventHandlerService] Using default exit sentiment: neutral`);
                                        }
                                     }
                                  }
                               }
                            } catch (imageError: any) {
                               Logger.error(`[EventHandlerService] Failed to process office exit sentiment image:`, imageError);
                            }
                         }
                         
                         // If person_Id is null, try to find it using human_id from the event
                         let searchPersonId = person_Id;
                         if (!searchPersonId && eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id) {
                            const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id;
                            if (humanId && humanId !== "-1") {
                               const user = await db.users.findFirst({
                                  where: { unique_id: humanId.toString() }
                               });
                               if (user) {
                                  searchPersonId = user.Id;
                                  Logger.info(`[EventHandlerService] Found person_Id for exit sentiment using human_id: ${searchPersonId}`);
                               }
                            }
                         }
                         
                         if (!searchPersonId) {
                            Logger.warn(`[EventHandlerService] Cannot process exit sentiment - no valid person_Id found`);
                            return;
                         }
                         
                         const latestSentiment = await db.offices_sentiment_analysis.findFirst({
                            where: {
                               office_Id: office_Id,
                               person_Id: searchPersonId.toString(),
                               check_out_capture: null // Find record without exit data
                            },
                            orderBy: {
                               check_in_date: 'desc'
                            }
                         });
                         
                         if(latestSentiment){
                            Logger.info(`[EventHandlerService] Updating office exit sentiment analysis for record ID: ${latestSentiment.Id}`);
                            await db.offices_sentiment_analysis.update({
                               where: { Id: latestSentiment.Id },
                               data: {
                                  check_out_capture: exitSentimentImageUrl,
                                  check_out_date: officeSentimentData.check_out_date,
                                  check_out_time: officeSentimentData.check_out_time,
                                  check_out_sentiment: exitDetectedSentiment,
                                  exit_camera_Id: officeSentimentData.exit_camera_Id
                               }
                            });
                            Logger.info(`[EventHandlerService] Successfully updated office exit sentiment analysis`);
                            
                            // Get entry camera details for the exit update
                            let entryCameraDetails = null;
                            if (latestSentiment.entry_camera_Id) {
                               const entryCamera = await db.offices_cameras.findFirst({
                                  where: { Id: latestSentiment.entry_camera_Id }
                               });
                               if (entryCamera) {
                                  entryCameraDetails = {
                                     camera_english_name: entryCamera.camera_english_name,
                                     camera_arabic_name: entryCamera.camera_arabic_name,
                                     ip_address: entryCamera.ip_address
                                  };
                               }
                            }

                            try {
                               SocketService.emitOfficeSentimentUpdate({
                                  type: 'exit_update',
                                  data: {
                                     id: latestSentiment.Id,
                                     person_Id: latestSentiment.person_Id,
                                     detection_Id: latestSentiment.detection_Id,
                                     sentiment_of: latestSentiment.sentiment_of,
                                     person_name: personName,
                                     person_image: personImage,
                                     gender: latestSentiment.gender,
                                     check_in_image: latestSentiment.check_in_image,
                                     check_in_date: formatDate(latestSentiment.check_in_date),
                                     check_in_time: formatTime(latestSentiment.check_in_time),
                                     check_in_sentiment: latestSentiment.check_in_sentiment,
                                     entry_camera_Id: latestSentiment.entry_camera_Id,
                                     check_out_date: formatDate(officeSentimentData.check_out_date),
                                     check_out_time: formatTime(officeSentimentData.check_out_time),
                                     check_out_capture: exitSentimentImageUrl,
                                     check_out_sentiment: exitDetectedSentiment,
                                     exit_camera_Id: officeSentimentData.exit_camera_Id,
                                     createdAt: latestSentiment.createdAt,
                                     updatedAt: latestSentiment.updatedAt,
                                     user: userDetails, // Complete user details (same as office sentiment service)
                                     // Camera details (same structure as office sentiment service)
                                     offices_cameras_offices_sentiment_analysis_entry_camera_IdTooffices_cameras: entryCameraDetails,
                                     offices_cameras_offices_sentiment_analysis_exit_camera_IdTooffices_cameras: {
                                        camera_english_name: officeCamera.camera_english_name,
                                        camera_arabic_name: officeCamera.camera_arabic_name,
                                        ip_address: officeCamera.ip_address
                                     }
                                  }
                               });
                            } catch (socketError) {
                               Logger.error(`[EventHandlerService] Failed to emit socket event for exit:`, socketError);
                            }
                         } else {
                            Logger.warn(`[EventHandlerService] No matching entry record found for office exit sentiment analysis`, {
                               office_Id,
                               person_Id: searchPersonId,
                               searchCriteria: {
                                  office_Id,
                                  person_Id: searchPersonId.toString(),
                                  check_out_capture: null
                               }
                            });
                         }
                      }
                      
                      if(isEntry){
                         // Check if the person is a guest user
                         const isGuest = await this.isGuestUser(person_Id);
                         
                         if (isGuest) {
                            Logger.info(`[EventHandlerService] Skipping office entry attendance record for guest user`, {
                               person_Id,
                               office_Id,
                               reason: "Guest users do not have attendance records"
                            });
                         } else {
                         Logger.info(`[EventHandlerService] Processing office entry attendance`);
                         const officeAttendanceData = {
                            office_Id: office_Id,
                            person_Id: person_Id,
                            entry_time: eventInfo.happenTime
                         }
                         
                         const officeAttendanceRecord = await db.offices_attendance.create({
                            data: officeAttendanceData
                         })
                         
                         Logger.info(`[EventHandlerService] Successfully created office entry attendance record with ID: ${officeAttendanceRecord.Id}`);

                         // Emit office attendance update via socket
                         try {
                            // Get user details
                            const userDetails = officeAttendanceRecord.person_Id ? await db.users.findUnique({
                               where: { Id: officeAttendanceRecord.person_Id },
                               select: {
                                  Id: true,
                                  emp__eng_name: true,
                                  emp__arabic_name: true,
                                  emp_Id: true,
                                  user_Id: true,
                                  unique_id: true,
                                  dep_eng_name: true,
                                  dep_arabic_name: true,
                                  gender: true,
                                  image: true,
                                  is_attendance_user: true
                               }
                            }) : null;

                            // Get office details
                            const officeDetails = officeAttendanceRecord.office_Id ? await db.offices.findUnique({
                               where: { Id: officeAttendanceRecord.office_Id },
                               select: {
                                  Id: true,
                                  office_english_name: true,
                                  office_arabic_name: true,
                                  latitude: true,
                                  longitude: true
                               }
                            }) : null;

                            // Format dates for frontend compatibility
                            const formatTimeToString = (timeValue: any): string => {
                               if (!timeValue) return "--";
                               
                               try {
                                  let dateObj: Date;
                                  
                                  if (typeof timeValue === 'string') {
                                     if (timeValue.includes(' ') && timeValue.includes(':')) {
                                        dateObj = new Date(timeValue);
                                     } else {
                                        return timeValue;
                                     }
                                  } else if (timeValue instanceof Date) {
                                     dateObj = timeValue;
                                  } else {
                                     return "--";
                                  }
                                  
                                  if (isNaN(dateObj.getTime())) {
                                     return "--";
                                  }
                                  const hours = dateObj.getUTCHours().toString().padStart(2, '0');
                                  const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
                                  const seconds = dateObj.getUTCSeconds().toString().padStart(2, '0');
                                  return `${hours}:${minutes}:${seconds}`;
                               } catch (error) {
                                  return "--";
                               }
                            };

                            const formatDateToString = (dateValue: any): string => {
                               if (!dateValue) return "No date";
                               
                               try {
                                  let dateObj: Date;
                                  
                                  if (typeof dateValue === 'string') {
                                     if (dateValue.includes(' ') && dateValue.includes(':')) {
                                        dateObj = new Date(dateValue);
                                     } else if (dateValue.includes('-') && dateValue.length === 10) {
                                        return dateValue;
                                     } else {
                                        return "No date";
                                     }
                                  } else if (dateValue instanceof Date) {
                                     dateObj = dateValue;
                                  } else {
                                     return "No date";
                                  }
                                  
                                  if (isNaN(dateObj.getTime())) {
                                     return "No date";
                                  }
                                  
                                  const year = dateObj.getUTCFullYear();
                                  const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
                                  const day = dateObj.getUTCDate().toString().padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                               } catch (error) {
                                  return "No date";
                               }
                            };

                            const formatDateForDisplay = (dateString: string): string => {
                               if (!dateString || dateString === "No date") return "No date";
                               
                               try {
                                  const [year, month, day] = dateString.split('-');
                                  const monthNames = [
                                     "January", "February", "March", "April", "May", "June",
                                     "July", "August", "September", "October", "November", "December"
                                  ];
                                  
                                  const monthIndex = parseInt(month) - 1;
                                  if (monthIndex < 0 || monthIndex > 11) return dateString;
                                  
                                  return `${parseInt(day)} ${monthNames[monthIndex]} ${year}`;
                               } catch (error) {
                                  return dateString;
                               }
                            };

                            const socketData = {
                               type: 'attendance_entry',
                               data: {
                                  ...officeAttendanceRecord,
                                  user: userDetails,
                                  office: officeDetails,
                                  // Add formatted date/time fields for frontend compatibility
                                  formattedEntryTime: formatTimeToString(officeAttendanceRecord.entry_time),
                                  formattedDate: formatDateForDisplay(formatDateToString(officeAttendanceRecord.entry_time || officeAttendanceRecord.createdAt)),
                                  rawDate: formatDateToString(officeAttendanceRecord.entry_time || officeAttendanceRecord.createdAt),
                                  createdAt: new Date(),
                                  updatedAt: new Date()
                               }
                            };


                            SocketService.emitOfficeAttendanceUpdate(socketData);
                         } catch (socketError: any) {
                            Logger.error(`[EventHandlerService] ❌ Failed to emit office attendance entry socket update:`, socketError.message);
                         }
                            
                            // Call EmployeeEntryExitService API for entry
                            try {
                               const user = await db.users.findUnique({
                                  where: { Id: person_Id },
                                  select: { user_Id: true }
                               });
                               
                               if (user && user.user_Id) {
                                  Logger.info(`[EventHandlerService] Calling EmployeeEntryExitService API for office entry`);
                                  const secretKey = await this.fetchSecretFromAPI();
                                  
                                  const employeeEntryPayload = {
                                     SecretKey: secretKey,
                                     Lang: "en",
                                     UserID: user.user_Id,
                                     Type: "1" // Entry
                                  };
                                  
                                  const employeeEntryResponse = await axios.post(
                                     "https://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeEntryExitService",
                                     employeeEntryPayload,
                                     {
                                        headers: { "Content-Type": "application/json" },
                                        timeout: 10000,
                                        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                                     }
                                  );
                                  
                                  Logger.info(`[EventHandlerService] EmployeeEntryExitService API response for office entry:`, {
                                     status: employeeEntryResponse.status,
                                     data: employeeEntryResponse.data
                                  });
                               } else {
                                  Logger.warn(`[EventHandlerService] Cannot call EmployeeEntryExitService - user_Id not found for person_Id: ${person_Id}`);
                               }
                            } catch (employeeApiError: any) {
                               Logger.error(`[EventHandlerService] Failed to call EmployeeEntryExitService for office entry:`, employeeApiError.message);
                               // Don't throw error - attendance record was created successfully
                            }
                         }
                      } else if(isExit){
                         Logger.info(`[EventHandlerService] Processing office exit attendance`);
                         
                         // Debug logging for exit event
                         Logger.debug(`[EventHandlerService] Exit event details:`, {
                            office_Id,
                            person_Id,
                            srcName: eventInfo.srcName,
                            happenTime: eventInfo.happenTime,
                            humanId: eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id
                         });
                         
                         // If person_Id is null, try to find it using human_id from the event
                         let searchPersonId = person_Id;
                         if (!searchPersonId && eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id) {
                            const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id;
                            if (humanId && humanId !== "-1") {
                               const user = await db.users.findFirst({
                                  where: { unique_id: humanId.toString() }
                               });
                               if (user) {
                                  searchPersonId = user.Id;
                                  Logger.info(`[EventHandlerService] Found person_Id for exit event using human_id: ${searchPersonId}`);
                               }
                            }
                         }
                         
                         if (!searchPersonId) {
                            Logger.warn(`[EventHandlerService] Cannot process exit event - no valid person_Id found`);
                            return;
                         }
                         
                         const latestAttendance = await db.offices_attendance.findFirst({
                            where: {
                               office_Id: office_Id,
                               person_Id: searchPersonId,
                               exit_time: null
                            },
                            orderBy: {
                               entry_time: 'desc'
                            }
                         })
                         
                         if(latestAttendance){
                            // Check if the person is a guest user
                            const isGuest = await this.isGuestUser(searchPersonId);
                            
                            if (isGuest) {
                               Logger.info(`[EventHandlerService] Skipping office exit attendance update for guest user`, {
                                  person_Id: searchPersonId,
                                  office_Id,
                                  attendanceRecordId: latestAttendance.Id,
                                  reason: "Guest users do not have attendance records"
                               });
                            } else {
                            Logger.info(`[EventHandlerService] Updating office exit attendance for record ID: ${latestAttendance.Id}`);
                            const updatedAttendanceRecord = await db.offices_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventInfo.happenTime
                               }
                            })
                            Logger.info(`[EventHandlerService] Successfully updated office exit attendance`);

                            // Emit office attendance exit update via socket
                            try {
                               // Get user details
                               const userDetails = updatedAttendanceRecord.person_Id ? await db.users.findUnique({
                                  where: { Id: updatedAttendanceRecord.person_Id },
                                  select: {
                                     Id: true,
                                     emp__eng_name: true,
                                     emp__arabic_name: true,
                                     emp_Id: true,
                                     user_Id: true,
                                     unique_id: true,
                                     dep_eng_name: true,
                                     dep_arabic_name: true,
                                     gender: true,
                                     image: true,
                                     is_attendance_user: true
                                  }
                               }) : null;

                               // Get office details
                               const officeDetails = updatedAttendanceRecord.office_Id ? await db.offices.findUnique({
                                  where: { Id: updatedAttendanceRecord.office_Id },
                                  select: {
                                     Id: true,
                                     office_english_name: true,
                                     office_arabic_name: true,
                                     latitude: true,
                                     longitude: true
                                  }
                               }) : null;

                               // Format dates for frontend compatibility (same functions as entry)
                               const formatTimeToString = (timeValue: any): string => {
                                  if (!timeValue) return "--";
                                  
                                  try {
                                     let dateObj: Date;
                                     
                                     if (typeof timeValue === 'string') {
                                        if (timeValue.includes(' ') && timeValue.includes(':')) {
                                           dateObj = new Date(timeValue);
                                        } else {
                                           return timeValue;
                                        }
                                     } else if (timeValue instanceof Date) {
                                        dateObj = timeValue;
                                     } else {
                                        return "--";
                                     }
                                     
                                     if (isNaN(dateObj.getTime())) {
                                        return "--";
                                     }
                                     const hours = dateObj.getUTCHours().toString().padStart(2, '0');
                                     const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
                                     const seconds = dateObj.getUTCSeconds().toString().padStart(2, '0');
                                     return `${hours}:${minutes}:${seconds}`;
                                  } catch (error) {
                                     return "--";
                                  }
                               };

                               const formatDateToString = (dateValue: any): string => {
                                  if (!dateValue) return "No date";
                                  
                                  try {
                                     let dateObj: Date;
                                     
                                     if (typeof dateValue === 'string') {
                                        if (dateValue.includes(' ') && dateValue.includes(':')) {
                                           dateObj = new Date(dateValue);
                                        } else if (dateValue.includes('-') && dateValue.length === 10) {
                                           return dateValue;
                                        } else {
                                           return "No date";
                                        }
                                     } else if (dateValue instanceof Date) {
                                        dateObj = dateValue;
                                     } else {
                                        return "No date";
                                     }
                                     
                                     if (isNaN(dateObj.getTime())) {
                                        return "No date";
                                     }
                                     
                                     const year = dateObj.getUTCFullYear();
                                     const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
                                     const day = dateObj.getUTCDate().toString().padStart(2, '0');
                                     return `${year}-${month}-${day}`;
                                  } catch (error) {
                                     return "No date";
                                  }
                               };

                               const formatDateForDisplay = (dateString: string): string => {
                                  if (!dateString || dateString === "No date") return "No date";
                                  
                                  try {
                                     const [year, month, day] = dateString.split('-');
                                     const monthNames = [
                                        "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"
                                     ];
                                     
                                     const monthIndex = parseInt(month) - 1;
                                     if (monthIndex < 0 || monthIndex > 11) return dateString;
                                     
                                     return `${parseInt(day)} ${monthNames[monthIndex]} ${year}`;
                                  } catch (error) {
                                     return dateString;
                                  }
                               };

                               const socketData = {
                                  type: 'attendance_exit',
                                  data: {
                                     ...updatedAttendanceRecord,
                                     user: userDetails,
                                     office: officeDetails,
                                     // Add formatted date/time fields for frontend compatibility
                                     formattedEntryTime: formatTimeToString(updatedAttendanceRecord.entry_time),
                                     formattedExitTime: formatTimeToString(updatedAttendanceRecord.exit_time),
                                     formattedDate: formatDateForDisplay(formatDateToString(updatedAttendanceRecord.entry_time || updatedAttendanceRecord.createdAt)),
                                     rawDate: formatDateToString(updatedAttendanceRecord.entry_time || updatedAttendanceRecord.createdAt),
                                     createdAt: new Date(),
                                     updatedAt: new Date()
                                  }
                               };


                               SocketService.emitOfficeAttendanceUpdate(socketData);
                            } catch (socketError: any) {
                               Logger.error(`[EventHandlerService] ❌ Failed to emit office attendance exit socket update:`, socketError.message);
                            }
                               
                               // Call EmployeeEntryExitService API for exit
                               try {
                                  const user = await db.users.findUnique({
                                     where: { Id: searchPersonId },
                                     select: { user_Id: true }
                                  });
                                  
                                  if (user && user.user_Id) {
                                     Logger.info(`[EventHandlerService] Calling EmployeeEntryExitService API for office exit`);
                                     const secretKey = await this.fetchSecretFromAPI();
                                     
                                     const employeeExitPayload = {
                                        SecretKey: secretKey,
                                        Lang: "en",
                                        UserID: user.user_Id,
                                        Type: "2" // Exit
                                     };
                                     
                                     const employeeExitResponse = await axios.post(
                                        "https://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeEntryExitService",
                                        employeeExitPayload,
                                        {
                                           headers: { "Content-Type": "application/json" },
                                           timeout: 10000,
                                           httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                                        }
                                     );
                                     
                                     Logger.info(`[EventHandlerService] EmployeeEntryExitService API response for office exit:`, {
                                        status: employeeExitResponse.status,
                                        data: employeeExitResponse.data
                                     });
                         } else {
                                     Logger.warn(`[EventHandlerService] Cannot call EmployeeEntryExitService - user_Id not found for person_Id: ${searchPersonId}`);
                                  }
                               } catch (employeeApiError: any) {
                                  Logger.error(`[EventHandlerService] Failed to call EmployeeEntryExitService for office exit:`, employeeApiError.message);
                                  // Don't throw error - attendance record was updated successfully
                               }
                            }
                         } else {
                            Logger.warn(`[EventHandlerService] No matching entry record found for office exit attendance`, {
                               office_Id,
                               person_Id: searchPersonId,
                               searchCriteria: {
                                  office_Id,
                                  person_Id: searchPersonId,
                                  exit_time: null
                               }
                            });
                         }
                      }
                   }
                }
                else if(isParkCamera){
                   Logger.info(`[EventHandlerService] Processing park camera attendance`);
                   const parkCamera = await db.park_cameras.findFirst({
                      where: {
                         camera_Id: eventInfo.srcIndex
                      }
                   })
                   
                   if(parkCamera && parkCamera.park_Id){
                      Logger.info(`[EventHandlerService] Found park camera:`, {
                         cameraId: parkCamera.Id,
                         parkId: parkCamera.park_Id,
                         cameraIndex: eventInfo.srcIndex
                      });
                      
                      const park_Id = parkCamera.park_Id
                      const isEntry = eventInfo.srcName.toLowerCase().includes("entry")
                      const isExit = eventInfo.srcName.toLowerCase().includes("exit")
                      
                      Logger.debug(`[EventHandlerService] Park attendance type:`, {
                         srcName: eventInfo.srcName,
                         isEntry,
                         isExit
                      });
                      
                      const genderValue = eventInfo.data.alarmResult.faces.gender.value
                      const ageGroup = eventInfo.data.alarmResult.faces.age.ageGroup
                      const genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                      const isChild = ageGroup <= 2 // INFANT, KID, CHILD
                      
                      const similarity = eventInfo.data.alarmResult.faces.identify.candidate.similarity
                      const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id
                      let faceData = null;
                      
                      Logger.debug(`[EventHandlerService] Park face recognition details:`, {
                         genderValue,
                         ageGroup,
                         genderName,
                         isChild,
                         similarity,
                         humanId
                      });
                      
                      let person_Id = null; // Default fallback - use null for unknown persons
                      if (humanId && similarity !== null && similarity !== undefined) {
                         const user = await db.users.findFirst({
                            where: { unique_id: humanId.toString() }
                         });
                         if (user) {
                            person_Id = user.Id;
                            Logger.info(`[EventHandlerService] Identified employee for park attendance:`, {
                               personId: person_Id,
                               empId: humanId,
                               similarity
                            });
                         } else {
                            Logger.warn(`[EventHandlerService] Employee not found in database for park attendance empId: ${humanId}`);
                            Logger.info(`[EventHandlerService] 👤 Employee not found, creating guest user for park attendance`, {
                               empId: humanId,
                               similarity,
                               gender: genderName
                            });
                            
                            try {
                               // Get faceData URL from event data
                               let faceData = null;
                               if (eventInfo.data?.alarmResult?.faces?.URL) {
                                  faceData = eventInfo.data.alarmResult.faces.URL;
                                  Logger.debug(`[EventHandlerService] 📸 Extracted face data URL for park guest user`, {
                                     faceDataUrl: faceData
                                  });
                                  } else {
                                  Logger.warn(`[EventHandlerService] ⚠️ No face data URL available for park guest user creation`);
                               }
                               
                               const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData);
                               person_Id = guestUser.Id;
                               
                               Logger.info(`[EventHandlerService] ✅ Successfully created guest user for park attendance`, {
                                  guestUserId: person_Id,
                                  guestName: guestUser.emp__eng_name,
                                  gender: genderName,
                                  unique_id: guestUser.unique_id,
                                  originalEmpId: humanId
                               });
                            } catch (guestError: any) {
                               Logger.error(`[EventHandlerService] ❌ Failed to create guest user for park attendance`, {
                                  error: guestError.message,
                                  empId: humanId,
                                  gender: genderName,
                                  hasFaceData: !!faceData
                               });
                            }
                         }
                      } else {
                         Logger.debug(`[EventHandlerService] No valid employee identification for park attendance (similarity: ${similarity}, humanId: ${humanId})`);
                         Logger.info(`[EventHandlerService] 👤 Unknown person detected, creating guest user for park attendance`, {
                            similarity,
                            humanId,
                            gender: genderName
                         });
                         
                         try {
                            // Get faceData URL from event data
                            let faceData = null;
                            if (eventInfo.data?.alarmResult?.faces?.URL) {
                               faceData = eventInfo.data.alarmResult.faces.URL;
                               Logger.debug(`[EventHandlerService] 📸 Extracted face data URL for unknown park visitor`, {
                                  faceDataUrl: faceData
                               });
                               } else {
                               Logger.warn(`[EventHandlerService] ⚠️ No face data URL available for unknown park visitor guest creation`);
                            }
                            
                            const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData);
                               person_Id = guestUser.Id;
                            
                            Logger.info(`[EventHandlerService] ✅ Successfully created guest user for unknown park visitor`, {
                               guestUserId: person_Id,
                                  guestName: guestUser.emp__eng_name,
                               gender: genderName,
                               unique_id: guestUser.unique_id,
                               originalHumanId: humanId
                               });
                            } catch (guestError: any) {
                            Logger.error(`[EventHandlerService] ❌ Failed to create guest user for unknown park visitor`, {
                               error: guestError.message,
                               humanId,
                               gender: genderName,
                               hasFaceData: !!faceData
                            });
                         }
                      }
                      
                      const parkFootfallData = {
                         park_Id: park_Id,
                         detection_Id: eventInfo.eventId,
                         person_Id: person_Id,
                         gender: genderName,
                         is_child: isChild,
                         time: eventInfo.happenTime,
                         detected_camera_Id: eventInfo.srcIndex,
                         detected_camera_name: eventInfo.srcName
                      }
                      
                      // Only create footfall records for entry events, not exit events
                      if(isEntry){
                         Logger.info(`[EventHandlerService] Creating park footfall record for entry:`, {
                         parkId: parkFootfallData.park_Id,
                         personId: parkFootfallData.person_Id,
                         gender: parkFootfallData.gender,
                         isChild: parkFootfallData.is_child,
                         detectionId: parkFootfallData.detection_Id
                      });
                     
                        const parkFootfallRecord = await db.parks_footfall_analysis.create({
                           data: parkFootfallData
                        })
                        
                        Logger.info(`[EventHandlerService] Successfully created park footfall record with ID: ${parkFootfallRecord.id}`);

                        // Emit park footfall update via socket
                        try {
                           // Get user details
                           const userDetails = parkFootfallRecord.person_Id ? await db.users.findUnique({
                              where: { Id: parkFootfallRecord.person_Id },
                              select: {
                                 Id: true,
                                 emp__eng_name: true,
                                 emp__arabic_name: true,
                                 emp_Id: true,
                                 user_Id: true,
                                 is_attendance_user: true
                              }
                           }) : null;

                           // Get park details
                           const parkDetails = parkFootfallRecord.park_Id ? await db.parks.findUnique({
                              where: { Id: parkFootfallRecord.park_Id },
                              select: {
                                 Id: true,
                                 park_english_name: true,
                                 park_arabic_name: true
                              }
                           }) : null;

                           // Get camera details - convert string to number for Id field
                           const cameraDetails = parkFootfallRecord.detected_camera_Id ? await db.park_cameras.findUnique({
                              where: { Id: parseInt(parkFootfallRecord.detected_camera_Id) },
                              select: {
                                 Id: true,
                                 camera_english_name: true,
                                 camera_arabic_name: true,
                                 ip_address: true
                              }
                           }) : null;

                           const socketData = {
                              type: 'new_entry',
                              data: {
                                 ...parkFootfallRecord,
                                 person: userDetails,
                                 park: parkDetails,
                                 park_cameras: cameraDetails,
                                 createdAt: new Date(),
                                 updatedAt: new Date()
                              }
                           };


                           SocketService.emitParkFootfallUpdate(socketData);
                        } catch (socketError: any) {
                           Logger.error(`[EventHandlerService] ❌ Failed to emit park footfall socket update:`, socketError.message);
                        }
                      } else {
                         Logger.info(`[EventHandlerService] Skipping park footfall record creation for exit event`);
                      }

                      // Create sentiment analysis record for both entry and exit events
                      let sentimentImageUrl = null;
                      let detectedSentiment = 'neutral'; // Default sentiment
                      
                      // Get faceData URL from event data (same as guest user creation)
                      if (eventInfo.data?.alarmResult?.faces?.URL) {
                         try {
                            Logger.info(`[EventHandlerService] Processing sentiment analysis image for park`);
                            const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                            const imageDataResponse = await this.getImageData(faceDataUrl);
                            
                            if (imageDataResponse) {
                               // The response is directly the base64 string, not wrapped in a data object
                               const base64Image = imageDataResponse;
                               
                               // Upload to Cloudinary
                               sentimentImageUrl = await this.uploadImageToCloudinary(base64Image, 'sentiment', eventInfo.eventId);
                               Logger.info(`[EventHandlerService] Successfully uploaded sentiment image to Cloudinary for park`);
                               
                               // Get emotion detection from the uploaded image
                               if (sentimentImageUrl) {
                                  try {
                                     Logger.info(`[EventHandlerService] Calling emotion detection API for park sentiment`);
                                     const emotionResponse = await axios.post('http://127.0.0.1:8000/api/emotion-detection', {
                                        image_url: sentimentImageUrl
                                     }, {
                                        timeout: 10000,
                                        headers: { 'Content-Type': 'application/json' }
                                     });
                                     
                                     if (emotionResponse.data?.success && emotionResponse.data?.faces?.length > 0) {
                                        detectedSentiment = emotionResponse.data.faces[0].emotion;
                                        Logger.info(`[EventHandlerService] Detected park sentiment: ${detectedSentiment}`, {
                                           confidence: emotionResponse.data.faces[0].confidence,
                                           processingTime: emotionResponse.data.processing_time
                                        });
                                     } else {
                                        Logger.warn(`[EventHandlerService] No emotion detected for park image, using default: neutral`);
                                     }
                                  } catch (emotionError: any) {
                                     if (emotionError.code === 'ECONNREFUSED') {
                                        Logger.warn(`[EventHandlerService] Emotion detection service is not available (ECONNREFUSED). Using default sentiment: neutral`);
                                     } else if (emotionError.code === 'ETIMEDOUT') {
                                        Logger.warn(`[EventHandlerService] Emotion detection service timed out. Using default sentiment: neutral`);
                                     } else {
                                        Logger.error(`[EventHandlerService] Failed to detect emotion for park image:`, emotionError.message);
                                        Logger.info(`[EventHandlerService] Using default sentiment: neutral`);
                                     }
                                  }
                               }
                            }
                         } catch (imageError: any) {
                            Logger.error(`[EventHandlerService] Failed to process park sentiment image:`, imageError);
                         }
                      }

                      // Get user details for sentiment analysis (same structure as park sentiment service)
                      let personName = 'Unknown';
                      let personImage = null;
                      let sentimentOf = 'visitor';
                      let userDetails = null;
                      
                      if (person_Id) {
                         const user = await db.users.findUnique({
                            where: { Id: person_Id },
                            include: {
                               users_roles: {
                                  select: {
                                     role_name: true
                                  }
                               }
                            }
                         });
                         
                         if (user) {
                            personName = user.emp__eng_name || user.emp__arabic_name || 'Unknown';
                            personImage = user.image;
                            
                            // Determine if employee or visitor (same logic as park sentiment service)
                            const isEmployee = (user.emp_Id && user.emp_Id.trim() !== '') ||
                                             (user.emp_code && user.emp_code.trim() !== '') ||
                                             user.is_attendance_user === true;
                            sentimentOf = isEmployee ? 'employee' : 'visitor';
                            
                            // Create user details object (same structure as park sentiment service)
                            userDetails = {
                               Id: user.Id,
                               user_Id: user.user_Id,
                               emp_Id: user.emp_Id,
                               emp__eng_name: user.emp__eng_name,
                               emp__arabic_name: user.emp__arabic_name,
                               gender: user.gender,
                               country_code: user.country_code,
                               phone: user.phone,
                               email: user.email,
                               dep_eng_name: user.dep_eng_name,
                               dep_arabic_name: user.dep_arabic_name,
                               desig_eng_name: user.desig_eng_name,
                               desig_arabic_name: user.desig_arabic_name,
                               unit_eng_name: user.unit_eng_name,
                               unit_arabic_name: user.unit_arabic_name,
                               committe_eng_name: user.committe_eng_name,
                               committe_arabic_name: user.committe_arabic_name,
                               ai_engine_access: user.ai_engine_access,
                               last_login: user.last_login,
                               role: user.users_roles?.role_name,
                               createdAt: user.createdAt,
                               updatedAt: user.updatedAt
                            };
                            
                            Logger.debug(`[EventHandlerService] Park sentiment analysis user details:`, {
                               personName,
                               sentimentOf,
                               hasPersonImage: !!personImage
                            });
                         }
                      }

                      const parkSentimentData = {
                         park_Id: park_Id,
                         person_Id: person_Id?.toString() || null,
                         detection_Id: eventInfo.eventId,
                         person_name: personName,
                         person_image: personImage,
                         gender: genderName,
                         check_in_image: isEntry ? sentimentImageUrl : null,
                         sentiment_of: sentimentOf as 'employee' | 'visitor',
                         check_in_date: isEntry ? eventInfo.happenTime: null,
                         check_in_time: isEntry ? eventInfo.happenTime: null,
                         check_in_sentiment: isEntry ? detectedSentiment : null,
                         entry_camera_Id: isEntry ? parkCamera.Id : null,
                         check_out_date: isExit ? eventInfo.happenTime: null,
                         check_out_time: isExit ? eventInfo.happenTime : null,
                         check_out_capture: isExit ? sentimentImageUrl : null,
                         check_out_sentiment: isExit ? detectedSentiment : null,
                         exit_camera_Id: isExit ? parkCamera.Id : null
                      }
                   
                      if(isEntry){
                         // Create new sentiment analysis record for entry
                         Logger.info(`[EventHandlerService] Creating park sentiment analysis record for entry:`, {
                            parkId: parkSentimentData.park_Id,
                            personId: parkSentimentData.person_Id,
                            personName: parkSentimentData.person_name,
                            sentimentOf: parkSentimentData.sentiment_of,
                            hasImage: !!sentimentImageUrl
                         });
                         
                         const parkSentimentRecord = await db.parks_sentiment_analysis.create({
                            data: parkSentimentData
                         });
                         
                         Logger.info(`[EventHandlerService] Successfully created park sentiment analysis record with ID: ${parkSentimentRecord.Id}`);
                         
                         // Emit socket event for real-time updates (same structure as park sentiment service)
                         try {
                            SocketService.emitParkSentimentUpdate({
                               type: 'new_entry',
                               data: {
                                  id: parkSentimentRecord.Id,
                                  person_Id: parkSentimentData.person_Id,
                                  detection_Id: parkSentimentData.detection_Id,
                                  sentiment_of: parkSentimentData.sentiment_of,
                                  person_name: personName,
                                  person_image: personImage,
                                  gender: parkSentimentData.gender,
                                  check_in_image: parkSentimentData.check_in_image,
                                  check_in_date: formatDate(parkSentimentData.check_in_date),
                                  check_in_time: formatTime(parkSentimentData.check_in_time),
                                  check_in_sentiment: parkSentimentData.check_in_sentiment,
                                  entry_camera_Id: parkSentimentData.entry_camera_Id,
                                  check_out_date: parkSentimentData.check_out_date ? formatDate(parkSentimentData.check_out_date) : null,
                                  check_out_time: parkSentimentData.check_out_time ? formatTime(parkSentimentData.check_out_time) : null,
                                  check_out_capture: parkSentimentData.check_out_capture,
                                  check_out_sentiment: parkSentimentData.check_out_sentiment,
                                  exit_camera_Id: parkSentimentData.exit_camera_Id,
                                  createdAt: parkSentimentRecord.createdAt,
                                  updatedAt: parkSentimentRecord.updatedAt,
                                  user: userDetails, // Complete user details (same as park sentiment service)
                                  // Camera details (same structure as park sentiment service)
                                  park_cameras_parks_sentiment_analysis_entry_camera_IdTopark_cameras: isEntry ? {
                                     camera_english_name: parkCamera.camera_english_name,
                                     camera_arabic_name: parkCamera.camera_arabic_name,
                                     ip_address: parkCamera.ip_address
                                  } : null,
                                  park_cameras_parks_sentiment_analysis_exit_camera_IdTopark_cameras: isExit ? {
                                     camera_english_name: parkCamera.camera_english_name,
                                     camera_arabic_name: parkCamera.camera_arabic_name,
                                     ip_address: parkCamera.ip_address
                                  } : null
                               }
                            });
                         } catch (socketError) {
                            Logger.error(`[EventHandlerService] Failed to emit park sentiment socket event:`, socketError);
                         }
                      } else if(isExit){
                         // Find existing sentiment analysis record for exit (similar to attendance logic)
                         Logger.info(`[EventHandlerService] Processing park exit sentiment analysis`);
                         
                         // Process exit sentiment image and detection
                         let exitSentimentImageUrl = null;
                         let exitDetectedSentiment = 'neutral'; // Default sentiment
                         
                         // Get faceData URL from event data for exit sentiment
                         if (eventInfo.data?.alarmResult?.faces?.URL) {
                            try {
                               Logger.info(`[EventHandlerService] Processing exit sentiment analysis image for park`);
                               const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                               const imageDataResponse = await this.getImageData(faceDataUrl);
                               
                               if (imageDataResponse) {
                                  // The response is directly the base64 string, not wrapped in a data object
                                  const base64Image = imageDataResponse;
                                  
                                  // Upload to Cloudinary
                                  exitSentimentImageUrl = await this.uploadImageToCloudinary(base64Image, 'sentiment', eventInfo.eventId);
                                  Logger.info(`[EventHandlerService] Successfully uploaded exit sentiment image to Cloudinary for park`);
                                  
                                  // Get emotion detection from the uploaded image
                                  if (exitSentimentImageUrl) {
                                     try {
                                        Logger.info(`[EventHandlerService] Calling emotion detection API for park exit sentiment`);
                                        const emotionResponse = await axios.post('http://127.0.0.1:8000/api/emotion-detection', {
                                           image_url: exitSentimentImageUrl
                                        }, {
                                           timeout: 10000,
                                           headers: { 'Content-Type': 'application/json' }
                                        });
                                        
                                        if (emotionResponse.data?.success && emotionResponse.data?.faces?.length > 0) {
                                           exitDetectedSentiment = emotionResponse.data.faces[0].emotion;
                                           Logger.info(`[EventHandlerService] Detected park exit sentiment: ${exitDetectedSentiment}`, {
                                              confidence: emotionResponse.data.faces[0].confidence,
                                              processingTime: emotionResponse.data.processing_time
                                           });
                                        } else {
                                           Logger.warn(`[EventHandlerService] No emotion detected for park exit image, using default: neutral`);
                                        }
                                     } catch (emotionError: any) {
                                        if (emotionError.code === 'ECONNREFUSED') {
                                           Logger.warn(`[EventHandlerService] Emotion detection service is not available (ECONNREFUSED). Using default exit sentiment: neutral`);
                                        } else if (emotionError.code === 'ETIMEDOUT') {
                                           Logger.warn(`[EventHandlerService] Emotion detection service timed out. Using default exit sentiment: neutral`);
                                        } else {
                                           Logger.error(`[EventHandlerService] Failed to detect emotion for park exit image:`, emotionError.message);
                                           Logger.info(`[EventHandlerService] Using default exit sentiment: neutral`);
                                        }
                                     }
                                  }
                               }
                            } catch (imageError: any) {
                               Logger.error(`[EventHandlerService] Failed to process park exit sentiment image:`, imageError);
                            }
                         }
                         
                         // If person_Id is null, try to find it using human_id from the event
                         let searchPersonId = person_Id;
                         if (!searchPersonId && eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id) {
                            const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id;
                            if (humanId && humanId !== "-1") {
                               const user = await db.users.findFirst({
                                  where: { unique_id: humanId.toString() }
                               });
                               if (user) {
                                  searchPersonId = user.Id;
                                  Logger.info(`[EventHandlerService] Found person_Id for park exit sentiment using human_id: ${searchPersonId}`);
                               }
                            }
                         }
                         
                         if (!searchPersonId) {
                            Logger.warn(`[EventHandlerService] Cannot process park exit sentiment - no valid person_Id found`);
                            return;
                         }
                         
                         const latestSentiment = await db.parks_sentiment_analysis.findFirst({
                            where: {
                               park_Id: park_Id,
                               person_Id: searchPersonId.toString(),
                               check_out_capture: null // Find record without exit data
                            },
                            orderBy: {
                               check_in_date: 'desc'
                            }
                         });
                         
                         if(latestSentiment){
                            Logger.info(`[EventHandlerService] Updating park exit sentiment analysis for record ID: ${latestSentiment.Id}`);
                            await db.parks_sentiment_analysis.update({
                               where: { Id: latestSentiment.Id },
                               data: {
                                  check_out_capture: exitSentimentImageUrl,
                                  check_out_date: parkSentimentData.check_out_date,
                                  check_out_time: parkSentimentData.check_out_time,
                                  check_out_sentiment: exitDetectedSentiment,
                                  exit_camera_Id: parkSentimentData.exit_camera_Id
                               }
                            });
                            Logger.info(`[EventHandlerService] Successfully updated park exit sentiment analysis`);
                            
                            // Get entry camera details for the exit update
                            let entryCameraDetails = null;
                            if (latestSentiment.entry_camera_Id) {
                               const entryCamera = await db.park_cameras.findFirst({
                                  where: { Id: latestSentiment.entry_camera_Id }
                               });
                               if (entryCamera) {
                                  entryCameraDetails = {
                                     camera_english_name: entryCamera.camera_english_name,
                                     camera_arabic_name: entryCamera.camera_arabic_name,
                                     ip_address: entryCamera.ip_address
                                  };
                               }
                            }

                            // Emit socket event for real-time updates (same structure as park sentiment service)
                            try {
                               SocketService.emitParkSentimentUpdate({
                                  type: 'exit_update',
                                  data: {
                                     id: latestSentiment.Id,
                                     person_Id: latestSentiment.person_Id,
                                     detection_Id: latestSentiment.detection_Id,
                                     sentiment_of: latestSentiment.sentiment_of,
                                     person_name: personName,
                                     person_image: personImage,
                                     gender: latestSentiment.gender,
                                     check_in_image: latestSentiment.check_in_image,
                                     check_in_date: formatDate(latestSentiment.check_in_date),
                                     check_in_time: formatTime(latestSentiment.check_in_time),
                                     check_in_sentiment: latestSentiment.check_in_sentiment,
                                     entry_camera_Id: latestSentiment.entry_camera_Id,
                                     check_out_date: formatDate(parkSentimentData.check_out_date),
                                     check_out_time: formatTime(parkSentimentData.check_out_time),
                                     check_out_capture: exitSentimentImageUrl,
                                     check_out_sentiment: exitDetectedSentiment,
                                     exit_camera_Id: parkSentimentData.exit_camera_Id,
                                     createdAt: latestSentiment.createdAt,
                                     updatedAt: latestSentiment.updatedAt,
                                     user: userDetails, // Complete user details (same as park sentiment service)
                                     // Camera details (same structure as park sentiment service)
                                     park_cameras_parks_sentiment_analysis_entry_camera_IdTopark_cameras: entryCameraDetails,
                                     park_cameras_parks_sentiment_analysis_exit_camera_IdTopark_cameras: {
                                        camera_english_name: parkCamera.camera_english_name,
                                        camera_arabic_name: parkCamera.camera_arabic_name,
                                        ip_address: parkCamera.ip_address
                                     }
                                  }
                               });
                            } catch (socketError) {
                               Logger.error(`[EventHandlerService] Failed to emit park sentiment socket event for exit:`, socketError);
                            }
                         } else {
                            Logger.warn(`[EventHandlerService] No matching entry record found for park exit sentiment analysis`, {
                               park_Id,
                               person_Id: searchPersonId,
                               searchCriteria: {
                                  park_Id,
                                  person_Id: searchPersonId.toString(),
                                  check_out_capture: null
                               }
                            });
                         }
                      }
                      
                      if(isEntry){
                         // Check if the person is a guest user
                         const isGuest = await this.isGuestUser(person_Id);
                         
                         if (isGuest) {
                            Logger.info(`[EventHandlerService] Skipping park entry attendance record for guest user`, {
                               person_Id,
                               park_Id,
                               reason: "Guest users do not have attendance records"
                            });
                         } else {
                         Logger.info(`[EventHandlerService] Processing park entry attendance`);
                         const parkAttendanceData = {
                            park_Id: park_Id,
                            person_Id: person_Id,
                            entry_time: eventInfo.happenTime
                         }
                         
                         const parkAttendanceRecord = await db.parks_attendance.create({
                            data: parkAttendanceData
                         })
                         
                         Logger.info(`[EventHandlerService] Successfully created park entry attendance record with ID: ${parkAttendanceRecord.Id}`);
                            
                            // Call EmployeeEntryExitService API for entry
                            try {
                               const user = await db.users.findUnique({
                                  where: { Id: person_Id },
                                  select: { user_Id: true }
                               });
                               
                               if (user && user.user_Id) {
                                  Logger.info(`[EventHandlerService] Calling EmployeeEntryExitService API for park entry`);
                                  const secretKey = await this.fetchSecretFromAPI();
                                  
                                  const employeeEntryPayload = {
                                     SecretKey: secretKey,
                                     Lang: "en",
                                     UserID: user.user_Id,
                                     Type: "1" // Entry
                                  };
                                  
                                  const employeeEntryResponse = await axios.post(
                                     "https://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeEntryExitService",
                                     employeeEntryPayload,
                                     {
                                        headers: { "Content-Type": "application/json" },
                                        timeout: 10000,
                                        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                                     }
                                  );
                                  
                                  Logger.info(`[EventHandlerService] EmployeeEntryExitService API response for park entry:`, {
                                     status: employeeEntryResponse.status,
                                     data: employeeEntryResponse.data
                                  });
                               } else {
                                  Logger.warn(`[EventHandlerService] Cannot call EmployeeEntryExitService - user_Id not found for person_Id: ${person_Id}`);
                               }
                            } catch (employeeApiError: any) {
                               Logger.error(`[EventHandlerService] Failed to call EmployeeEntryExitService for park entry:`, employeeApiError.message);
                               // Don't throw error - attendance record was created successfully
                            }
                         }
                      } else if(isExit){
                         Logger.info(`[EventHandlerService] Processing park exit attendance`);
                         
                         // Debug logging for exit event
                         Logger.debug(`[EventHandlerService] Park exit event details:`, {
                            park_Id,
                            person_Id,
                            srcName: eventInfo.srcName,
                            happenTime: eventInfo.happenTime,
                            humanId: eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id
                         });
                         
                         // If person_Id is null, try to find it using human_id from the event
                         let searchPersonId = person_Id;
                         if (!searchPersonId && eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id) {
                            const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id;
                            if (humanId && humanId !== "-1") {
                               const user = await db.users.findFirst({
                                  where: { unique_id: humanId.toString() }
                               });
                               if (user) {
                                  searchPersonId = user.Id;
                                  Logger.info(`[EventHandlerService] Found person_Id for park exit event using human_id: ${searchPersonId}`);
                               }
                            }
                         }
                         
                         if (!searchPersonId) {
                            Logger.warn(`[EventHandlerService] Cannot process park exit event - no valid person_Id found`);
                            return;
                         }
                         
                         const latestAttendance = await db.parks_attendance.findFirst({
                            where: {
                               park_Id: park_Id,
                               person_Id: searchPersonId,
                               exit_time: null
                            },
                            orderBy: {
                               entry_time: 'desc'
                            }
                         })
                         
                         if(latestAttendance){
                            // Check if the person is a guest user
                            const isGuest = await this.isGuestUser(searchPersonId);
                            
                            if (isGuest) {
                               Logger.info(`[EventHandlerService] Skipping park exit attendance update for guest user`, {
                                  person_Id: searchPersonId,
                                  park_Id,
                                  attendanceRecordId: latestAttendance.Id,
                                  reason: "Guest users do not have attendance records"
                               });
                            } else {
                            Logger.info(`[EventHandlerService] Updating park exit attendance for record ID: ${latestAttendance.Id}`);
                            await db.parks_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventInfo.happenTime
                               }
                            })
                            Logger.info(`[EventHandlerService] Successfully updated park exit attendance`);
                               
                               // Call EmployeeEntryExitService API for exit
                               try {
                                  const user = await db.users.findUnique({
                                     where: { Id: searchPersonId },
                                     select: { user_Id: true }
                                  });
                                  
                                  if (user && user.user_Id) {
                                     Logger.info(`[EventHandlerService] Calling EmployeeEntryExitService API for park exit`);
                                     const secretKey = await this.fetchSecretFromAPI();
                                     
                                     const employeeExitPayload = {
                                        SecretKey: secretKey,
                                        Lang: "en",
                                        UserID: user.user_Id,
                                        Type: "2" // Exit
                                     };
                                     
                                     const employeeExitResponse = await axios.post(
                                        "https://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeEntryExitService",
                                        employeeExitPayload,
                                        {
                                           headers: { "Content-Type": "application/json" },
                                           timeout: 10000,
                                           httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                                        }
                                     );
                                     
                                     Logger.info(`[EventHandlerService] EmployeeEntryExitService API response for park exit:`, {
                                        status: employeeExitResponse.status,
                                        data: employeeExitResponse.data
                                     });
                         } else {
                                     Logger.warn(`[EventHandlerService] Cannot call EmployeeEntryExitService - user_Id not found for person_Id: ${searchPersonId}`);
                                  }
                               } catch (employeeApiError: any) {
                                  Logger.error(`[EventHandlerService] Failed to call EmployeeEntryExitService for park exit:`, employeeApiError.message);
                                  // Don't throw error - attendance record was updated successfully
                               }
                            }
                         } else {
                            Logger.warn(`[EventHandlerService] No matching entry record found for park exit attendance`, {
                               park_Id,
                               person_Id: searchPersonId,
                               searchCriteria: {
                                  park_Id,
                                  person_Id: searchPersonId,
                                  exit_time: null
                               }
                            });
                         }
                      }
                   }
                }
             }
             else if(bevaviour_code.includes(eventType)){
                Logger.info(`[EventHandlerService] Processing behavior detection event for camera: ${eventInfo.srcIndex}`);
                
               const isParkCamera = park_cameras.includes(eventInfo.srcIndex.toString())
               
               if(isParkCamera){
                  Logger.info(`[EventHandlerService] Behavior detection on park camera`);
                  const parkCamera = await db.park_cameras.findFirst({
                     where: {
                        camera_Id: eventInfo.srcIndex.toString()
                     }
                  })
                  
                  if(parkCamera){
                     Logger.info(`[EventHandlerService] Found park camera for behavior detection:`, {
                        cameraId: parkCamera.Id,
                        parkId: parkCamera.park_Id,
                        cameraIndex: eventInfo.srcIndex
                     });
                     
                     let imageUrl = null;
                     
                     try {
                        const eventIndexCode = eventInfo.eventId;
                        Logger.debug(`[EventHandlerService] Attempting to retrieve image for behavior event: ${eventIndexCode}`);
                        
                        const eventRecordsResponse = await this.getEventRecords(eventIndexCode);
                        
                        if (eventRecordsResponse && eventRecordsResponse.code === '0' && eventRecordsResponse.data?.list?.length > 0) {
                           const eventRecord = eventRecordsResponse.data.list[0];
                           const eventPicUri = eventRecord.eventPicUri;
                           Logger.debug(`[EventHandlerService] Found behavior event record with picUri: ${eventPicUri ? 'Yes' : 'No'}`);
                           
                           if (eventPicUri) {
                              const imageDataResponse = await this.getImageData(eventPicUri);
                              
                              if (imageDataResponse) {
                                 // The response is directly the base64 string, not wrapped in a data object
                                 const base64Image = imageDataResponse;
                                 
                                 imageUrl = await this.uploadImageToCloudinary(base64Image, 'behavior', eventIndexCode);
                                 Logger.info(`[EventHandlerService] Successfully uploaded behavior image to Cloudinary`);
                              } else {
                                 Logger.warn(`[EventHandlerService] No image data received for behavior event`);
                              }
                           } else {
                              Logger.warn(`[EventHandlerService] No eventPicUri found for behavior event`);
                           }
                        } else {
                           Logger.warn(`[EventHandlerService] No valid event records found for behavior event`);
                        }
                     } catch (imageError: any) {
                        Logger.error(`[EventHandlerService] Failed to process behavior image:`, imageError);
                     }

                     // Determine person_Id using face recognition data (same logic as attendance)
                     let person_Id = null; // Default fallback - use empty string for unknown persons
                     let faceData = null;
                     
                     if (eventInfo.data?.alarmResult?.faces) {
                        Logger.debug(`[EventHandlerService] Processing face recognition data for behavior detection`);
                        const similarity = eventInfo.data.alarmResult.faces.identify.candidate.similarity
                        const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id
                        
                        Logger.debug(`[EventHandlerService] Behavior face recognition details:`, {
                           similarity,
                           humanId
                        });
                        
                        if (humanId && similarity !== null && similarity !== undefined) {
                           const user = await db.users.findFirst({
                              where: { unique_id: humanId.toString() }
                           });
                           if (user) {
                              person_Id = user.Id.toString();
                              Logger.info(`[EventHandlerService] Identified employee for behavior detection:`, {
                                 personId: person_Id,
                                 empId: humanId,
                                 similarity
                              });
                           } else {
                              Logger.warn(`[EventHandlerService] Employee not found in database for behavior detection empId: ${humanId}`);
                              Logger.info(`[EventHandlerService] 👤 Employee not found, creating guest user for behavior detection`, {
                                 empId: humanId,
                                 similarity
                              });
                              
                              try {
                                 // Get faceData URL from event data
                                 let faceData = null;
                                 if (eventInfo.data?.alarmResult?.faces?.URL) {
                                    faceData = eventInfo.data.alarmResult.faces.URL;
                                    Logger.debug(`[EventHandlerService] 📸 Extracted face data URL for behavior guest user`, {
                                       faceDataUrl: faceData
                                    });
                                    } else {
                                    Logger.warn(`[EventHandlerService] ⚠️ No face data URL available for behavior guest user creation`);
                                 }
                                 
                                 const genderValue = eventInfo.data.alarmResult.faces.gender.value
                                 const genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                                 
                                 const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData);
                                 person_Id = guestUser.Id.toString();
                                 
                                 Logger.info(`[EventHandlerService] ✅ Successfully created guest user for behavior detection`, {
                                    guestUserId: person_Id,
                                    guestName: guestUser.emp__eng_name,
                                    gender: genderName,
                                    unique_id: guestUser.unique_id,
                                    originalEmpId: humanId
                                 });
                              } catch (guestError: any) {
                                 Logger.error(`[EventHandlerService] ❌ Failed to create guest user for behavior detection`, {
                                    error: guestError.message,
                                    empId: humanId,
                                    hasFaceData: !!faceData
                                 });
                              }
                           }
                        } else {
                           Logger.debug(`[EventHandlerService] No valid employee identification for behavior detection (similarity: ${similarity}, humanId: ${humanId})`);
                        }
                     } else {
                        Logger.debug(`[EventHandlerService] No face recognition data available for behavior detection`);
                     }
      
                     const detectedBehaviour = eventType===bevaviour_code[0]?'People Gathering Alarm':eventType===bevaviour_code[1]?'Fall Down':eventType===bevaviour_code[2]?'Fast Moving':eventType===bevaviour_code[3]?'Physical Conflict':eventType===bevaviour_code[4]?'Violent Motion Detection':eventType===bevaviour_code[5]?'Fire and Smoke Detection':'Other';
                     
                     const behaviourData = {
                        park_Id: parkCamera?.park_Id,
                        camera_Id: parkCamera?.Id,
                        detection_Id: eventInfo.eventId,
                        detection_code: eventType?.toString(),
                        detection_date: eventInfo.happenTime,
                        detection_time: eventInfo.happenTime,
                        person_Id: person_Id,
                        detected_behaviour: detectedBehaviour,
                        snap_shot: imageUrl,
                        is_employee: false,
                        description: `Behavior detected at ${eventInfo.srcName} camera`
                     }
                     
                     Logger.info(`[EventHandlerService] Creating behavior alert record:`, {
                        parkId: behaviourData.park_Id,
                        cameraId: behaviourData.camera_Id,
                        detectionId: behaviourData.detection_Id,
                        detectionCode: behaviourData.detection_code,
                        detectedBehaviour: behaviourData.detected_behaviour,
                        hasImage: !!imageUrl
                     });
                     
                     // Check if behavior alert with same detection_Id already exists
                     const existingBehaviour = await db.parks_behaviour_alerts.findFirst({
                        where: {
                           detection_Id: behaviourData.detection_Id
                        }
                     });
                     
                     if (existingBehaviour) {
                        Logger.warn(`[EventHandlerService] Behavior alert with detection_Id ${behaviourData.detection_Id} already exists. Skipping duplicate creation.`);
                        return;
                     }
                     
                     const newBehaviourAlert = await db.parks_behaviour_alerts.create({
                        data: behaviourData
                     });
                     
                     Logger.info(`[EventHandlerService] Successfully created behavior alert record with ID: ${newBehaviourAlert.Id}`);
                     
                  } else {
                     Logger.error(`[EventHandlerService] Park camera not found for behavior detection camera index: ${eventInfo.srcIndex}`);
                  }
                 
             } else {
                Logger.warn(`[EventHandlerService] Behavior detection event not on park camera: ${eventInfo.srcIndex}`);
             }
          } else {
             Logger.warn(`[EventHandlerService] No event data provided`);
          }
         }
         
         const duration = Date.now() - startTime;
         Logger.info(`[EventHandlerService] Event processing completed successfully in ${duration}ms`);
         
         return {
            success: true,
            message: "Event processed successfully",
            data: eventData
         };

      } catch (error: any) {
         const duration = Date.now() - startTime;
         Logger.error(`[EventHandlerService] Event processing failed after ${duration}ms`, error);
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to process event");
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

   private static async createGuestUserAndUploadToHikVision(gender: string, faceData: string): Promise<any> {
      const startTime = Date.now();
      Logger.info(`[EventHandlerService] 🚀 Starting guest user creation process`, {
         gender,
         hasFaceData: !!faceData,
         faceDataLength: faceData ? faceData.length : 0
      });

      try {
         Logger.debug(`[EventHandlerService] 🔍 Finding last guest user to determine next number`);
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
               Logger.debug(`[EventHandlerService] 📊 Found last guest: ${lastGuest.emp__eng_name}, next number: ${guestNumber}`);
            } else {
               Logger.debug(`[EventHandlerService] 📊 Found guest with non-standard name: ${lastGuest.emp__eng_name}, using number: ${guestNumber}`);
            }
         } else {
            Logger.debug(`[EventHandlerService] 📊 No existing guests found, using first number: ${guestNumber}`);
         }

         const guestName = `Guest${guestNumber}`;
         Logger.info(`[EventHandlerService] 🏷️ Generated guest name: ${guestName}`);

         Logger.info(`[EventHandlerService] 💾 Creating guest user in database`, {
            guestName,
            gender,
            guestNumber
         });

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

         Logger.info(`[EventHandlerService] ✅ Successfully created guest user in database`, {
            guestUserId: guestUser.Id,
            guestName: guestUser.emp__eng_name,
            gender: guestUser.gender,
            createdAt: guestUser.createdAt
         });

         // Get base64 image data from faceData URL using getImageData API
         let base64ImageData = null;
         if (faceData) {
            Logger.info(`[EventHandlerService] 📸 Fetching base64 image data from faceData URL: ${faceData}`);
            try {
               const imageDataResponse = await this.getImageData(faceData);
            
            if (imageDataResponse) {
               // The response is directly the base64 string, not wrapped in a data object
                  base64ImageData = imageDataResponse;
                  Logger.info(`[EventHandlerService] ✅ Successfully retrieved base64 image data, length: ${base64ImageData.length}`);
            } else {
                  Logger.warn(`[EventHandlerService] ⚠️ No image data received for faceData URL: ${faceData}`);
               }
            } catch (imageError: any) {
               Logger.error(`[EventHandlerService] ❌ Failed to fetch image data from faceData URL:`, imageError.message);
            }
         } else {
            Logger.warn(`[EventHandlerService] ⚠️ No faceData URL provided for image retrieval`);
         }

         // Remove base64 prefix from image data before sending to HikVision API
         const cleanFaceData = base64ImageData ? base64ImageData.replace(/^data:image\/[a-z]+;base64,/, '') : null;
         const hikVisionPayload = {
            personCode: `G-${guestUser.Id.toString()}`,
            personFamilyName: guestNumber.toString(),
            personGivenName: "Guest",
            gender: gender === "Male" ? 1 : 2,
            orgIndexCode: "3",
            faces: cleanFaceData ? [{ faceData: cleanFaceData }] : []
         };

         Logger.info(`[EventHandlerService] 📤 Preparing HIK Vision upload`, {
            personCode: hikVisionPayload.personCode,
            personFamilyName: hikVisionPayload.personFamilyName,
            personGivenName: hikVisionPayload.personGivenName,
            gender: hikVisionPayload.gender,
            orgIndexCode: hikVisionPayload.orgIndexCode,
            hasFaceData: !!base64ImageData,
            faceDataLength: base64ImageData ? base64ImageData.length : 0
         });

         Logger.debug(`[EventHandlerService] 🔄 Calling HIK Vision API for guest user upload`);
         const hikVisionResponse = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            '/artemis/api/resource/v1/person/single/add',
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            hikVisionPayload
         );

         Logger.debug(`[EventHandlerService] 📥 Received HIK Vision response`, {
            code: hikVisionResponse?.code,
            msg: hikVisionResponse?.msg,
            hasData: !!hikVisionResponse?.data,
            dataValue: hikVisionResponse?.data
         });

         if (hikVisionResponse && hikVisionResponse.code === '0' && hikVisionResponse.data) {
            Logger.info(`[EventHandlerService] 🎉 HIK Vision upload successful, updating guest user with unique_id`);
            const updatedGuestUser = await db.users.update({
               where: { Id: guestUser.Id },
               data: { unique_id: hikVisionResponse.data }
            });

            // Add face information to guest group (group 5)
            try {
               Logger.info(`[EventHandlerService] 📸 Adding face information to guest group`);
               const faceAdditionPayload = {
                  personIndexCode: hikVisionResponse.data, // The unique_id from HikVision
                  faceGroupIndexCode: "5" // Group 5 for guests
               };

               Logger.debug(`[EventHandlerService] Face addition payload:`, faceAdditionPayload);

               const faceAdditionResponse = await this.callHikVisionAPI(
                  this.HIK_CONFIG.baseURL,
                  '/artemis/api/frs/v1/face/single/addition',
                  this.HIK_CONFIG.appKey,
                  this.HIK_CONFIG.appSecret,
                  faceAdditionPayload
               );

               if (faceAdditionResponse && faceAdditionResponse.code === '0') {
                  Logger.info(`[EventHandlerService] ✅ Face information added to guest group successfully`, {
                     personIndexCode: faceAdditionPayload.personIndexCode,
                     faceGroupIndexCode: faceAdditionPayload.faceGroupIndexCode
                  });
               } else {
                  Logger.warn(`[EventHandlerService] ⚠️ Face addition API returned error:`, faceAdditionResponse);
               }
            } catch (faceAdditionError: any) {
               Logger.error(`[EventHandlerService] ❌ Failed to add face information to guest group:`, faceAdditionError.message);
               // Don't throw error here as the main guest creation was successful
            }

            const duration = Date.now() - startTime;
            Logger.info(`[EventHandlerService] ✅ Guest user creation and HIK Vision upload completed successfully`, {
               guestUserId: guestUser.Id,
               guestName: guestName,
               hikVisionId: hikVisionResponse.data,
               unique_id: updatedGuestUser.unique_id,
               duration: `${duration}ms`,
               gender: gender,
               hasFaceData: !!base64ImageData
            });

            return updatedGuestUser;
         } else {
            const duration = Date.now() - startTime;
            Logger.error(`[EventHandlerService] ❌ HIK Vision API returned error for guest user`, {
               guestUserId: guestUser.Id,
               guestName: guestName,
               hikVisionResponse,
               duration: `${duration}ms`,
               error: hikVisionResponse?.msg || 'Unknown error'
            });
            Logger.warn(`[EventHandlerService] ⚠️ Returning guest user without HIK Vision ID due to upload failure`);
            return guestUser;
         }

      } catch (error: any) {
         const duration = Date.now() - startTime;
         Logger.error(`[EventHandlerService] 💥 Failed to create guest user and upload to HIK Vision`, {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            gender,
            hasFaceData: !!faceData
         });
         if (error.code === 'ETIMEDOUT') {
            Logger.error(`[EventHandlerService] 🌐 Network timeout error - HIK Vision server may be unreachable`);
         } else if (error.response) {
            Logger.error(`[EventHandlerService] 📡 HTTP error response`, {
               status: error.response.status,
               statusText: error.response.statusText,
               responseData: error.response.data
            });
         } else if (error.code === 'ECONNREFUSED') {
            Logger.error(`[EventHandlerService] 🔌 Connection refused - HIK Vision server may be down`);
         }
         
         throw error;
      }
   }

   private static async postToIntranetAPI(parkExists: any, intrusionDetection: any): Promise<any> {
      try {
         const secretKey = await this.fetchSecretFromAPI();
         const endpoint = "https://192.168.164.7/website_demo/middleware/?class=general&action=ParkViolationFineService";
         const payload = {
            SecretKey: secretKey,
            Lang: "en",
            ParkName: parkExists.park_english_name,
            Photo: intrusionDetection.snap_shot,
            EventID: '1'
         };

         const requestConfig = {
            headers: { 
               "Content-Type": "application/json",
               "Accept": "*/*",
               "User-Agent": "PostmanRuntime/7.46.1",
               "Accept-Encoding": "gzip, deflate, br",
               "Connection": "keep-alive",
               "Cache-Control": "no-cache"
            },
            timeout: 30000,
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
         };
         
         const response = await axios.post(endpoint, payload, requestConfig);

         if (response.data?.status === "SUCCESS" && response.data?.code === 200) {
            return response.data;
         } else {
            throw new HttpException(STATUS.BAD_REQUEST, `Intranet API returned error: ${response.data?.message || 'Unknown error'}`);
         }

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, `Failed to post to intranet API: ${error.message}`);
      }
   }

   /**
    * Get all office camera IDs from database
    * @returns Promise<string[]> Array of office camera IDs
    */
   private static async getOfficeCameraIds(): Promise<string[]> {
      try {
         const officeCameras = await db.offices_cameras.findMany({
            select: {
               camera_Id: true
            },
            where: {
               status: true // Only get active cameras
            }
         });
         
         return officeCameras
            .map(camera => camera.camera_Id)
            .filter((id): id is string => id !== null);
      } catch (error) {
         Logger.error(`[EventHandlerService] Error fetching office camera IDs:`, error);
         // Return empty array as fallback
         return [];
      }
   }

   /**
    * Get all park camera IDs from database
    * @returns Promise<string[]> Array of park camera IDs
    */
   private static async getParkCameraIds(): Promise<string[]> {
      try {
         const parkCameras = await db.park_cameras.findMany({
            select: {
               camera_Id: true
            },
            where: {
               status: true // Only get active cameras
            }
         });
         
         return parkCameras
            .map(camera => camera.camera_Id)
            .filter((id): id is string => id !== null);
      } catch (error) {
         Logger.error(`[EventHandlerService] Error fetching park camera IDs:`, error);
         // Return empty array as fallback
         return [];
      }
   }

   /**
    * Check if a user is a guest user (not an employee)
    * @param personId The person ID to check
    * @returns Promise<boolean> True if the user is a guest, false if employee
    */
   private static async isGuestUser(personId: number): Promise<boolean> {
      try {
         const user = await db.users.findUnique({
            where: { Id: personId },
            select: { 
               emp_Id: true,
               emp_code: true,
               is_attendance_user: true
            }
         });
         
         if (!user) {
            Logger.warn(`[EventHandlerService] User not found for personId: ${personId}`);
            return true; // Treat as guest if user not found
         }
         
         // A user is considered a guest if:
         // 1. emp_Id is null or empty
         // 2. emp_code is null or empty  
         // 3. is_attendance_user is false
         const isGuest = !user.emp_Id || !user.emp_code || !user.is_attendance_user;
         
         Logger.debug(`[EventHandlerService] User type check:`, {
            personId,
            emp_Id: user.emp_Id,
            emp_code: user.emp_code,
            is_attendance_user: user.is_attendance_user,
            isGuest
         });
         
         return isGuest;
      } catch (error) {
         Logger.error(`[EventHandlerService] Error checking if user is guest:`, error);
         return true; // Treat as guest on error to be safe
      }
   }
}
export default EventHandlerService;
