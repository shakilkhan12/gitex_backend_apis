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
   }) => {
      try {
         // If no pagination params provided, return all data (backward compatibility)
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

         // Build where clause for filtering
         const whereClause: any = {};

         // Search functionality
         if (paginationParams.search) {
            whereClause.OR = [
               { location: { contains: paginationParams.search, mode: 'insensitive' } },
               { description: { contains: paginationParams.search, mode: 'insensitive' } },
               { detection_Id: { contains: paginationParams.search, mode: 'insensitive' } },
               { parks: { park_english_name: { contains: paginationParams.search, mode: 'insensitive' } } },
               { parks: { park_arabic_name: { contains: paginationParams.search, mode: 'insensitive' } } }
            ];
         }

         // Status filtering
         if (paginationParams.status) {
            whereClause.current_status = paginationParams.status;
         }

         // Build orderBy clause
         const orderByClause: any = {};
         orderByClause[paginationParams.sortBy] = paginationParams.sortOrder;

         // Calculate pagination
         const skip = (paginationParams.page - 1) * paginationParams.limit;

         // Get total count for pagination metadata
         const totalCount = await db.parks_intrusion_detection.count({ where: whereClause });

         // Get paginated results
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

         // Calculate pagination metadata
         const totalPages = Math.ceil(totalCount / paginationParams.limit);
         const hasNextPage = paginationParams.page < totalPages;
         const hasPreviousPage = paginationParams.page > 1;

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
            }
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
