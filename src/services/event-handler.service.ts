import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import db from "@/prisma/client";
import axios from "axios";
import https from "https";
import * as nodeCrypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import SocketService from "./socket.service";
import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
interface FaceRect {
  x: number;      
  y: number;      
  width: number;  
  height: number; 
}

async function cropFaceWithMargin(base64Image: string, faceRect: FaceRect): Promise<string> {
  try {
    const img = await loadImage(base64Image);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error("Canvas not supported");

    const imgWidth = img.width;
    const imgHeight = img.height;

    const expandX = faceRect.width * 0.4;
    const expandY = faceRect.height * 0.4;

    const newX = Math.max(0, faceRect.x - expandX);
    const newY = Math.max(0, faceRect.y - expandY);
    const newWidth = Math.min(1, faceRect.width * 1.8 - Math.max(0, expandX - faceRect.x));
    const newHeight = Math.min(1, faceRect.height * 1.8 - Math.max(0, expandY - faceRect.y));

    const cropX = newX * imgWidth;
    const cropY = newY * imgHeight;
    const cropW = newWidth * imgWidth;
    const cropH = newHeight * imgHeight;

    canvas.width = cropW;
    canvas.height = cropH;

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    return canvas.toDataURL("image/png");
  } catch (error) {
    return base64Image;
  }
}

class EventHandlerService {

   private static readonly HIK_CONFIG = {
      baseURL: 'https://10.70.90.183:443',
      appKey: '59315117',
      appSecret: 'YuWS8qCb61xbD8fEbwFJ',
      eventRecordsEndpoint: '/artemis/api/eventService/v1/eventRecords/page',
      imageDataEndpoint: '/artemis/api/eventService/v1/image_data',
   };

