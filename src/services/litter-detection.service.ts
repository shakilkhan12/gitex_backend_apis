import { LitterDetectionType, LitterDetectionCompleteType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import axios from "axios";
import { formatImageUrlsInArray } from "@/utils/imageUrl.utils";

class LitterDetectionService {
   protected static addLitterDetectionService = async (litterDetection: LitterDetectionType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { park_Id: litterDetection.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         let cameraDatabaseId = null;
         if (litterDetection.camera_Id) {
            const cameraExists = await db.park_cameras.findFirst({
               where: { camera_Id: litterDetection.camera_Id },
            });
            if (!cameraExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
            }
            cameraDatabaseId = cameraExists.Id;

            const existingRecord = await db.parks_litter_detection.findFirst({
               where: {
                  camera_Id: cameraDatabaseId,
                  current_status: {
                     not: "complete"
                  }
               }
            });
            
            if (existingRecord) {
               throw new HttpException(STATUS.BAD_REQUEST, "Active litter detection case already exists for this camera. Please complete the existing case before creating a new one.");
            }
         }

         const occurrenceDate = new Date(litterDetection.occurrence_date);
         const occurrenceTime = new Date(`1970-01-01T${litterDetection.occurrence_time}Z`);
         const detectionDate = litterDetection.detection_date ? new Date(litterDetection.detection_date) : new Date();
         const detectionTime = litterDetection.detection_time ? new Date(`1970-01-01T${litterDetection.detection_time}Z`) : new Date();

         const result = await db.parks_litter_detection.create({
            data: {
               park_Id: parkExists.Id,
               case_Id: litterDetection.case_Id,
               location: litterDetection.location,
               occurrence_date: occurrenceDate,
               occurrence_time: occurrenceTime,
               snap_shot: litterDetection.snap_shot,
               status: litterDetection.status,
               detection_Id: litterDetection.detection_Id,
               detection_date: detectionDate,
               detection_time: detectionTime,
               description: litterDetection.description,
               current_status: litterDetection.current_status,
               camera_Id: cameraDatabaseId,
               after_image: litterDetection.after_image,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         const ticketDetails = await db.ticket_details_table.create({
            data: {
               litterDetectionId: result.Id,
               status: 'Pending',
               date: result.occurrence_date,
               time: result.occurrence_time,
               comments: result.description,
               image: result.snap_shot,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });


         return result;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add litter detection");
      }
   }

   protected static viewLitterDetectionsService = async (paginationParams?: {
      page: number;
      limit: number;
      search: string;
      status: string;
      sortBy: string;
      sortOrder: string;
      startDate?: string;
      endDate?: string;
   }) => {

      try {
         if (!paginationParams) {
            const results = await db.parks_litter_detection.findMany({
               include: {
                  parks: {
                     select: {
                        park_english_name: true,
                        park_arabic_name: true,
                        latitude: true,
                        longitude: true
                     }
                  },
                  park_cameras: {
                     select: {
                        Id: true,
                        camera_Id: true,
                        camera_english_name: true,
                        camera_arabic_name: true,
                        ip_address: true,
                        latitude: true,
                        longitude: true,
                        status: true
                     }
                  },
                  assignedUser: {
                     select: {
                        Id: true,
                        emp__eng_name: true,
                        emp__arabic_name: true,
                        dep_eng_name: true,
                        dep_arabic_name: true
                     }
                  },
                  ticket_details: {
                     select: {
                        id: true,
                        status: true,
                        date: true,
                        time: true,
                        comments: true,
                        image: true,
                        abc1: true,
                        abc2: true,
                        abc3: true,
                        abc4: true,
                        litterDetectionId: true,
                        createdAt: true,
                        updatedAt: true,
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

            const litterDetectionIds = results.map(ld => ld.Id.toString());
            
            const allIntranetHistory = await db.intranet_posting_history.findMany({
               where: {
                  OR: [
                     { abc1: { in: litterDetectionIds } },
                     { abc2: { in: litterDetectionIds } },
                     { abc3: { in: litterDetectionIds } }
                  ]
               },
               select: {
                  id: true,
                  title: true,
                  intranet_id: true,
                  comments: true,
                  date: true,
                  time: true,
                  abc1: true,
                  abc2: true,
                  abc3: true
               }
            });

            const intranetHistoryMap = new Map();
            allIntranetHistory.forEach(history => {
               const litterId = history.abc1 || history.abc2 || history.abc3;
               if (litterId) {
                  if (!intranetHistoryMap.has(litterId)) {
                     intranetHistoryMap.set(litterId, []);
                  }
                  intranetHistoryMap.get(litterId).push({
                     id: history.id,
                     title: history.title,
                     intranet_id: history.intranet_id,
                     comments: history.comments,
                     date: history.date,
                     time: history.time
                  });
               }
            });

            const resultsWithIntranetHistory = results.map(litterDetection => ({
               ...litterDetection,
               intranet_posting_history: intranetHistoryMap.get(litterDetection.Id.toString()) || []
            }));

            return resultsWithIntranetHistory;
         }

         const whereClause: any = {};
         
         if (paginationParams.search) {
            whereClause.OR = [
               { case_Id: { contains: paginationParams.search, mode: 'insensitive' } },
               { location: { contains: paginationParams.search, mode: 'insensitive' } },
               { description: { contains: paginationParams.search, mode: 'insensitive' } },
               { parks: { park_english_name: { contains: paginationParams.search, mode: 'insensitive' } } },
               { parks: { park_arabic_name: { contains: paginationParams.search, mode: 'insensitive' } } }
            ];
         }

         if (paginationParams.status) {
            whereClause.status = paginationParams.status;
         }

         if (paginationParams.startDate || paginationParams.endDate) {
            whereClause.occurrence_date = {};
            
            if (paginationParams.startDate) {
               whereClause.occurrence_date.gte = new Date(paginationParams.startDate);
            }
            
            if (paginationParams.endDate) {
               const endDate = new Date(paginationParams.endDate);
               endDate.setHours(23, 59, 59, 999);
               whereClause.occurrence_date.lte = endDate;
            }
         }

         const orderByClause: any = {};
         orderByClause[paginationParams.sortBy] = paginationParams.sortOrder;

         const skip = (paginationParams.page - 1) * paginationParams.limit;

         const totalCount = await db.parks_litter_detection.count({ where: whereClause });

         const results = await db.parks_litter_detection.findMany({
            where: whereClause,
            include: {
               parks: {
                  select: {
                     park_english_name: true,
                     park_arabic_name: true,
                     latitude: true,
                     longitude: true
                  }
               },
               park_cameras: {
                  select: {
                     Id: true,
                     camera_Id: true,
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true,
                     latitude: true,
                     longitude: true,
                     status: true
                  }
               },
               assignedUser: {
                  select: {
                     Id: true,
                     emp__eng_name: true,
                     emp__arabic_name: true,
                     dep_eng_name: true,
                     dep_arabic_name: true
                  }
               },
               ticket_details: {
                  select: {
                     id: true,
                     status: true,
                     date: true,
                     time: true,
                     comments: true,
                     image: true,
                     abc1: true,
                     abc2: true,
                     abc3: true,
                     abc4: true,
                     litterDetectionId: true,
                     createdAt: true,
                     updatedAt: true,
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

         const litterDetectionIds = results.map(ld => ld.Id.toString());
         
         const allIntranetHistory = await db.intranet_posting_history.findMany({
            where: {
               OR: [
                  { abc1: { in: litterDetectionIds } },
                  { abc2: { in: litterDetectionIds } },
                  { abc3: { in: litterDetectionIds } }
               ]
            },
            select: {
               id: true,
               title: true,
               intranet_id: true,
               comments: true,
               date: true,
               time: true,
               abc1: true,
               abc2: true,
               abc3: true
            }
         });

         const intranetHistoryMap = new Map();
         allIntranetHistory.forEach(history => {
            const litterId = history.abc1 || history.abc2 || history.abc3;
            if (litterId) {
               if (!intranetHistoryMap.has(litterId)) {
                  intranetHistoryMap.set(litterId, []);
               }
               intranetHistoryMap.get(litterId).push({
                  id: history.id,
                  title: history.title,
                  intranet_id: history.intranet_id,
                  comments: history.comments,
                  date: history.date,
                  time: history.time
               });
            }
         });

         const resultsWithIntranetHistory = results.map(litterDetection => ({
            ...litterDetection,
            intranet_posting_history: intranetHistoryMap.get(litterDetection.Id.toString()) || []
         }));

         const totalPages = Math.ceil(totalCount / paginationParams.limit);
         const hasNextPage = paginationParams.page < totalPages;
         const hasPreviousPage = paginationParams.page > 1;

         const allDataForStats = await db.parks_litter_detection.findMany({
            where: whereClause,
            select: {
               assinged_to: true,
               status: true
            }
         });

         const stats = {
            unassigned: allDataForStats.filter(
               item => !item.assinged_to || 
                      (item.status && (item.status.toLowerCase() === 'pending' || item.status.toLowerCase() === 'open'))
            ).length,
            underProcess: allDataForStats.filter(
               item =>
                  item.assinged_to && 
                  item.status &&
                  !['completed', 'cleaned', 'closed', 'resolved'].includes(item.status.toLowerCase())
            ).length,
            completed: allDataForStats.filter(
               item =>
                  item.status &&
                  ['completed', 'cleaned', 'closed', 'resolved'].includes(item.status.toLowerCase())
            ).length,
            total: allDataForStats.length
         };

         const imageFields = ['snap_shot', 'after_image'];
         const formattedResultsWithImages = formatImageUrlsInArray(resultsWithIntranetHistory, imageFields);

         return {
            data: formattedResultsWithImages,
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
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch litter detections");
      }
   }

   public static assignLitterDetectionService = async (assignmentData: {
      litterDetectionId: number;
      userId: number;
      title: string;
      comments: string;
   }) => {
      try {
         const litterDetection = await db.parks_litter_detection.findFirst({
            where: { Id: assignmentData.litterDetectionId }
         });

         if (!litterDetection) {
            throw new HttpException(STATUS.NOT_FOUND, "Litter detection record not found");
         }

         const user = await db.users.findFirst({
            where: { 
               Id: assignmentData.userId,
               litter_detection_access: true
            }
         });

         if (!user) {
            throw new HttpException(STATUS.BAD_REQUEST, "User not found or doesn't have litter detection access");
         }

         await db.parks_litter_detection.update({
            where: { Id: assignmentData.litterDetectionId },
            data: { assinged_to: assignmentData.userId, status:"In Progress" }
         });

         const currentDate = new Date();
         const currentTime = new Date(`1970-01-01T${currentDate.toTimeString().split(' ')[0]}Z`);
         
         const ticketRecord = await db.ticket_details_table.create({
            data: {
               litterDetectionId: assignmentData.litterDetectionId,
               user_Id: assignmentData.userId,
               status: 'Assigned',
               comments: "Case Assigned",
               date: currentDate,
               time: currentTime,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });


         return {
            litterDetectionId: assignmentData.litterDetectionId,
            userId: assignmentData.userId,
            ticketId: ticketRecord.id
         };

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to assign litter detection");
      }
   }

   protected static completeLitterDetectionService = async (litterDetectionComplete: LitterDetectionCompleteType) => {
      try {
         
         const litterDetection = await db.parks_litter_detection.findUnique({
            where: { Id: litterDetectionComplete.id },
            include: {
               parks: {
                  select: {
                     park_english_name: true,
                     park_arabic_name: true,
                     latitude: true,
                     longitude: true
                  }
               },
               park_cameras: {
                  select: {
                     camera_Id: true,
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true
                  }
               }
            }
         });
         
         
         if (!litterDetection) {
            throw new HttpException(STATUS.NOT_FOUND, "Litter detection record not found");
         }

         if (litterDetection.status === "complete") {
            return {
               message: "Case already closed",
               litterDetection,
               ticketDetails: null
            };
         }

         const currentDate = new Date();
         const currentTime = new Date();

         let verificationResult = null;
         if (litterDetection.park_cameras?.camera_Id) {
            try {
               
               const verificationResponse = await axios.post('http://localhost:5000/verify-cleanup', {
                  camera_id: litterDetection.park_cameras.camera_Id,
                  status: "pending"
               }, {
                  headers: {
                     'Content-Type': 'application/json'
                  },
                  timeout: 30000 
               });

               verificationResult = verificationResponse.data; 

            } catch (verificationError: any) {
               verificationResult = null;
            }
         }

         if (verificationResult && verificationResult.success) {
            if (verificationResult.status === "True") {
               
         const updatedLitterDetection = await db.parks_litter_detection.update({
            where: { Id: litterDetection.Id },
            data: {
               status: "complete",
               current_status: "complete",
                     after_image: verificationResult.frame_url,
               updatedAt: new Date()
            },
            include: {
               parks: {
                  select: {
                     park_english_name: true,
                     park_arabic_name: true,
                     latitude: true,
                     longitude: true
                  }
               },
               park_cameras: {
                  select: {
                           camera_Id: true,
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true
                  }
               }
            }
         });

               const ticketDetails = await db.ticket_details_table.create({
                  data: {
                     litterDetectionId: litterDetection.Id,
                     user_Id: litterDetectionComplete.userId,
                     status: "Completed",
                     date: currentDate,
                     time: currentTime,
                     comments: verificationResult.message,
                     image: verificationResult.frame_url,
                     createdAt: new Date(),
                     updatedAt: new Date()
                  }
               });

         return {
            litterDetection: updatedLitterDetection,
                  ticketDetails,
                  verificationResult
               };

            } else if (verificationResult.status === "Incomplete") {
               
               const ticketDetails = await db.ticket_details_table.create({
                  data: {
                     litterDetectionId: litterDetection.Id,
                     user_Id: litterDetectionComplete.userId,
                     status: "AI Verification Failed",
                     date: currentDate,
                     time: currentTime,
                     comments: `AI Verification Failed: ${verificationResult.message}. Detection count: ${verificationResult.detection_count}`,
                     image: verificationResult.frame_url,
                     createdAt: new Date(),
                     updatedAt: new Date()
                  }
               });

               return {
                  litterDetection,
                  ticketDetails,
                  verificationResult,
                  message: "AI verification failed - litter still detected"
               };
            }
         }
      } catch (error) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to complete litter detection");
      }
   }
}

export default LitterDetectionService; 