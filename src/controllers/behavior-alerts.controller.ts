import { BehaviorAlertsService } from "@/services";
import { BehaviorAlertType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { formatExportDateAndTime } from "@/utils/export.utils";

const buildBehaviorAlertFilters = (req: Request) => {
   const { page, limit, search, sortBy, sortOrder, fromDateTime, toDateTime, behaviour, camera, employee, parkId } = req.query;

   return {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
      fromDateTime: fromDateTime as string,
      toDateTime: toDateTime as string,
      behaviour: behaviour as string,
      camera: camera as string,
      employee: employee as string,
      parkId: parkId ? parseInt(parkId as string) : undefined
   };
};

const mapBehaviorAlertExportRows = (records: any[]) => {
   return records.map((item) => ({
      "Type": item.is_employee ? "Employee" : "Guest",
      "ID": item.is_employee ? `EMP-${item.user?.emp_Id || item.person_Id || "-"}` : `GUEST-${item.Id || "-"}`,
      "Location": item.parks?.park_english_name || item.parks?.park_arabic_name || "-",
      "Camera": `${item.park_cameras?.camera_english_name || item.park_cameras?.camera_arabic_name || "-"} (${item.park_cameras?.camera_Id || item.camera_Id || "-"})`,
      "Occurrence": formatExportDateAndTime(item.detection_date, item.detection_time),
      "Detected Behaviour": item.detected_behaviour || item.detection_code || "-"
   }));
};

class BehaviorAlertsController extends BehaviorAlertsService {
   public static addBehaviorAlert = async (req: Request<{}, {}, BehaviorAlertType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const behaviorAlert = await BehaviorAlertsService.addBehaviorAlertService(req.body)
            return res.status(STATUS.CREATED).json(behaviorAlert)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static getBehaviorAlertsFilters = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await BehaviorAlertsService.getBehaviorAlertsFiltersService();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   };

   public static viewBehaviorAlerts = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = buildBehaviorAlertFilters(req);

         const result = await BehaviorAlertsService.viewBehaviorAlertsService(filters);

         // Handle both paginated and non-paginated responses
         if (result.pagination) {
            // Paginated response
            const response: any = {
               success: true,
               message: "Behavior alerts retrieved successfully",
               data: result.data,
               pagination: result.pagination
            };
            
            // Include stats if available
            if (result.stats) {
               response.stats = result.stats;
            }
            
            return res.status(STATUS.SUCCESS).json(response);
         } else {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json(result);
         }
      } catch (error) {
         next(error)
      }
   }

   public static exportBehaviorAlertsExcel = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = { ...buildBehaviorAlertFilters(req), page: 1, limit: 50000 };
         const result = await BehaviorAlertsService.viewBehaviorAlertsService(filters);
         const rows = mapBehaviorAlertExportRows(result.data || []);

         const workbook = XLSX.utils.book_new();
         const worksheet = XLSX.utils.json_to_sheet(rows);
         XLSX.utils.book_append_sheet(workbook, worksheet, "Behaviour Alerts");

         const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
         const fileName = `behaviour_alerts_${new Date().toISOString().slice(0, 10)}.xlsx`;

         res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
         return res.status(STATUS.SUCCESS).send(buffer);
      } catch (error) {
         next(error);
      }
   }

   public static exportBehaviorAlertsPdf = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = { ...buildBehaviorAlertFilters(req), page: 1, limit: 50000 };
         const result = await BehaviorAlertsService.viewBehaviorAlertsService(filters);
         const rows = mapBehaviorAlertExportRows(result.data || []);
         const headers = ["Type", "ID", "Location", "Camera", "Occurrence", "Detected Behaviour"];
         const widths = [45, 75, 90, 120, 95, 95];

         const fileName = `behaviour_alerts_${new Date().toISOString().slice(0, 10)}.pdf`;
         res.setHeader("Content-Type", "application/pdf");
         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

         const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 20 });
         doc.pipe(res);

         const startX = 20;
         const maxY = doc.page.height - 30;
         let currentY = 20;

         const renderHeader = () => {
            doc.fontSize(14).font("Helvetica-Bold").text("Behaviour Alerts Export", startX, currentY);
            currentY += 24;
            doc.fontSize(8).font("Helvetica-Bold");

            let x = startX;
            headers.forEach((header, index) => {
               doc.text(header, x, currentY, { width: widths[index] });
               x += widths[index];
            });

            currentY += 16;
            doc.moveTo(startX, currentY - 4).lineTo(startX + widths.reduce((a, b) => a + b, 0), currentY - 4).stroke();
            doc.font("Helvetica");
         };

         renderHeader();

         rows.forEach((row) => {
            const values = headers.map((header) => String((row as any)[header] ?? "-"));
            const rowHeight = Math.max(...values.map((value, index) => doc.heightOfString(value, { width: widths[index], align: "left" }))) + 6;

            if (currentY + rowHeight > maxY) {
               doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
               currentY = 20;
               renderHeader();
            }

            let x = startX;
            values.forEach((value, index) => {
               doc.fontSize(7).text(value, x, currentY, { width: widths[index] });
               x += widths[index];
            });

            currentY += rowHeight;
         });

         doc.end();
      } catch (error) {
         next(error);
      }
   }
}

export default BehaviorAlertsController; 