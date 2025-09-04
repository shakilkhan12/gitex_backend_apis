import { SmokingDetectionService } from "@/services";
import { SmokingDetectionType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class SmokingDetectionController extends SmokingDetectionService {
   public static addSmokingDetection = async (req: Request<{}, {}, SmokingDetectionType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const smokingDetection = await SmokingDetectionService.addSmokingDetectionService(req.body)
            return res.status(STATUS.CREATED).json(smokingDetection)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewSmokingDetections = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const smokingDetections = await SmokingDetectionService.viewSmokingDetectionsService();
         return res.status(STATUS.SUCCESS).json(smokingDetections);
      } catch (error) {
         next(error)
      }
   }

   public static getSmokingDetectionById = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { id } = req.params;
         const detection = await SmokingDetectionService.getSmokingDetectionByIdService(parseInt(id));
         return res.status(STATUS.SUCCESS).json(detection);
      } catch (error) {
         next(error);
      }
   }

   public static updateSmokingDetection = async (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      try {
         if (errors.isEmpty()) {
            const { id } = req.params;
            const detection = await SmokingDetectionService.updateSmokingDetectionService(parseInt(id), req.body);
            return res.status(STATUS.SUCCESS).json(detection);
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error);
      }
   }
}

export default SmokingDetectionController; 