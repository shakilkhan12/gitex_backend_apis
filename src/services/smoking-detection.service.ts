import { SmokingDetectionType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import axios from "axios";
import https from "https";

class SmokingDetectionService {
   protected static addSmokingDetectionService = async (smokingDetection: SmokingDetectionType) => {
      try {
         console.log('🔍 Looking for park with park_Id:', smokingDetection.park_Id);
         const parkExists = await db.parks.findFirst({
            where: { park_Id: smokingDetection.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         let cameraDatabaseId = null;
         if (smokingDetection.camera_Id) {
            const cameraExists = await db.park_cameras.findFirst({
               where: { camera_Id: smokingDetection.camera_Id },
            });
            if (!cameraExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
            }
            cameraDatabaseId = cameraExists.Id;
         }


         // Format date and time properly for database with consistent timestamps
         const currentTimestamp = new Date();
         const currentTimeString = new Date().toTimeString().split(' ')[0]; // Get HH:MM:SS format
         const occurrenceDate = new Date(smokingDetection.occurrence_date);
         const occurrenceTime = new Date(`1970-01-01T${smokingDetection.occurrence_time}Z`);
         const detectionDate = smokingDetection.detection_date ? new Date(smokingDetection.detection_date) : currentTimestamp;
         const detectionTime = smokingDetection.detection_time ? new Date(`1970-01-01T${smokingDetection.detection_time}Z`) : new Date(`1970-01-01T${currentTimeString}Z`);

         const result = await db.parks_smoking_detection.create({
            data: {
               park_Id: parkExists.Id,
               location: smokingDetection.location,
               camera_Id: cameraDatabaseId,
               occurrence_date: occurrenceDate,
               occurrence_time: occurrenceTime,
               snap_shot: smokingDetection.snap_shot,
               detection_Id: smokingDetection.detection_Id,
               detection_date: detectionDate,
               detection_time: detectionTime,
               description: smokingDetection.description || `Smoking activity detected in ${smokingDetection.location}`,
               is_employee: smokingDetection.is_employee || false,
               current_status: smokingDetection.current_status || 'pending',
               createdAt: currentTimestamp,
               updatedAt: currentTimestamp
            },
         });


         let intranetHistory = null;
         let intranetResponse = null;
         let intranetSuccess = false;
         let intranetError: any = null;
         
         try {
            intranetResponse = await this.postToIntranetAPI(parkExists, smokingDetection);
            intranetSuccess = true;
         } catch (error: any) {
            intranetError = error;
            intranetSuccess = false;
         }

         try {
            // Use consistent date/time for intranet posting
            const currentDate = new Date();
            const currentTime = new Date(`1970-01-01T${new Date().toTimeString().split(' ')[0]}Z`);
            
            intranetHistory = await db.intranet_posting_history.create({
               data: {
                  smokingDetectionId: result.Id,
                  title: `Alert Posted to Intranet`,
                  intranet_id: intranetSuccess ? intranetResponse?.ApplicationNumber : null,
                  comments: intranetSuccess 
                     ? `Smoking detected at ${smokingDetection.location} - Posted successfully to intranet`
                     : ``,
                  date: currentDate,
                  time: currentTime,
               }
            });

            if (intranetSuccess) {
               const updatedResult = await db.parks_smoking_detection.update({
                  where: { Id: result.Id },
                  data: {
                     posted_to_intranet_date: currentDate,
                     posted_to_intranet_time: currentTime,
                     updatedAt: new Date()
                  }
               });
               return updatedResult;
            } else {
               return result;
            }

         } catch (historyError: any) {
            return result;
         }

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, error);
      }
   }

   protected static viewSmokingDetectionsService = async (paginationParams?: {
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
         // If no pagination params provided, return all data (backward compatibility)
         if (!paginationParams) {
            const results = await db.parks_smoking_detection.findMany({
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

         // Date range filtering
         if (paginationParams.startDate || paginationParams.endDate) {
            whereClause.occurrence_date = {};
            
            if (paginationParams.startDate) {
               whereClause.occurrence_date.gte = new Date(paginationParams.startDate);
            }
            
            if (paginationParams.endDate) {
               // Set end date to end of day
               const endDate = new Date(paginationParams.endDate);
               endDate.setHours(23, 59, 59, 999);
               whereClause.occurrence_date.lte = endDate;
            }
         }

         // Build orderBy clause
         const orderByClause: any = {};
         orderByClause[paginationParams.sortBy] = paginationParams.sortOrder;

         // Calculate pagination
         const skip = (paginationParams.page - 1) * paginationParams.limit;

         // Get total count for pagination metadata
         const totalCount = await db.parks_smoking_detection.count({ where: whereClause });

         // Get paginated results
         const results = await db.parks_smoking_detection.findMany({
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

         // Calculate stats from ALL data (not just current page) for cards
         const allDataForStats = await db.parks_smoking_detection.findMany({
            where: whereClause,
            select: {
               current_status: true
            }
         });

         // Debug: Log unique status values to understand the data
         const statusValues = allDataForStats.map(item => item.current_status);
         const uniqueStatuses = Array.from(new Set(statusValues));
         console.log('🔍 [SmokingDetectionService] Unique status values:', uniqueStatuses);

         const stats = {
            pending: allDataForStats.filter(
               item => {
                  const status = item.current_status?.toLowerCase()?.trim();
                  // Pending: has a status but it's not under process, open, in progress, closed, resolved, or completed
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
                  // Under Process: null, empty, or explicitly "under process", "in progress", "open"
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

         console.log('🔍 [SmokingDetectionService] Calculated stats:', stats);

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
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch smoking detections");
      }
   }

   protected static getSmokingDetectionByIdService = async (detectionId: number) => {

      try {
         const detection = await db.parks_smoking_detection.findUnique({
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
            throw new HttpException(STATUS.NOT_FOUND, "Smoking detection not found");
         }

         return detection;

      } catch (error: any) {
         if (error instanceof HttpException) throw error;
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch smoking detection");
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

   private static async postToIntranetAPI(parkExists: any, smokingDetection: SmokingDetectionType): Promise<any> {
      try {
         const secretKey = await this.fetchSecretFromAPI();
         const endpoint = "https://192.168.164.7/website_demo/middleware/?class=general&action=ParkViolationFineService";
         const payload = {
            SecretKey: secretKey,
            Lang: "en",
            ParkName: parkExists.park_english_name,
            Photo: smokingDetection.snap_shot,
            EventID:'1'
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
         console.log('response',response);
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

   // Get statistics for smoking detection cards
   protected static getSmokingDetectionStatsService = async () => {
      try {
         // Get counts for each status without fetching all data
         const [pendingCount, underProcessCount, completedCount, totalCount] = await Promise.all([
            db.parks_smoking_detection.count({
               where: {
                  current_status: {
                     notIn: ['under process', 'open', 'in progress', 'closed', 'resolved', 'completed']
                  }
               }
            }),
            db.parks_smoking_detection.count({
               where: {
                  current_status: {
                     in: ['under process', 'in progress', 'open']
                  }
               }
            }),
            db.parks_smoking_detection.count({
               where: {
                  current_status: {
                     in: ['closed', 'resolved', 'completed']
                  }
               }
            }),
            db.parks_smoking_detection.count()
         ]);

         return {
            pending: pendingCount,
            underProcess: underProcessCount,
            completed: completedCount,
            total: totalCount
         };
      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, `Failed to get smoking detection stats: ${error.message}`);
      }
   }

}

export default SmokingDetectionService;
