import { IntrusionDetectionType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class IntrusionDetectionService {
   protected static addIntrusionDetectionService = async (intrusionDetection: IntrusionDetectionType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { Id: intrusionDetection.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         const cameraExists = await db.park_cameras.findFirst({
            where: { Id: intrusionDetection.camera_Id },
         });
         if (!cameraExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
         }

         const result = await db.parks_intrusion_detection.create({
            data: {
               park_Id: intrusionDetection.park_Id,
               location: intrusionDetection.location,
               camera_Id: intrusionDetection.camera_Id,
               occurrence_date: intrusionDetection.occurrence_date || new Date(),
               occurrence_time: intrusionDetection.occurrence_time || new Date(),
               snap_shot: intrusionDetection.snap_shot,
               posted_to_intranet_date: intrusionDetection.posted_to_intranet_date,
               posted_to_intranet_time: intrusionDetection.posted_to_intranet_time,
               detection_Id: intrusionDetection.detection_Id || `INTRUSION_${Date.now()}_${Math.random().toString(36).substring(7)}`,
               detection_date: intrusionDetection.detection_date || new Date(),
               detection_time: intrusionDetection.detection_time || new Date(),
               description: intrusionDetection.description || `Intrusion activity detected in ${intrusionDetection.location}`,
               is_employee: intrusionDetection.is_employee || false,
               current_status: intrusionDetection.current_status || 'pending',
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add intrusion detection");
      }
   }

   protected static viewIntrusionDetectionsService = async (paginationParams?: {
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
            const results = await db.parks_intrusion_detection.findMany({
               include: {
                  parks: {
                     select: {
                        Id: true,
                        park_Id: true,
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
                  intranet_posting_history: {
                     select: {
                        id: true,
                        title: true,
                        intranet_id: true,
                        comments: true,
                        date: true,
                        time: true
                     },
                     orderBy: {
                        id: 'desc'
                     }
                  }
               },
               orderBy: {
                  createdAt: 'desc'
               }
            });

            return results;
         }

         const whereClause: any = {};

         if (paginationParams.search) {
            whereClause.OR = [
               { location: { contains: paginationParams.search, mode: 'insensitive' } },
               { description: { contains: paginationParams.search, mode: 'insensitive' } },
               { detection_Id: { contains: paginationParams.search, mode: 'insensitive' } },
               { parks: { park_english_name: { contains: paginationParams.search, mode: 'insensitive' } } },
               { parks: { park_arabic_name: { contains: paginationParams.search, mode: 'insensitive' } } }
            ];
         }

         if (paginationParams.status) {
            whereClause.current_status = paginationParams.status;
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

         const totalCount = await db.parks_intrusion_detection.count({ where: whereClause });

         const results = await db.parks_intrusion_detection.findMany({
            where: whereClause,
            include: {
               parks: {
                  select: {
                     Id: true,
                     park_Id: true,
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
               intranet_posting_history: {
                  select: {
                     id: true,
                     title: true,
                     intranet_id: true,
                     comments: true,
                     date: true,
                     time: true
                  },
                  orderBy: {
                     id: 'desc'
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

         const allDataForStats = await db.parks_intrusion_detection.findMany({
            where: whereClause,
            select: {
               current_status: true
            }
         });

         const statusValues = allDataForStats.map(item => item.current_status);
         const uniqueStatuses = Array.from(new Set(statusValues));

         const stats = {
            pending: allDataForStats.filter(
               item => {
                  const status = item.current_status?.toLowerCase()?.trim();
                  return status && status !== 'under process' && 
                         status !== 'open' && 
                         status !== 'in progress' && 
                         status !== 'closed' && 
                         status !== 'resolved' && 
                         status !== 'completed';
               }
            ).length,
            underProcess: allDataForStats.filter(
               item => {
                  const status = item.current_status?.toLowerCase()?.trim();
                  return !status || status === '' || 
                         status === 'under process' || 
                         status === 'in progress' || 
                         status === 'open';
               }
            ).length,
            completed: allDataForStats.filter(
               item => {
                  const status = item.current_status?.toLowerCase()?.trim();
                  return status === 'closed' || 
                         status === 'resolved' || 
                         status === 'completed';
               }
            ).length,
            total: allDataForStats.length
         };

         return {
            data: results,
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
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch intrusion detections");
      }
   }

   protected static getIntrusionDetectionByIdService = async (detectionId: number) => {

      try {
         const detection = await db.parks_intrusion_detection.findUnique({
            where: { Id: detectionId },
            include: {
               parks: {
                  select: {
                     Id: true,
                     park_Id: true,
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
               intranet_posting_history: {
                  select: {
                     id: true,
                     title: true,
                     intranet_id: true,
                     comments: true,
                     date: true,
                     time: true
                  }
               }
            }
         });

         if (!detection) {
            throw new HttpException(STATUS.NOT_FOUND, "Intrusion detection not found");
         }

         return detection;

      } catch (error: any) {
         if (error instanceof HttpException) throw error;
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch intrusion detection");
      }
   }

   protected static updateIntrusionDetectionService = async (detectionId: number, updateData: Partial<IntrusionDetectionType>) => {

      try {
         const updatedDetection = await db.parks_intrusion_detection.update({
            where: { Id: detectionId },
            data: {
               ...updateData,
               updatedAt: new Date()
            }
         });

         return updatedDetection;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to update intrusion detection");
      }
   }
}

export default IntrusionDetectionService;
