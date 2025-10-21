import { LandscapingService } from "@/services";
import { LandscapingType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import CronService from "../services/cron.service";

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
      console.log("🟡 [LandscapingController] viewLandscapings called");
      try {
         // Extract pagination parameters from query
         const page = parseInt(req.query.page as string) || 1;
         const limit = parseInt(req.query.limit as string) || 10;
         const search = req.query.search as string || '';
         const status = req.query.status as string || '';
         const sortBy = req.query.sortBy as string || 'createdAt';
         const sortOrder = req.query.sortOrder as string || 'desc';

         const result = await LandscapingService.viewLandscapingsService({
            page,
            limit,
            search,
            status,
            sortBy,
            sortOrder
         });

         console.log("✅ [LandscapingController] Successfully retrieved landscaping records");

         // Handle both paginated and non-paginated responses
         if (Array.isArray(result)) {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Landscaping records retrieved successfully",
               data: result
            });
         } else {
            // Paginated response
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Landscaping records retrieved successfully",
               data: result.data,
               pagination: result.pagination
            });
         }
      } catch (error) {
         console.error("❌ [LandscapingController] Error in viewLandscapings:", error);
         next(error)
      }
   }

   public static assignLandscaping = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { landscapingId, userId, title, comments } = req.body;
         
         if (!landscapingId || !userId) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "landscapingId and userId are required"
            });
         }

         const result = await LandscapingService.assignLandscapingService({
            landscapingId: Number(landscapingId),
            userId: Number(userId),
            title: title || "Case Assigned",
            comments: comments || "Landscaping case assigned"
         });

         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Landscaping case assigned successfully",
            data: result
         });
      } catch (error) {
         next(error)
      }
   }

   public static markAsCompleted = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { landscapingId, userId, title, comments, image } = req.body;
         if (!landscapingId) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "landscapingId is required"
            });
         }
         const result = await LandscapingService.markAsCompletedService({
            landscapingId: Number(landscapingId),
            userId: userId ? Number(userId) : null,
            title: title || "Marked as Completed",
            comments: comments || "Landscaping case has been marked as completed",
            image: image || null
         });
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Landscaping case marked as completed successfully",
            data: result
         });
      } catch (error) {
         next(error)
      }
   }

   public static monitorParkCameras = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await LandscapingService.monitorParkCamerasService();
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Park camera monitoring completed successfully",
            data: result
         });
      } catch (error) {
         next(error)
      }
   }

   public static getCronStatus = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const status = CronService.getCronStatus();
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Cron job status retrieved successfully",
            data: status
         });
      } catch (error) {
         next(error)
      }
   }

   public static testingLandscaping = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { images } = req.body;
         
         if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "Images array is required and must not be empty"
            });
         }

         const result = await LandscapingService.testingLandscapingService(images);
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Testing landscaping completed successfully",
            data: result
         });
      } catch (error) {
         next(error)
      }
   }
}

export default LandscapingController; 