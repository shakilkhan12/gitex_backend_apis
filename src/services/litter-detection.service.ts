import { LitterDetectionType, LitterDetectionCompleteType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class LitterDetectionService {
   protected static addLitterDetectionService = async (litterDetection: LitterDetectionType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { park_Id: litterDetection.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         let cameraDatabaseId = null;
         if (litterDetection.camera_Id) {
            const cameraExists = await db.park_cameras.findFirst({
               where: { camera_Id: litterDetection.camera_Id },
            });
            if (!cameraExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
            }
            cameraDatabaseId = cameraExists.Id;

            // Check for existing litter detection for this camera that is not completed
            const existingRecord = await db.parks_litter_detection.findFirst({
               where: {
                  camera_Id: cameraDatabaseId,
                  current_status: {
                     not: "complete"
                  }
               }
            });
            
            if (existingRecord) {
               throw new HttpException(STATUS.BAD_REQUEST, "Active litter detection case already exists for this camera. Please complete the existing case before creating a new one.");
            }
         }

         // Format date and time properly for database
         const occurrenceDate = new Date(litterDetection.occurrence_date);
         const occurrenceTime = new Date(`1970-01-01T${litterDetection.occurrence_time}Z`);
         const detectionDate = litterDetection.detection_date ? new Date(litterDetection.detection_date) : new Date();
         const detectionTime = litterDetection.detection_time ? new Date(`1970-01-01T${litterDetection.detection_time}Z`) : new Date();

         const result = await db.parks_litter_detection.create({
            data: {
               park_Id: parkExists.Id,
               case_Id: litterDetection.case_Id,
               location: litterDetection.location,
               occurrence_date: occurrenceDate,
               occurrence_time: occurrenceTime,
               snap_shot: litterDetection.snap_shot,
               status: litterDetection.status,
               detection_Id: litterDetection.detection_Id,
               detection_date: detectionDate,
               detection_time: detectionTime,
               description: litterDetection.description,
               current_status: litterDetection.current_status,
               camera_Id: cameraDatabaseId,
               after_image: litterDetection.after_image,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         const ticketDetails = await db.ticket_details_table.create({
            data: {
               litterDetectionId: result.Id,
               status: 'Pending',
               date: result.occurrence_date,
               time: result.occurrence_time,
               comments: result.description,
               image: result.snap_shot,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });


         return result;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add litter detection");
      }
   }

   protected static viewLitterDetectionsService = async () => {

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
               },
               park_cameras: {
                  select: {
                     Id: true,
                     camera_Id: true,
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true,
                     latitude: true,
                     longitude: true,
                     status: true
                  }
               },
               assignedUser: {
                  select: {
                     Id: true,
                     emp__eng_name: true,
                     dep_eng_name: true
                  }
               },
               ticket_details: {
                  select: {
                     id: true,
                     status: true,
                     date: true,
                     time: true,
                     comments: true,
                     image: true,
                     abc1: true,
                     abc2: true,
                     abc3: true,
                     abc4: true,
                     litterDetectionId: true,
                     createdAt: true,
                     updatedAt: true,
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

         // Get all litter detection IDs for batch query
         const litterDetectionIds = results.map(ld => ld.Id.toString());
         
         // Fetch all intranet posting history in a single query
         const allIntranetHistory = await db.intranet_posting_history.findMany({
            where: {
               OR: [
                  { abc1: { in: litterDetectionIds } },
                  { abc2: { in: litterDetectionIds } },
                  { abc3: { in: litterDetectionIds } }
               ]
            },
            select: {
               id: true,
               title: true,
               intranet_id: true,
               comments: true,
               date: true,
               time: true,
               abc1: true,
               abc2: true,
               abc3: true
            }
         });

         // Group intranet history by litter detection ID
         const intranetHistoryMap = new Map();
         allIntranetHistory.forEach(history => {
            const litterId = history.abc1 || history.abc2 || history.abc3;
            if (litterId) {
               if (!intranetHistoryMap.has(litterId)) {
                  intranetHistoryMap.set(litterId, []);
               }
               intranetHistoryMap.get(litterId).push({
                  id: history.id,
                  title: history.title,
                  intranet_id: history.intranet_id,
                  comments: history.comments,
                  date: history.date,
                  time: history.time
               });
            }
         });

         // Map intranet history to each litter detection
         const resultsWithIntranetHistory = results.map(litterDetection => ({
            ...litterDetection,
            intranet_posting_history: intranetHistoryMap.get(litterDetection.Id.toString()) || []
         }));

         return resultsWithIntranetHistory;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch litter detections");
      }
   }

   public static assignLitterDetectionService = async (assignmentData: {
      litterDetectionId: number;
      userId: number;
      title: string;
      comments: string;
   }) => {
      try {
         // Check if litter detection exists
         const litterDetection = await db.parks_litter_detection.findFirst({
            where: { Id: assignmentData.litterDetectionId }
         });

         if (!litterDetection) {
            throw new HttpException(STATUS.NOT_FOUND, "Litter detection record not found");
         }

         // Check if user exists and has litter detection access
         const user = await db.users.findFirst({
            where: { 
               Id: assignmentData.userId,
               litter_detection_access: true
            }
         });

         if (!user) {
            throw new HttpException(STATUS.BAD_REQUEST, "User not found or doesn't have litter detection access");
         }

         // Update the litter detection record with assigned user
         await db.parks_litter_detection.update({
            where: { Id: assignmentData.litterDetectionId },
            data: { assinged_to: assignmentData.userId, status:"In Progress" }
         });

         // Create a ticket details record for the assignment
         // Use the same date and time format as in addLitterDetectionService
         const currentDate = new Date();
         const currentTime = new Date(`1970-01-01T${currentDate.toTimeString().split(' ')[0]}Z`);
         
         const ticketRecord = await db.ticket_details_table.create({
            data: {
               litterDetectionId: assignmentData.litterDetectionId,
               user_Id: assignmentData.userId,
               status: 'Assigned',
               comments: "Case Assigned",
               date: currentDate,
               time: currentTime,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });


         return {
            litterDetectionId: assignmentData.litterDetectionId,
            userId: assignmentData.userId,
            ticketId: ticketRecord.id
         };

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to assign litter detection");
      }
   }

   protected static completeLitterDetectionService = async (litterDetectionComplete: LitterDetectionCompleteType) => {
      try {
         
         // Find the litter detection record by ID
         const litterDetection = await db.parks_litter_detection.findUnique({
            where: { Id: litterDetectionComplete.id },
            include: {
               parks: {
                  select: {
                     park_english_name: true,
                     park_arabic_name: true,
                     latitude: true,
                     longitude: true
                  }
               },
               park_cameras: {
                  select: {
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true
                  }
               }
            }
         });
         
         console.log('📋 Litter detection found:', litterDetection ? 'YES' : 'NO', litterDetection);
         
         if (!litterDetection) {
            throw new HttpException(STATUS.NOT_FOUND, "Litter detection record not found");
         }

         // Check if the case is already completed
         if (litterDetection.status === "complete") {
            return {
               message: "Case already closed",
               litterDetection,
               ticketDetails: null
            };
         }

         // Get current date and time
         const currentDate = new Date();
         const currentTime = new Date();

         // Create new ticket details record with status "Completed"
         const ticketDetails = await db.ticket_details_table.create({
            data: {
               litterDetectionId: litterDetection.Id,
               user_Id: litterDetectionComplete.userId,
               status: "Completed",
               date: currentDate,
               time: currentTime,
               comments: litterDetectionComplete.comments,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });
         


         // Update the litter detection status to "complete"
         const updatedLitterDetection = await db.parks_litter_detection.update({
            where: { Id: litterDetection.Id },
            data: {
               status: "complete",
               current_status: "complete",
               updatedAt: new Date()
            },
            include: {
               parks: {
                  select: {
                     park_english_name: true,
                     park_arabic_name: true,
                     latitude: true,
                     longitude: true
                  }
               },
               park_cameras: {
                  select: {
                     camera_english_name: true,
                     camera_arabic_name: true,
                     ip_address: true
                  }
               }
            }
         });

         console.log('✅ Litter detection status updated to "complete":', updatedLitterDetection);

         return {
            litterDetection: updatedLitterDetection,
            ticketDetails
         };

      } catch (error) {
         console.error('❌ Error completing litter detection:', error);
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to complete litter detection");
      }
   }
}

export default LitterDetectionService; 