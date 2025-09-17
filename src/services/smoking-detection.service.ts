import { SmokingDetectionType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class SmokingDetectionService {
   protected static addSmokingDetectionService = async (smokingDetection: SmokingDetectionType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { Id: smokingDetection.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         let cameraDatabaseId = null;
         if (smokingDetection.camera_Id) {
            const cameraExists = await db.park_cameras.findFirst({
               where: { camera_Id: smokingDetection.camera_Id.toString() },
            });
            if (!cameraExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
            }
            cameraDatabaseId = cameraExists.Id;
         }

         const result = await db.parks_smoking_detection.create({
            data: {
               park_Id: smokingDetection.park_Id,
               location: smokingDetection.location,
               camera_Id: cameraDatabaseId,
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

         return result;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add smoking detection");
      }
   }

   protected static viewSmokingDetectionsService = async () => {

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

         return results;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch smoking detections");
      }
   }

   protected static getSmokingDetectionByIdService = async (detectionId: number) => {

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
            throw new HttpException(STATUS.NOT_FOUND, "Smoking detection not found");
         }

         return detection;

      } catch (error: any) {
         if (error instanceof HttpException) throw error;
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch smoking detection");
      }
   }

   protected static updateSmokingDetectionService = async (detectionId: number, updateData: Partial<SmokingDetectionType>) => {

      try {
         let cameraDatabaseId = undefined;
         if (updateData.camera_Id) {
            const cameraExists = await db.park_cameras.findFirst({
               where: { camera_Id: updateData.camera_Id.toString() },
            });
            if (!cameraExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
            }
            cameraDatabaseId = cameraExists.Id;
         }

         const { camera_Id, ...updateDataWithoutCameraId } = updateData;
         const finalUpdateData = {
            ...updateDataWithoutCameraId,
            ...(cameraDatabaseId !== undefined && { camera_Id: cameraDatabaseId }),
            updatedAt: new Date()
         };

         const updatedDetection = await db.parks_smoking_detection.update({
            where: { Id: detectionId },
            data: finalUpdateData
         });

         return updatedDetection;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to update smoking detection");
      }
   }
}

export default SmokingDetectionService;
