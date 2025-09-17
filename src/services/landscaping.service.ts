import { LandscapingType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class LandscapingService {
   protected static addLandscapingService = async (landscaping: LandscapingType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { Id: landscaping.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         const result = await db.parks_landscaping.create({
            data: {
               ...landscaping,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add landscaping record");
      }
   }

   protected static viewLandscapingsService = async () => {

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

         return results;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch landscaping records");
      }
   }
}

export default LandscapingService; 