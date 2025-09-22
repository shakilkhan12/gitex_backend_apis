import { IntranetPostingHistoryType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class IntranetPostingHistoryService {
   protected static addIntranetPostingHistoryService = async (intranetPostingHistory: IntranetPostingHistoryType) => {
      try {
         console.log('🔍 Looking for existing record with intranet_id:', intranetPostingHistory.intranet_id);
         
         // Find existing record by intranet_id
         const existingRecord = await db.intranet_posting_history.findFirst({
            where: { intranet_id: intranetPostingHistory.intranet_id },
         });
         
         console.log('📋 Existing record found:', existingRecord ? 'YES' : 'NO', existingRecord);
         
         if (!existingRecord) {
            throw new HttpException(STATUS.BAD_REQUEST, "No existing record found with the provided intranet_id");
         }

         // Get current date and time
         const currentDate = new Date();
         const currentTime = new Date();

         // Create new record with smokingDetectionId and intrusionDetectionId from existing record
         const result = await db.intranet_posting_history.create({
            data: {
               title: intranetPostingHistory.title,
               intranet_id: intranetPostingHistory.intranet_id,
               comments: intranetPostingHistory.comments,
               smokingDetectionId: existingRecord.smokingDetectionId,
               intrusionDetectionId: existingRecord.intrusionDetectionId,
               date: currentDate,
               time: currentTime,
            },
         });

         console.log('✅ New intranet posting history record created:', result);
         return result;

      } catch (error) {
         console.error('❌ Error creating intranet posting history:', error);
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to create intranet posting history record");
      }
   }

   protected static viewIntranetPostingHistoryService = async () => {
      try {
         const intranetPostingHistory = await db.intranet_posting_history.findMany({
            include: {
               smokingDetection: {
                  include: {
                     parks: true,
                     park_cameras: true,
                  }
               },
               intrusionDetection: {
                  include: {
                     parks: true,
                     park_cameras: true,
                  }
               }
            },
            orderBy: {
               id: 'desc'
            }
         });

         return intranetPostingHistory;
      } catch (error) {
         console.error('❌ Error fetching intranet posting history:', error);
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch intranet posting history records");
      }
   }

   protected static getIntranetPostingHistoryByIdService = async (id: number) => {
      try {
         const intranetPostingHistory = await db.intranet_posting_history.findUnique({
            where: { id },
            include: {
               smokingDetection: {
                  include: {
                     parks: true,
                     park_cameras: true,
                  }
               },
               intrusionDetection: {
                  include: {
                     parks: true,
                     park_cameras: true,
                  }
               }
            }
         });

         if (!intranetPostingHistory) {
            throw new HttpException(STATUS.NOT_FOUND, "Intranet posting history record not found");
         }

         return intranetPostingHistory;
      } catch (error) {
         console.error('❌ Error fetching intranet posting history by ID:', error);
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch intranet posting history record");
      }
   }
}

export default IntranetPostingHistoryService;
