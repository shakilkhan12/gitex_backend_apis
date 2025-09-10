import { IntrusionDetectionService } from "@/services";
import { IntrusionDetectionType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class IntrusionDetectionController extends IntrusionDetectionService {
   public static addIntrusionDetection = async (req: Request<{}, {}, IntrusionDetectionType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const intrusionDetection = await IntrusionDetectionService.addIntrusionDetectionService(req.body)
            return res.status(STATUS.CREATED).json(intrusionDetection)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewIntrusionDetections = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const intrusionDetections = await IntrusionDetectionService.viewIntrusionDetectionsService();
         return res.status(STATUS.SUCCESS).json(intrusionDetections);
      } catch (error) {
         next(error)
      }
   }

   public static getIntrusionDetectionById = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { id } = req.params;
         const detection = await IntrusionDetectionService.getIntrusionDetectionByIdService(parseInt(id));
         return res.status(STATUS.SUCCESS).json(detection);
      } catch (error) {
         next(error);
      }
   }

   public static updateIntrusionDetection = async (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      try {
         if (errors.isEmpty()) {
            const { id } = req.params;
            const detection = await IntrusionDetectionService.updateIntrusionDetectionService(parseInt(id), req.body);
            return res.status(STATUS.SUCCESS).json(detection);
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error);
      }
   }
}

export default IntrusionDetectionController;