   private static readonly CLOUDINARY_CONFIG = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      folder: 'event-images'
   };

   private static readonly API_CONFIG = {
      baseUrl: process.env.API_BASE_URL ,
      emotionDetectionUrl: process.env.EMOTION_DETECTION_URL || 'http://127.0.0.1:8000/detect',
      localHostUrl: process.env.LOCAL_HOST_API 
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
      
      try {
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            this.HIK_CONFIG.eventRecordsEndpoint,
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            { eventIndexCode }
         );
         
         const duration = Date.now() - startTime;
        
         return response;
      } catch (error: any) {
         const duration = Date.now() - startTime;
         throw error;
      }
   }

   private static async getImageData(picUri: string) {
      const startTime = Date.now();
      
      try {
         const response = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            this.HIK_CONFIG.imageDataEndpoint,
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            { picUri }
         );
         
         const duration = Date.now() - startTime;
        
         return response;
      } catch (error: any) {
         const duration = Date.now() - startTime;
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
      const startTime = Date.now();
      
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
         
         const duration = Date.now() - startTime;
         
         return imageUrl;
      } catch (error: any) {
         const duration = Date.now() - startTime;
         throw error;
      }
   }

   private static async callHikVisionAPI(baseUrl: string, endpoint: string, appKey: string, appSecret: string, requestData: any) {
      const startTime = Date.now();

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

         const duration = Date.now() - startTime;
         return response.data;
      } catch (error: any) {
         const duration = Date.now() - startTime;
         
         if (error.response) {
            const errorMsg = `HikVision API Error: ${error.response.status} - ${error.response.statusText}`;
            throw new Error(errorMsg);
         } else {
            const errorMsg = `Error: ${error.message}`;
            throw new Error(errorMsg);
         }
      }
   }

  public static handleEventService = async (eventData: any) => {
      const startTime = Date.now(); 
      let imageUrl: string | null = null;
      
      try { 
        const office_cameras = await this.getOfficeCameraIds();
        const park_cameras = await this.getParkCameraIds();
         let intrusion_detection_code=131585
         let attendance_code=131659
         let bevaviour_code=[131593,131605,131592,131677,131596,192515]

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
                if (data.event?.params?.events?.[0]) {
                   return data.event.params.events[0];
                }
                
               
                let currentLevel = data.logData;
                let depth = 0;
                const maxDepth = 10; 
                
                while (currentLevel && depth < maxDepth) {
                   if (currentLevel.params?.events?.[0]) {
                      return currentLevel.params.events[0];
                   }
                   
                  
                   if (currentLevel.logData) {
                      currentLevel = currentLevel.logData;
                      depth++;
                   } else {
                      break;
                   }
                }
                
               
                if (data.logData?.event?.params?.events?.[0]) {
                   return data.logData.event.params.events[0];
                }
               
                return null;
             };
             
             const eventInfo = extractEventData(eventData);
             if (!eventInfo) {
                throw new HttpException(STATUS.BAD_REQUEST, "Invalid event data structure");
             }
             
            
             let sendTime = null;
             if (eventData.event?.params?.sendTime) {
                sendTime = eventData.event.params.sendTime;
             } else if (eventData.logData?.event?.params?.sendTime) {
                sendTime = eventData.logData.event.params.sendTime;
             } else {
                sendTime = eventInfo.happenTime;
             }
             
             eventInfo.sendTime = sendTime;
             
             let eventType = eventInfo.eventType 
             
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
                               const base64Image = imageDataResponse;
                               
                               imageUrl = await this.saveImageLocally(base64Image, 'intrusion', eventIndexCode);
                            }
                         } else {
                         }
                      } else {
                      }
                   } catch (imageError: any) {
                   }

                   const intrusionData = {
                      park_Id:park_Id,
                      camera_Id:parkcamera.Id,
                      occurrence_date:eventInfo.sendTime,
                      occurrence_time:eventInfo.sendTime,
                      snap_shot:imageUrl,
                      detection_Id:eventInfo.eventId,
                      detection_date:eventInfo.sendTime,
                      detection_time:eventInfo.sendTime,
                      is_employee:false,
                      description: `Intrusion detected at ${eventInfo.srcName} camera`
                   }
                
                   const existingIntrusion = await db.parks_intrusion_detection.findFirst({
                      where: {
                         detection_Id: intrusionData.detection_Id
                      }
                   });
                   
                   if (existingIntrusion) {
                      return;
                   }
                   
                   const new_intrusion_detection=await db.parks_intrusion_detection.create({
                      data: intrusionData
                   })
                   

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
                      } else {
                      }

                   } catch (historyError: any) {
                   }
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
                      const isEntry = eventInfo.srcName.toLowerCase().includes("entry") || eventInfo.srcName.toLowerCase().includes("test")
                      const isExit = eventInfo.srcName.toLowerCase().includes("exit")
                      
                      let genderName = 'Unknown';
                      let genderValue = 0;
                      let isChild = false;
                      let person_Id = null;
                      let faceData = null;
                     let ageGroup = null;
                      
                      if (eventInfo.data?.alarmResult?.faces) {
                         genderValue = eventInfo.data.alarmResult.faces.gender.value
                         ageGroup = eventInfo.data.alarmResult.faces.age.ageGroup
                         genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                         isChild = ageGroup <= 2 
                         
                         const similarity = eventInfo.data.alarmResult.faces.identify.candidate.similarity
                         const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id
                         
                         if (humanId) {
                            const user = await db.users.findFirst({
                               where: { unique_id: humanId.toString() }
                            });
                            if (user) {
                              if(user.isDeleted&&user.linked_with_user_Id)
                               person_Id = user.linked_with_user_Id;
                              else{
                               person_Id = user.Id;

                              }
                              
                            } else {
                              
                               try {
                                  let faceData = null;
                                  if(eventInfo.data?.alarmResult?.faces?.URL){
                                     faceData = eventInfo.data.alarmResult.faces.URL;
                                     
                                  }
                                  let faceRect = null;
                                  if (eventInfo.data?.alarmResult?.faces?.URL) {
                                     faceData = eventInfo.data.alarmResult.faces.URL;
                                     
                                     } else {
                                  }
                                  
                                  if (eventInfo.data?.alarmResult?.faces?.faceRect) {
                                     faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                     
                                  }
                                  
                                  const orgIndexCode = await this.getOrgIndexCodeForGuest(null, true);
                                  const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData, faceRect, orgIndexCode);
                                  person_Id = guestUser.Id;
                                 
                               } catch (guestError: any) {
                                 
                               }
                            }
                         } else {
                          
                            
                            try {
                               let faceData = null;
                               let faceRect = null;
                               if (eventInfo.data?.alarmResult?.faces?.URL) {
                                  faceData = eventInfo.data.alarmResult.faces.URL;
                                  
                                  } else {
                               }
                               
                               if (eventInfo.data?.alarmResult?.faces?.faceRect) {
                                  faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                  
                               }
                               
                               const orgIndexCode = await this.getOrgIndexCodeForGuest(null, true);
                               const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData, faceRect, orgIndexCode);
                                  person_Id = guestUser.Id;
                               
                               } catch (guestError: any) {
                                
                             }
                         }
                      } else {
                      }
                      
                      let officeFootfallImage = null;
                      if (eventInfo.data?.alarmResult?.faces?.URL) {
                         try {
                            const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                            const imageDataResponse = await this.getImageData(faceDataUrl);
                            
                            if (imageDataResponse) {
                               const base64Image = imageDataResponse;
                               const dataUrl = `data:image/jpeg;base64,${base64Image}`;
                               
                               officeFootfallImage = await this.saveImageLocally(dataUrl, 'office-footfall', eventInfo.eventId);
                            }
                         } catch (imageError: any) {
                         }
                      }
                      const officeFootfallData = {
                         office_Id: office_Id,
                         detection_Id: eventInfo.eventId,
                         person_Id: person_Id,
                         gender: genderName,
                         is_child: isChild,
                         time: eventInfo.sendTime,
                         detected_camera_Id: eventInfo.srcIndex,
                         detected_camera_name: eventInfo.srcName,
                         image: officeFootfallImage,
                         age_group: ageGroup,
                      }
                      
                     
                      
                      if(isEntry){
                       
                      
                        const officeFootfallRecord = await db.offices_footfall_analysis.create({
                           data: officeFootfallData
                        })
                        

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
                                 image: user.image ? `${this.API_CONFIG.baseUrl}${user.image}` : null
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
                         
                      }

                      let sentimentImageUrl = null;
                      let detectedSentiment = 'neutral'; 
                      let base64Image = null;
                      
                      if (eventInfo.data?.alarmResult?.faces?.URL) {
                         try {
                            const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                            const imageDataResponse = await this.getImageData(faceDataUrl);
                            
                            if (imageDataResponse) {
                               base64Image = imageDataResponse;
                               
                               if (!imageUrl) {
                                  imageUrl = await this.saveImageLocally(base64Image, 'sentiment', eventInfo.eventId);
                               } else {
                               }
                               sentimentImageUrl = imageUrl;
                               
                               if (sentimentImageUrl) {
                                  try {
                                     const fullImageUrl = `${this.API_CONFIG.localHostUrl}${sentimentImageUrl}`;
                                     const emotionResponse = await axios.post(this.API_CONFIG.emotionDetectionUrl, {
                                        image_url: fullImageUrl
                                     }, {
                                        timeout: 10000,
                                        headers: { 'Content-Type': 'application/json' }
                                     });
                                     
                                     if (emotionResponse.data?.success && emotionResponse.data?.dominant_face) {
                                        detectedSentiment = emotionResponse.data.dominant_face.primary_emotion;
                                       
                                     } else {
                                     }
                                  } catch (emotionError: any) {
                                     if (emotionError.code === 'ECONNREFUSED') {
                                     } else if (emotionError.code === 'ETIMEDOUT') {
                                     } else {
                                       
                                     }
                                  }
                               }
                            }
                         } catch (imageError: any) {
                         }
                      }

                      if (person_Id && sentimentImageUrl) {
                         try {
                            const user = await db.users.findUnique({
                               where: { Id: person_Id },
                               select: { user_Id: true, emp_Id: true, image: true }
                            });
                            
                            if (user) {
                               const isGuest = (!user.user_Id || user.user_Id.trim() === '') && 
                                             (!user.emp_Id || user.emp_Id.trim() === '');
                               
                               if (isGuest && (!user.image || user.image.trim() === '')) {
                                  let guestImageUrl = null;
                                  
                                  if (eventInfo.data?.alarmResult?.faces?.faceRect && base64Image) {
                                     try {
                                        const faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                        const croppedImage = await cropFaceWithMargin(base64Image, faceRect);
                                        guestImageUrl = await this.saveImageLocally(croppedImage, 'guest-users', person_Id.toString());
                                     } catch (cropError: any) {
                                        guestImageUrl = sentimentImageUrl;
                                     }
                                  } else {
                                     guestImageUrl = sentimentImageUrl;
                                  }
                                  
                                  if (guestImageUrl) {
                                     await db.users.update({
                                        where: { Id: person_Id },
                                        data: { image: guestImageUrl }
                                     });
                                  }
                               }
                            }
                         } catch (updateError: any) {
                         }
                      }

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
                            
                            const isEmployee = (user.emp_Id && user.emp_Id.trim() !== '') ||
                                             (user.emp_code && user.emp_code.trim() !== '') ||
                             user.is_attendance_user === true;
                            sentimentOf = isEmployee ? 'employee' : 'visitor';
                            
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
                         check_in_date: isEntry ? eventInfo.sendTime: null,
                         check_in_time: isEntry ?eventInfo.sendTime : null,
                         check_in_sentiment: isEntry ? detectedSentiment : null,
                         entry_camera_Id: isEntry ? officeCamera.Id : null,
                         check_out_date: isExit ? eventInfo.sendTime : null,
                         check_out_time: isExit ? eventInfo.sendTime : null,
                         check_out_capture: isExit ? sentimentImageUrl : null,
                         check_out_sentiment: isExit ? detectedSentiment : null,
                         exit_camera_Id: isExit ? officeCamera.Id : null,
                         age_group: ageGroup,
                      }
                    
                      if(isEntry){
                         
                         const officeSentimentRecord = await db.offices_sentiment_analysis.create({
                            data: officeSentimentData
                         });
                         
                         
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
                                  user: userDetails, 
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
                         }
                      } else if(isExit){
                         
                         let exitSentimentImageUrl = null;
                         let exitDetectedSentiment = 'neutral'; 
                         let base64Image = null;
                         
                         if (eventInfo.data?.alarmResult?.faces?.URL) {
                            try {
                               const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                               const imageDataResponse = await this.getImageData(faceDataUrl);
                               
                               if (imageDataResponse) {
                                  base64Image = imageDataResponse;
                                  
                                  if (!imageUrl) {
                                     imageUrl = await this.saveImageLocally(base64Image, 'sentiment', eventInfo.eventId);
                                  } else {
                                  }
                                  exitSentimentImageUrl = imageUrl;
                                  
                                  if (exitSentimentImageUrl) {
                                     try {
                                        const fullImageUrl = `${this.API_CONFIG.localHostUrl}${exitSentimentImageUrl}`;
                                        const emotionResponse = await axios.post(this.API_CONFIG.emotionDetectionUrl, {
                                           image_url: fullImageUrl
                                        }, {
                                           timeout: 10000,
                                           headers: { 'Content-Type': 'application/json' }
                                        });
                                        
                                        if (emotionResponse.data?.success && emotionResponse.data?.dominant_face) {
                                           exitDetectedSentiment = emotionResponse.data.dominant_face.primary_emotion;
                                           
                                        } else {
                                        }
                                     } catch (emotionError: any) {
                                        if (emotionError.code === 'ECONNREFUSED') {
                                        } else if (emotionError.code === 'ETIMEDOUT') {
                                        } else {
                                          
                                        }
                                     }
                                  }
                               }
                            } catch (imageError: any) {
                            }
                         }
                         
                         if (person_Id && exitSentimentImageUrl) {
                            try {
                               const user = await db.users.findUnique({
                                  where: { Id: person_Id },
                                  select: { user_Id: true, emp_Id: true, image: true }
                               });
                               
                               if (user) {
                                  const isGuest = (!user.user_Id || user.user_Id.trim() === '') && 
                                                (!user.emp_Id || user.emp_Id.trim() === '');
                                  
                                  if (isGuest && (!user.image || user.image.trim() === '')) {
                                     let guestImageUrl = null;
                                     
                                     if (eventInfo.data?.alarmResult?.faces?.faceRect && base64Image) {
                                        try {
                                           const faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                           const croppedImage = await cropFaceWithMargin(base64Image, faceRect);
                                           guestImageUrl = await this.saveImageLocally(croppedImage, 'guest-users', person_Id.toString());
                                        } catch (cropError: any) {
                                           guestImageUrl = exitSentimentImageUrl;
                                        }
                                     } else {
                                        guestImageUrl = exitSentimentImageUrl;
                                     }
                                     
                                     if (guestImageUrl) {
                                        await db.users.update({
                                           where: { Id: person_Id },
                                           data: { image: guestImageUrl }
                                        });
                                     }
                                  }
                               }
                            } catch (updateError: any) {
                            }
                         }
                         
                         let searchPersonId = person_Id;
                        
                         
                         if (!searchPersonId && eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id) {
                            const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id;
                            
                            if (humanId && humanId !== "-1") {
                               const user = await db.users.findFirst({
                                  where: { unique_id: humanId.toString() },
                                  select: { Id: true, user_Id: true, emp_Id: true, image: true, isDeleted: true, linked_with_user_Id: true }
                               });
                               
                              
                               
                               if (user) {
                                  if(user.isDeleted&&user.linked_with_user_Id)
                                   searchPersonId = user.linked_with_user_Id;
                                  else{
                                   searchPersonId = user.Id;
                                  }
                                  
                                  if (exitSentimentImageUrl) {
                                     try {
                                        const isGuest = (!user.user_Id || user.user_Id.trim() === '') && 
                                                      (!user.emp_Id || user.emp_Id.trim() === '');
                                        
                                        if (isGuest && (!user.image || user.image.trim() === '')) {
                                           let guestImageUrl = null;
                                           
                                           if (eventInfo.data?.alarmResult?.faces?.faceRect && base64Image) {
                                              try {
                                                 const faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                                 const croppedImage = await cropFaceWithMargin(base64Image, faceRect);
                                                 guestImageUrl = await this.saveImageLocally(croppedImage, 'guest-users', user.Id.toString());
                                              } catch (cropError: any) {
                                                 guestImageUrl = exitSentimentImageUrl;
                                              }
                                           } else {
                                              guestImageUrl = exitSentimentImageUrl;
                                           }
                                           
                                           if (guestImageUrl) {
                                              await db.users.update({
                                                 where: { Id: user.Id },
                                                 data: { image: guestImageUrl }
                                              });
                                           }
                                        }
                                     } catch (updateError: any) {
                                     }
                                  }
                               }
                            }
                         }
                         
                         if (!searchPersonId) {
                            return;
                         }
                         
                         const latestSentiment = await db.offices_sentiment_analysis.findFirst({
                            where: {
                               office_Id: office_Id,
                               person_Id: searchPersonId.toString(),
                               check_out_capture: null 
                            },
                            orderBy: {
                               check_in_date: 'desc'
                            }
                         });

                       
                         if (!latestSentiment) {
                            const allSentimentRecords = await db.offices_sentiment_analysis.findMany({
                               where: {
                                  office_Id: office_Id,
                                  person_Id: searchPersonId.toString()
                               },
                               orderBy: {
                                  check_in_date: 'desc'
                               },
                               take: 5
                            });
                            
                           
                         }
                         
                         if(latestSentiment){
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
                                     user: userDetails, 
                                     offices_cameras_offices_sentiment_analysis_entry_camera_IdTooffices_cameras: entryCameraDetails,
                                     offices_cameras_offices_sentiment_analysis_exit_camera_IdTooffices_cameras: {
                                        camera_english_name: officeCamera.camera_english_name,
                                        camera_arabic_name: officeCamera.camera_arabic_name,
                                        ip_address: officeCamera.ip_address
                                     }
                                  }
                               });
                            } catch (socketError) {
                            }
                         } else {
                          
                         }
                         
                         try {
                            
                            const latestQMSRecord = await db.qms_history.findFirst({
                               where: {
                                  visitor_id: searchPersonId,
                                  status: 'Active'
                               },
                               orderBy: {
                                  createdAt: 'desc'
                               }
                            });
                            
                            if (latestQMSRecord) {
                               
                               await db.qms_history.update({
                                  where: { visit_id: latestQMSRecord.visit_id },
                                  data: {
                                     exit_image: exitSentimentImageUrl,
                                     exit_camera: officeSentimentData.exit_camera_Id?.toString() || null,
                                     exit_mode: exitDetectedSentiment,
                                     exit_date: officeSentimentData.check_out_date,
                                     exit_time: officeSentimentData.check_out_time,
                                     status: 'Completed',
                                     updatedAt: new Date()
                                  }
                               });
                               
                            } else {
                            }
                         } catch (qmsError: any) {
                         }
                      }
                      
                      if(isEntry){
                         const isGuest = await this.isGuestUser(person_Id);
                         
                         if (isGuest) {
                           
                         } else {
                         
                         let entryImageUrl = null;
                         if (eventInfo.data?.alarmResult?.faces?.URL) {
                            try {
                               const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                               const imageDataResponse = await this.getImageData(faceDataUrl);
                               
                               if (imageDataResponse) {
                                  const base64Image = imageDataResponse;
                                  if (!imageUrl) {
                                     imageUrl = await this.saveImageLocally(base64Image, 'attendance', eventInfo.eventId);
                                  } else {
                                  }
                                  entryImageUrl = imageUrl;
                               }
                            } catch (imageError: any) {
                            }
                         }
                         
                         const officeAttendanceData = {
                            office_Id: office_Id,
                            person_Id: person_Id,
                            entry_time: eventInfo.sendTime,
                            entry_image: entryImageUrl,
                            age_group: ageGroup,
                            gender: genderValue,
                         }
                         
                         const officeAttendanceRecord = await db.offices_attendance.create({
                            data: officeAttendanceData
                         })
                         

                         try {
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
                                  formattedEntryTime: formatTimeToString(officeAttendanceRecord.entry_time),
                                  formattedDate: formatDateForDisplay(formatDateToString(officeAttendanceRecord.entry_time || officeAttendanceRecord.createdAt)),
                                  rawDate: formatDateToString(officeAttendanceRecord.entry_time || officeAttendanceRecord.createdAt),
                                  entry_image: officeAttendanceRecord.entry_image ? `${this.API_CONFIG.baseUrl}${officeAttendanceRecord.entry_image}` : null,
                                  exit_image: officeAttendanceRecord.exit_image ? `${this.API_CONFIG.baseUrl}${officeAttendanceRecord.exit_image}` : null,
                                  createdAt: new Date(),
                                  updatedAt: new Date()
                               }
                            };


                            SocketService.emitOfficeAttendanceUpdate(socketData);
                         } catch (socketError: any) {
                         }
                            
                            try {
                               const user = await db.users.findUnique({
                                  where: { Id: person_Id },
                                  select: { user_Id: true }
                               });
                               
                               if (user && user.user_Id) {
                                  const secretKey = await this.fetchSecretFromAPI();
                                  
                                  const employeeEntryPayload = {
                                     SecretKey: secretKey,
                                     Lang: "en",
                                     UserID: user.user_Id,
                                     Type: "1"
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
                                  
                                  
                               } else {
                               }
                            } catch (employeeApiError: any) {
                            }
                         }
                      } else if(isExit){
                        
                         
                         let searchPersonId = person_Id;
                         if (!searchPersonId && eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id) {
                            const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id;
                            if (humanId && humanId !== "-1") {
                               const user = await db.users.findFirst({
                                  where: { unique_id: humanId.toString() },
                                  select: { Id: true, user_Id: true, emp_Id: true, image: true, isDeleted: true, linked_with_user_Id: true }
                               });
                               if (user) {
                                  if(user.isDeleted&&user.linked_with_user_Id)
                                   searchPersonId = user.linked_with_user_Id;
                                  else{
                                   searchPersonId = user.Id;
                                  }
                               }
                            }
                         }
                         
                         if (!searchPersonId) {
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
                            const isGuest = await this.isGuestUser(searchPersonId);
                            
                            if (isGuest) {
                               
                            } else {
                            
                            let exitImageUrl = null;
                            if (eventInfo.data?.alarmResult?.faces?.URL) {
                               try {
                                  const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                                  const imageDataResponse = await this.getImageData(faceDataUrl);
                                  
                                  if (imageDataResponse) {
                                     const base64Image = imageDataResponse;
                                     if (!imageUrl) {
                                        imageUrl = await this.saveImageLocally(base64Image, 'attendance', eventInfo.eventId);
                                     } else {
                                     }
                                     exitImageUrl = imageUrl;
                                  }
                               } catch (imageError: any) {
                               }
                            }
                            
                            const updatedAttendanceRecord = await db.offices_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventInfo.sendTime,
                                  exit_image: exitImageUrl
                               }
                            })

                            try {
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
                                     formattedEntryTime: formatTimeToString(updatedAttendanceRecord.entry_time),
                                     formattedExitTime: formatTimeToString(updatedAttendanceRecord.exit_time),
                                     formattedDate: formatDateForDisplay(formatDateToString(updatedAttendanceRecord.entry_time || updatedAttendanceRecord.createdAt)),
                                     rawDate: formatDateToString(updatedAttendanceRecord.entry_time || updatedAttendanceRecord.createdAt),
                                     entry_image: updatedAttendanceRecord.entry_image ? `${this.API_CONFIG.baseUrl}${updatedAttendanceRecord.entry_image}` : null,
                                     exit_image: updatedAttendanceRecord.exit_image ? `${this.API_CONFIG.baseUrl}${updatedAttendanceRecord.exit_image}` : null,
                                     createdAt: new Date(),
                                     updatedAt: new Date()
                                  }
                               };


                               SocketService.emitOfficeAttendanceUpdate(socketData);
                            } catch (socketError: any) {
                            }
                               
                               try {
                                  const user = await db.users.findUnique({
                                     where: { Id: searchPersonId },
                                     select: { user_Id: true }
                                  });
                                  
                                  if (user && user.user_Id) {
                                     const secretKey = await this.fetchSecretFromAPI();
                                     
                                     const employeeExitPayload = {
                                        SecretKey: secretKey,
                                        Lang: "en",
                                        UserID: user.user_Id,
                                        Type: "2"
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
                                     
                                    
                         } else {
                                  }
                               } catch (employeeApiError: any) {
                               }
                            }
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
                      const isEntry = eventInfo.srcName.toLowerCase().includes("entry")
                      const isExit = eventInfo.srcName.toLowerCase().includes("exit")
                     
                      
                      const genderValue = eventInfo.data.alarmResult.faces.gender.value
                      let ageGroup = eventInfo.data.alarmResult.faces.age.ageGroup
                      const genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                      const isChild = ageGroup <= 2 
                      
                      const similarity = eventInfo.data.alarmResult.faces.identify.candidate.similarity
                      const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id
                      let faceData = null;
                      
                      
                      
                      let person_Id = null; 
                      if (humanId && similarity !== null && similarity !== undefined) {
                         const user = await db.users.findFirst({
                            where: { unique_id: humanId.toString() },
                            select: { Id: true, user_Id: true, emp_Id: true, image: true, isDeleted: true, linked_with_user_Id: true }
                         });
                         if (user) {
                            if(user.isDeleted&&user.linked_with_user_Id)
                             person_Id = user.linked_with_user_Id;
                            else{
                             person_Id = user.Id;
                            }
                           
                         } else {
                           
                            
                            try {
                               let faceData = null;
                               let faceRect = null;
                               if (eventInfo.data?.alarmResult?.faces?.URL) {
                                  faceData = eventInfo.data.alarmResult.faces.URL;
                                  
                                  } else {
                               }
                               
                               if (eventInfo.data?.alarmResult?.faces?.faceRect) {
                                  faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                  
                               }
                               
                               const orgIndexCode = await this.getOrgIndexCodeForGuest(park_Id, false);
                               const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData, faceRect, orgIndexCode);
                               person_Id = guestUser.Id;
                               
                              
                            } catch (guestError: any) {
                               
                            }
                         }
                      } else {
                         
                         try {
                            let faceData = null;
                            if (eventInfo.data?.alarmResult?.faces?.URL) {
                               faceData = eventInfo.data.alarmResult.faces.URL;
                               
                               } else {
                            }
                            
                            const orgIndexCode = await this.getOrgIndexCodeForGuest(park_Id, false);
                            const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData, undefined, orgIndexCode);
                               person_Id = guestUser.Id;
                            
                           
                            } catch (guestError: any) {
                             
                         }
                      }
                      
                      let parkFootfallImage = null;
                      if (eventInfo.data?.alarmResult?.faces?.URL) {
                         try {
                            const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                            const imageDataResponse = await this.getImageData(faceDataUrl);
                            
                            if (imageDataResponse) {
                               const base64Image = imageDataResponse;
                               const dataUrl = `data:image/jpeg;base64,${base64Image}`;
                               
                               parkFootfallImage = await this.saveImageLocally(dataUrl, 'park-footfall', eventInfo.eventId);
                            }
                         } catch (imageError: any) {
                         }
                      }
                      const parkFootfallData = {
                         park_Id: park_Id,
                         detection_Id: eventInfo.eventId,
                         person_Id: person_Id,
                         gender: genderName,
                         is_child: isChild,
                         time: eventInfo.sendTime,
                         detected_camera_Id: eventInfo.srcIndex,
                         detected_camera_name: eventInfo.srcName,
                         image: parkFootfallImage,
                         age_group: ageGroup,
                      }
                      
                      if(isEntry){
                       
                        const parkFootfallRecord = await db.parks_footfall_analysis.create({
                           data: parkFootfallData
                        })
                        try {
                           const userDetails = parkFootfallRecord.person_Id ? await db.users.findUnique({
                              where: { Id: parkFootfallRecord.person_Id },
                              select: {
                                 Id: true,
                                 emp__eng_name: true,
                                 emp__arabic_name: true,
                                 emp_Id: true,
                                 user_Id: true,
                                 is_attendance_user: true,
                                 image: true
                              }
                           }) : null;

                           if (userDetails && userDetails.image) {
                              userDetails.image = `${this.API_CONFIG.baseUrl}${userDetails.image}`;
                           }

                           const parkDetails = parkFootfallRecord.park_Id ? await db.parks.findUnique({
                              where: { Id: parkFootfallRecord.park_Id },
                              select: {
                                 Id: true,
                                 park_english_name: true,
                                 park_arabic_name: true
                              }
                           }) : null;

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
                        }
                      } else {
                      }

                      let sentimentImageUrl = null;
                      let detectedSentiment = 'neutral'; 
                      let base64Image = null;
                      
                      if (eventInfo.data?.alarmResult?.faces?.URL) {
                         try {
                            const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                            const imageDataResponse = await this.getImageData(faceDataUrl);
                            
                            if (imageDataResponse) {
                               base64Image = imageDataResponse;
                               
                               if (!imageUrl) {
                                  imageUrl = await this.saveImageLocally(base64Image, 'sentiment', eventInfo.eventId);
                               } else {
                               }
                               sentimentImageUrl = imageUrl;
                               
                               if (sentimentImageUrl) {
                                  try {
                                     const fullImageUrl = `${this.API_CONFIG.localHostUrl}${sentimentImageUrl}`;
                                     const emotionResponse = await axios.post(this.API_CONFIG.emotionDetectionUrl, {
                                        image_url: fullImageUrl
                                     }, {
                                        timeout: 10000,
                                        headers: { 'Content-Type': 'application/json' }
                                     });
                                     
                                     if (emotionResponse.data?.success && emotionResponse.data?.dominant_face) {
                                        detectedSentiment = emotionResponse.data.dominant_face.primary_emotion;
                                       
                                     } else {
                                       
                                     }
                                  } catch (emotionError: any) {
                                     if (emotionError.code === 'ECONNREFUSED') {
                                       
                                     } else if (emotionError.code === 'ETIMEDOUT') {
                                       
                                     } else {
                                       
                                     }
                                  }
                               }
                            }
                         } catch (imageError: any) {
                           
                         }
                      }

                      if (person_Id && sentimentImageUrl) {
                         try {
                            const user = await db.users.findUnique({
                               where: { Id: person_Id },
                               select: { user_Id: true, emp_Id: true, image: true }
                            });
                            
                            if (user) {
                               const isGuest = (!user.user_Id || user.user_Id.trim() === '') && 
                                             (!user.emp_Id || user.emp_Id.trim() === '');
                               
                               if (isGuest && (!user.image || user.image.trim() === '')) {
                                  let guestImageUrl = null;
                                  
                                  if (eventInfo.data?.alarmResult?.faces?.faceRect && base64Image) {
                                     try {
                                        const faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                        const croppedImage = await cropFaceWithMargin(base64Image, faceRect);
                                        guestImageUrl = await this.saveImageLocally(croppedImage, 'guest-users', person_Id.toString());
                                     } catch (cropError: any) {
                                        guestImageUrl = sentimentImageUrl;
                                     }
                                  } else {
                                     guestImageUrl = sentimentImageUrl;
                                  }
                                  
                                  if (guestImageUrl) {
                                     await db.users.update({
                                        where: { Id: person_Id },
                                        data: { image: guestImageUrl }
                                     });
                                  }
                               }
                            }
                         } catch (updateError: any) {
                         }
                      }

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
                            
                            const isEmployee = (user.emp_Id && user.emp_Id.trim() !== '') ||
                                             (user.emp_code && user.emp_code.trim() !== '') ||
                                             user.is_attendance_user === true;
                            sentimentOf = isEmployee ? 'employee' : 'visitor';
                            
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
                            
                           
                         }
                      }

                      const parkSentimentData = {
                         park_Id: park_Id,
                         person_Id: person_Id?.toString() || null,
                         detection_Id: eventInfo.eventId,
                         person_name: personName,
                         person_image: personImage,
                         gender: genderName, 
                         age_group: ageGroup,
                         check_in_image: isEntry ? sentimentImageUrl : null,
                         sentiment_of: sentimentOf as 'employee' | 'visitor',
                         check_in_date: isEntry ? eventInfo.sendTime: null,
                         check_in_time: isEntry ? eventInfo.sendTime: null,
                         check_in_sentiment: isEntry ? detectedSentiment : null,
                         entry_camera_Id: isEntry ? parkCamera.Id : null,
                         check_out_date: isExit ? eventInfo.sendTime: null,
                         check_out_time: isExit ? eventInfo.sendTime : null,
                         check_out_capture: isExit ? sentimentImageUrl : null,
                         check_out_sentiment: isExit ? detectedSentiment : null,
                         exit_camera_Id: isExit ? parkCamera.Id : null,
                       
                      }
                   
                      if(isEntry){
                        
                         
                         const parkSentimentRecord = await db.parks_sentiment_analysis.create({
                            data: parkSentimentData
                         });
                         
                         
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
                                  user: userDetails, 
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
                           
                         }
                      } else if(isExit){
                        
                         
                         let exitSentimentImageUrl = null;
                         let exitDetectedSentiment = 'neutral'; 
                         
                         if (eventInfo.data?.alarmResult?.faces?.URL) {
                            try {
                              
                               const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                               const imageDataResponse = await this.getImageData(faceDataUrl);
                               
                               if (imageDataResponse) {
                                  const base64Image = imageDataResponse;
                                  
                                  if (!imageUrl) {
                                     imageUrl = await this.saveImageLocally(base64Image, 'sentiment', eventInfo.eventId);
                                  } else {
                                  }
                                  exitSentimentImageUrl = imageUrl;
                                  
                                  if (exitSentimentImageUrl) {
                                     try {
                                        const fullImageUrl = `${this.API_CONFIG.localHostUrl}${exitSentimentImageUrl}`;
                                        const emotionResponse = await axios.post(this.API_CONFIG.emotionDetectionUrl, {
                                           image_url: fullImageUrl
                                        }, {
                                           timeout: 10000,
                                           headers: { 'Content-Type': 'application/json' }
                                        });
                                        
                                        if (emotionResponse.data?.success && emotionResponse.data?.dominant_face) {
                                           exitDetectedSentiment = emotionResponse.data.dominant_face.primary_emotion;

                                        } else {
                                        }
                                     } catch (emotionError: any) {
                                        if (emotionError.code === 'ECONNREFUSED') {
                                        } else if (emotionError.code === 'ETIMEDOUT') {
                                        } else {
                                          
                                        }
                                     }
                                  }
                               }
                            } catch (imageError: any) {
                            }
                         }
                         
                         if (person_Id && exitSentimentImageUrl) {
                            try {
                               const user = await db.users.findUnique({
                                  where: { Id: person_Id },
                                  select: { user_Id: true, emp_Id: true, image: true }
                               });
                               
                               if (user) {
                                  const isGuest = (!user.user_Id || user.user_Id.trim() === '') && 
                                                (!user.emp_Id || user.emp_Id.trim() === '');
                                  
                                  if (isGuest && (!user.image || user.image.trim() === '')) {
                                     let guestImageUrl = null;
                                     
                                     if (eventInfo.data?.alarmResult?.faces?.faceRect && base64Image) {
                                        try {
                                           const faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                           const croppedImage = await cropFaceWithMargin(base64Image, faceRect);
                                           guestImageUrl = await this.saveImageLocally(croppedImage, 'guest-users', person_Id.toString());
                                        } catch (cropError: any) {
                                           guestImageUrl = exitSentimentImageUrl;
                                        }
                                     } else {
                                        guestImageUrl = exitSentimentImageUrl;
                                     }
                                     
                                     if (guestImageUrl) {
                                        await db.users.update({
                                           where: { Id: person_Id },
                                           data: { image: guestImageUrl }
                                        });
                                     }
                                  }
                               }
                            } catch (updateError: any) {
                            }
                         }
                         
                         let searchPersonId = person_Id;
                         if (!searchPersonId && eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id) {
                            const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id;
                            if (humanId && humanId !== "-1") {
                               const user = await db.users.findFirst({
                                  where: { unique_id: humanId.toString() },
                                  select: { Id: true, user_Id: true, emp_Id: true, image: true, isDeleted: true, linked_with_user_Id: true }
                               });
                               if (user) {
                                  if(user.isDeleted&&user.linked_with_user_Id)
                                   searchPersonId = user.linked_with_user_Id;
                                  else{
                                   searchPersonId = user.Id;
                                  }
                                  
                                  if (exitSentimentImageUrl) {
                                     try {
                                        const isGuest = (!user.user_Id || user.user_Id.trim() === '') && 
                                                      (!user.emp_Id || user.emp_Id.trim() === '');
                                        
                                        if (isGuest && (!user.image || user.image.trim() === '')) {
                                           let guestImageUrl = null;
                                           
                                           if (eventInfo.data?.alarmResult?.faces?.faceRect && base64Image) {
                                              try {
                                                 const faceRect = eventInfo.data.alarmResult.faces.faceRect;
                                                 const croppedImage = await cropFaceWithMargin(base64Image, faceRect);
                                                 guestImageUrl = await this.saveImageLocally(croppedImage, 'guest-users', user.Id.toString());
                                              } catch (cropError: any) {
                                                 guestImageUrl = exitSentimentImageUrl;
                                              }
                                           } else {
                                              guestImageUrl = exitSentimentImageUrl;
                                           }
                                           
                                           if (guestImageUrl) {
                                              await db.users.update({
                                                 where: { Id: user.Id },
                                                 data: { image: guestImageUrl }
                                              });
                                           }
                                        }
                                     } catch (updateError: any) {
                                     }
                                  }
                               }
                            }
                         }
                         
                         if (!searchPersonId) {
                            return;
                         }
                         
                         const latestSentiment = await db.parks_sentiment_analysis.findFirst({
                            where: {
                               park_Id: park_Id,
                               person_Id: searchPersonId.toString(),
                               check_out_capture: null 
                            },
                            orderBy: {
                               check_in_date: 'desc'
                            }
                         });
                         
                         if(latestSentiment){
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
                                     check_in_image: latestSentiment.check_in_image ? `${this.API_CONFIG.baseUrl}${latestSentiment.check_in_image}` : null,
                                     check_in_date: formatDate(latestSentiment.check_in_date),
                                     check_in_time: formatTime(latestSentiment.check_in_time),
                                     check_in_sentiment: latestSentiment.check_in_sentiment,
                                     entry_camera_Id: latestSentiment.entry_camera_Id,
                                     check_out_date: formatDate(parkSentimentData.check_out_date),
                                     check_out_time: formatTime(parkSentimentData.check_out_time),
                                     check_out_capture: exitSentimentImageUrl ? `${this.API_CONFIG.baseUrl}${exitSentimentImageUrl}` : null,
                                     check_out_sentiment: exitDetectedSentiment,
                                     exit_camera_Id: parkSentimentData.exit_camera_Id,
                                     createdAt: latestSentiment.createdAt,
                                     updatedAt: latestSentiment.updatedAt,
                                     user: userDetails, 
                                     park_cameras_parks_sentiment_analysis_entry_camera_IdTopark_cameras: entryCameraDetails,
                                     park_cameras_parks_sentiment_analysis_exit_camera_IdTopark_cameras: {
                                        camera_english_name: parkCamera.camera_english_name,
                                        camera_arabic_name: parkCamera.camera_arabic_name,
                                        ip_address: parkCamera.ip_address
                                     }
                                  }
                               });
                            } catch (socketError) {
                            }
                         } else {
                           
                         }
                      }
                      
                      if(isEntry){
                         const isGuest = await this.isGuestUser(person_Id);
                         
                         if (isGuest) {
                           
                         } else {
                         
                         
                         let entryImageUrl = null;
                         if (eventInfo.data?.alarmResult?.faces?.URL) {
                            try {
                             
                               const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                               const imageDataResponse = await this.getImageData(faceDataUrl);
                               
                               if (imageDataResponse) {
                                  const base64Image = imageDataResponse;
                                  if (!imageUrl) {
                                     imageUrl = await this.saveImageLocally(base64Image, 'attendance', eventInfo.eventId);
                                  } else {
                                  }
                                  entryImageUrl = imageUrl;
                               }
                            } catch (imageError: any) {
                            }
                         }
                         
                         const parkAttendanceData = {
                            park_Id: park_Id,
                            person_Id: person_Id,
                            entry_time: eventInfo.sendTime,
                            entry_image: entryImageUrl,
                            age_group: ageGroup,
                            gender: genderValue,
                         }
                         
                         const parkAttendanceRecord = await db.parks_attendance.create({
                            data: parkAttendanceData
                         })
                         
                            
                            try {
                               const user = await db.users.findUnique({
                                  where: { Id: person_Id },
                                  select: { user_Id: true }
                               });
                               
                               if (user && user.user_Id) {
                                  const secretKey = await this.fetchSecretFromAPI();
                                  
                                  const employeeEntryPayload = {
                                     SecretKey: secretKey,
                                     Lang: "en",
                                     UserID: user.user_Id,
                                     Type: "1" 
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
                                  
                                 } else {
                               }
                            } catch (employeeApiError: any) {
                            }
                         }
                      } else if(isExit){
                              
                         let searchPersonId = person_Id;
                         if (!searchPersonId && eventInfo.data?.alarmResult?.faces?.identify?.candidate?.human_id) {
                            const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id;
                            if (humanId && humanId !== "-1") {
                               const user = await db.users.findFirst({
                                  where: { unique_id: humanId.toString() },
                                  select: { Id: true, user_Id: true, emp_Id: true, image: true, isDeleted: true, linked_with_user_Id: true }
                               });
                               if (user) {
                                  if(user.isDeleted&&user.linked_with_user_Id)
                                   searchPersonId = user.linked_with_user_Id;
                                  else{
                                   searchPersonId = user.Id;
                                  }
                               }
                            }
                         }
                         
                           if (!searchPersonId) {
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
                            const isGuest = await this.isGuestUser(searchPersonId);
                            
                            if (isGuest) {
                               
                            } else {
                            
                            let exitImageUrl = null;
                            if (eventInfo.data?.alarmResult?.faces?.URL) {
                               try {
                                  const faceDataUrl = eventInfo.data.alarmResult.faces.URL;
                                  const imageDataResponse = await this.getImageData(faceDataUrl);
                                  
                                  if (imageDataResponse) {
                                     const base64Image = imageDataResponse;
                                     if (!imageUrl) {
                                        imageUrl = await this.saveImageLocally(base64Image, 'attendance', eventInfo.eventId);
                                     } else {
                                     }
                                     exitImageUrl = imageUrl;
                                  }
                               } catch (imageError: any) {
                               }
                            }
                            
                            await db.parks_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventInfo.sendTime,
                                  exit_image: exitImageUrl
                               }
                            })
                               
                               try {
                                  const user = await db.users.findUnique({
                                     where: { Id: searchPersonId },
                                     select: { user_Id: true }
                                  });
                                  
                                  if (user && user.user_Id) {
                                     const secretKey = await this.fetchSecretFromAPI();
                                     
                                     const employeeExitPayload = {
                                        SecretKey: secretKey,
                                        Lang: "en",
                                        UserID: user.user_Id,
                                        Type: "2" 
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
                                     
                                     
                                  } else {
                                  }
                               } catch (employeeApiError: any) {
                                  }
                            }
                         } else {
                           
                         }
                      }
                   }
                }
             }
             else if(bevaviour_code.includes(eventType)){
                
               const isParkCamera = park_cameras.includes(eventInfo.srcIndex.toString())
               
               if(isParkCamera){
                  const parkCamera = await db.park_cameras.findFirst({
                     where: {
                        camera_Id: eventInfo.srcIndex.toString()
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
                                 const base64Image = imageDataResponse;
                                 
                                 if (!imageUrl) {
                                    imageUrl = await this.saveImageLocally(base64Image, 'behavior', eventIndexCode);
                                    } else {
                                 }
                              } else {
                                 }
                           } else {
                                 }
                        } else {
                                 }
                     } catch (imageError: any) {
                        }

                     let person_Id = null; 
                     let faceData = null;
                     
                     if (eventInfo.data?.alarmResult?.faces) {
                        const similarity = eventInfo.data.alarmResult.faces.identify.candidate.similarity
                        const humanId = eventInfo.data.alarmResult.faces.identify.candidate.human_id

                        if (humanId && similarity !== null && similarity !== undefined) {
                           const user = await db.users.findFirst({
                              where: { unique_id: humanId.toString() },
                              select: { Id: true, user_Id: true, emp_Id: true, image: true, isDeleted: true, linked_with_user_Id: true }
                           });
                           if (user) {
                              if(user.isDeleted&&user.linked_with_user_Id)
                               person_Id = user.linked_with_user_Id.toString();
                              else{
                               person_Id = user.Id.toString();
                              }
                             
                           } else {
                             
                              try {
                                 let faceData = null;
                                 if (eventInfo.data?.alarmResult?.faces?.URL) {
                                    faceData = eventInfo.data.alarmResult.faces.URL;
                                    } else {
                                 }
                                 
                                 const genderValue = eventInfo.data.alarmResult.faces.gender.value
                                 const genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                                 
                                 const orgIndexCode = await this.getOrgIndexCodeForGuest(parkCamera?.park_Id || null, false);
                                 const guestUser = await this.createGuestUserAndUploadToHikVision(genderName, faceData, undefined, orgIndexCode);
                                 person_Id = guestUser.Id.toString();
                                 
                              } catch (guestError: any) {
                                
                              }
                           }
                        } else {
                          
                        }
                     } else {
                       
                     }
      
                     const detectedBehaviour = eventType===bevaviour_code[0]?'People Gathering Alarm':eventType===bevaviour_code[1]?'Fall Down':eventType===bevaviour_code[2]?'Fast Moving':eventType===bevaviour_code[3]?'Physical Conflict':eventType===bevaviour_code[4]?'Violent Motion Detection':eventType===bevaviour_code[5]?'Fire and Smoke Detection':'Other';
                     
                     const behaviourData = {
                        park_Id: parkCamera?.park_Id,
                        camera_Id: parkCamera?.Id,
                        detection_Id: eventInfo.eventId,
                        detection_code: eventType?.toString(),
                        detection_date: eventInfo.sendTime,
                        detection_time: eventInfo.sendTime,
                        person_Id: person_Id,
                        detected_behaviour: detectedBehaviour,
                        snap_shot: imageUrl,
                        is_employee: false,
                        description: `Behavior detected at ${eventInfo.srcName} camera`
                     }
                     
                     
                     
                     const existingBehaviour = await db.parks_behaviour_alerts.findFirst({
                        where: {
                           detection_Id: behaviourData.detection_Id
                        }
                     });
                     
                     if (existingBehaviour) {
                        
                        return;
                     }
                     
                     const newBehaviourAlert = await db.parks_behaviour_alerts.create({
                        data: behaviourData
                     });
                     
                     
                  } else {
                    
                  }
                 
             } else {

             }
          } else {
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

   /**
    * Get orgIndexCode for guest users based on park name or office context
    * @param parkId Optional park ID to check park name
    * @param isOfficeEvent Whether this is an office event
    * @returns Promise<string> The orgIndexCode ("5" for Shees, "6" for Lulaya, "7" for Main Building/Office, "8" for Others)
    */
   private static async getOrgIndexCodeForGuest(parkId: number | null = null, isOfficeEvent: boolean = false): Promise<string> {
      // For office events, always return "7" (Main Building Guests)
      if (isOfficeEvent) {
         return "7";
      }

      // For park events, check the park name
      if (parkId) {
         try {
            const park = await db.parks.findUnique({
               where: { Id: parkId },
               select: { park_english_name: true, park_arabic_name: true }
            });

            if (park) {
               const parkName = (park.park_english_name || park.park_arabic_name || "").toLowerCase();
               
               if (parkName.includes("shees")) {
                  return "5"; 
               } else if (parkName.includes("lulaya")) {
                  return "6";
               } else if (parkName.includes("main building")) {
                  return "7"; 
               }
            }
         } catch (error) {
            // If error occurs, default to "8"
         }
      }

      // Default to "8" for Others
      return "8";
   }

   private static async createGuestUserAndUploadToHikVision(gender: string, faceData: string, faceRect?: FaceRect, orgIndexCode: string = "8"): Promise<any> {
      const startTime = Date.now();
      

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
            } else {
            }
         } else {
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

         

         let base64ImageData = null;
         if (faceData) {
            try {
               const imageDataResponse = await this.getImageData(faceData);
            
            if (imageDataResponse) {
                  base64ImageData = imageDataResponse;
                  
                  if (faceRect && base64ImageData) {
                     try {
                        const croppedImage = await cropFaceWithMargin(base64ImageData, faceRect);
                        base64ImageData = croppedImage;
                     } catch (cropError: any) {
                     }
                  } else if (faceRect) {
                  }
            } else {
               }
            } catch (imageError: any) {
            }
         } else {
         }

         const cleanFaceData = base64ImageData ? base64ImageData.replace(/^data:image\/[a-z]+;base64,/, '') : null;
         const hikVisionPayload = {
            personCode: `${guestUser.Id.toString()}`,
            personFamilyName: guestNumber.toString(),
            personGivenName: "Guest",
            gender: gender === "Male" ? 1 : 2,
            orgIndexCode: orgIndexCode,
            faces: cleanFaceData ? [{ faceData: cleanFaceData }] : []
         };

         
         const hikVisionResponse = await this.callHikVisionAPI(
            this.HIK_CONFIG.baseURL,
            '/artemis/api/resource/v1/person/single/add',
            this.HIK_CONFIG.appKey,
            this.HIK_CONFIG.appSecret,
            hikVisionPayload
         );

        
         if (hikVisionResponse && hikVisionResponse.code === '0' && hikVisionResponse.data) {
            
            let imageUrl = null;
            if (base64ImageData) {
               try {
                  let dataUrl = base64ImageData;
                  if (!base64ImageData.startsWith('data:')) {
                     dataUrl = `data:image/jpeg;base64,${base64ImageData}`;
                  }
                  
                  imageUrl = await this.saveImageLocally(dataUrl, 'guest-users', guestUser.Id.toString());
               } catch (imageError: any) {
               }
            }
            
            const updatedGuestUser = await db.users.update({
               where: { Id: guestUser.Id },
               data: { 
                  unique_id: hikVisionResponse.data,
                  image: imageUrl
               }
            });

            try {
               const faceAdditionPayload = {
                  personIndexCode: hikVisionResponse.data, 
                  faceGroupIndexCode: "5" 
               };


               const faceAdditionResponse = await this.callHikVisionAPI(
                  this.HIK_CONFIG.baseURL,
                  '/artemis/api/frs/v1/face/single/addition',
                  this.HIK_CONFIG.appKey,
                  this.HIK_CONFIG.appSecret,
                  faceAdditionPayload
               );

               
            } catch (faceAdditionError: any) {
            }

          
            return updatedGuestUser;
         } else {
            let imageUrl = null;
            if (base64ImageData) {
               try {
                  let dataUrl = base64ImageData;
                  if (!base64ImageData.startsWith('data:')) {
                     dataUrl = `data:image/jpeg;base64,${base64ImageData}`;
                  }
                  
                  imageUrl = await this.saveImageLocally(dataUrl, 'guest-users', guestUser.Id.toString());
                  
                  const updatedGuestUser = await db.users.update({
                     where: { Id: guestUser.Id },
                     data: { 
                        image: imageUrl
                     }
                  });
               } catch (imageError: any) {
               }
            }
            
            const duration = Date.now() - startTime;
           
            
            if (imageUrl) {
               const guestUserWithImage = await db.users.findUnique({
                  where: { Id: guestUser.Id }
               });
               return guestUserWithImage || guestUser;
            }
            return guestUser;
         }

      } catch (error: any) {
         const duration = Date.now() - startTime;
        
         
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
               status: true 
            }
         });
         
         return officeCameras
            .map(camera => camera.camera_Id)
            .filter((id): id is string => id !== null);
      } catch (error) {
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
               status: true 
            }
         });
         
         return parkCameras
            .map(camera => camera.camera_Id)
            .filter((id): id is string => id !== null);
      } catch (error) {
         return [];
      }
   }

   /**
    * Check if a user is a guest user (not an employee)
    * @param personId The person ID to check
    * @returns Promise<boolean> True if the user is a guest, false if employee
    */
   private static async isGuestUser(personId: number | null | undefined): Promise<boolean> {
      try {
         if (!personId || personId === null || personId === undefined) {
            return true;
         }

         const user = await db.users.findUnique({
            where: { Id: personId },
            select: { 
               emp_Id: true,
               emp_code: true,
               user_Id: true
            }
         });
         
         if (!user) {
            return true; 
         }

         const isGuest = (!user.emp_Id || user.emp_Id.trim() === '') && 
                        (!user.emp_code || user.emp_code.trim() === '') && 
                        !user.user_Id;
         

         return isGuest;
      } catch (error) {
         return true; 
      }
   }
}
export default EventHandlerService;
