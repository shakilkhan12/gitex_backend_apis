import { LitterDetectionType, STATUS } from "@/typescript";
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
               }
            },
            orderBy: {
               createdAt: 'desc'
            }
         });

         return results;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch litter detections");
      }
   }
}

export default LitterDetectionService; 