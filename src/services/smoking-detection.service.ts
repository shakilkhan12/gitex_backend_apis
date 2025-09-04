import { SmokingDetectionType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class SmokingDetectionService {
   protected static addSmokingDetectionService = async (smokingDetection: SmokingDetectionType) => {
      console.log("🟢 [SmokingDetectionService] Adding new smoking detection:", smokingDetection);

      try {
         // Check if park exists
         const parkExists = await db.parks.findFirst({
            where: { Id: smokingDetection.park_Id },
         });
         if (!parkExists) {
            console.error("❌ [SmokingDetectionService] Park not found with Id:", smokingDetection.park_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }
         console.log("✅ [SmokingDetectionService] Park exists:", parkExists.park_english_name);

         // Check if camera exists
         const cameraExists = await db.park_cameras.findFirst({
            where: { Id: smokingDetection.camera_Id },
         });
         if (!cameraExists) {
            console.error("❌ [SmokingDetectionService] Camera not found with Id:", smokingDetection.camera_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
         }
         console.log("✅ [SmokingDetectionService] Camera exists:", cameraExists.camera_english_name);

         // Insert detection record with new schema fields
         const result = await db.parks_smoking_detection.create({
            data: {
               park_Id: smokingDetection.park_Id,
               location: smokingDetection.location,
               camera_Id: smokingDetection.camera_Id,
               occurrence_date: smokingDetection.occurrence_date || new Date(),
               occurrence_time: smokingDetection.occurrence_time || new Date(),
               snap_shot: smokingDetection.snap_shot,
               posted_to_intranet_date: smokingDetection.posted_to_intranet_date,
               posted_to_intranet_time: smokingDetection.posted_to_intranet_time,
               detection_Id: smokingDetection.detection_Id || `SMOKE_${Date.now()}_${Math.random().toString(36).substring(7)}`,
               detection_date: smokingDetection.detection_date || new Date(),
               detection_time: smokingDetection.detection_time || new Date(),
               description: smokingDetection.description || `Smoking activity detected in ${smokingDetection.location}`,
               is_employee: smokingDetection.is_employee || false,
               current_status: smokingDetection.current_status || 'pending',
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [SmokingDetectionService] Smoking detection saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [SmokingDetectionService] Error adding smoking detection:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add smoking detection");
      }
   }

   protected static viewSmokingDetectionsService = async () => {
      console.log("🟡 [SmokingDetectionService] Fetching all smoking detections...");

      try {
         const results = await db.parks_smoking_detection.findMany({
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

         console.log(`📦 [SmokingDetectionService] Retrieved ${results.length} smoking detections.`);
         return results;

      } catch (error: any) {
         console.error("💥 [SmokingDetectionService] Error fetching smoking detections:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch smoking detections");
      }
   }

   protected static getSmokingDetectionByIdService = async (detectionId: number) => {
      console.log(`🟢 [SmokingDetectionService] Getting smoking detection with ID ${detectionId}...`);

      try {
         const detection = await db.parks_smoking_detection.findUnique({
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
            console.log("🟡 [SmokingDetectionService] Smoking detection not found");
            throw new HttpException(STATUS.NOT_FOUND, "Smoking detection not found");
         }

         console.log("✅ [SmokingDetectionService] Successfully retrieved smoking detection data");
         return detection;

      } catch (error: any) {
         console.error("💥 [SmokingDetectionService] Error getting smoking detection by ID:", error.message || error);
         if (error instanceof HttpException) throw error;
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch smoking detection");
      }
   }

   protected static updateSmokingDetectionService = async (detectionId: number, updateData: Partial<SmokingDetectionType>) => {
      console.log(`🟢 [SmokingDetectionService] Updating smoking detection with ID ${detectionId}...`);

      try {
         const updatedDetection = await db.parks_smoking_detection.update({
            where: { Id: detectionId },
            data: {
               ...updateData,
               updatedAt: new Date()
            }
         });

         console.log("✅ [SmokingDetectionService] Successfully updated smoking detection");
         return updatedDetection;

      } catch (error: any) {
         console.error("💥 [SmokingDetectionService] Error updating smoking detection:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to update smoking detection");
      }
   }
}

export default SmokingDetectionService;
