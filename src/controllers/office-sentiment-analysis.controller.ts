import { OfficeSentimentAnalysisService } from "@/services";
import { OfficeSentimentAnalysisType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { formatExportDate, formatExportTime } from "@/utils/export.utils";

const buildOfficeSentimentFilters = (req: Request) => {
   const { page, limit, search, sortBy, sortOrder, fromDateTime, toDateTime, entryMood, exitMood, employeeId, sentimentOf, gender, cameraId, officeId } = req.query;

   return {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
      fromDateTime: fromDateTime as string,
      toDateTime: toDateTime as string,
      entryMood: entryMood as string,
      exitMood: exitMood as string,
      employeeId: employeeId as string,
      sentimentOf: sentimentOf as string,
      gender: gender as string,
      cameraId: cameraId ? parseInt(cameraId as string) : undefined,
      officeId: officeId as string
   };
};

const mapOfficeSentimentExportRows = (records: any[]) => {
   return records.map((item) => ({
      "Type": item.sentiment_of === "employee" ? "Employee" : "Guest",
      "Name": item.user?.emp__eng_name || item.user?.emp__arabic_name || item.person_name || "-",
      "Emp ID": item.user?.emp_Id || item.person_Id || "-",
      "Department": item.user?.dep_eng_name || item.user?.dep_arabic_name || "-",
      "Gender": item.gender || item.user?.gender || "-",
      "Entry Date": formatExportDate(item.check_in_date),
      "Entry Time": formatExportTime(item.check_in_time),
      "Entry Sentiment": item.check_in_sentiment || "-",
      "Entry Camera":
         item.offices_cameras_offices_sentiment_analysis_entry_camera_IdTooffices_cameras?.camera_english_name ||
         item.offices_cameras_offices_sentiment_analysis_entry_camera_IdTooffices_cameras?.camera_arabic_name ||
         "-",
      "Exit Date": formatExportDate(item.check_out_date),
      "Exit Time": formatExportTime(item.check_out_time),
      "Exit Sentiment": item.check_out_sentiment || "-",
      "Exit Camera":
         item.offices_cameras_offices_sentiment_analysis_exit_camera_IdTooffices_cameras?.camera_english_name ||
         item.offices_cameras_offices_sentiment_analysis_exit_camera_IdTooffices_cameras?.camera_arabic_name ||
         "-"
   }));
};

class OfficeSentimentAnalysisController extends OfficeSentimentAnalysisService {
   public static addOfficeSentimentAnalysis = async (req: Request<{}, {}, OfficeSentimentAnalysisType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const sentimentAnalysis = await OfficeSentimentAnalysisService.addOfficeSentimentAnalysisService(req.body)
            return res.status(STATUS.CREATED).json(sentimentAnalysis)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static updateOfficeSentimentAnalysis = async (req: Request<{ detection_Id: string }, {}, Partial<OfficeSentimentAnalysisType>>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const { detection_Id } = req.params;
            const sentimentAnalysis = await OfficeSentimentAnalysisService.updateOfficeSentimentAnalysisService(detection_Id, req.body)
            return res.status(STATUS.SUCCESS).json(sentimentAnalysis)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewOfficeSentimentAnalyses = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = buildOfficeSentimentFilters(req);

         const result = await OfficeSentimentAnalysisService.viewOfficeSentimentAnalysesService(filters);

         // Handle both paginated and non-paginated responses
         if (result.pagination) {
            // Paginated response
            const response: any = {
               success: true,
               message: "Office sentiment analyses retrieved successfully",
               data: result.data,
               pagination: result.pagination,
               stats: result.stats
            };
            
            return res.status(STATUS.SUCCESS).json(response);
         } else {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json(result);
         }
      } catch (error) {
         next(error)
      }
   }

   public static exportOfficeSentimentAnalysesExcel = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = {
            ...buildOfficeSentimentFilters(req),
            page: 1,
            limit: 50000
         };

         const result = await OfficeSentimentAnalysisService.viewOfficeSentimentAnalysesService(filters);
         const rows = mapOfficeSentimentExportRows(result.data || []);

         const workbook = XLSX.utils.book_new();
         const worksheet = XLSX.utils.json_to_sheet(rows);
         XLSX.utils.book_append_sheet(workbook, worksheet, "Office Sentiment");

         const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
         const fileName = `office_sentiment_${new Date().toISOString().slice(0, 10)}.xlsx`;

         res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
         return res.status(STATUS.SUCCESS).send(buffer);
      } catch (error) {
         next(error);
      }
   }

   public static exportOfficeSentimentAnalysesPdf = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = {
            ...buildOfficeSentimentFilters(req),
            page: 1,
            limit: 50000
         };

         const result = await OfficeSentimentAnalysisService.viewOfficeSentimentAnalysesService(filters);
         const rows = mapOfficeSentimentExportRows(result.data || []);
         const headers = ["Type", "Name", "Emp ID", "Department", "Gender", "Entry Date", "Entry Time", "Entry Sentiment", "Entry Camera", "Exit Date", "Exit Time", "Exit Sentiment", "Exit Camera"];
         const widths = [38, 78, 48, 60, 42, 50, 45, 55, 72, 50, 45, 55, 72];

         const fileName = `office_sentiment_${new Date().toISOString().slice(0, 10)}.pdf`;
         res.setHeader("Content-Type", "application/pdf");
         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

         const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 20 });
         doc.pipe(res);

         const startX = 20;
         const maxY = doc.page.height - 30;
         let currentY = 20;

         const renderHeader = () => {
            doc.fontSize(14).font("Helvetica-Bold").text("Office Sentiment Export", startX, currentY);
            currentY += 24;
            doc.fontSize(7).font("Helvetica-Bold");

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
            const rowHeight = Math.max(
               ...values.map((value, index) => doc.heightOfString(value, { width: widths[index], align: "left" }))
            ) + 6;

            if (currentY + rowHeight > maxY) {
               doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
               currentY = 20;
               renderHeader();
            }

            let x = startX;
            values.forEach((value, index) => {
               doc.fontSize(6).text(value, x, currentY, { width: widths[index] });
               x += widths[index];
            });

            currentY += rowHeight;
         });

         doc.end();
      } catch (error) {
         next(error);
      }
   }

   public static getOfficeSentimentAnalysisFilters = async (_req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await OfficeSentimentAnalysisService.getOfficeSentimentAnalysisFiltersService();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }
}

export default OfficeSentimentAnalysisController; 