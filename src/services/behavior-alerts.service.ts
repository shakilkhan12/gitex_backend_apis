import { BehaviorAlertType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class BehaviorAlertsService {
   protected static addBehaviorAlertService = async (behaviorAlert: BehaviorAlertType) => {
      console.log("🟢 [BehaviorAlertsService] Adding new behavior alert:", behaviorAlert);

      try {
         // Check if park exists
         const parkExists = await db.parks.findFirst({
            where: { Id: behaviorAlert.park_Id },
         });
         if (!parkExists) {
            console.error("❌ [BehaviorAlertsService] Park not found with Id:", behaviorAlert.park_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }
         console.log("✅ [BehaviorAlertsService] Park exists:", parkExists.park_english_name);

         // Check if camera exists
         const cameraExists = await db.park_cameras.findFirst({
            where: { Id: behaviorAlert.camera_Id },
         });
         if (!cameraExists) {
            console.error("❌ [BehaviorAlertsService] Camera not found with Id:", behaviorAlert.camera_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Camera does not exist");
         }
         console.log("✅ [BehaviorAlertsService] Camera exists:", cameraExists.camera_english_name);

         const result = await db.parks_behaviour_alerts.create({
            data: {
               ...behaviorAlert,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [BehaviorAlertsService] Behavior alert saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [BehaviorAlertsService] Error adding behavior alert:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add behavior alert");
      }
   }

   protected static viewBehaviorAlertsService = async () => {
      console.log("🟡 [BehaviorAlertsService] Fetching all behavior alerts...");

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
                     ip_address: true
                  }
               }
            },
            orderBy: {
               createdAt: 'desc'
            }
         });

         console.log(`📦 [BehaviorAlertsService] Retrieved ${results.length} behavior alerts.`);
         return results;

      } catch (error: any) {
         console.error("💥 [BehaviorAlertsService] Error fetching behavior alerts:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch behavior alerts");
      }
   }
}

export default BehaviorAlertsService; 