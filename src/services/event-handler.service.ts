import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import db from "@/prisma/client";
import axios from "axios";
import https from "https";
import * as nodeCrypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

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
      try {
         
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            this.HIK_CONFIG.eventRecordsEndpoint,
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            { eventIndexCode }
         );
         
         return response;
      } catch (error: any) {
         throw error;
      }
   }

   private static async getImageData(picUri: string) {
      try {
         
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            this.HIK_CONFIG.imageDataEndpoint,
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            { picUri }
         );
         
         return response;
      } catch (error: any) {
         throw error;
      }
   }

   private static async uploadImageToCloudinary(base64Image: string, eventType: string, eventId: string): Promise<string> {
      try {
         
         const publicId = `${this.CLOUDINARY_CONFIG.folder}/${eventType}/${eventId}_${Date.now()}`;
         
         
         const result = await cloudinary.uploader.upload(base64Image, {
            public_id: publicId,
            resource_type: 'image',
            format: 'jpg',
            quality: 'auto',
            fetch_format: 'auto'
         });
         
         
         return result.secure_url;
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
         if (error.response) {
            throw new Error(`HikVision API Error: ${error.response.status} - ${error.response.statusText}`);
         } else {
            throw new Error(`Error: ${error.message}`);
         }
      }
   }

   public static handleEventService = async (eventData: any) => {
       try { 
         
         const office_cameras=['131','132','133','134','135','136']
         const park_cameras=['3','4','5','6','75','76','77','78','79','186','187','188','189','190','191','192','193']
         let intrusion_detection_code=131585
         let attendance_code=131659
         let bevaviour_code=[131596,131605,192515]
         
         
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
             
             const extractEventData = (data: any) => {
                if (data.logData?.event?.params?.events?.[0]) {
                   return data.logData.event.params.events[0];
                }
                else if (data.logData?.logData?.params?.events?.[0]) {
                   return data.logData.logData.params.events[0];
                }
                return null;
             };
             
             const eventInfo = extractEventData(eventData);
             if (!eventInfo) {
                throw new HttpException(STATUS.BAD_REQUEST, "Invalid event data structure");
             }
             
             let eventType = eventInfo.eventType
             
             if (eventType === intrusion_detection_code) {
             } else if (eventType === attendance_code) {
             } else if (bevaviour_code.includes(eventType)) {
             } else {
             }
             
             if(eventType===intrusion_detection_code){
                let park_Id;

                let parkcamera=await db.park_cameras.findFirst({
                   where:{
                      camera_Id: eventInfo.srcIndex
                   }
                })
                
                if(parkcamera){
                   park_Id=parkcamera.park_Id
                   let imageUrl = null;
                   
                   try {
                      const eventIndexCode = eventInfo.eventId;
                      
                      const eventRecordsResponse = await this.getEventRecords(eventIndexCode);
                      
                      if (eventRecordsResponse && eventRecordsResponse.code === '0' && eventRecordsResponse.data?.list?.length > 0) {
                         const eventRecord = eventRecordsResponse.data.list[0];
                         const eventPicUri = eventRecord.eventPicUri;
                         
                         
                         if (eventPicUri) {
                            const imageDataResponse = await this.getImageData(eventPicUri);
                            
                            if (imageDataResponse) {
                               // The response is directly the base64 string, not wrapped in a data object
                               const base64Image = imageDataResponse;
                               
                               // Upload to Cloudinary
                               imageUrl = await this.uploadImageToCloudinary(base64Image, 'intrusion', eventIndexCode);
                            }
                         }
                      }
                   } catch (imageError: any) {
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
                   
                   const logData = {
                      ...intrusionData,
                      snap_shot: imageUrl ? `[Cloudinary URL - ${imageUrl.length} chars]` : 'No image'
                   };
                   const new_intrusion_detection=await db.parks_intrusion_detection.create({
                      data: intrusionData
                   })
                }
                else{
                   return new HttpException(STATUS.NOT_FOUND, "Park camera not found")
                }
             }
             else if(eventType===attendance_code){
                const isOfficeCamera = office_cameras.includes(eventInfo.srcIndex)
                const isParkCamera = park_cameras.includes(eventInfo.srcIndex)
                
                
                if(isOfficeCamera){
                   const officeCamera = await db.offices_cameras.findFirst({
                      where: {
                         camera_Id: eventInfo.srcIndex
                      }
                   })
                   
                   if(officeCamera && officeCamera.office_Id){
                      const office_Id = officeCamera.office_Id
                      const isEntry = eventInfo.srcName === "ENTRY"
                      const isExit = eventInfo.srcName === "EXIT"
                      
                      let genderName = 'Unknown';
                      let isChild = false;
                      let person_Id = null;
                      
                      if (eventInfo.data?.alarmResult?.faces) {
                         const genderValue = eventInfo.data.alarmResult.faces.gender.value
                         const ageGroup = eventInfo.data.alarmResult.faces.age.ageGroup
                         genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                         isChild = ageGroup <= 2 // INFANT, KID, CHILD
                         
                         const similarity = eventInfo.data.alarmResult.faces.identify.candidate.similarity
                         const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id
                         
                         if (similarity !== 0 && humanId && humanId !== "-1") {
                            const user = await db.users.findFirst({
                               where: { emp_Id: humanId.toString() }
                            });
                            if (user) {
                               person_Id = user.Id;
                            } else {
                            }
                         }
                      } else {
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
                      
                     
                        const officeFootfallRecord = await db.offices_footfall_analysis.create({
                           data: officeFootfallData
                        })
                        
                      
                    
                      if(isEntry){
                         const officeAttendanceData = {
                            office_Id: office_Id,
                            person_Id: person_Id,
                            entry_time: eventInfo.happenTime
                         }
                         
                         const officeAttendanceRecord = await db.offices_attendance.create({
                            data: officeAttendanceData
                         })
                      } else if(isExit){
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
                            await db.offices_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventInfo.happenTime
                               }
                            })
                         } else {
                         }
                      }
                   }
                }
                else if(isParkCamera){
                   const parkCamera = await db.park_cameras.findFirst({
                      where: {
                         camera_Id: eventInfo.srcIndex
                      }
                   })
                   
                   if(parkCamera && parkCamera.park_Id){
                      const park_Id = parkCamera.park_Id
                      const isEntry = eventInfo.srcName === "ENTRY"
                      const isExit = eventInfo.srcName === "EXIT"
                      
                      const genderValue = eventInfo.data.alarmResult.faces.gender.value
                      const ageGroup = eventInfo.data.alarmResult.faces.age.ageGroup
                      const genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                      const isChild = ageGroup <= 2 // INFANT, KID, CHILD
                      
                      const similarity = eventInfo.data.alarmResult.faces.identify.candidate.similarity
                      const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id
                      
                      let person_Id = null; // Default fallback - use null for unknown persons
                      if (similarity !== 0 && humanId && humanId !== "-1") {
                         const user = await db.users.findFirst({
                            where: { emp_Id: humanId.toString() }
                         });
                         if (user) {
                            person_Id = user.Id;
                         } else {
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
                     
                        const parkFootfallRecord = await db.parks_footfall_analysis.create({
                           data: parkFootfallData
                        })
                        
                      
                      
                   
                      if(isEntry){
                         const parkAttendanceData = {
                            park_Id: park_Id,
                            person_Id: person_Id,
                            entry_time: eventInfo.happenTime
                         }
                         
                         const parkAttendanceRecord = await db.parks_attendance.create({
                            data: parkAttendanceData
                         })
                      } else if(isExit){
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
                            await db.parks_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventInfo.happenTime
                               }
                            })
                         } else {
                         }
                      }
                   }
                }
             }
             else if(bevaviour_code.includes(eventType)){
                
               const isParkCamera = park_cameras.includes(eventInfo.srcIndex)
               
               if(isParkCamera){
                  const parkCamera = await db.park_cameras.findFirst({
                     where: {
                        camera_Id: eventInfo.srcIndex
                     }
                  })
                  
                  if(parkCamera){
                     let imageUrl = null;
                     
                     try {
                        const eventIndexCode = eventInfo.eventId;
                        
                        const eventRecordsResponse = await this.getEventRecords(eventIndexCode);
                        
                        if (eventRecordsResponse && eventRecordsResponse.code === '0' && eventRecordsResponse.data?.list?.length > 0) {
                           const eventRecord = eventRecordsResponse.data.list[0];
                           const eventPicUri = eventRecord.eventPicUri;
                           
                           
                           if (eventPicUri) {
                              const imageDataResponse = await this.getImageData(eventPicUri);
                              
                              if (imageDataResponse) {
                                 // The response is directly the base64 string, not wrapped in a data object
                                 const base64Image = imageDataResponse;
                                 
                                 imageUrl = await this.uploadImageToCloudinary(base64Image, 'behavior', eventIndexCode);
                              } else {
                              }
                           } else {
                           }
                        } else {
                        }
                     } catch (imageError: any) {
                     }
      
                     const behaviourData = {
                        park_Id: parkCamera?.park_Id,
                        camera_Id: parkCamera?.Id,
                        detection_Id: eventInfo.eventId,
                        detection_code: eventType?.toString(),
                        detection_date: eventInfo.happenTime,
                        detection_time: eventInfo.happenTime,
                        person_Id: '',
                        detected_behaviour: eventType===bevaviour_code[0]?'Violent Motion Detection':eventType===bevaviour_code[1]?'Falling Down':'Fire and Smoke Detection',
                        snap_shot: imageUrl, // Store the Cloudinary URL instead of base64
                        is_employee: false,
                        description: `Behavior detected at ${eventInfo.srcName} camera`
                     }
                     
                     const logData = {
                        ...behaviourData,
                        snap_shot: imageUrl ? `[Cloudinary URL - ${imageUrl.length} chars]` : 'No image'
                     };
                     
                     const newBehaviourAlert = await db.parks_behaviour_alerts.create({
                        data: behaviourData
                     });
                     
                  }
                 
             }
          }
         }
         
         return {
            success: true,
            message: "Event processed successfully",
            data: eventData
         };

      } catch (error: any) {
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to process event");
      }
   }
}
export default EventHandlerService;
