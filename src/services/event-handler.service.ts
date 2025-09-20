import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import db from "@/prisma/client";
import axios from "axios";
import https from "https";
import * as nodeCrypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
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
         const office_cameras=['131','132','133','134','135','136']
         const park_cameras=['3','4','5','6','75','76','77','78','79','186','187','188','189','190','191','192','193']
         let intrusion_detection_code=131585
         let attendance_code=131659
         let bevaviour_code=[131596,131605,192515]
         
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
                      snap_shot:imageUrl, // Use Cloudinary URL instead of base64
                      posted_to_intranet_date:eventData.timestamp,
                      posted_to_intranet_time:eventData.timestamp,
                      detection_Id:eventInfo.eventId,
                      detection_date:eventInfo.happenTime,
                      detection_time:eventInfo.happenTime,
                      is_employee:false, // Default to false since we don't have face data in this format
                      description: `Intrusion detected at ${eventInfo.srcName} camera`
                   }
                   
                   Logger.info(`[EventHandlerService] Creating intrusion detection record:`, {
                      parkId: intrusionData.park_Id,
                      cameraId: intrusionData.camera_Id,
                      detectionId: intrusionData.detection_Id,
                      hasImage: !!imageUrl
                   });
                   
                   const new_intrusion_detection=await db.parks_intrusion_detection.create({
                      data: intrusionData
                   })
                   
                   Logger.info(`[EventHandlerService] Successfully created intrusion detection record with ID: ${new_intrusion_detection.Id}`);
                }
                else{
                   Logger.error(`[EventHandlerService] Park camera not found for camera index: ${eventInfo.srcIndex}`);
                   return new HttpException(STATUS.NOT_FOUND, "Park camera not found")
                }
             }
             else if(eventType===attendance_code){
                Logger.info(`[EventHandlerService] Processing attendance event for camera: ${eventInfo.srcIndex}`);
                const isOfficeCamera = office_cameras.includes(eventInfo.srcIndex)
                const isParkCamera = park_cameras.includes(eventInfo.srcIndex)
                
                Logger.debug(`[EventHandlerService] Camera type detection:`, {
                   srcIndex: eventInfo.srcIndex,
                   isOfficeCamera,
                   isParkCamera,
                   srcName: eventInfo.srcName
                });
                
                if(isOfficeCamera){
                   Logger.info(`[EventHandlerService] Processing office camera attendance`);
                   const officeCamera = await db.offices_cameras.findFirst({
                      where: {
                         camera_Id: eventInfo.srcIndex
                      }
                   })
                   
                   if(officeCamera && officeCamera.office_Id){
                      Logger.info(`[EventHandlerService] Found office camera:`, {
                         cameraId: officeCamera.Id,
                         officeId: officeCamera.office_Id,
                         cameraIndex: eventInfo.srcIndex
                      });
                      
                      const office_Id = officeCamera.office_Id
                      const isEntry = eventInfo.srcName === "ENTRY"
                      const isExit = eventInfo.srcName === "EXIT"
                      
                      Logger.debug(`[EventHandlerService] Office attendance type:`, {
                         srcName: eventInfo.srcName,
                         isEntry,
                         isExit
                      });
                      
                      let genderName = 'Unknown';
                      let isChild = false;
                      let person_Id = null;
                      
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
                         
                         if (similarity !== 0 && humanId && humanId !== "-1") {
                            const user = await db.users.findFirst({
                               where: { emp_Id: humanId.toString() }
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
                            }
                         } else {
                            Logger.debug(`[EventHandlerService] No valid employee identification (similarity: ${similarity}, humanId: ${humanId})`);
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
                      
                      Logger.info(`[EventHandlerService] Creating office footfall record:`, {
                         officeId: officeFootfallData.office_Id,
                         personId: officeFootfallData.person_Id,
                         gender: officeFootfallData.gender,
                         isChild: officeFootfallData.is_child,
                         detectionId: officeFootfallData.detection_Id
                      });
                      
                        const officeFootfallRecord = await db.offices_footfall_analysis.create({
                           data: officeFootfallData
                        })
                        
                        Logger.info(`[EventHandlerService] Successfully created office footfall record with ID: ${officeFootfallRecord.id}`);
                      
                    
                      if(isEntry){
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
                      } else if(isExit){
                         Logger.info(`[EventHandlerService] Processing office exit attendance`);
                         const latestAttendance = await db.offices_attendance.findFirst({
                            where: {
                               office_Id: office_Id,
                               person_Id: person_Id,
                               exit_time: null
                            },
                            orderBy: {
                               entry_time: 'desc'
                            }
                         })
                         
                         if(latestAttendance){
                            Logger.info(`[EventHandlerService] Updating office exit attendance for record ID: ${latestAttendance.Id}`);
                            await db.offices_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventInfo.happenTime
                               }
                            })
                            Logger.info(`[EventHandlerService] Successfully updated office exit attendance`);
                         } else {
                            Logger.warn(`[EventHandlerService] No matching entry record found for office exit attendance`);
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
                      const isEntry = eventInfo.srcName === "ENTRY"
                      const isExit = eventInfo.srcName === "EXIT"
                      
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
                      
                      Logger.debug(`[EventHandlerService] Park face recognition details:`, {
                         genderValue,
                         ageGroup,
                         genderName,
                         isChild,
                         similarity,
                         humanId
                      });
                      
                      let person_Id = null; // Default fallback - use null for unknown persons
                      if (similarity !== 0 && humanId && humanId !== "-1") {
                         const user = await db.users.findFirst({
                            where: { emp_Id: humanId.toString() }
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
                         }
                      } else {
                         Logger.debug(`[EventHandlerService] No valid employee identification for park attendance (similarity: ${similarity}, humanId: ${humanId})`);
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
                      
                      Logger.info(`[EventHandlerService] Creating park footfall record:`, {
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
                      
                      
                   
                      if(isEntry){
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
                      } else if(isExit){
                         Logger.info(`[EventHandlerService] Processing park exit attendance`);
                         const latestAttendance = await db.parks_attendance.findFirst({
                            where: {
                               park_Id: park_Id,
                               person_Id: person_Id,
                               exit_time: null
                            },
                            orderBy: {
                               entry_time: 'desc'
                            }
                         })
                         
                         if(latestAttendance){
                            Logger.info(`[EventHandlerService] Updating park exit attendance for record ID: ${latestAttendance.Id}`);
                            await db.parks_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventInfo.happenTime
                               }
                            })
                            Logger.info(`[EventHandlerService] Successfully updated park exit attendance`);
                         } else {
                            Logger.warn(`[EventHandlerService] No matching entry record found for park exit attendance`);
                         }
                      }
                   }
                }
             }
             else if(bevaviour_code.includes(eventType)){
                Logger.info(`[EventHandlerService] Processing behavior detection event for camera: ${eventInfo.srcIndex}`);
                
               const isParkCamera = park_cameras.includes(eventInfo.srcIndex)
               
               if(isParkCamera){
                  Logger.info(`[EventHandlerService] Behavior detection on park camera`);
                  const parkCamera = await db.park_cameras.findFirst({
                     where: {
                        camera_Id: eventInfo.srcIndex
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
      
                     const detectedBehaviour = eventType===bevaviour_code[0]?'Violent Motion Detection':eventType===bevaviour_code[1]?'Falling Down':'Fire and Smoke Detection';
                     
                     const behaviourData = {
                        park_Id: parkCamera?.park_Id,
                        camera_Id: parkCamera?.Id,
                        detection_Id: eventInfo.eventId,
                        detection_code: eventType?.toString(),
                        detection_date: eventInfo.happenTime,
                        detection_time: eventInfo.happenTime,
                        person_Id: '',
                        detected_behaviour: detectedBehaviour,
                        snap_shot: imageUrl, // Store the Cloudinary URL instead of base64
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
}
export default EventHandlerService;
