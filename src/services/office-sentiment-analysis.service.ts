import { OfficeSentimentAnalysisType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";

class OfficeSentimentAnalysisService {
   protected static addOfficeSentimentAnalysisService = async (sentimentAnalysis: OfficeSentimentAnalysisType) => {
      console.log("🟢 [OfficeSentimentAnalysisService] Adding new office sentiment analysis:", sentimentAnalysis);

      try {
         // Check if office exists
         const officeExists = await db.offices.findFirst({
            where: { Id: sentimentAnalysis.office_Id },
         });
         if (!officeExists) {
            console.error("❌ [OfficeSentimentAnalysisService] Office not found with Id:", sentimentAnalysis.office_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Office does not exist");
         }
         console.log("✅ [OfficeSentimentAnalysisService] Office exists:", officeExists.office_english_name);

         // Check if entry camera exists
         const entryCameraExists = await db.offices_cameras.findFirst({
            where: { Id: sentimentAnalysis.entry_camera_Id },
         });
         if (!entryCameraExists) {
            console.error("❌ [OfficeSentimentAnalysisService] Entry camera not found with Id:", sentimentAnalysis.entry_camera_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Entry camera does not exist");
         }
         console.log("✅ [OfficeSentimentAnalysisService] Entry camera exists:", entryCameraExists.camera_english_name);

         // Check if exit camera exists (if provided)
         if (sentimentAnalysis.exit_camera_Id) {
            const exitCameraExists = await db.offices_cameras.findFirst({
               where: { Id: sentimentAnalysis.exit_camera_Id },
            });
            if (!exitCameraExists) {
               console.error("❌ [OfficeSentimentAnalysisService] Exit camera not found with Id:", sentimentAnalysis.exit_camera_Id);
               throw new HttpException(STATUS.BAD_REQUEST, "Exit camera does not exist");
            }
            console.log("✅ [OfficeSentimentAnalysisService] Exit camera exists:", exitCameraExists.camera_english_name);
         }

         const result = await db.offices_sentiment_analysis.create({
            data: {
               ...sentimentAnalysis,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [OfficeSentimentAnalysisService] Office sentiment analysis saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [OfficeSentimentAnalysisService] Error adding office sentiment analysis:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add office sentiment analysis");
      }
   }

   protected static viewOfficeSentimentAnalysesService = async () => {
      console.log("🟡 [OfficeSentimentAnalysisService] Fetching all office sentiment analyses...");

      try {
         const results = await db.offices_sentiment_analysis.findMany({
            include: {
               offices: {
                  select: {
                     office_english_name: true,
                     office_arabic_name: true,
                     latitude: true,
                     longitude: true
                  }
               },
               offices_cameras_offices_sentiment_analysis_entry_camera_IdTooffices_cameras: {
                  select: {
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true
                  }
               },
               offices_cameras_offices_sentiment_analysis_exit_camera_IdTooffices_cameras: {
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

         console.log(`📦 [OfficeSentimentAnalysisService] Retrieved ${formattedResults.length} office sentiment analyses with user details.`);
         return formattedResults;

      } catch (error: any) {
         console.error("💥 [OfficeSentimentAnalysisService] Error fetching office sentiment analyses:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch office sentiment analyses");
      }
   }
}

export default OfficeSentimentAnalysisService; 