import { LitterDetectionService } from "@/services";
import { LitterDetectionType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class LitterDetectionController extends LitterDetectionService {
   public static addLitterDetection = async (req: Request<{}, {}, LitterDetectionType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const litterDetection = await LitterDetectionService.addLitterDetectionService(req.body)
            return res.status(STATUS.CREATED).json(litterDetection)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewLitterDetections = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const litterDetections = await LitterDetectionService.viewLitterDetectionsService();
         return res.status(STATUS.SUCCESS).json(litterDetections);
      } catch (error) {
         next(error)
      }
   }
}

export default LitterDetectionController; 