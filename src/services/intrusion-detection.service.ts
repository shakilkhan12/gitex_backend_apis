import { IntrusionDetectionType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class IntrusionDetectionService {
   protected static addIntrusionDetectionService = async (intrusionDetection: IntrusionDetectionType) => {
      console.log("🟢 [IntrusionDetectionService] Adding new intrusion detection:", intrusionDetection);

      try {
         // Check if park exists
         const parkExists = await db.parks.findFirst({
            where: { Id: intrusionDetection.park_Id },
         });
         if (!parkExists) {
            console.error("❌ [IntrusionDetectionService] Park not found with Id:", intrusionDetection.park_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }
         console.log("✅ [IntrusionDetectionService] Park exists:", parkExists.park_english_name);

         // Check if camera exists
         const cameraExists = await db.park_cameras.findFirst({
            where: { Id: intrusionDetection.camera_Id },
         });
         if (!cameraExists) {
            console.error("❌ [IntrusionDetectionService] Camera not found with Id:", intrusionDetection.camera_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
         }
         console.log("✅ [IntrusionDetectionService] Camera exists:", cameraExists.camera_english_name);

         // Insert detection record with new schema fields
         const result = await db.parks_intrusion_detection.create({
            data: {
               park_Id: intrusionDetection.park_Id,
               location: intrusionDetection.location,
               camera_Id: intrusionDetection.camera_Id,
               occurrence_date: intrusionDetection.occurrence_date || new Date(),
               occurrence_time: intrusionDetection.occurrence_time || new Date(),
               snap_shot: intrusionDetection.snap_shot,
               posted_to_intranet_date: intrusionDetection.posted_to_intranet_date,
               posted_to_intranet_time: intrusionDetection.posted_to_intranet_time,
               detection_Id: intrusionDetection.detection_Id || `INTRUSION_${Date.now()}_${Math.random().toString(36).substring(7)}`,
               detection_date: intrusionDetection.detection_date || new Date(),
               detection_time: intrusionDetection.detection_time || new Date(),
               description: intrusionDetection.description || `Intrusion activity detected in ${intrusionDetection.location}`,
               is_employee: intrusionDetection.is_employee || false,
               current_status: intrusionDetection.current_status || 'pending',
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [IntrusionDetectionService] Intrusion detection saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [IntrusionDetectionService] Error adding intrusion detection:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add intrusion detection");
      }
   }

   protected static viewIntrusionDetectionsService = async () => {
      console.log("🟡 [IntrusionDetectionService] Fetching all intrusion detections...");

      try {
         const results = await db.parks_intrusion_detection.findMany({
            include: {
               parks: {
                  select: {
                     Id: true,
                     park_Id: true,
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
               intranet_posting_history: {
                  select: {
                     id: true,
                     title: true,
                     intranet_id: true,
                     comments: true,
                     date: true,
                     time: true
                  }
               }
            },
            orderBy: {
               createdAt: 'desc'
            }
         });

         console.log(`📦 [IntrusionDetectionService] Retrieved ${results.length} intrusion detections.`);
         return results;

      } catch (error: any) {
         console.error("💥 [IntrusionDetectionService] Error fetching intrusion detections:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch intrusion detections");
      }
   }

   protected static getIntrusionDetectionByIdService = async (detectionId: number) => {
      console.log(`🟢 [IntrusionDetectionService] Getting intrusion detection with ID ${detectionId}...`);

      try {
         const detection = await db.parks_intrusion_detection.findUnique({
            where: { Id: detectionId },
            include: {
               parks: {
                  select: {
                     Id: true,
                     park_Id: true,
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
               intranet_posting_history: {
                  select: {
                     id: true,
                     title: true,
                     intranet_id: true,
                     comments: true,
                     date: true,
                     time: true
                  }
               }
            }
         });

         if (!detection) {
            console.log("🟡 [IntrusionDetectionService] Intrusion detection not found");
            throw new HttpException(STATUS.NOT_FOUND, "Intrusion detection not found");
         }

         console.log("✅ [IntrusionDetectionService] Successfully retrieved intrusion detection data");
         return detection;

      } catch (error: any) {
         console.error("💥 [IntrusionDetectionService] Error getting intrusion detection by ID:", error.message || error);
         if (error instanceof HttpException) throw error;
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch intrusion detection");
      }
   }

   protected static updateIntrusionDetectionService = async (detectionId: number, updateData: Partial<IntrusionDetectionType>) => {
      console.log(`🟢 [IntrusionDetectionService] Updating intrusion detection with ID ${detectionId}...`);

      try {
         const updatedDetection = await db.parks_intrusion_detection.update({
            where: { Id: detectionId },
            data: {
               ...updateData,
               updatedAt: new Date()
            }
         });

         console.log("✅ [IntrusionDetectionService] Successfully updated intrusion detection");
         return updatedDetection;

      } catch (error: any) {
         console.error("💥 [IntrusionDetectionService] Error updating intrusion detection:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to update intrusion detection");
      }
   }
}

export default IntrusionDetectionService;
