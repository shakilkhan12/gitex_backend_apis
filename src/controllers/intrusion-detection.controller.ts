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
      console.log("🟡 [IntrusionDetectionController] viewIntrusionDetections called");
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

         const result = await IntrusionDetectionService.viewIntrusionDetectionsService({
            page,
            limit,
            search,
            status,
            sortBy,
            sortOrder,
            startDate,
            endDate
         });

         console.log("✅ [IntrusionDetectionController] Successfully retrieved intrusion detections");

         // Handle both paginated and non-paginated responses
         if (Array.isArray(result)) {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Intrusion detection records retrieved successfully",
               data: result
            });
         } else {
            // Paginated response
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Intrusion detection records retrieved successfully",
               data: result.data,
               pagination: result.pagination,
               stats: result.stats
            });
         }
      } catch (error) {
         console.error("❌ [IntrusionDetectionController] Error in viewIntrusionDetections:", error);
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
