import { BehaviorAlertsService } from "@/services";
import { BehaviorAlertType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class BehaviorAlertsController extends BehaviorAlertsService {
   public static addBehaviorAlert = async (req: Request<{}, {}, BehaviorAlertType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const behaviorAlert = await BehaviorAlertsService.addBehaviorAlertService(req.body)
            return res.status(STATUS.CREATED).json(behaviorAlert)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewBehaviorAlerts = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const behaviorAlerts = await BehaviorAlertsService.viewBehaviorAlertsService();
         return res.status(STATUS.SUCCESS).json(behaviorAlerts);
      } catch (error) {
         next(error)
      }
   }
}

export default BehaviorAlertsController; 