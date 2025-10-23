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
         const { page, limit, search, sortBy, sortOrder, fromDateTime, toDateTime, behaviour, camera, employee } = req.query;

         const filters = {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as string,
            fromDateTime: fromDateTime as string,
            toDateTime: toDateTime as string,
            behaviour: behaviour as string,
            camera: camera as string,
            employee: employee as string
         };

         const result = await BehaviorAlertsService.viewBehaviorAlertsService(filters);

         // Handle both paginated and non-paginated responses
         if (result.pagination) {
            // Paginated response
            const response: any = {
               success: true,
               message: "Behavior alerts retrieved successfully",
               data: result.data,
               pagination: result.pagination
            };
            
            // Include stats if available
            if (result.stats) {
               response.stats = result.stats;
            }
            
            return res.status(STATUS.SUCCESS).json(response);
         } else {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json(result);
         }
      } catch (error) {
         next(error)
      }
   }
}

export default BehaviorAlertsController; 