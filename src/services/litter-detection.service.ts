import { LitterDetectionType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class LitterDetectionService {
   protected static addLitterDetectionService = async (litterDetection: LitterDetectionType) => {
      console.log("🟢 [LitterDetectionService] Adding new litter detection:", litterDetection);

      try {
         // Check if park exists
         const parkExists = await db.parks.findFirst({
            where: { Id: litterDetection.park_Id },
         });
         if (!parkExists) {
            console.error("❌ [LitterDetectionService] Park not found with Id:", litterDetection.park_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }
         console.log("✅ [LitterDetectionService] Park exists:", parkExists.park_english_name);

         const result = await db.parks_litter_detection.create({
            data: {
               ...litterDetection,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [LitterDetectionService] Litter detection saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [LitterDetectionService] Error adding litter detection:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add litter detection");
      }
   }

   protected static viewLitterDetectionsService = async () => {
      console.log("🟡 [LitterDetectionService] Fetching all litter detections...");

      try {
         const results = await db.parks_litter_detection.findMany({
            include: {
               parks: {
                  select: {
                     park_english_name: true,
                     park_arabic_name: true,
                     latitude: true,
                     longitude: true
                  }
               }
            },
            orderBy: {
               createdAt: 'desc'
            }
         });

         console.log(`📦 [LitterDetectionService] Retrieved ${results.length} litter detections.`);
         return results;

      } catch (error: any) {
         console.error("💥 [LitterDetectionService] Error fetching litter detections:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch litter detections");
      }
   }
}

export default LitterDetectionService; 