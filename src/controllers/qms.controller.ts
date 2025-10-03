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
         const history = await QMSService.viewQMSHistoryService();
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "QMS history retrieved successfully",
            data: history
         });
      } catch (error) {
         next(error)
      }
   }
}

export default QMSController;
