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
               current_status:"Peding",
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
            include: {
               assignedUser: {
                  select: {
                     Id: true,
                     emp__eng_name: true,
                     dep_eng_name: true
                  }
               },
               landscaping_history: {
                  include: {
                     users: {
                        select: {
                           Id: true,
                           emp__eng_name: true,
                           dep_eng_name: true
                        }
                     }
                  },
                  orderBy: {
                     createdAt: 'desc'
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

   public static assignLandscapingService = async (assignmentData: {
      landscapingId: number;
      userId: number;
      title: string;
      comments: string;
   }) => {
      try {
         // Check if landscaping exists
         const landscaping = await db.landscaping.findUnique({
            where: { id: assignmentData.landscapingId }
         });

         if (!landscaping) {
            throw new HttpException(STATUS.NOT_FOUND, "Landscaping case not found");
         }

         // Check if user exists and has landscaping access
         const user = await db.users.findUnique({
            where: { Id: assignmentData.userId }
         });

         if (!user) {
            throw new HttpException(STATUS.NOT_FOUND, "User not found");
         }

         if (!user.landscaping_access) {
            throw new HttpException(STATUS.BAD_REQUEST, "User does not have landscaping access");
         }

         // Update landscaping with assigned user
         await db.landscaping.update({
            where: { id: assignmentData.landscapingId },
            data: { assinged_to: assignmentData.userId,current_status:"In Progress" }
         });

         // Create landscaping history record
         const historyRecord = await db.landscaping_history.create({
            data: {
               landscaping_Id: assignmentData.landscapingId,
               user_Id: assignmentData.userId,
               title: assignmentData.title,
               comments: assignmentData.comments,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });

         return {
            landscapingId: assignmentData.landscapingId,
            userId: assignmentData.userId,
            historyId: historyRecord.id
         };

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to assign landscaping case");
      }
   }

   public static markAsCompletedService = async (completionData: {
      landscapingId: number;
      userId: number | null;
      title: string;
      comments: string;
      image: string | null;
   }) => {
      try {
         // Check if landscaping case exists
         const landscaping = await db.landscaping.findFirst({
            where: { id: completionData.landscapingId }
         });

         if (!landscaping) {
            throw new HttpException(STATUS.NOT_FOUND, "Landscaping case not found");
         }

         // Update the landscaping case status to completed
         await db.landscaping.update({
            where: { id: completionData.landscapingId },
            data: { current_status: 'Completed' }
         });

         // Create a history record for the completion
         const historyRecord = await db.landscaping_history.create({
            data: {
               landscaping_Id: completionData.landscapingId,
               user_Id: completionData.userId, // User who marked as completed
               title: completionData.title,
               comments: completionData.comments,
               image: completionData.image,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });

         return {
            landscapingId: completionData.landscapingId,
            historyId: historyRecord.id,
            status: 'Completed'
         };

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to mark landscaping case as completed");
      }
   }
}

export default LandscapingService; 