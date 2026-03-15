import { BehaviorAlertType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class BehaviorAlertsService {
   protected static addBehaviorAlertService = async (behaviorAlert: BehaviorAlertType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { Id: behaviorAlert.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         const cameraExists = await db.park_cameras.findFirst({
            where: { Id: behaviorAlert.camera_Id },
         });
         if (!cameraExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
         }

         const result = await db.parks_behaviour_alerts.create({
            data: {
               ...behaviorAlert,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add behavior alert");
      }
   }

   protected static getBehaviorAlertsFiltersService = async () => {
      try {
         const parks = await db.parks.findMany({
            where: {
               parks_behaviour_alerts: {
                  some: {}
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

         const cameras = await db.park_cameras.findMany({
            where: {
               parks_behaviour_alerts: {
                  some: {}
               }
            },
            select: {
               Id: true,
               camera_Id: true,
               camera_english_name: true,
               camera_arabic_name: true
            },
            orderBy: { camera_english_name: 'asc' }
         });

         return {
            success: true,
            data: {
               parks: parks.map(p => ({
                  id: p.Id,
                  parkId: p.park_Id,
                  name_en: p.park_english_name,
                  name_ar: p.park_arabic_name
               })),
               cameras: cameras.map(c => ({
                  id: c.Id,
                  cameraId: c.camera_Id,
                  name_en: c.camera_english_name,
                  name_ar: c.camera_arabic_name
               }))
            }
         };
      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch behavior alerts filters");
      }
   };

   protected static viewBehaviorAlertsService = async (filters?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      fromDateTime?: string;
      toDateTime?: string;
      behaviour?: string;
      camera?: string;
      employee?: string;
      parkId?: number;
   }) => {

      try {
         // Build where clause for filtering
         const whereClause: any = {};

         // Search filter
         if (filters?.search) {
            whereClause.OR = [
               { detection_Id: { contains: filters.search, mode: 'insensitive' } },
               { location: { contains: filters.search, mode: 'insensitive' } },
               { description: { contains: filters.search, mode: 'insensitive' } },
               { parks: { park_english_name: { contains: filters.search, mode: 'insensitive' } } },
               { parks: { park_arabic_name: { contains: filters.search, mode: 'insensitive' } } }
            ];
         }

         // Behaviour filter (schema field is detected_behaviour)
         if (filters?.behaviour) {
            whereClause.detected_behaviour = filters.behaviour;
         }

         // Park filter
         if (filters?.parkId) {
            whereClause.park_Id = filters.parkId;
         }

         // Camera filter
         if (filters?.camera) {
            whereClause.camera_Id = parseInt(filters.camera);
         }

         // Employee filter
         if (filters?.employee) {
            whereClause.person_Id = filters.employee;
         }

         // Date range filter
         if (filters?.fromDateTime && filters?.toDateTime) {
            whereClause.detection_date = {
               gte: new Date(filters.fromDateTime),
               lte: new Date(filters.toDateTime)
            };
         }

         // Build order by clause - Sort by createdAt desc, then by Id desc for consistent ordering
         const orderByClause: any = [
            { createdAt: 'desc' },
            { Id: 'desc' }
         ];

         // Debug logging

         // Calculate pagination
         const skip = filters?.page && filters?.limit ? (filters.page - 1) * filters.limit : 0;
         const take = filters?.limit || 10;

         // Get total count for pagination metadata
         const totalCount = await db.parks_behaviour_alerts.count({ where: whereClause });

         // Get paginated results
         const results = await db.parks_behaviour_alerts.findMany({
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
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true,
                  }
               }
            },
            orderBy: orderByClause,
            skip: skip,
            take: take
         });

       

         // Enrich results with user information
         const enrichedResults = await Promise.all(
            results.map(async (alert) => {
               let userInfo = null;
               
               // If person_Id exists and is_employee is true, try to find user by emp_Id
               if (alert.person_Id && alert.is_employee) {
                  try {
                     userInfo = await db.users.findFirst({
                        where: {
                           emp_Id: alert.person_Id
                        },
                        select: {
                           Id: true,
                           emp_Id: true,
                           emp__eng_name: true,
                           emp__arabic_name: true,
                           gender: true,
                           image: true,
                           
                        }
                     });
                  } catch (userError) {
                     console.log('Error fetching user info:', userError);
                  }
               }

               return {
                  ...alert,
                  user: userInfo
               };
            })
         );

         // Calculate pagination metadata
         const totalPages = Math.ceil(totalCount / take);
         const hasNextPage = filters?.page ? filters.page < totalPages : false;
         const hasPreviousPage = filters?.page ? filters.page > 1 : false;

         const paginationData = {
            currentPage: filters?.page || 1,
            totalPages,
            totalCount,
            limit: take,
            hasNextPage,
            hasPreviousPage,
            nextPage: hasNextPage ? (filters?.page || 1) + 1 : null,
            previousPage: hasPreviousPage ? (filters?.page || 1) - 1 : null
         };

         // Calculate stats for cards from all filtered data (not just current page)
         const allDataForStats = await db.parks_behaviour_alerts.findMany({
            where: whereClause,
            select: {
               detected_behaviour: true
            }
         });

         const statsData = {
            totalEvents: allDataForStats.length,
            totalFallDowns: allDataForStats.filter(d => d.detected_behaviour === 'Fall Down').length,
            totalAggression: allDataForStats.filter(d => d.detected_behaviour === 'Aggression').length,
            totalFastMoving: allDataForStats.filter(d => d.detected_behaviour === 'Fast Moving').length,
            totalPeople: allDataForStats.filter(d => d.detected_behaviour === 'People Gethering').length
         };

         console.log('📊 Behavior alerts stats calculated:', statsData);

         return {
            success: true,
            data: enrichedResults,
            total: totalCount,
            pagination: paginationData,
            stats: statsData
         };

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch behavior alerts");
      }
   }
}

export default BehaviorAlertsService; 