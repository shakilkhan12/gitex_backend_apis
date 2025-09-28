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

  // Toggle camera favorite status
  public static toggleCameraFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cameraId, cameraType, isFavorite } = req.body;
      const result = await CamerasService.toggleCameraFavoriteService(parseInt(cameraId), cameraType, isFavorite);
      return res.status(STATUS.SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default CamerasController;
