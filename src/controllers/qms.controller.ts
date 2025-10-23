import { QMSService } from "@/services";
import { QMSTriggerType, QMSUpdateType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

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
         const { page, limit, search, sortBy, sortOrder, fromDateTime, toDateTime, entryMode, exitMode, service, status } = req.query;

         const filters = {
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
            status: status as string
         };

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
}

export default QMSController;
