import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import db from "@/prisma/client";
import axios from "axios";
import https from "https";
import * as nodeCrypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

class EventHandlerService {

   // HikVision API configuration
   private static readonly HIK_CONFIG = {
      baseURL: 'https://10.70.90.183:443',
      appKey: '59315117',
      appSecret: 'YuWS8qCb61xbD8fEbwFJ',
      eventRecordsEndpoint: '/artemis/api/eventService/v1/eventRecords/page',
      imageDataEndpoint: '/artemis/api/eventService/v1/image_data',
   };

   // Cloudinary configuration
   private static readonly CLOUDINARY_CONFIG = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
      api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
      folder: 'event-images' // Folder to store event images
   };
   
   static {
      console.log("🔧 [HIKVISION API] Configuration loaded:", {
         baseURL: this.HIK_CONFIG.baseURL,
         appKey: this.HIK_CONFIG.appKey,
         eventRecordsEndpoint: this.HIK_CONFIG.eventRecordsEndpoint,
         imageDataEndpoint: this.HIK_CONFIG.imageDataEndpoint
      });
      
      // Configure Cloudinary
      cloudinary.config({
         cloud_name: this.CLOUDINARY_CONFIG.cloud_name,
         api_key: this.CLOUDINARY_CONFIG.api_key,
         api_secret: this.CLOUDINARY_CONFIG.api_secret,
      });
      
      console.log("☁️ [CLOUDINARY] Configuration loaded:", {
         cloud_name: this.CLOUDINARY_CONFIG.cloud_name,
         folder: this.CLOUDINARY_CONFIG.folder
      });
   }

   // Get event records from HikVision API
   private static async getEventRecords(eventIndexCode: string) {
      try {
         console.log('📋 [HIKVISION API] Fetching event records for:', eventIndexCode);
         
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            this.HIK_CONFIG.eventRecordsEndpoint,
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            { eventIndexCode }
         );
         
         console.log('📋 [HIKVISION API] Event records response:', response);
         return response;
      } catch (error: any) {
         console.error('❌ [HIKVISION API] Failed to get event records:', error.message);
         throw error;
      }
   }

   // Get image data from HikVision API
   private static async getImageData(picUri: string) {
      try {
         console.log('📸 [HIKVISION API] Fetching image data for:', picUri);
         
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            this.HIK_CONFIG.imageDataEndpoint,
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            { picUri }
         );
         
         console.log('📸 [HIKVISION API] Image data response received');
         return response;
      } catch (error: any) {
         console.error('❌ [HIKVISION API] Failed to get image data:', error.message);
         throw error;
      }
   }

   // Upload base64 image to Cloudinary
   private static async uploadImageToCloudinary(base64Image: string, eventType: string, eventId: string): Promise<string> {
      try {
         console.log('☁️ [CLOUDINARY] Starting image upload...');
         console.log('☁️ [CLOUDINARY] Image size:', Math.round(base64Image.length * 0.75 / 1024), 'KB (estimated)');
         
         // Generate unique public ID for the image
         const publicId = `${this.CLOUDINARY_CONFIG.folder}/${eventType}/${eventId}_${Date.now()}`;
         
         console.log('☁️ [CLOUDINARY] Uploading with public ID:', publicId);
         
         const result = await cloudinary.uploader.upload(base64Image, {
            public_id: publicId,
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto',
            fetch_format: 'auto'
         });
         
         console.log('✅ [CLOUDINARY] Image uploaded successfully:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            bytes: result.bytes
         });
         
         return result.secure_url;
      } catch (error: any) {
         console.error('❌ [CLOUDINARY] Failed to upload image:', error.message);
         throw error;
      }
   }

   // Generic HikVision API call function
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

         console.log('📦 [HIKVISION API] Making request to:', `${baseUrl}${endpoint}`);
         console.log('📦 [HIKVISION API] Request headers:', JSON.stringify(headers, null, 2));
         console.log('📦 [HIKVISION API] Request body:', requestBody);

         const response = await axios({
            method,
            url: `${baseUrl}${endpoint}`,
            headers,
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            data: requestBody,
            timeout: 30000,
         });

         console.log('📦 [HIKVISION API] Response status:', response.status);
         console.log('📦 [HIKVISION API] Response headers:', JSON.stringify(response.headers, null, 2));
         console.log('📦 [HIKVISION API] Response data preview:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
         return response.data;
      } catch (error: any) {
         if (error.response) {
            console.error('❌ [HIKVISION API] Error Response:', {
               status: error.response.status,
               statusText: error.response.statusText,
               data: error.response.data,
            });
            throw new Error(`HikVision API Error: ${error.response.status} - ${error.response.statusText}`);
         } else {
            console.error('❌ [HIKVISION API] Error:', error.message);
            throw new Error(`Error: ${error.message}`);
         }
      }
   }

   // Handle event processing
   public static handleEventService = async (eventData: any) => {
       try { 
         console.log("🚀 [EVENT HANDLER] ==========================================");
         console.log("🚀 [EVENT HANDLER] Starting event processing...");
         console.log("📦 [EVENT HANDLER] Received event data:", JSON.stringify(eventData, null, 2));
         console.log("⏰ [EVENT HANDLER] Processing timestamp:", new Date().toISOString());
         
         const office_cameras=['131','132','133','134','135','136']
         const park_cameras=['3','4','5','6','75','76','77','78','79','186','187','188','189','190','191','192','193']
         let intrusion_detection_code=131585
         let attendance_code=131659
         let bevaviour_code=[131596,131605,192515]
         
         console.log("📋 [EVENT HANDLER] Event type codes configured:");
         console.log("   - Intrusion Detection:", intrusion_detection_code);
         console.log("   - Attendance:", attendance_code);
         console.log("   - Behavior:", bevaviour_code);
         console.log("📷 [EVENT HANDLER] Camera lists:");
         console.log("   - Office cameras:", office_cameras);
         console.log("   - Park cameras:", park_cameras);
         
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
             console.log("🔍 [EVENT HANDLER] Validating event data structure...");
             
             if (!eventData.logData || !eventData.logData.params || !eventData.logData.params.events || !eventData.logData.params.events[0]) {
                console.error("❌ [EVENT HANDLER] Invalid event data structure - missing required fields");
                throw new HttpException(STATUS.BAD_REQUEST, "Invalid event data structure");
             }
             
             let eventType=eventData.logData.params.events[0].eventType
             console.log("📝 [EVENT HANDLER] Processing event:", {
                eventType: eventType,
                srcIndex: eventData.logData.params.events[0].srcIndex,
                srcName: eventData.logData.params.events[0].srcName,
                eventId: eventData.logData.params.events[0].eventId,
                happenTime: eventData.logData.params.events[0].happenTime,
                hasFaceData: !!(eventData.logData.params.events[0].data?.alarmResult?.faces)
             });
             
             console.log("🎯 [EVENT HANDLER] Event type classification:");
             if (eventType === intrusion_detection_code) {
                console.log("   → INTRUSION DETECTION event detected");
             } else if (eventType === attendance_code) {
                console.log("   → ATTENDANCE event detected");
             } else if (bevaviour_code.includes(eventType)) {
                console.log("   → BEHAVIOR event detected");
             } else {
                console.log("   → UNKNOWN event type - will be ignored");
             }
             
             if(eventType===intrusion_detection_code){
                console.log("🚨 [INTRUSION DETECTION] Processing intrusion detection event...");
                let park_Id;

                console.log("🔍 [INTRUSION DETECTION] Looking up park camera for srcIndex:", eventData.logData.params.events[0].srcIndex);
                let parkcamera=await db.park_cameras.findFirst({
                   where:{
                      camera_Id: eventData.logData.params.events[0].srcIndex
                   }
                })
                
                if(parkcamera){
                   park_Id=parkcamera.park_Id
                   console.log("✅ [INTRUSION DETECTION] Found park camera:", {
                      camera_Id: parkcamera.camera_Id,
                      park_Id: parkcamera.park_Id,
                      camera_name: parkcamera.camera_english_name
                   });
                   let imageUrl = null;
                   
                   try {
                      // Get image for intrusion detection
                      const eventIndexCode = eventData.logData.params.events[0].eventId;
                      console.log('🔍 [INTRUSION DETECTION] Getting event records for eventIndexCode:', eventIndexCode);
                      
                      const eventRecordsResponse = await this.getEventRecords(eventIndexCode);
                      
                      if (eventRecordsResponse && eventRecordsResponse.code === '0' && eventRecordsResponse.data?.list?.length > 0) {
                         const eventRecord = eventRecordsResponse.data.list[0];
                         const eventPicUri = eventRecord.eventPicUri;
                         
                         console.log('📸 [INTRUSION DETECTION] Found eventPicUri:', eventPicUri);
                         
                         if (eventPicUri) {
                            const imageDataResponse = await this.getImageData(eventPicUri);
                            
                            if (imageDataResponse) {
                               // The response is directly the base64 string, not wrapped in a data object
                               const base64Image = imageDataResponse;
                               console.log('✅ [INTRUSION DETECTION] Successfully fetched base64 image');
                               console.log('📏 [INTRUSION DETECTION] Base64 Image Length:', base64Image.length, 'characters');
                               
                               // Upload to Cloudinary
                               imageUrl = await this.uploadImageToCloudinary(base64Image, 'intrusion', eventIndexCode);
                               console.log('☁️ [INTRUSION DETECTION] Image uploaded to Cloudinary:', imageUrl);
                            }
                         }
                      }
                   } catch (imageError: any) {
                      console.error('❌ [INTRUSION DETECTION] Error fetching/uploading image:', imageError.message);
                      console.log('⚠️ [INTRUSION DETECTION] Continuing without image data');
                   }

                   const intrusionData = {
                      park_Id:park_Id,
                      camera_Id:parkcamera.Id,
                      occurrence_date:eventData.logData.params.events[0].happenTime,
                      occurrence_time:eventData.logData.params.events[0].happenTime,
                      snap_shot:imageUrl, // Use Cloudinary URL instead of base64
                      posted_to_intranet_date:eventData.timestamp,
                      posted_to_intranet_time:eventData.timestamp,
                      detection_Id:eventData.logData.params.events[0].eventId,
                      detection_date:eventData.logData.params.events[0].happenTime,
                      detection_time:eventData.logData.params.events[0].happenTime,
                      is_employee:false, // Default to false since we don't have face data in this format
                      description: `Intrusion detected at ${eventData.logData.params.events[0].srcName} camera`
                   }
                   
                   // Create a separate object for logging to avoid modifying the original data
                   const logData = {
                      ...intrusionData,
                      snap_shot: imageUrl ? `[Cloudinary URL - ${imageUrl.length} chars]` : 'No image'
                   };
                   console.log("🚨 [INTRUSION DETECTION] Creating intrusion record:", JSON.stringify(logData, null, 2));
                   console.log("🔗 [INTRUSION DETECTION] Actual URL being stored:", imageUrl);
                   const new_intrusion_detection=await db.parks_intrusion_detection.create({
                      data: intrusionData
                   })
                   console.log("✅ [INTRUSION DETECTION] Record created with ID:", new_intrusion_detection.Id);
                }
                else{
                   return new HttpException(STATUS.NOT_FOUND, "Park camera not found")
                }
             }
             else if(eventType===attendance_code){
                console.log("👥 [ATTENDANCE] Processing attendance event...");
                // Check if it's office or park camera
                const isOfficeCamera = office_cameras.includes(eventData.logData.params.events[0].srcIndex)
                const isParkCamera = park_cameras.includes(eventData.logData.params.events[0].srcIndex)
                
                console.log("🔍 [ATTENDANCE] Camera type detection:", {
                   srcIndex: eventData.logData.params.events[0].srcIndex,
                   isOfficeCamera: isOfficeCamera,
                   isParkCamera: isParkCamera
                });
                
                if(isOfficeCamera){
                   // Handle office attendance and footfall
                   const officeCamera = await db.offices_cameras.findFirst({
                      where: {
                         camera_Id: eventData.logData.params.events[0].srcIndex
                      }
                   })
                   
                   if(officeCamera && officeCamera.office_Id){
                      const office_Id = officeCamera.office_Id
                      const isEntry = eventData.logData.params.events[0].srcName === "ENTRY"
                      const isExit = eventData.logData.params.events[0].srcName === "EXIT"
                      
                      // Create footfall analysis record
                      let genderName = 'Unknown';
                      let isChild = false;
                      let person_Id = null;
                      
                      // Check if face data is available
                      if (eventData.logData.params.events[0].data?.alarmResult?.faces) {
                         const genderValue = eventData.logData.params.events[0].data.alarmResult.faces.gender.value
                         const ageGroup = eventData.logData.params.events[0].data.alarmResult.faces.age.ageGroup
                         genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                         isChild = ageGroup <= 2 // INFANT, KID, CHILD
                         
                         // Check similarity to determine person_Id
                         const similarity = eventData.logData.params.events[0].data.alarmResult.faces.identify.candidate.similarity
                         const humanId = eventData.logData.params.events[0].data.alarmResult.faces.identify.candidate.human_id
                         
                         // Look up person_Id in users database
                         if (similarity !== 0 && humanId && humanId !== "-1") {
                            const user = await db.users.findFirst({
                               where: { emp_Id: humanId.toString() }
                            });
                            if (user) {
                               person_Id = user.Id;
                               console.log("👤 [USER LOOKUP] Found user:", { Id: user.Id, user_Id: user.user_Id, name: user.emp__eng_name });
                            } else {
                               console.log("⚠️ [USER LOOKUP] User not found for Id:", humanId);
                            }
                         }
                      } else {
                         console.log("⚠️ [OFFICE FOOTFALL] No face data available in event");
                      }
                      
                      const officeFootfallData = {
                         office_Id: office_Id,
                         detection_Id: eventData.logData.params.events[0].eventId,
                         person_Id: person_Id,
                         gender: genderName,
                         is_child: isChild,
                         time: eventData.logData.params.events[0].happenTime,
                         detected_camera_Id: eventData.logData.params.events[0].srcIndex,
                         detected_camera_name: eventData.logData.params.events[0].srcName
                      }
                      
                      console.log("🏢 [OFFICE FOOTFALL] Creating footfall record:", JSON.stringify(officeFootfallData, null, 2));
                     
                        const officeFootfallRecord = await db.offices_footfall_analysis.create({
                           data: officeFootfallData
                        })
                        console.log("✅ [OFFICE FOOTFALL] Record created with ID:", officeFootfallRecord.id);
                        
                      
                    
                      // Handle attendance (entry/exit)
                      if(isEntry){
                         // Create new attendance record for entry
                         const officeAttendanceData = {
                            office_Id: office_Id,
                            person_Id: person_Id,
                            entry_time: eventData.logData.params.events[0].happenTime
                         }
                         
                         console.log("🏢 [OFFICE ATTENDANCE] Creating entry record:", JSON.stringify(officeAttendanceData, null, 2));
                         const officeAttendanceRecord = await db.offices_attendance.create({
                            data: officeAttendanceData
                         })
                         console.log("✅ [OFFICE ATTENDANCE] Entry record created with ID:", officeAttendanceRecord.Id);
                      } else if(isExit){
                         // Find latest attendance record without exit_time and update it
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
                            console.log("🏢 [OFFICE ATTENDANCE] Updating exit time for record ID:", latestAttendance.Id);
                            await db.offices_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventData.logData.params.events[0].happenTime
                               }
                            })
                            console.log("✅ [OFFICE ATTENDANCE] Exit time updated successfully");
                         } else {
                            console.log("⚠️ [OFFICE ATTENDANCE] No open attendance record found for person_Id:", person_Id);
                         }
                      }
                   }
                }
                else if(isParkCamera){
                   // Handle park attendance and footfall
                   const parkCamera = await db.park_cameras.findFirst({
                      where: {
                         camera_Id: eventData.logData.params.events[0].srcIndex
                      }
                   })
                   
                   if(parkCamera && parkCamera.park_Id){
                      const park_Id = parkCamera.park_Id
                      const isEntry = eventData.logData.params.events[0].srcName === "ENTRY"
                      const isExit = eventData.logData.params.events[0].srcName === "EXIT"
                      
                      // Create footfall analysis record
                      const genderValue = eventData.logData.params.events[0].data.alarmResult.faces.gender.value
                      const ageGroup = eventData.logData.params.events[0].data.alarmResult.faces.age.ageGroup
                      const genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                      const isChild = ageGroup <= 2 // INFANT, KID, CHILD
                      
                      // Check similarity to determine person_Id
                      const similarity = eventData.logData.params.events[0].data.alarmResult.faces.identify.candidate.similarity
                      const humanId = eventData.logData.params.events[0].data.alarmResult.faces.identify.candidate.human_id
                      
                      // Look up person_Id in users database
                      let person_Id = null; // Default fallback - use null for unknown persons
                      if (similarity !== 0 && humanId && humanId !== "-1") {
                         const user = await db.users.findFirst({
                            where: { emp_Id: humanId.toString() }
                         });
                         if (user) {
                            person_Id = user.Id;
                            console.log("👤 [USER LOOKUP] Found user:", { Id: user.Id, user_Id: user.user_Id, name: user.emp__eng_name });
                         } else {
                            console.log("⚠️ [USER LOOKUP] User not found for Id:", humanId);
                         }
                      }
                      
                      const parkFootfallData = {
                         park_Id: park_Id,
                         detection_Id: eventData.logData.params.events[0].eventId,
                         person_Id: person_Id,
                         gender: genderName,
                         is_child: isChild,
                         time: eventData.logData.params.events[0].happenTime,
                         detected_camera_Id: eventData.logData.params.events[0].srcIndex,
                         detected_camera_name: eventData.logData.params.events[0].srcName
                      }
                     
                        console.log("🌳 [PARK FOOTFALL] Creating footfall record:", JSON.stringify(parkFootfallData, null, 2));
                        const parkFootfallRecord = await db.parks_footfall_analysis.create({
                           data: parkFootfallData
                        })
                        console.log("✅ [PARK FOOTFALL] Record created with ID:", parkFootfallRecord.id);
                        
                      
                      
                   
                      // Handle attendance (entry/exit)
                      if(isEntry){
                         // Create new attendance record for entry
                         const parkAttendanceData = {
                            park_Id: park_Id,
                            person_Id: person_Id,
                            entry_time: eventData.logData.params.events[0].happenTime
                         }
                         
                         console.log("🌳 [PARK ATTENDANCE] Creating entry record:", JSON.stringify(parkAttendanceData, null, 2));
                         const parkAttendanceRecord = await db.parks_attendance.create({
                            data: parkAttendanceData
                         })
                         console.log("✅ [PARK ATTENDANCE] Entry record created with ID:", parkAttendanceRecord.Id);
                      } else if(isExit){
                         // Find latest attendance record without exit_time and update it
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
                            console.log("🌳 [PARK ATTENDANCE] Updating exit time for record ID:", latestAttendance.Id);
                            await db.parks_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventData.logData.params.events[0].happenTime
                               }
                            })
                            console.log("✅ [PARK ATTENDANCE] Exit time updated successfully");
                         } else {
                            console.log("⚠️ [PARK ATTENDANCE] No open attendance record found for person_Id:", person_Id);
                         }
                      }
                   }
                }
             }
             else if(bevaviour_code.includes(eventType)){
                console.log("🎭 [BEHAVIOR DETECTION] Processing behavior event...");
                console.log("🎯 [BEHAVIOR DETECTION] Behavior type:", eventType);
                
               const isParkCamera = park_cameras.includes(eventData.logData.params.events[0].srcIndex)
               console.log("🔍 [BEHAVIOR DETECTION] Camera type detection:", {
                  srcIndex: eventData.logData.params.events[0].srcIndex,
                  isParkCamera: isParkCamera
               });
               
               if(isParkCamera){
                  console.log("🔍 [BEHAVIOR DETECTION] Looking up park camera for srcIndex:", eventData.logData.params.events[0].srcIndex);
                  const parkCamera = await db.park_cameras.findFirst({
                     where: {
                        camera_Id: eventData.logData.params.events[0].srcIndex
                     }
                  })
                  
                  if(parkCamera){
                     console.log("✅ [BEHAVIOR DETECTION] Found park camera:", {
                        camera_Id: parkCamera.camera_Id,
                        park_Id: parkCamera.park_Id,
                        camera_name: parkCamera.camera_english_name
                     });
                     let imageUrl = null;
                     
                     try {
                        // Step 1: Get event records to find eventPicUri
                        const eventIndexCode = eventData.logData.params.events[0].eventId;
                        console.log('🔍 [BEHAVIOR DETECTION] Getting event records for eventIndexCode:', eventIndexCode);
                        
                        const eventRecordsResponse = await this.getEventRecords(eventIndexCode);
                        
                        if (eventRecordsResponse && eventRecordsResponse.code === '0' && eventRecordsResponse.data?.list?.length > 0) {
                           const eventRecord = eventRecordsResponse.data.list[0];
                           const eventPicUri = eventRecord.eventPicUri;
                           
                           console.log('📸 [BEHAVIOR DETECTION] Found eventPicUri:', eventPicUri);
                           
                           if (eventPicUri) {
                              // Step 2: Get the actual image data using eventPicUri
                              const imageDataResponse = await this.getImageData(eventPicUri);
                              
                              if (imageDataResponse) {
                                 // The response is directly the base64 string, not wrapped in a data object
                                 const base64Image = imageDataResponse;
                                 console.log('✅ [BEHAVIOR DETECTION] Successfully fetched base64 image');
                                 console.log('📏 [BEHAVIOR DETECTION] Base64 Image Length:', base64Image.length, 'characters');
                                 console.log('📊 [BEHAVIOR DETECTION] Base64 Image Size:', Math.round(base64Image.length * 0.75 / 1024), 'KB (estimated)');
                                 
                                 // Upload to Cloudinary
                                 imageUrl = await this.uploadImageToCloudinary(base64Image, 'behavior', eventIndexCode);
                                 console.log('☁️ [BEHAVIOR DETECTION] Image uploaded to Cloudinary:', imageUrl);
                              } else {
                                 console.error('❌ [BEHAVIOR DETECTION] Failed to get image data from API response');
                              }
                           } else {
                              console.log('⚠️ [BEHAVIOR DETECTION] No eventPicUri found in event records');
                           }
                        } else {
                           console.error('❌ [BEHAVIOR DETECTION] Failed to get event records or no records found');
                        }
                     } catch (imageError: any) {
                        console.error('❌ [BEHAVIOR DETECTION] Error fetching/uploading image:', imageError.message);
                        console.log('⚠️ [BEHAVIOR DETECTION] Continuing without image data');
                     }
      
                     const behaviourData = {
                        park_Id: parkCamera?.park_Id,
                        camera_Id: parkCamera?.Id,
                        detection_Id: eventData.logData.params.events[0].eventId,
                        detection_code: eventType,
                        detection_date: eventData.logData.params.events[0].happenTime,
                        detection_time: eventData.logData.params.events[0].happenTime,
                        person_Id: '',
                        detected_behaviour: eventType===bevaviour_code[0]?'Violent Motion Detection':eventType===bevaviour_code[1]?'Falling Down':'Fire and Smoke Detection',
                        time: eventData.logData.params.events[0].happenTime,
                        snap_shot: imageUrl, // Store the Cloudinary URL instead of base64
                        posted_to_intranet_date: eventData.timestamp,
                        posted_to_intranet_time: eventData.timestamp,
                     }
                     
                     // Create a separate object for logging to avoid modifying the original data
                     const logData = {
                        ...behaviourData,
                        snap_shot: imageUrl ? `[Cloudinary URL - ${imageUrl.length} chars]` : 'No image'
                     };
                     console.log("🚨 [BEHAVIOR DETECTION] Creating behavior alert record:", JSON.stringify(logData, null, 2));
                     console.log("🔗 [BEHAVIOR DETECTION] Actual URL being stored:", imageUrl);
                     
                     const newBehaviourAlert = await db.parks_behaviour_alerts.create({
                        data: behaviourData
                     });
                     
                     console.log("✅ [BEHAVIOR DETECTION] Record created with ID:", newBehaviourAlert.Id);
                  }
                 
             }
          }
         }
         console.log("✅ [EVENT HANDLER] Event processing completed successfully");
         console.log("🚀 [EVENT HANDLER] ==========================================");
         
         return {
            success: true,
            message: "Event processed successfully",
            data: eventData
         };

      } catch (error: any) {
         console.error("❌ [EVENT HANDLER] ==========================================");
         console.error("❌ [EVENT HANDLER] Error processing event:", error.message || error);
         console.error("❌ [EVENT HANDLER] Error stack:", error.stack);
         console.error("❌ [EVENT HANDLER] ==========================================");
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to process event");
      }
   }
}
export default EventHandlerService;
