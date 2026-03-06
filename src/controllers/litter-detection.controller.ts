import { LitterDetectionService } from "@/services";
import { LitterDetectionType, LitterDetectionCompleteType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { formatExportDate, formatExportTime, sendExcelExport, sendPdfTableExport } from "@/utils/export.utils";

const buildLitterDetectionFilters = (req: Request) => {
   const { page, limit, search, status, sortBy, sortOrder, startDate, endDate } = req.query;

   return {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
      startDate: startDate as string,
      endDate: endDate as string
   };
};

const mapLitterDetectionExportRows = (records: any[]) => {
   return records.map(item => ({
      "Case ID": item.case_Id || "-",
      "Occurrence Date": formatExportDate(item.occurrence_date),
      "Occurrence Time": formatExportTime(item.occurrence_time),
      "Park": item.parks?.park_english_name || item.parks?.park_arabic_name || "-",
      "Camera": `${item.park_cameras?.camera_english_name || item.park_cameras?.camera_arabic_name || "-"} (${item.camera_Id || "-"})`,
      "Status": item.current_status || item.status || "-",
      "Assigned To": item.assignedUser
         ? `${item.assignedUser.emp__eng_name || item.assignedUser.emp__arabic_name || "-"} (${item.assignedUser.emp_Id || item.assignedUser.Id || item.assignedUser.id || "-"})`
         : "-"
   }));
};

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
         // Extract pagination parameters from query
         const page = parseInt(req.query.page as string) || 1;
         const limit = parseInt(req.query.limit as string) || 10;
         const search = req.query.search as string || '';
         const status = req.query.status as string || '';
         const sortBy = req.query.sortBy as string || 'createdAt';
         const sortOrder = req.query.sortOrder as string || 'desc';
         const startDate = req.query.startDate as string || '';
         const endDate = req.query.endDate as string || '';

         const result = await LitterDetectionService.viewLitterDetectionsService({
            page,
            limit,
            search,
            status,
            sortBy,
            sortOrder,
            startDate,
            endDate
         });
         
         console.log("✅ [LitterDetectionController] Successfully retrieved litter detections");
         
         // Handle both paginated and non-paginated responses
         if (Array.isArray(result)) {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Litter detection records retrieved successfully",
               data: result
            });
         } else {
            // Paginated response
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Litter detection records retrieved successfully",
               data: result.data,
               pagination: result.pagination,
               stats: result.stats
            });
         }
      } catch (error) {
         console.error("❌ [LitterDetectionController] Error in viewLitterDetections:", error);
         next(error)
      }
   }

   public static exportLitterDetectionsExcel = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = { ...buildLitterDetectionFilters(req), page: 1, limit: 50000 };
         const result = await LitterDetectionService.viewLitterDetectionsService(filters);
         const records = Array.isArray(result) ? result : result.data || [];
         const rows = mapLitterDetectionExportRows(records);

         return sendExcelExport(res, {
            rows,
            sheetName: "Litter Detection",
            fileName: `litter_detection_${new Date().toISOString().slice(0, 10)}.xlsx`
         });
      } catch (error) {
         next(error)
      }
   }

   public static exportLitterDetectionsPdf = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = { ...buildLitterDetectionFilters(req), page: 1, limit: 50000 };
         const result = await LitterDetectionService.viewLitterDetectionsService(filters);
         const records = Array.isArray(result) ? result : result.data || [];
         const rows = mapLitterDetectionExportRows(records);

         return sendPdfTableExport(res, {
            title: "Litter Detection Export",
            headers: ["Case ID", "Occurrence Date", "Occurrence Time", "Park", "Camera", "Status", "Assigned To"],
            widths: [60, 90, 70, 100, 120, 70, 120],
            rows,
            fileName: `litter_detection_${new Date().toISOString().slice(0, 10)}.pdf`
         });
      } catch (error) {
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