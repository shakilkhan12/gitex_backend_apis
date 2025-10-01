import { LitterDetectionService } from "@/services";
import { LitterDetectionType, LitterDetectionCompleteType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class LitterDetectionController extends LitterDetectionService {
   public static addLitterDetection = async (req: Request<{}, {}, LitterDetectionType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const litterDetection = await LitterDetectionService.addLitterDetectionService(req.body)
            return res.status(STATUS.CREATED).json({
               success: true,
               message: "Litter detection record created successfully",
               data: litterDetection
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

   public static viewLitterDetections = async (req: Request, res: Response, next: NextFunction) => {
      console.log("🟡 [LitterDetectionController] viewLitterDetections called");
      try {
         const litterDetections = await LitterDetectionService.viewLitterDetectionsService();
         console.log("✅ [LitterDetectionController] Successfully retrieved litter detections");
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Litter detection records retrieved successfully",
            data: litterDetections
         });
      } catch (error) {
         console.error("❌ [LitterDetectionController] Error in viewLitterDetections:", error);
         next(error)
      }
   }

   public static assignLitterDetection = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { litterDetectionId, userId, title, comments } = req.body;
         if (!litterDetectionId || !userId) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "litterDetectionId and userId are required"
            });
         }
         const result = await LitterDetectionService.assignLitterDetectionService({
            litterDetectionId: Number(litterDetectionId),
            userId: Number(userId),
            title: title || "Assigned to user",
            comments: comments || "Litter detection case assigned to user"
         });
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Litter detection case assigned successfully",
            data: result
         });
      } catch (error) {
         next(error)
      }
   }

   public static completeLitterDetection = async (req: Request<{}, {}, LitterDetectionCompleteType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const result = await LitterDetectionService.completeLitterDetectionService(req.body)
            return res.status(STATUS.CREATED).json({
               success: true,
               message: "Litter detection case completed successfully",
               data: result
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
}

export default LitterDetectionController; 