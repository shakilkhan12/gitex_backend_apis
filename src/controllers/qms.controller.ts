import { QMSService } from "@/services";
import { QMSTriggerType, QMSUpdateType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { formatExportDate, formatExportTime } from "@/utils/export.utils";

const buildQmsFilters = (req: Request) => {
   const { page, limit, search, sortBy, sortOrder, fromDateTime, toDateTime, entryMode, exitMode, service, agent, ticketNumber, status } = req.query;

   return {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
      fromDateTime: fromDateTime as string,
      toDateTime: toDateTime as string,
      entryMode: entryMode as string,
      exitMode: exitMode as string,
      service: service as string,
      agent: agent as string,
      ticketNumber: ticketNumber as string,
      status: status as string
   };
};

const mapQmsExportRows = (records: any[]) => {
   return records.map((item) => ({
      "Visit ID": item.visit_id || "-",
      "Date": formatExportDate(item.entry_date),
      "Entry Time": formatExportTime(item.entry_time),
      "Ticket #": item.ticket_number || "-",
      "Service": item.service_english_name || item.service_arabic_name || "-",
      "Waiting Time": item.waiting_time || "-",
      "Total Processing Time": item.total_processing_time || "-",
      "Service Agent": item.agent_english_name || item.agent_arabic_name || "-"
   }));
};

class QMSController extends QMSService {
   public static triggerQMSVisit = async (req: Request<{}, {}, QMSTriggerType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const result = await QMSService.triggerQMSVisitService()
            
            if (!result) {
               return res.status(STATUS.NOT_FOUND).json({
                  success: false,
                  message: "No stream event data available",
                  data: null
               })
            }
            
            return res.status(STATUS.CREATED).json({
               success: true,
               message: "QMS visit triggered successfully",
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

   public static updateQMSVisit = async (req: Request<{}, {}, QMSUpdateType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const result = await QMSService.updateQMSVisitService(req.body)
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "QMS visit updated successfully",
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

   public static viewQMSHistory = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = buildQmsFilters(req);

         const result = await QMSService.viewQMSHistoryService(filters);

         // Handle both paginated and non-paginated responses
         if (result.pagination) {
            // Paginated response
            const response: any = {
               success: true,
               message: "QMS history retrieved successfully",
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

   public static exportQMSHistoryExcel = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = { ...buildQmsFilters(req), page: 1, limit: 50000 };
         const result = await QMSService.viewQMSHistoryService(filters);
         const rows = mapQmsExportRows(result.data || []);

         const workbook = XLSX.utils.book_new();
         const worksheet = XLSX.utils.json_to_sheet(rows);
         XLSX.utils.book_append_sheet(workbook, worksheet, "Queue");

         const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
         const fileName = `queue_management_${new Date().toISOString().slice(0, 10)}.xlsx`;

         res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
         return res.status(STATUS.SUCCESS).send(buffer);
      } catch (error) {
         next(error);
      }
   }

   public static exportQMSHistoryPdf = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const filters = { ...buildQmsFilters(req), page: 1, limit: 50000 };
         const result = await QMSService.viewQMSHistoryService(filters);
         const rows = mapQmsExportRows(result.data || []);
         const headers = ["Visit ID", "Date", "Entry Time", "Ticket #", "Service", "Waiting Time", "Total Processing Time", "Service Agent"];
         const widths = [55, 55, 55, 60, 85, 60, 80, 85];

         const fileName = `queue_management_${new Date().toISOString().slice(0, 10)}.pdf`;
         res.setHeader("Content-Type", "application/pdf");
         res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

         const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 20 });
         doc.pipe(res);

         const startX = 20;
         const maxY = doc.page.height - 30;
         let currentY = 20;

         const renderHeader = () => {
            doc.fontSize(14).font("Helvetica-Bold").text("Queue Management Export", startX, currentY);
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

export default QMSController;
