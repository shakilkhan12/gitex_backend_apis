import { ParkAttendanceService } from "@/services";
import { ParkAttendanceType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class ParkAttendanceController extends ParkAttendanceService {
   public static addParkAttendance = async (req: Request<{}, {}, ParkAttendanceType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const attendance = await ParkAttendanceService.addParkAttendanceService(req.body)
            return res.status(STATUS.CREATED).json(attendance)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewParkAttendances = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const attendances = await ParkAttendanceService.viewParkAttendancesService();
         return res.status(STATUS.SUCCESS).json(attendances);
      } catch (error) {
         next(error)
      }
   }
}

export default ParkAttendanceController; 