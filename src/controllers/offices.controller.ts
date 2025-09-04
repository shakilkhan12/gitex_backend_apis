import { OfficesService, ParkService } from "@/services";
import { OfficeCamera, OfficeSettingInputTypes, OfficeType, ParkCamera, ParkType, ParkZone, SettingInputTypes, STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class OfficesController extends OfficesService {
  
  // add new park
   public static addOffice = async (req: Request<{}, {}, OfficeType>, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
       try {
        if(errors.isEmpty()) {
           const office = await OfficesService.addOfficeService(req.body)
          return res.status(STATUS.CREATED).json(office)
        } else {
          return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()});
        }
       } catch (error: any) {
        if (error.code === "P2002") {
      return res.status(
        STATUS.BAD_REQUEST
      ).json({message: `Office ID ${req?.body?.office_Id} already exists`});
    } else {
 next(error)
    }
       }
   }
//    get all offices
   public static getOffices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const offices = await OfficesService.getOfficesService();
      return res.status(STATUS.SUCCESS).json(offices);
    } catch (error) {
      next(error)
    }
   }
  // get all office cameras 
    public static getOfficeCameras = async (req: Request <{officeId: number}>, res: Response, next: NextFunction) => {
    const officeId = req.params.officeId
    try {
      const officeCameras = await OfficesService.getOfficeCamerasService(officeId);
      return res.status(STATUS.SUCCESS).json(officeCameras)
    } catch (error) {
      next(error)
    }
  }
  // add office camera
  public static addOfficeCamera = async (req: Request <{}, {}, OfficeCamera>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    try {
      if(errors.isEmpty()) {
        const officeCamera = await OfficesService.addOfficeCameraService(req.body);
        return res.status(STATUS.CREATED).json(officeCamera)
      } else {
        return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()})
      }
    } catch (error: any) {
      if(error.code === 'P2002') {
          return res.status(STATUS.BAD_REQUEST).json({message: "This camera already exists in the selected office."});
      } else {
 next(error)
      }
     
    }
  }
  // update park camera functionality
  public static changeOfficeCameraFunctionality = async (req: Request, res: Response, next: NextFunction) => {
    try {
   const { camera_Id, ...fields } = req.body;
     console.log('body -> ', req.body)
    const updatableFields = [
      "attendance",
      "footfall",
      "sentiment",
    ];
     if (!camera_Id) {
      return res.status(STATUS.BAD_REQUEST).json({ message: "camera_Id is required" });
    }

    // Filter only allowed fields
    const fieldsToUpdate = Object.keys(fields).filter((f) =>
      updatableFields.includes(f)
    );

    // Ensure only one field is present
    if (fieldsToUpdate.length !== 1) {
      return res.status(STATUS.BAD_REQUEST).json({
        message: "You must provide exactly one field to update",
      });
    }
    const fieldName = fieldsToUpdate[0];
    const fieldValue = fields[fieldName];
    const updatedCamera = await OfficesService.changeOfficeCameraFunctionalityService({fieldName, fieldValue, camera_Id})
    return res.status(STATUS.CREATED).json(updatedCamera)
    } catch (error) {
      next(error)
    }
  }
  // update setting 
  public static updateOfficeSetting = async (req: Request <{}, {}, OfficeSettingInputTypes>, res: Response, next: NextFunction) => {
    const officeId = req.body.office_Id
    if(!officeId) {
      return res.status(STATUS.BAD_REQUEST).json({message: 'office id is required'})
    }
    try {
      const settingUpdated = await OfficesService.changeOfficeSettingService(req.body);
      return res.status(STATUS.CREATED).json(settingUpdated)
    } catch (error) {
      next(error)
    }
  }
    public static updateOfficeBasicInfo = async (req: Request <{}, {}, OfficeType>, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if(errors.isEmpty()) {
        const basicInfo = await OfficesService.updateOfficeBasicInfoService(req.body)
        return res.status(STATUS.CREATED).json(basicInfo)
      } else {
        return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()})
      }
    } catch (error: any) {
      console.log(error.message)
      next(error)
    }
  }
  // get office details
  public static getOffice = async (req: Request, res: Response, next: NextFunction) => {
    const officeId: number = Number(req.params.office_Id);
    try {
      const office = await OfficesService.getOfficeService(officeId);
      return res.status(STATUS.SUCCESS).json(office)
    } catch (error) {
      next(error)
    }
  }
    public static getOfficeSetting = async (req: Request, res: Response, next: NextFunction) => {
    const officeId: number = Number(req.params.officeId);
    try {
      const setting = await OfficesService.getOfficeSettingService(officeId);
      return res.status(STATUS.SUCCESS).json(setting)
    } catch (error) {
      next(error)
    }
  }
    public static getOfficeCamerasFunctionalities = async (req: Request, res: Response, next: NextFunction) => {
    const officeId: number = Number(req.params.officeId)
    try {
      const functionalities = await OfficesService.getOfficeCamerasFunctionalitiesService(officeId);
      return res.status(STATUS.SUCCESS).json(functionalities)
    } catch (error) {
      next(error)
    }
  }

}
export default OfficesController;
