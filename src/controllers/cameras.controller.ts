import CamerasService from "@/services/cameras.service";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class CamerasController extends CamerasService {
  // Get all offices and parks cameras in a single response
  public static getAllCameras = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const camerasData = await CamerasService.getAllCamerasService();
      return res.status(STATUS.SUCCESS).json(camerasData);
    } catch (error) {
      next(error);
    }
  };
}

export default CamerasController;
