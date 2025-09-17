import { LitterDetectionType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class LitterDetectionService {
   protected static addLitterDetectionService = async (litterDetection: LitterDetectionType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { Id: litterDetection.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         let cameraDatabaseId = null;
         if (litterDetection.camera_Id) {
            const cameraExists = await db.park_cameras.findFirst({
               where: { camera_Id: litterDetection.camera_Id.toString() },
            });
            if (!cameraExists) {
               throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
            }
            cameraDatabaseId = cameraExists.Id;
         }

         const result = await db.parks_litter_detection.create({
            data: {
               ...litterDetection,
               camera_Id: cameraDatabaseId,
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