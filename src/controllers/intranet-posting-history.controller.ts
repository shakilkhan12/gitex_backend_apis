import { IntranetPostingHistoryService } from "@/services";
import { IntranetPostingHistoryType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class IntranetPostingHistoryController extends IntranetPostingHistoryService {
   public static addIntranetPostingHistory = async (req: Request<{}, {}, IntranetPostingHistoryType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const intranetPostingHistory = await IntranetPostingHistoryService.addIntranetPostingHistoryService(req.body)
            return res.status(STATUS.CREATED).json(intranetPostingHistory)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewIntranetPostingHistory = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const intranetPostingHistory = await IntranetPostingHistoryService.viewIntranetPostingHistoryService();
         return res.status(STATUS.SUCCESS).json(intranetPostingHistory);
      } catch (error) {
         next(error)
      }
   }

   public static getIntranetPostingHistoryById = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { id } = req.params;
         const intranetPostingHistory = await IntranetPostingHistoryService.getIntranetPostingHistoryByIdService(parseInt(id));
         return res.status(STATUS.SUCCESS).json(intranetPostingHistory);
      } catch (error) {
         next(error);
      }
   }
}

export default IntranetPostingHistoryController;
