import { Decimal } from "@/prisma/generated/prisma/runtime/library";
import { ParksService } from "@/services";
import { ParkCamera, ParkType, ParkZone, SettingInputTypes, STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class ParksController extends ParksService {
  
  // add new park
   public static addPark = async (req: Request<{}, {}, ParkType>, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
       try {
        if(errors.isEmpty()) {
           const park = await ParksService.addParkService(req.body)
          return res.status(STATUS.CREATED).json(park)
        } else {
          return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()});
        }
       } catch (error: any) {
        console.log(error)
         if (error.code === "P2002") {
      return res.status(
        STATUS.BAD_REQUEST
      ).json({message: `Park ID ${req?.body?.park_Id} already exists`});
    } else {
     next(error)
    }
       }
   }
  //  get all parks
   public static getParks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parks = await ParksService.getParksService();
      return res.status(STATUS.SUCCESS).json(parks);
    } catch (error) {
      next(error)
    }
   }
  //  get all park zones
  public static getParkZones = async (req: Request <{parkId: number}>, res: Response, next: NextFunction) => {
    const parkId = req.params.parkId
    try {
      const parkZones = await ParksService.getParkZonesService(parkId);
      return res.status(STATUS.SUCCESS).json(parkZones)
    } catch (error) {
      next(error)
    }
  }
  // get all park cameras 
    public static getParkCameras = async (req: Request <{parkId: number}>, res: Response, next: NextFunction) => {
    const parkId = req.params.parkId
    try {
      const parkCameras = await ParksService.getParkCamerasService(parkId);
      return res.status(STATUS.SUCCESS).json(parkCameras)
    } catch (error) {
      next(error)
    }
  }
  //  add new park zone
  public static addParkZone = async (req: Request <{}, {}, ParkZone>, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    try {
      if(errors.isEmpty()) {
        const parkZone = await ParksService.addParkZoneService(req.body);
        return res.status(STATUS.CREATED).json(parkZone)
      } else {
        return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()})
      }
    } catch (error:any) {
      if(error.code === 'P2002') {
       return res.status(STATUS.BAD_REQUEST).json({message: "This zone already exists in the selected park."})
      } else {
       next(error) 
      } 
    }
  }
  // add park camera
  public static addParkCamera = async (req: Request <{}, {}, ParkCamera>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    try {
      if(errors.isEmpty()) {
        const parkCamera = await ParksService.addParCameraService(req.body);
        return res.status(STATUS.CREATED).json(parkCamera)
      } else {
        return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()})
      }
    } catch (error: any) {
      console.log(error)
      if(error.code === 'P2002') {
          return res.status(STATUS.BAD_REQUEST).json({message: "This camera already exists in the selected park."})
      } else {
            next(error)
      }
    }
  }
  // update park camera functionality
  public static changeParkCameraFunctionality = async (req: Request, res: Response, next: NextFunction) => {
    try {
const { camera_Id, ...fields } = req.body;

    const updatableFields = [
      "attendance",
      "footfall",
      "behaviour",
      "sentiment",
      "irrigation",
      "landscaping",
      "litter_detection",
      "intrusion",
      "smoking_detection",
    ];
     if (!camera_Id) {
      return res.status(STATUS.BAD_REQUEST).json({ message: "camera_Id is required" });
    }

    // Filter only allowed fields
    const fieldsToUpdate = Object.keys(fields).filter((f) =>
      updatableFields.includes(f)
    );
    console.log(fieldsToUpdate)
    // Ensure only one field is present
    if (fieldsToUpdate.length !== 1) {
      return res.status(STATUS.BAD_REQUEST).json({
        message: "You must provide exactly one field to update",
      });
    }
    const fieldName = fieldsToUpdate[0];
    const fieldValue = fields[fieldName];
    const updatedCamera = await ParksService.changeParkCameraFunctionalityService({fieldName, fieldValue, camera_Id})
    return res.status(STATUS.CREATED).json(updatedCamera)
    } catch (error) {
      next(error)
    }
  }
  // update setting 
  public static updateSetting = async (req: Request <{}, {}, SettingInputTypes>, res: Response, next: NextFunction) => {
    const parkId = req.body.park_Id
    if(!parkId) {
      return res.status(STATUS.BAD_REQUEST).json({message: 'park id is required'})
    }
    try {
      const settingUpdated = await ParksService.changeParkSettingService(req.body);
      return res.status(STATUS.CREATED).json(settingUpdated)
    } catch (error) {
      next(error)
    }
  }
  public static updateParkBasicInfo = async (req: Request <{}, {}, ParkType>, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if(errors.isEmpty()) {
        const basicInfo = await ParksService.updateParkBasicInfoService(req.body)
        return res.status(STATUS.CREATED).json(basicInfo)
      } else {
        return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()})
      }
    } catch (error) {
      next(error)
    }
  }
  public static getPark = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const park_Id: number = Number(req.params.parkId);
      const park = await ParksService.getParkService(park_Id);
      return res.status(STATUS.SUCCESS).json(park)
    } catch (error) {
      next(error)
    }
  }
    public static getParkCamerasFunctionalities = async (req: Request, res: Response, next: NextFunction) => {
    const parkId: number = Number(req.params.parkId)
    try {
      const functionalities = await ParksService.getParkCamerasFunctionalitiesService(parkId);
      return res.status(STATUS.SUCCESS).json(functionalities)
    } catch (error) {
      next(error)
    }
  }
  public static getParkSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parkId: number = Number(req.params.parkId)
      const settings = await ParksService.getParkSettingService(parkId)
      return res.status(STATUS.SUCCESS).json(settings)
    } catch (error) {
      next(error)
    }
  }
}
export default ParksController;
