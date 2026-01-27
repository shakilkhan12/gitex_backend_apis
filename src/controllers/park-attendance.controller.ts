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
         const { department, employeeId, parkId, cameraId } = req.query;
         
         // Parse parkId and cameraId, handling both string and number inputs
         const parsedParkId = parkId ? (typeof parkId === 'string' ? parseInt(parkId, 10) : Number(parkId)) : undefined;
         const parsedCameraId = cameraId ? (typeof cameraId === 'string' ? parseInt(cameraId, 10) : Number(cameraId)) : undefined;
         
         // Validate parsed IDs
         if (parkId && (isNaN(parsedParkId!) || parsedParkId! <= 0)) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               status: STATUS.BAD_REQUEST, 
               message: 'Invalid parkId parameter' 
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
            parkId: parsedParkId,
            cameraId: parsedCameraId
         };
         
         console.log('[ParkAttendance Controller] Filters received:', filters);
         
         const attendances = await ParkAttendanceService.viewParkAttendancesService(filters);
         return res.status(STATUS.SUCCESS).json(attendances);
      } catch (error) {
         next(error)
      }
   }

   public static getParkAttendanceFilters = async (_req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await ParkAttendanceService.getParkAttendanceFiltersService();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }
}

export default ParkAttendanceController; 