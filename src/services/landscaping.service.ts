import { LandscapingType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import axios from "axios";
import https from "https";
import * as nodeCrypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { formatImageUrl, formatImageUrlsInArray } from "@/utils/imageUrl.utils";
import { CronLogger } from "@/utils/cronLogger.utils";

class LandscapingService {
   private static readonly HIK_CONFIG = {
      baseURL: 'https://10.70.90.183:443',
      appKey: '59315117',
      appSecret: 'YuWS8qCb61xbD8fEbwFJ', 
      eventRecordsEndpoint: '/artemis/api/eventService/v1/eventRecords/page',
      imageDataEndpoint: '/artemis/api/eventService/v1/image_data',
   };

   // Helper function to log to both console and file
   private static log(message: string): void {
      console.log(message);
      CronLogger.log(message);
   }

   // Helper function to log errors to both console and file
   private static logError(message: string, error?: any): void {
      const errorMessage = error ? `${message} ${error.message || JSON.stringify(error)}` : message;
      console.error(errorMessage);
      CronLogger.log(`[ERROR] ${errorMessage}`);
   }

   protected static getLandscapingFiltersService = async (startDate?: string, endDate?: string) => {
      try {
         const parks = await db.parks.findMany({
            where: {
               landscaping: {
                  some: {
                     plant_type: { not: "Plant" }
                  }
               }
            },
            select: {
               Id: true,
               park_Id: true,
               park_english_name: true,
               park_arabic_name: true
            },
            orderBy: { park_english_name: 'asc' }
         });

         return {
            success: true,
            data: {
               parks: parks.map(p => ({
                  id: p.Id,
                  parkId: p.park_Id,
                  name_en: p.park_english_name,
                  name_ar: p.park_arabic_name
               }))
            }
         };
      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch landscaping filters");
      }
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

   protected static viewLandscapingsService = async (paginationParams?: {
      page: number;
      limit: number;
      search: string;
      status: string;
      sortBy: string;
      sortOrder: string;
      startDate?: string;
      endDate?: string;
      parkId?: number;
      statusFilter?: 'pending' | 'under_process' | 'completed';
   }) => {
      try {
         if (!paginationParams) {
            const results = await db.landscaping.findMany({
               include: {
                  assignedUser: {
                     select: {
                        Id: true,
                        emp__eng_name: true,
                        emp__arabic_name: true,
                        dep_eng_name: true,
                        dep_arabic_name: true
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
                              emp__arabic_name: true,
                              dep_eng_name: true,
                              dep_arabic_name: true
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

            // Format image URLs in the results
            const imageFields = ['image'];
            const formattedResults = formatImageUrlsInArray(results, imageFields);

            // Format image URLs in nested landscaping_history arrays
            const formattedResultsWithHistory = formattedResults.map(item => {
              if (item.landscaping_history && Array.isArray(item.landscaping_history)) {
                const formattedHistory = formatImageUrlsInArray(item.landscaping_history, ['image']);
                return {
                  ...item,
                  landscaping_history: formattedHistory
                };
              }
              return item;
            });

            return formattedResultsWithHistory;
         }

         const whereClause: any = {
            plant_type: { not: "Plant" }
         };
         const andConditions: any[] = [];

         if (paginationParams.search) {
            andConditions.push({
               OR: [
                  { case_Id: { contains: paginationParams.search, mode: 'insensitive' } },
                  { name: { contains: paginationParams.search, mode: 'insensitive' } },
                  { suggestion: { contains: paginationParams.search, mode: 'insensitive' } },
                  { parks: { park_english_name: { contains: paginationParams.search, mode: 'insensitive' } } },
                  { parks: { park_arabic_name: { contains: paginationParams.search, mode: 'insensitive' } } }
               ]
            });
         }

         if (paginationParams.status && !paginationParams.statusFilter) {
            whereClause.current_status = paginationParams.status;
         }

         if (paginationParams.parkId) {
            whereClause.park_Id = paginationParams.parkId;
         }

         if (paginationParams.statusFilter) {
            const sf = paginationParams.statusFilter;
            if (sf === 'pending') {
               whereClause.current_status = { in: ['pending', 'Pending', 'new', 'New'] };
            } else if (sf === 'under_process') {
               whereClause.current_status = {
                  in: ['in progress', 'under process', 'assigned', 'In Progress', 'Under Process', 'Assigned', 'open', 'Open', 'in review', 'In Review']
               };
            } else if (sf === 'completed') {
               whereClause.current_status = {
                  in: ['completed', 'closed', 'resolved', 'finished', 'done', 'Completed', 'Closed', 'Resolved', 'Finished', 'Done']
               };
            }
         }

         if (paginationParams.startDate && paginationParams.endDate) {
            whereClause.createdAt = {
               gte: new Date(paginationParams.startDate),
               lte: new Date(paginationParams.endDate)
            };
         }

         const finalWhere = andConditions.length > 0 ? { AND: [...andConditions, whereClause] } : whereClause;

         const orderByClause: any = {};
         orderByClause[paginationParams.sortBy] = paginationParams.sortOrder;

         const skip = (paginationParams.page - 1) * paginationParams.limit;

         const totalCount = await db.landscaping.count({ where: finalWhere });

         const results = await db.landscaping.findMany({
            where: finalWhere,
            include: {
               assignedUser: {
                  select: {
                     Id: true,
                     emp__eng_name: true,
                     emp__arabic_name: true,
                     dep_eng_name: true,
                     dep_arabic_name: true
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
                           emp__arabic_name: true,
                           dep_eng_name: true,
                           dep_arabic_name: true
                        }
                     }
                  },
                  orderBy: {
                     createdAt: 'desc'
                  }
               }
            },
            orderBy: orderByClause,
            skip: skip,
            take: paginationParams.limit
         });

         const totalPages = Math.ceil(totalCount / paginationParams.limit);
         const hasNextPage = paginationParams.page < totalPages;
         const hasPreviousPage = paginationParams.page > 1;

         const allDataForStats = await db.landscaping.findMany({
            where: finalWhere,
            select: {
               current_status: true
            }
         });

         const stats = {
            pending: allDataForStats.filter(item => 
               !item.current_status || 
               item.current_status.toLowerCase() === 'pending' ||
               item.current_status.toLowerCase() === 'new'
            ).length,
            underProcess: allDataForStats.filter(item => 
               item.current_status && 
               (item.current_status.toLowerCase() === 'under process' ||
                item.current_status.toLowerCase() === 'in progress' ||
                item.current_status.toLowerCase() === 'open' ||
                item.current_status.toLowerCase() === 'assigned' ||
                item.current_status.toLowerCase() === 'in review')
            ).length,
            completed: allDataForStats.filter(item => 
               item.current_status && 
               ['completed', 'closed', 'resolved', 'finished', 'done'].includes(item.current_status.toLowerCase())
            ).length,
            total: allDataForStats.length
         };

         const imageFields = ['image'];
         const formattedResults = formatImageUrlsInArray(results, imageFields);

         const formattedResultsWithHistory = formattedResults.map(item => {
            if (item.landscaping_history && Array.isArray(item.landscaping_history)) {
               const formattedHistory = formatImageUrlsInArray(item.landscaping_history, ['image']);
               return {
                  ...item,
                  landscaping_history: formattedHistory
               };
            }
            return item;
         });

         return {
            data: formattedResultsWithHistory,
            pagination: {
               currentPage: paginationParams.page,
               totalPages,
               totalCount,
               limit: paginationParams.limit,
               hasNextPage,
               hasPreviousPage,
               nextPage: hasNextPage ? paginationParams.page + 1 : null,
               previousPage: hasPreviousPage ? paginationParams.page - 1 : null
            },
            stats
         };

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
            where: { Id: assignmentData.userId },
            include: {
               users_roles: {
                  select: {
                     users_permissions: {
                        select: {
                           park_landscaping_view: true,
                           park_landscaping_add: true,
                           park_landscaping_update: true,
                           park_plant_disease_view: true,
                           park_plant_disease_add: true,
                           park_plant_disease_update: true
                        }
                     }
                  }
               }
            }
         });

         if (!user) {
            throw new HttpException(STATUS.NOT_FOUND, "User not found");
         }

         const hasLandscapingFlag = user.landscaping_access === true;
         const hasPlantDiseaseFlag = user.plant_disease_access === true;
         const perms = user.users_roles?.users_permissions?.[0];
         const hasLandscapingRole =
            perms &&
            (perms.park_landscaping_view === true ||
               perms.park_landscaping_add === true ||
               perms.park_landscaping_update === true);
         const hasPlantDiseaseRole =
            perms &&
            (perms.park_plant_disease_view === true ||
               perms.park_plant_disease_add === true ||
               perms.park_plant_disease_update === true);
         if (!hasLandscapingFlag && !hasLandscapingRole && !hasPlantDiseaseFlag && !hasPlantDiseaseRole) {
            throw new HttpException(STATUS.BAD_REQUEST, "User does not have landscaping or plant disease access");
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

         let savedImageUrl = null;
         
         if (completionData.image) {
            try {
               if (completionData.image.startsWith('/uploads/')) {
                  savedImageUrl = completionData.image;
               } else if (completionData.image.startsWith('data:image/') || completionData.image.startsWith('data:image%2F')) {
                  const eventId = `completion_${completionData.landscapingId}_${Date.now()}`;
                  savedImageUrl = await this.saveImageLocally(completionData.image, eventId);
               } else {
                  const dataUrl = `data:image/jpeg;base64,${completionData.image}`;
                  const eventId = `completion_${completionData.landscapingId}_${Date.now()}`;
                  savedImageUrl = await this.saveImageLocally(dataUrl, eventId);
               }
            } catch (imageError: any) {
               savedImageUrl = null;
            }
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
               image: savedImageUrl,
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
       
         const cameraIndexes = ["278", "283", "289", "288"];
         
         const parkCameras = [];
         for (const cameraIndex of cameraIndexes) {
            try {
               const camera = await db.park_cameras.findFirst({
                  where: {
                     camera_Id: cameraIndex
                  },
                  select: {
                     camera_Id: true,
                     park_Id: true
                  }
               });
               
               if (camera && camera.camera_Id) {
                  parkCameras.push({
                     camera_Id: camera.camera_Id,
                     park_Id: camera.park_Id 
                  });
               } else {
                  parkCameras.push({
                     camera_Id: cameraIndex,
                     park_Id: 1
                  });
               }
            } catch (dbError: any) {
               parkCameras.push({
                  camera_Id: cameraIndex,
                  park_Id: 1
               });
            }
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

               const imageUrl = await this.saveImageLocally(base64Image!, camera.camera_Id);
               
               if (!imageUrl) {
                  continue;
               }

               const geminiResponse = await this.analyzeImageWithGemini(imageUrl!);
               
               if (!geminiResponse) {
                  continue;
               }

               try {
                  const landscapingRecord = await this.createGrassMonitoringRecord({
                     parkId: camera.park_Id || undefined,
                     cameraId: camera.camera_Id,
                     imageUrl: imageUrl!,
                     geminiResponse: geminiResponse!
                  });

                  if (landscapingRecord.id) {
                     results.push({
                        cameraId: camera.camera_Id,
                        parkId: camera.park_Id,
                        success: true,
                        landscapingId: landscapingRecord.id,
                        message: "Record stored - grass needs cutting",
                        needs_cutting: true
                     });
                  } else {
                     results.push({
                        cameraId: camera.camera_Id,
                        parkId: camera.park_Id,
                        success: true,
                        message: landscapingRecord.message || "Record not stored - grass does not need cutting",
                        needs_cutting: false,
                        estimated_height: landscapingRecord.estimated_height
                     });
                  }
               } catch (dbError: any) {
                  results.push({
                     cameraId: camera.camera_Id,
                     parkId: camera.park_Id,
                     success: true,
                     message: "Processed successfully but database record creation failed",
                     imageUrl: imageUrl,
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

   // New method to monitor landscaping sections based on working_time
   public static monitorLandscapingSectionsService = async (workingTime: string) => {
      const startTime = Date.now();
      
      // Initialize logger for this service
      CronLogger.initialize('landscaping');
      CronLogger.startJobRun(workingTime);
      
      console.log(`[LandscapingService] 🌳 Starting landscaping monitoring for working time: ${workingTime}`);
      CronLogger.log(`[LandscapingService] 🌳 Starting landscaping monitoring for working time: ${workingTime}`);
      
      try {
         const appKey = this.HIK_CONFIG.appKey;
         const secretKey = this.HIK_CONFIG.appSecret;

         this.log(`[LandscapingService] 📋 Fetching landscaping sections for time ${workingTime}...`);
         const landscapingSections = await db.cameras_landscaping_section.findMany({
            where: {
               working_time: workingTime,
               park_cameras: {
                  status: true 
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
               }
            }
         });

         this.log(`[LandscapingService] 📊 Found ${landscapingSections.length} landscaping sections for time ${workingTime}`);

         if (landscapingSections.length === 0) {
            this.log(`[LandscapingService] ⚠️ No landscaping sections found for time ${workingTime}`);
            return {
               success: true,
               message: `No landscaping sections found for time ${workingTime}`,
               results: []
            };
         }

         const results = [];
         let processedCount = 0;
         let successCount = 0;
         let failureCount = 0;
         let needsCuttingCount = 0;

         for (const section of landscapingSections) {
            processedCount++;
            this.log(`[LandscapingService] 🔄 Processing section ${processedCount}/${landscapingSections.length} (Section ID: ${section.id}, Area: ${section.area_name || 'N/A'})`);
            
            try {
               if (!section.park_cameras || !section.park_cameras.camera_Id) {
                  this.log(`[LandscapingService] ❌ Section ${section.id}: Camera not found`);
                  results.push({
                     sectionId: section.id,
                     areaName: section.area_name,
                     success: false,
                     error: "Camera not found for this section"
                  });
                  failureCount++;
                  continue;
               }

               const camera = section.park_cameras;
               if (!camera.camera_Id) {
                  this.log(`[LandscapingService] ❌ Section ${section.id}: Camera ID not found`);
                  results.push({
                     sectionId: section.id,
                     areaName: section.area_name,
                     success: false,
                     error: "Camera ID not found"
                  });
                  failureCount++;
                  continue;
               }

               // Skip if camera is not active
               if (camera.status === false || camera.status === null) {
                  this.log(`[LandscapingService] ⚠️ Section ${section.id}: Camera ${camera.camera_Id} is not active, skipping`);
                  results.push({
                     sectionId: section.id,
                     areaName: section.area_name,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Camera is not active"
                  });
                  failureCount++;
                  continue;
               }

               this.log(`[LandscapingService] 📷 Section ${section.id}: Capturing image from camera ${camera.camera_Id} (Area: ${section.area_name || 'N/A'})...`);
               const base64Image = await this.captureCameraImage(camera.camera_Id, appKey, secretKey);
               console.log('camera response for landscaping section', section.id, base64Image)
               
               if (!base64Image) {
                  this.log(`[LandscapingService] ❌ Section ${section.id}: Failed to capture image from camera ${camera.camera_Id}`);
                  results.push({
                     sectionId: section.id,
                     areaName: section.area_name,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Failed to capture image"
                  });
                  failureCount++;
                  continue;
               }
               this.log(`[LandscapingService] ✅ Section ${section.id}: Image captured successfully`);

               const eventId = `landscaping_${section.id}_${Date.now()}`;
               this.log(`[LandscapingService] 💾 Section ${section.id}: Saving image locally...`);
               const imageUrl = await this.saveImageLocally(base64Image, eventId);
               
               if (!imageUrl) {
                  this.log(`[LandscapingService] ❌ Section ${section.id}: Failed to save image locally`);
                  results.push({
                     sectionId: section.id,
                     areaName: section.area_name,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Failed to save image"
                  });
                  failureCount++;
                  continue;
               }
               this.log(`[LandscapingService] ✅ Section ${section.id}: Image saved at ${imageUrl}`);

               this.log(`[LandscapingService] 🤖 Section ${section.id}: Analyzing image with Gemini...`);
               const geminiResponse = await this.analyzeImageWithGemini(imageUrl);
               
               if (!geminiResponse) {
                  this.log(`[LandscapingService] ❌ Section ${section.id}: Failed to analyze image with Gemini`);
                  results.push({
                     sectionId: section.id,
                     areaName: section.area_name,
                     cameraId: camera.camera_Id,
                     success: false,
                     error: "Failed to analyze image"
                  });
                  failureCount++;
                  continue;
               }
               this.log(`[LandscapingService] ✅ Section ${section.id}: Image analyzed successfully`);

               this.log(`[LandscapingService] 💾 Section ${section.id}: Creating grass monitoring record...`);
               try {
                  const landscapingRecord = await this.createGrassMonitoringRecord({
                     parkId: camera.park_Id || undefined,
                     cameraId: camera.camera_Id!,
                     imageUrl: imageUrl,
                     geminiResponse: geminiResponse
                  });

                  if (landscapingRecord.id) {
                     this.log(`[LandscapingService] ✅ Section ${section.id}: Record stored - grass needs cutting (ID: ${landscapingRecord.id})`);
                     needsCuttingCount++;
                     successCount++;
                     results.push({
                        sectionId: section.id,
                        areaName: section.area_name,
                        cameraId: camera.camera_Id,
                        parkId: camera.park_Id,
                        success: true,
                        landscapingId: landscapingRecord.id,
                        message: "Record stored - grass needs cutting",
                        needs_cutting: true
                     });
                  } else {
                     this.log(`[LandscapingService] ℹ️ Section ${section.id}: Record not stored - grass does not need cutting`);
                     successCount++;
                     results.push({
                        sectionId: section.id,
                        areaName: section.area_name,
                        cameraId: camera.camera_Id,
                        parkId: camera.park_Id,
                        success: true,
                        message: landscapingRecord.message || "Record not stored - grass does not need cutting",
                        needs_cutting: false,
                        estimated_height: landscapingRecord.estimated_height
                     });
                  }
               } catch (dbError: any) {
                  this.logError(`[LandscapingService] ❌ Section ${section.id}: Database record creation failed:`, dbError);
                  failureCount++;
                  results.push({
                     sectionId: section.id,
                     areaName: section.area_name,
                     cameraId: camera.camera_Id,
                     parkId: camera.park_Id,
                     success: false,
                     error: "Database record creation failed",
                     message: dbError.message
                  });
               }

            } catch (error: any) {
               this.logError(`[LandscapingService] ❌ Section ${section.id}: Unexpected error:`, error);
               failureCount++;
               results.push({
                  sectionId: section.id,
                  areaName: section.area_name,
                  success: false,
                  error: error.message
               });
            }
         }

         const duration = ((Date.now() - startTime) / 1000).toFixed(2);
         this.log(`[LandscapingService] 📊 Summary for ${workingTime}:`);
         this.log(`[LandscapingService]   - Total sections: ${landscapingSections.length}`);
         this.log(`[LandscapingService]   - Processed: ${processedCount}`);
         this.log(`[LandscapingService]   - Successful: ${successCount}`);
         this.log(`[LandscapingService]   - Failed: ${failureCount}`);
         this.log(`[LandscapingService]   - Needs cutting: ${needsCuttingCount}`);
         this.log(`[LandscapingService]   - Duration: ${duration}s`);
         this.log(`[LandscapingService] ✅ Completed landscaping monitoring for ${workingTime}`);

         // Log summary to file
         CronLogger.endJobRun({
            workingTime: workingTime,
            totalSections: landscapingSections.length,
            processed: processedCount,
            successful: successCount,
            failed: failureCount,
            duration: duration,
            additionalInfo: {
               needsCutting: needsCuttingCount
            }
         });

         return {
            success: true,
            message: `Processed ${results.length} landscaping sections for time ${workingTime}`,
            workingTime: workingTime,
            results: results
         };

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, `Failed to monitor landscaping sections for time ${workingTime}: ${error.message}`);
      }
   }

   // Get all unique working times from landscaping sections (only for active cameras)
   public static getAllLandscapingWorkingTimes = async (): Promise<string[]> => {
      try {
         const sections = await db.cameras_landscaping_section.findMany({
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
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch landscaping working times");
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
         console.log('camera response for landscaping section main', cameraIndexCode, response)
         if (response && response.code === '0' && response.msg === 'Success' && response.data) {
            return response.data;
         } else {
            return null;
         }
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

   private static async saveImageLocally(base64Image: string, eventId: string): Promise<string | null> {
      try {
         const uploadDir = path.join(process.cwd(), 'uploads', 'landscaping');

         let cleanBase64 = base64Image.trim();
         
         if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
         }
         
         if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
            throw new Error('Invalid base64 format detected');
         }
         
         const imageFormat = this.detectImageFormat(base64Image);
         const fileName = `${eventId}.${imageFormat}`;
         const filePath = path.join(uploadDir, fileName);
         
         if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
         }
         
         const imageBuffer = Buffer.from(cleanBase64, 'base64');
         
         if (imageBuffer.length === 0) {
            throw new Error('Empty image buffer after base64 decoding');
         }
         
         fs.writeFileSync(filePath, imageBuffer);
         
         const imageUrl = `/uploads/landscaping/${fileName}`;

         return imageUrl;
      } catch (error: any) {
         return null;
      }
   }

   private static async analyzeImageWithGemini(imageUrl: string): Promise<string | null> {
      const maxRetries = 3;
      const retryDelay = 2000; 
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
            const MODEL = "gemini-2.5-flash";
            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
            
            // Sanitize the imageUrl first (remove any spaces or invalid characters)
            const sanitizedImageUrl = imageUrl.trim().replace(/\s+/g, '');
            
            // Construct full publicly accessible URL for Gemini
            let fullImageUrl = formatImageUrl(sanitizedImageUrl);
            if (!fullImageUrl || (!fullImageUrl.startsWith('http://') && !fullImageUrl.startsWith('https://'))) {
               const apiBaseUrl = process.env.API_BASE_URL || 'http://83.111.75.163:5000';
               fullImageUrl = sanitizedImageUrl.startsWith('/') 
                  ? `${apiBaseUrl}${sanitizedImageUrl}`
                  : `${apiBaseUrl}/${sanitizedImageUrl}`;
            }
            
            // Ensure final URL is properly formatted (no spaces, properly encoded)
            fullImageUrl = fullImageUrl.trim().replace(/\s+/g, '');
            
            console.log(`[LandscapingService] 🖼️ Full image URL for Gemini (attempt ${attempt}): ${fullImageUrl}`);
         
         const prompt = `Objective:
Analyze the provided visual and contextual data to determine the current grass height in inches/centimeters and whether the grass needs cutting.
The final output MUST be a JSON object containing the measured/estimated grass height, confidence score, rationale, and a cutting recommendation.

IMPORTANT - SKIP UNUSABLE IMAGES:
Before analyzing grass, check image quality and content. If the image is BLUR (out of focus or unclear), BLANK (empty, black, or no meaningful content), or contains NO GRASS (e.g. only pavement, sky, or non-grass areas), you MUST set "skip_record" to true and "skip_reason" to one of: "blur", "blank", "no_grass". In that case do NOT estimate grass height or cutting—skip this record so it will not be saved to the database. Only when the image is clear and shows grass should you set "skip_record" to false and provide the full analysis.

1. VISUAL DESCRIPTION (From Observation):
Blade Height: [Estimate the average visible grass height: e.g., 1.5 inches, 4 inches, 7 cm, etc.]

Uniformity: [Describe if the grass is evenly grown or patchy.]

Appearance: [Note if it looks neat, overgrown, or uneven.]

Surrounding Reference: [If visible, compare grass height relative to sidewalks, curbs, shoes, or other objects in the image.]

2. CONTEXTUAL INFORMATION (Cutting Standards):
Preferred Cutting Range: [e.g., Recommended optimal range is 2.5–3.5 inches for healthy turfgrass.]

Seasonal Context: [Grass growth speed may depend on the season; e.g., fast growth in spring, slower in winter.]
Maintenance Frequency: [Optional: how often the area is usually cut, if available.]

3. VISUAL SUPPORT (REQUIRED):
Still Image Link: ${fullImageUrl}

OUTPUT FORMAT:
[remove pre and post text]. The response must be a single JSON object only, structured as follows:

{
  "skip_record": "[true if image is blur, blank, or has no grass; otherwise false]",
  "skip_reason": "[only when skip_record is true: 'blur' | 'blank' | 'no_grass']",
  "estimated_height": "[Numeric value with unit, e.g., '4 inches' or '10 cm'; use 'N/A' if skip_record is true]",
  "confidence_score": "[0-100]",
  "rationale": "[Detailed justification using visual and contextual inputs; or reason for skip if skip_record is true]",
  "cutting_recommendation": {
    "needs_cutting": "[true or false]",
    "recommendation_note": "[Explain why cutting is or is not needed, e.g., 'Height exceeds 3.5 inches optimal range']"
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
                  console.log(`[LandscapingService] ✅ Gemini API response parsed successfully (attempt ${attempt})`);
                  return parsedResponse;
               } catch (parseError: any) {
                  console.log(`[LandscapingService] ⚠️ Failed to parse Gemini response as JSON, returning raw text (attempt ${attempt}):`, parseError.message);
                  return geminiResponse;
               }
            }

            console.log(`[LandscapingService] ⚠️ Gemini API response structure unexpected (attempt ${attempt}):`, JSON.stringify(response.data).substring(0, 200));
            return null;
         } catch (error: any) {
            console.error(`[LandscapingService] ❌ Gemini API error (attempt ${attempt}/${maxRetries}):`, {
               message: error.message,
               status: error.response?.status,
               statusText: error.response?.statusText,
               data: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : 'No response data'
            });
            
            if (attempt === maxRetries) {
               console.error(`[LandscapingService] ❌ All ${maxRetries} attempts failed for Gemini API`);
               return null;
            }
            
            console.log(`[LandscapingService] 🔄 Retrying Gemini API call in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
         }
      }
      
      return null;
   }

   private static async createGrassMonitoringRecord(data: {
      parkId: number | undefined;
      cameraId: string;
      imageUrl: string;
      geminiResponse: any;
   }): Promise<any> {
      try {
         const skipRecord = data.geminiResponse?.skip_record === true || data.geminiResponse?.skip_record === "true";
         const skipReason = data.geminiResponse?.skip_reason || "unusable_image";
         if (skipRecord) {
            return {
               id: null,
               case_Id: null,
               message: `Record skipped - image not suitable for analysis (${skipReason}: blur, blank, or no grass). Not saved to DB.`,
               needs_cutting: false,
               skip_record: true,
               skip_reason: skipReason,
               cameraId: data.cameraId
            };
         }

         const estimatedHeight = data.geminiResponse?.estimated_height || "Unknown";
         const confidenceScore = String(data.geminiResponse?.confidence_score || "0");
         const rationale = data.geminiResponse?.rationale || "No analysis available";
         const needsCutting = data.geminiResponse?.cutting_recommendation?.needs_cutting || false;
         const recommendationNote = data.geminiResponse?.cutting_recommendation?.recommendation_note || "No recommendation available";

         if (!needsCutting) {
            return {
               id: null,
               case_Id: null,
               message: "Record not stored - grass does not need cutting",
               needs_cutting: false,
               estimated_height: estimatedHeight,
               cameraId: data.cameraId
            };
         }

         const caseId = await this.generateUniqueCaseId();

         let grassHealthPercentage = "100%";
         if (needsCutting) {
            const heightValue = parseFloat(estimatedHeight.replace(/[^\d.]/g, ''));
            if (heightValue > 4.5) {
               grassHealthPercentage = "60%"; 
            } else if (heightValue > 3.5) {
               grassHealthPercentage = "75%"; 
            } else {
               grassHealthPercentage = "85%"; 
            }
         } else {
            grassHealthPercentage = "95%";
         }

         const suggestions = `Height: ${estimatedHeight}\nConfidence: ${confidenceScore}%\nNeeds Cutting: ${needsCutting ? 'Yes' : 'No'}\nRecommendation: ${recommendationNote}\n\nAnalysis: ${rationale}`;

         const result = await db.landscaping.create({
            data: {
               case_Id: caseId,
               image: data.imageUrl,
               name: "Grass Height Analysis",
               park_Id: data.parkId,
               plant_type: "Grass Height Check",
               status: grassHealthPercentage,
               current_status:"Pending",
               suggestion: suggestions,
               estimated_height: estimatedHeight,
               confidence_score: confidenceScore,
               rationale: rationale,
               needs_cutting: needsCutting,
               recommendation_note: recommendationNote,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;
      } catch (error: any) {
         throw error;
      }
   }

   public static testingLandscapingService = async (images: string[]) => {
      try {
         const results = [];

         for (let i = 0; i < images.length; i++) {
            const imageBase64 = images[i];
            
            try {
               const imageUrl = await this.saveImageLocally(imageBase64, `landscaping_testing_${i + 1}`);
               
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
               const skipRecord = (geminiData as any).skip_record === true || (geminiData as any).skip_record === "true";
               const skipReason = (geminiData as any).skip_reason || "unusable_image";
               const cuttingRecommendation = (geminiData as any).cutting_recommendation || {};
               const needsCutting = (cuttingRecommendation as any).needs_cutting || false;

               if (skipRecord) {
                  results.push({
                     imageIndex: i + 1,
                     success: true,
                     imageUrl: imageUrl,
                     testingRecordId: null,
                     geminiResponse: geminiResponse,
                     skip_record: true,
                     skip_reason: skipReason,
                     message: `Record skipped - image not suitable (${skipReason}). Not saved to DB.`
                  });
               } else if (needsCutting) {
                  const testingRecord = await this.createTestingModuleRecord({
                     image: imageUrl,
                     name: `Landscaping Testing`,
                     case_type: "Landscaping Testing",
                     estimated_height: (geminiData as any).estimated_height || null,
                     needs_cutting: needsCutting,
                     recommendation_note: (cuttingRecommendation as any).recommendation_note || null,
                     health: (geminiData as any).status || "Unknown",
                     suggestion: (geminiData as any).suggestions || null,
                     status: (geminiData as any).status || null,
                     confidence_score: String((geminiData as any).confidence_score || "0"),
                     rationale: (geminiData as any).rationale || null,
                     gallons_required_estimate: null, 
                     calculation_note: null 
                  });

                  results.push({
                     imageIndex: i + 1,
                     success: true,
                     imageUrl: imageUrl,
                     testingRecordId: testingRecord.id,
                     geminiResponse: geminiResponse,
                     needs_cutting: true,
                     message: "Record stored - grass needs cutting"
                  });
               } else {
                  results.push({
                     imageIndex: i + 1,
                     success: true,
                     imageUrl: imageUrl,
                     testingRecordId: null,
                     geminiResponse: geminiResponse,
                     needs_cutting: false,
                     message: "Record not stored - grass does not need cutting",
                     estimated_height: (geminiData as any).estimated_height || null
                  });
               }


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

export default LandscapingService; 