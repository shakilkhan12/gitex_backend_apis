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

   public static testingIrrigationZones = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { images } = req.body;
         
         if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "Images array is required and must not be empty"
            });
         }

         const result = await IrrigationsService.testingIrrigationZones(images);
         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Testing irrigation zones completed successfully",
            data: result
         });
      } catch (error) {
         next(error)
      }
   }
}

export default IrrigationsController;
