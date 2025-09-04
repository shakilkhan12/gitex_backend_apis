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
            return res.status(STATUS.CREATED).json(landscaping)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewLandscapings = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const landscapings = await LandscapingService.viewLandscapingsService();
         return res.status(STATUS.SUCCESS).json(landscapings);
      } catch (error) {
         next(error)
      }
   }
}

export default LandscapingController; 