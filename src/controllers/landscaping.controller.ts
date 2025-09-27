import { LandscapingService } from "@/services";
import { LandscapingType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class LandscapingController extends LandscapingService {
   public static addLandscaping = async (req: Request<{}, {}, LandscapingType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const landscaping = await LandscapingService.addLandscapingService(req.body)
            return res.status(STATUS.CREATED).json({
               success: true,
               message: "Landscaping record created successfully",
               data: landscaping
            })
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ 
               success: false,
               message: "Validation errors",
               errors: errors.array() 
            });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewLandscapings = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const landscapings = await LandscapingService.viewLandscapingsService();
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Landscaping records retrieved successfully",
            data: landscapings
         });
      } catch (error) {
         next(error)
      }
   }
}

export default LandscapingController; 