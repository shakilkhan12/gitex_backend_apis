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
      console.log("🟡 [SmokingDetectionController] viewSmokingDetections called");
      try {
         // Extract pagination parameters from query
         const page = parseInt(req.query.page as string) || 1;
         const limit = parseInt(req.query.limit as string) || 10;
         const search = req.query.search as string || '';
         const status = req.query.status as string || '';
         const sortBy = req.query.sortBy as string || 'createdAt';
         const sortOrder = req.query.sortOrder as string || 'desc';
         const startDate = req.query.startDate as string || '';
         const endDate = req.query.endDate as string || '';

         const result = await SmokingDetectionService.viewSmokingDetectionsService({
            page,
            limit,
            search,
            status,
            sortBy,
            sortOrder,
            startDate,
            endDate
         });

         console.log("✅ [SmokingDetectionController] Successfully retrieved smoking detections");

         // Handle both paginated and non-paginated responses
         if (Array.isArray(result)) {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Smoking detection records retrieved successfully",
               data: result
            });
         } else {
            // Paginated response
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Smoking detection records retrieved successfully",
               data: result.data,
               pagination: result.pagination,
               stats: result.stats
            });
         }
      } catch (error) {
         console.error("❌ [SmokingDetectionController] Error in viewSmokingDetections:", error);
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
}

export default SmokingDetectionController; 