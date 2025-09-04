import { LandscapingType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class LandscapingService {
   protected static addLandscapingService = async (landscaping: LandscapingType) => {
      console.log("🟢 [LandscapingService] Adding new landscaping record:", landscaping);

      try {
         // Check if park exists
         const parkExists = await db.parks.findFirst({
            where: { Id: landscaping.park_Id },
         });
         if (!parkExists) {
            console.error("❌ [LandscapingService] Park not found with Id:", landscaping.park_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }
         console.log("✅ [LandscapingService] Park exists:", parkExists.park_english_name);

         const result = await db.parks_landscaping.create({
            data: {
               ...landscaping,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [LandscapingService] Landscaping record saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [LandscapingService] Error adding landscaping record:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add landscaping record");
      }
   }

   protected static viewLandscapingsService = async () => {
      console.log("🟡 [LandscapingService] Fetching all landscaping records...");

      try {
         const results = await db.parks_landscaping.findMany({
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

         console.log(`📦 [LandscapingService] Retrieved ${results.length} landscaping records.`);
         return results;

      } catch (error: any) {
         console.error("💥 [LandscapingService] Error fetching landscaping records:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch landscaping records");
      }
   }
}

export default LandscapingService; 