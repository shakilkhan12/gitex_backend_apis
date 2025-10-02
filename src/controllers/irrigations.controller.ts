import { IrrigationsService } from "@/services";
import { NextFunction, Request, Response } from "express";
import { STATUS } from "@/typescript";

class IrrigationsController {
   public static monitorIrrigationZones = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await IrrigationsService.monitorIrrigationZones();
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Irrigation zone monitoring completed successfully",
            data: result
         });
      } catch (error) {
         next(error)
      }
   }
}

export default IrrigationsController;
