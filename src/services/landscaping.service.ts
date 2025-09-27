import { LandscapingType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class LandscapingService {
   protected static generateUniqueCaseId = async (): Promise<string> => {
      let caseId: string;
      let isUnique = false;
      
      while (!isUnique) {
         // Generate a 6-digit random number
         caseId = Math.floor(100000 + Math.random() * 900000).toString();
         
         // Check if this case_Id already exists
         const existingRecord = await db.landscaping.findFirst({
            where: { case_Id: caseId }
         });
         
         if (!existingRecord) {
            isUnique = true;
         }
      }
      
      return caseId!;
   };

   protected static addLandscapingService = async (landscaping: LandscapingType) => {
      try {
         // Generate unique 6-digit case_Id
         const caseId = await this.generateUniqueCaseId();

         const result = await db.landscaping.create({
            data: {
               case_Id: caseId,
               image: landscaping.image || null,
               name: landscaping.name || null,
               status: landscaping.status || null,
               suggestion: landscaping.suggestion || null,
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
         const results = await db.landscaping.findMany({
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