import { IntrusionDetectionType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class IntrusionDetectionService {
   protected static addIntrusionDetectionService = async (intrusionDetection: IntrusionDetectionType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { Id: intrusionDetection.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         const cameraExists = await db.park_cameras.findFirst({
            where: { Id: intrusionDetection.camera_Id },
         });
         if (!cameraExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
         }

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

         return result;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add intrusion detection");
      }
   }

   protected static viewIntrusionDetectionsService = async () => {

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
                  },
                  orderBy: {
                     id: 'desc'
                  }
               }
            },
            orderBy: {
               createdAt: 'desc'
            }
         });

         return results;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch intrusion detections");
      }
   }

   protected static getIntrusionDetectionByIdService = async (detectionId: number) => {

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
            throw new HttpException(STATUS.NOT_FOUND, "Intrusion detection not found");
         }

         return detection;

      } catch (error: any) {
         if (error instanceof HttpException) throw error;
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch intrusion detection");
      }
   }

   protected static updateIntrusionDetectionService = async (detectionId: number, updateData: Partial<IntrusionDetectionType>) => {

      try {
         const updatedDetection = await db.parks_intrusion_detection.update({
            where: { Id: detectionId },
            data: {
               ...updateData,
               updatedAt: new Date()
            }
         });

         return updatedDetection;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to update intrusion detection");
      }
   }
}

export default IntrusionDetectionService;
