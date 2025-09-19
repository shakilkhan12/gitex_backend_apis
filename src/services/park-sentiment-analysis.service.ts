import { ParkSentimentAnalysisType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";

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

   protected static viewParkSentimentAnalysesService = async () => {
      console.log("🟡 [ParkSentimentAnalysisService] Fetching all park sentiment analyses...");

      try {
         const results = await db.parks_sentiment_analysis.findMany({
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
            orderBy: {
               createdAt: 'desc'
            }
         });

         // Get user details for each sentiment analysis record
         const sentimentWithUsers = await Promise.all(
            results.map(async (sentiment) => {
               // Find the user by emp_Id (which should match person_Id)
               const user = await db.users.findFirst({
                  where: { emp_Id: sentiment.person_Id },
                  include: {
                     users_roles: {
                        select: {
                           role_name: true
                        }
                     }
                  }
               });

               return {
                  ...sentiment,
                  user: user ? {
                     Id: user.Id,
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
                  } : null
               };
            })
         );

         // Format the dates and times
         const formattedResults = sentimentWithUsers.map(sentiment => ({
            ...sentiment,
            check_in_date: formatDate(sentiment.check_in_date),
            check_in_time: formatTime(sentiment.check_in_time),
            check_out_date: formatDate(sentiment.check_out_date),
            check_out_time: formatTime(sentiment.check_out_time)
         }));

         console.log(`📦 [ParkSentimentAnalysisService] Retrieved ${formattedResults.length} park sentiment analyses with user details.`);
         return formattedResults;

      } catch (error: any) {
         console.error("💥 [ParkSentimentAnalysisService] Error fetching park sentiment analyses:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch park sentiment analyses");
      }
   }
}

export default ParkSentimentAnalysisService; 