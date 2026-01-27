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
         const { department, employeeId, officeId, cameraId } = req.query;
         
         // Parse cameraId and officeId, handling both string and number inputs
         const parsedOfficeId = officeId ? (typeof officeId === 'string' ? parseInt(officeId, 10) : Number(officeId)) : undefined;
         const parsedCameraId = cameraId ? (typeof cameraId === 'string' ? parseInt(cameraId, 10) : Number(cameraId)) : undefined;
         
         // Validate parsed IDs
         if (officeId && (isNaN(parsedOfficeId!) || parsedOfficeId! <= 0)) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               status: STATUS.BAD_REQUEST, 
               message: 'Invalid officeId parameter' 
            });
         }
         
         if (cameraId && (isNaN(parsedCameraId!) || parsedCameraId! <= 0)) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               status: STATUS.BAD_REQUEST, 
               message: 'Invalid cameraId parameter' 
            });
         }
         
         const filters = {
            department: department as string | undefined,
            employeeId: employeeId as string | undefined,
            officeId: parsedOfficeId,
            cameraId: parsedCameraId
         };
         
         console.log('[OfficeAttendance Controller] Filters received:', filters);
         
         const attendances = await OfficeAttendanceService.viewOfficeAttendancesService(filters);
         return res.status(STATUS.SUCCESS).json(attendances);
      } catch (error) {
         next(error)
      }
   }

   public static getOfficeAttendanceFilters = async (_req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await OfficeAttendanceService.getOfficeAttendanceFiltersService();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }
}

export default OfficeAttendanceController; 