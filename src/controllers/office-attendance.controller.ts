import { OfficeAttendanceService } from "@/services";
import { OfficeAttendanceType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class OfficeAttendanceController extends OfficeAttendanceService {
   public static addOfficeAttendance = async (req: Request<{}, {}, OfficeAttendanceType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const attendance = await OfficeAttendanceService.addOfficeAttendanceService(req.body)
            return res.status(STATUS.CREATED).json(attendance)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewOfficeAttendances = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const attendances = await OfficeAttendanceService.viewOfficeAttendancesService();
         return res.status(STATUS.SUCCESS).json(attendances);
      } catch (error) {
         next(error)
      }
   }
}

export default OfficeAttendanceController; 