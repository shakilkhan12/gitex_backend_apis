import { BehaviorAlertType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class BehaviorAlertsService {
   protected static addBehaviorAlertService = async (behaviorAlert: BehaviorAlertType) => {

      try {
         const parkExists = await db.parks.findFirst({
            where: { Id: behaviorAlert.park_Id },
         });
         if (!parkExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }

         const cameraExists = await db.park_cameras.findFirst({
            where: { Id: behaviorAlert.camera_Id },
         });
         if (!cameraExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
         }

         const result = await db.parks_behaviour_alerts.create({
            data: {
               ...behaviorAlert,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         return result;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add behavior alert");
      }
   }

   protected static viewBehaviorAlertsService = async () => {

      try {
         const results = await db.parks_behaviour_alerts.findMany({
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
                     ip_address: true,
                  }
               }
            },
            orderBy: {
               createdAt: 'desc'
            }
         });

         // Enrich results with user information
         const enrichedResults = await Promise.all(
            results.map(async (alert) => {
               let userInfo = null;
               
               // If person_Id exists and is_employee is true, try to find user by emp_Id
               if (alert.person_Id && alert.is_employee) {
                  try {
                     userInfo = await db.users.findFirst({
                        where: {
                           emp_Id: alert.person_Id
                        },
                        select: {
                           Id: true,
                           emp_Id: true,
                           emp__eng_name: true,
                           emp__arabic_name: true,
                           gender: true,
                           image: true,
                           
                        }
                     });
                  } catch (userError) {
                     console.log('Error fetching user info:', userError);
                  }
               }

               return {
                  ...alert,
                  user: userInfo
               };
            })
         );

         return enrichedResults;

      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch behavior alerts");
      }
   }
}

export default BehaviorAlertsService; 