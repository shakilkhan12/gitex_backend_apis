import { SmokingDetectionService } from "@/services";
import { SmokingDetectionType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { formatExportDate, formatExportTime, sendExcelExport, sendPdfTableExport } from "@/utils/export.utils";

const buildSmokingDetectionFilters = (req: Request) => {
   const { page, limit, search, status, sortBy, sortOrder, startDate, endDate, parkId, cameraId, location, statusFilter } = req.query;

   const locationParam = req.query.location;
   const locationArr = locationParam
      ? (Array.isArray(locationParam) ? locationParam as string[] : [locationParam as string])
      : undefined;

   return {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
      startDate: startDate as string,
      endDate: endDate as string,
      parkId: parkId ? parseInt(parkId as string) : undefined,
      cameraId: cameraId ? parseInt(cameraId as string) : undefined,
      location: locationArr,
      statusFilter: statusFilter as 'pending' | 'under_process' | 'completed' | undefined
   };
};

const mapSmokingDetectionExportRows = (records: any[]) => {
   return records.map(item => ({
      "ID": item.Id || "-",
      "Occurrence Date": formatExportDate(item.occurrence_date),
      "Occurrence Time": formatExportTime(item.occurrence_time),
      "Park": item.parks?.park_english_name || item.parks?.park_arabic_name || "-",
      "Camera": `${item.park_cameras?.camera_english_name || item.park_cameras?.camera_arabic_name || "-"} (${item.camera_Id || "-"})`,
      "Posted To Intranet Date": formatExportDate(item.posted_to_intranet_date),
      "Posted To Intranet Time": formatExportTime(item.posted_to_intranet_time),
      "Status": item.current_status || item.status || "-"
   }));
};

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
         const parkId = req.query.parkId ? parseInt(req.query.parkId as string) : undefined;
         const cameraId = req.query.cameraId ? parseInt(req.query.cameraId as string) : undefined;
         const locationParam = req.query.location;
         const location = locationParam
            ? (Array.isArray(locationParam) ? locationParam as string[] : [locationParam as string])
            : undefined;
         const statusFilter = req.query.statusFilter as 'pending' | 'under_process' | 'completed' | undefined;

         const result = await SmokingDetectionService.viewSmokingDetectionsService({
            page,
            limit,
            search,
            status,
            sortBy,
            sortOrder,
            startDate,
            endDate,
            parkId,
            cameraId,
            location,
            statusFilter
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

   public static exportSmokingDetectionsExcel = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = { ...buildSmokingDetectionFilters(req), page: 1, limit: 50000 };
         const result = await SmokingDetectionService.viewSmokingDetectionsService(filters);
         const records = Array.isArray(result) ? result : result.data || [];
         const rows = mapSmokingDetectionExportRows(records);

         return sendExcelExport(res, {
            rows,
            sheetName: "Smoking Detection",
            fileName: `smoking_detection_${new Date().toISOString().slice(0, 10)}.xlsx`
         });
      } catch (error) {
         next(error)
      }
   }

   public static exportSmokingDetectionsPdf = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = { ...buildSmokingDetectionFilters(req), page: 1, limit: 50000 };
         const result = await SmokingDetectionService.viewSmokingDetectionsService(filters);
         const records = Array.isArray(result) ? result : result.data || [];
         const rows = mapSmokingDetectionExportRows(records);

         return sendPdfTableExport(res, {
            title: "Smoking Detection Export",
            headers: ["ID", "Occurrence Date", "Occurrence Time", "Park", "Camera", "Posted To Intranet Date", "Posted To Intranet Time", "Status"],
            widths: [45, 80, 65, 90, 110, 90, 85, 60],
            rows,
            fileName: `smoking_detection_${new Date().toISOString().slice(0, 10)}.pdf`
         });
      } catch (error) {
         next(error)
      }
   }

   public static getSmokingDetectionFilters = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const startDate = req.query.startDate as string || undefined;
         const endDate = req.query.endDate as string || undefined;
         const result = await SmokingDetectionService.getSmokingDetectionFiltersService(startDate, endDate);
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   };

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