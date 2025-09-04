import { ParkSentimentAnalysisType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";

class ParkSentimentAnalysisService {
   protected static addParkSentimentAnalysisService = async (sentimentAnalysis: ParkSentimentAnalysisType) => {
      console.log("🟢 [ParkSentimentAnalysisService] Adding new park sentiment analysis:", sentimentAnalysis);

      try {
         // Check if park exists
         const parkExists = await db.parks.findFirst({
            where: { Id: sentimentAnalysis.park_Id },
         });
         if (!parkExists) {
            console.error("❌ [ParkSentimentAnalysisService] Park not found with Id:", sentimentAnalysis.park_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }
         console.log("✅ [ParkSentimentAnalysisService] Park exists:", parkExists.park_english_name);

         // Check if entry camera exists
         const entryCameraExists = await db.park_cameras.findFirst({
            where: { Id: sentimentAnalysis.entry_camera_Id },
         });
         if (!entryCameraExists) {
            console.error("❌ [ParkSentimentAnalysisService] Entry camera not found with Id:", sentimentAnalysis.entry_camera_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Entry camera does not exist");
         }
         console.log("✅ [ParkSentimentAnalysisService] Entry camera exists:", entryCameraExists.camera_english_name);

         // Check if exit camera exists (if provided)
         if (sentimentAnalysis.exit_camera_Id) {
            const exitCameraExists = await db.park_cameras.findFirst({
               where: { Id: sentimentAnalysis.exit_camera_Id },
            });
            if (!exitCameraExists) {
               console.error("❌ [ParkSentimentAnalysisService] Exit camera not found with Id:", sentimentAnalysis.exit_camera_Id);
               throw new HttpException(STATUS.BAD_REQUEST, "Exit camera does not exist");
            }
            console.log("✅ [ParkSentimentAnalysisService] Exit camera exists:", exitCameraExists.camera_english_name);
         }

         const result = await db.parks_sentiment_analysis.create({
            data: {
               ...sentimentAnalysis,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [ParkSentimentAnalysisService] Park sentiment analysis saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [ParkSentimentAnalysisService] Error adding park sentiment analysis:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add park sentiment analysis");
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