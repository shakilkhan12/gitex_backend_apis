import { ParkSentimentAnalysisType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import { formatTimeFetchFromFullDate } from "./office-sentiment-analysis.service";
import { formatImageUrlsInArray } from "@/utils/imageUrl.utils";
import UserService from "./user.service";

class ParkSentimentAnalysisService {
   protected static addParkSentimentAnalysisService = async (sentimentAnalysis: ParkSentimentAnalysisType) => {

      try {

         const parkExists = await db.parks.findFirst({
            where: { park_Id: sentimentAnalysis.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         const entryCameraExists = await db.park_cameras.findFirst({
            where: { camera_Id: sentimentAnalysis.entry_camera_Id },
         });
         if (!entryCameraExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Entry camera does not exist");
         }

         // Find user by emp_Id and get the user's Id
         const user = await db.users.findFirst({
            where: { emp_Id: sentimentAnalysis.person_Id },
         });

         // Format date and time properly for database
         const checkInDate = new Date(sentimentAnalysis.check_in_date);
         const checkInTime = new Date(`1970-01-01T${sentimentAnalysis.check_in_time}Z`);

         const createData: any = {
            person_Id: user ? user.Id.toString() : null,
            detection_Id: sentimentAnalysis.detection_Id,
            sentiment_of: user ? 'employee' : 'visitor',
            person_name: user ? user.emp__eng_name : 'Visitor',
            person_image: user ? user.image : '',
            gender: sentimentAnalysis.gender,
            check_in_image: sentimentAnalysis.check_in_image,
            check_in_date: checkInDate,
            check_in_time: checkInTime,
            check_in_sentiment: sentimentAnalysis.check_in_sentiment,
            park_Id: parkExists.Id,
            entry_camera_Id: entryCameraExists.Id,
            createdAt: new Date(),
            updatedAt: new Date()
         };


         const result = await db.parks_sentiment_analysis.create({
            data: createData,
         });

         console.log("🎉 [ParkSentimentAnalysisService] Park sentiment analysis saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [ParkSentimentAnalysisService] Error adding park sentiment analysis:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add park sentiment analysis");
      }
   }

   protected static updateParkSentimentAnalysisService = async (detection_Id: string, updateData: Partial<ParkSentimentAnalysisType>) => {
      try {
         // Find the park sentiment analysis by detection_Id
         const existingSentiment = await db.parks_sentiment_analysis.findFirst({
            where: { detection_Id: detection_Id },
         });

         if (!existingSentiment) {
            throw new HttpException(STATUS.NOT_FOUND, "Park sentiment analysis not found with the provided detection ID");
         }

         // Prepare update data, excluding detection_Id from updates
         const { detection_Id: _, ...updateFields } = updateData;

         // Prepare the update data object
         const updateDataForDb: any = {
            updatedAt: new Date()
         };

         // Handle each field individually to ensure proper type conversion
         if (updateFields.person_Id !== undefined) updateDataForDb.person_Id = updateFields.person_Id;
         if (updateFields.sentiment_of !== undefined) updateDataForDb.sentiment_of = updateFields.sentiment_of;
         if (updateFields.check_in_date !== undefined) updateDataForDb.check_in_date = new Date(updateFields.check_in_date);
         if (updateFields.check_in_time !== undefined) updateDataForDb.check_in_time = new Date(`1970-01-01T${updateFields.check_in_time}Z`);
         if (updateFields.check_in_sentiment !== undefined) updateDataForDb.check_in_sentiment = updateFields.check_in_sentiment;
         if (updateFields.check_out_date !== undefined) updateDataForDb.check_out_date = new Date(updateFields.check_out_date);
         if (updateFields.check_out_time !== undefined) updateDataForDb.check_out_time = new Date(`1970-01-01T${updateFields.check_out_time}Z`);
         if (updateFields.check_out_capture !== undefined) updateDataForDb.check_out_capture = updateFields.check_out_capture;
         if (updateFields.person_name !== undefined) updateDataForDb.person_name = updateFields.person_name;
         if (updateFields.person_image !== undefined) updateDataForDb.person_image = updateFields.person_image;
         if (updateFields.gender !== undefined) updateDataForDb.gender = updateFields.gender;
         if (updateFields.check_in_image !== undefined) updateDataForDb.check_in_image = updateFields.check_in_image;
         if (updateFields.check_out_sentiment !== undefined) updateDataForDb.check_out_sentiment = updateFields.check_out_sentiment;

         // If park_Id is being updated, validate it exists
         if (updateFields.park_Id) {
            const parkExists = await db.parks.findFirst({
               where: { park_Id: updateFields.park_Id },
            });
            if (!parkExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
            }
            updateDataForDb.park_Id = parkExists.Id;
         }

         // If entry_camera_Id is being updated, validate it exists
         if (updateFields.entry_camera_Id) {
            const entryCameraExists = await db.park_cameras.findFirst({
               where: { camera_Id: updateFields.entry_camera_Id },
            });
            if (!entryCameraExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Entry camera does not exist");
            }
            updateDataForDb.entry_camera_Id = entryCameraExists.Id;
         }

         // If exit_camera_Id is being updated, validate it exists
         if (updateFields.exit_camera_Id) {
            const exitCameraExists = await db.park_cameras.findFirst({
               where: { camera_Id: updateFields.exit_camera_Id },
            });
            if (!exitCameraExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Exit camera does not exist");
            }
            updateDataForDb.exit_camera_Id = exitCameraExists.Id;
         }

         // Update the record
         const result = await db.parks_sentiment_analysis.update({
            where: { Id: existingSentiment.Id },
            data: updateDataForDb,
         });

         console.log("🎉 [ParkSentimentAnalysisService] Park sentiment analysis updated successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [ParkSentimentAnalysisService] Error updating park sentiment analysis:", error.message || error);
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to update park sentiment analysis");
      }
   }

   protected static viewParkSentimentAnalysesService = async (filters?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      fromDateTime?: string;
      toDateTime?: string;
      entryMood?: string;
      exitMood?: string;
      employeeId?: string;
      sentimentOf?: string;
   }) => {
      console.log("🟡 [ParkSentimentAnalysisService] Fetching park sentiment analyses with filters:", filters);

      try {
         // Build where clause for filtering
         const whereClause: any = {};

         // Search filter
         if (filters?.search) {
            whereClause.OR = [
               { person_name: { contains: filters.search, mode: 'insensitive' } },
               { parks: { park_english_name: { contains: filters.search, mode: 'insensitive' } } },
               { parks: { park_arabic_name: { contains: filters.search, mode: 'insensitive' } } }
            ];
         }

         // Date range filter
         if (filters?.fromDateTime || filters?.toDateTime) {
            whereClause.check_in_date = {};
            if (filters.fromDateTime) {
               whereClause.check_in_date.gte = new Date(filters.fromDateTime);
            }
            if (filters.toDateTime) {
               whereClause.check_in_date.lte = new Date(filters.toDateTime);
            }
         }

         // Entry mood filter
         if (filters?.entryMood && filters.entryMood !== 'All') {
            whereClause.check_in_sentiment = filters.entryMood;
         }

         // Exit mood filter
         if (filters?.exitMood && filters.exitMood !== 'All') {
            if (filters.exitMood === 'No Exit') {
               whereClause.check_out_sentiment = null;
            } else {
               whereClause.check_out_sentiment = filters.exitMood;
            }
         }

         // Employee ID filter
         if (filters?.employeeId) {
            // Find user by emp_Id to get the user Id
            const user = await db.users.findFirst({
               where: { emp_Id: filters.employeeId },
               select: { Id: true }
            });
            
            if (user) {
               whereClause.person_Id = user.Id.toString();
            } else {
               // If employee not found, return empty results
               whereClause.person_Id = 'NOT_FOUND';
            }
         }

         // Sentiment of filter (employee/visitor)
         if (filters?.sentimentOf && filters.sentimentOf !== 'All') {
            if (filters.sentimentOf === 'Employees') {
               whereClause.sentiment_of = 'employee';
            } else if (filters.sentimentOf === 'Guests') {
               whereClause.sentiment_of = 'visitor';
            }
         }

         // Build order by clause
         const orderByClause: any = {};
         if (filters?.sortBy) {
            const sortField = filters.sortBy === 'createdAt' ? 'createdAt' : 
                             filters.sortBy === 'check_in_date' ? 'check_in_date' :
                             filters.sortBy === 'check_out_date' ? 'check_out_date' :
                             filters.sortBy === 'person_name' ? 'person_name' :
                             filters.sortBy === 'check_in_sentiment' ? 'check_in_sentiment' :
                             filters.sortBy === 'check_out_sentiment' ? 'check_out_sentiment' : 'updatedAt';
            orderByClause[sortField] = filters.sortOrder === 'asc' ? 'asc' : 'desc';
         } else {
            orderByClause.updatedAt = 'desc';
         }

         // Set default pagination values
         const page = filters?.page || 1;
         const limit = filters?.limit || 10;
         const skip = (page - 1) * limit;

         // Get total count for pagination metadata
         const totalCount = await db.parks_sentiment_analysis.count({ where: whereClause });

         // Get paginated results
         const results = await db.parks_sentiment_analysis.findMany({
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
               park_cameras_parks_sentiment_analysis_entry_camera_IdTopark_cameras: {
                  select: {
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true
                  }
               },
               park_cameras_parks_sentiment_analysis_exit_camera_IdTopark_cameras: {
                  select: {
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true
                  }
               }
            },
            orderBy: orderByClause,
            skip: skip,
            take: limit
         });

         // Get all unique person IDs from results
         const personIds = Array.from(new Set(results.map(sentiment => sentiment.person_Id).filter(Boolean))) as string[];
         
         // Fetch all users in a single query
         const users = await db.users.findMany({
            where: { 
               Id: { 
                  in: personIds.map(id => parseInt(id)).filter(id => !isNaN(id))
               } 
            },
            include: {
               users_roles: {
                  select: {
                     role_name: true
                  }
               }
            }
         });
         
         // Create a map for quick user lookup
         const userMap = new Map(users.map(user => [user.Id.toString(), user]));

         // Get user details for each sentiment analysis record
         const sentimentWithUsers = results.map((sentiment) => {
               // Find the user from the map
               const user = sentiment.person_Id ? userMap.get(sentiment.person_Id) : null;

               return {
                  ...sentiment,
                  user: user ? {
                     Id: user.Id,
                     user_Id: user.user_Id,
                     emp_Id: user.emp_Id,
                     image: user.image ? formatImageUrlsInArray([{ image: user.image }], ['image'])[0].image : null,
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
                  } : null
               };
            });

         // Format the dates and times
         const formattedResults = sentimentWithUsers.map(sentiment => ({
            ...sentiment,
            check_in_date: formatDate(sentiment.check_in_date),
            check_in_time: formatTimeFetchFromFullDate(sentiment.check_in_time),
            check_out_date: formatDate(sentiment.check_out_date),
            check_out_time: formatTimeFetchFromFullDate(sentiment.check_out_time)
         }));

         const totalPages = Math.ceil(totalCount / limit);
         const hasNextPage = page < totalPages;
         const hasPreviousPage = page > 1;

         const paginationData = {
            currentPage: page,
            totalPages,
            totalCount,
            limit: limit,
            hasNextPage,
            hasPreviousPage,
            nextPage: hasNextPage ? page + 1 : null,
            previousPage: hasPreviousPage ? page - 1 : null
         };

         // Calculate stats for cards (get all filtered data for stats calculation)
         const allDataForStats = await db.parks_sentiment_analysis.findMany({
            where: whereClause,
            select: {
               check_in_sentiment: true,
               check_out_sentiment: true
            }
         });

         const statsData = {
            totalEvents: allDataForStats.length,
            totalHappy: allDataForStats.filter(d => d.check_in_sentiment === 'happy').length,
            totalNormal: allDataForStats.filter(d => d.check_in_sentiment === 'neutral').length,
            totalSad: allDataForStats.filter(d => d.check_in_sentiment === 'sad').length,
            totalAngry: allDataForStats.filter(d => d.check_in_sentiment === 'angry').length
         };

         
         const imageFields = ['check_in_image', 'check_out_capture', 'image'];
         const formattedResultsWithImages = formatImageUrlsInArray(formattedResults, imageFields);
         return {
            success: true,
            data: formattedResultsWithImages,
            total: totalCount,
            pagination: paginationData,
            stats: statsData
         };

      } catch (error: any) {
         console.error("💥 [ParkSentimentAnalysisService] Error fetching park sentiment analyses:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch park sentiment analyses");
      }
   }

   protected static getParkSentimentAnalysisFiltersService = async () => {
      try {
         const userFiltersResult = await UserService.getUsersFiltersService();
         
         return {
            success: true,
            data: {
               employees: userFiltersResult.data.employees
            }
         };
      } catch (error) {
         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            "Failed to fetch park sentiment analysis filters"
         );
      }
   };
}

export default ParkSentimentAnalysisService; 