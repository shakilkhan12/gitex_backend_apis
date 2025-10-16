import { OfficesService } from "@/services";
import { OfficeCamera, OfficeSettingInputTypes, OfficeType, OfficeFootfallAnalysisType, ParkCamera, ParkType, ParkZone, SettingInputTypes } from "@/typescript";
import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class OfficesController extends OfficesService {
  
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
   public static getOffices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const offices = await OfficesService.getOfficesService();
      return res.status(STATUS.SUCCESS).json(offices);
    } catch (error) {
      next(error)
    }
   }
    public static getOfficeCameras = async (req: Request <{officeId: number}>, res: Response, next: NextFunction) => {
    const officeId = req.params.officeId
    try {
      const officeCameras = await OfficesService.getOfficeCamerasService(officeId);
      return res.status(STATUS.SUCCESS).json(officeCameras)
    } catch (error) {
      next(error)
    }
  }
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
    const updatableFields = [
      "attendance",
      "footfall",
      "sentiment",
    ];
     if (!camera_Id) {
      return res.status(STATUS.BAD_REQUEST).json({ message: "camera_Id is required" });
    }

    const fieldsToUpdate = Object.keys(fields).filter((f) =>
      updatableFields.includes(f)
    );

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
      next(error)
    }
  }
  public static getOffice = async (req: Request, res: Response, next: NextFunction) => {
    const officeId: number = Number(req.params.id);
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
    public static updateOfficeImage = async (req: Request <{}, {}, {Id: number, image: string}>, res: Response, next: NextFunction) => {
    try {
      const {Id, image} = req.body;
     if (!Id || !image) {
  return res
    .status(STATUS.BAD_REQUEST)
    .json({ message: 'id & image url are required' })
}
     const imageUpdated = await OfficesService.updateOfficeImageService({Id, image});
     return res.status(STATUS.SUCCESS).json(imageUpdated)

    } catch (error: any) {
      next(error)
    }
  }
  public static updateOfficeCamera = async (req: Request <{id: number}, {}, OfficeCamera>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    try {
      const id = req.params.id;
      if(errors.isEmpty()) {
        const parkCamera = await OfficesService.updateOfficeCameraService(req.body, id);
        return res.status(STATUS.CREATED).json(parkCamera)
      } else {
        return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()})
      }
    } catch (error: any) {
      if(error.code === 'P2002') {
          return res.status(STATUS.BAD_REQUEST).json({message: "This camera already exists in the selected office."})
      } else {
            next(error)
      }
    }
  }

  public static getOfficeFootfallAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { office_Id } = req.params;
      const { fromDate, toDate, officeIds } = req.query;

      let officeIdsToUse;
      
      if (officeIds) {
        if (typeof officeIds === 'string' && officeIds.includes(',')) {
          officeIdsToUse = officeIds.split(',').map(id => Number(id.trim()));
        } else if (Array.isArray(officeIds)) {
          officeIdsToUse = officeIds.map(id => Number(id));
        } else {
          officeIdsToUse = [Number(officeIds)];
        }
      } else if (office_Id) {
        officeIdsToUse = Number(office_Id);
      } else {
        return res.status(STATUS.BAD_REQUEST).json({ message: 'office_Id or officeIds is required' });
      }

      const footfallData = await OfficesService.getOfficeFootfallAnalysisService(
        officeIdsToUse,
        fromDate as string,
        toDate as string
      );

      return res.status(STATUS.SUCCESS).json(footfallData);
    } catch (error) {
      next(error);
    }
  }

  public static getOfficeFootfallDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { officeId, fromDate, toDate, filterType, filterValue } = req.query;

      if (!officeId) {
        return res.status(STATUS.BAD_REQUEST).json({ message: 'officeId is required' });
      }

      const footfallDetails = await OfficesService.getOfficeFootfallDetailsService(
        Number(officeId),
        fromDate as string,
        toDate as string,
        filterType as string,
        filterValue as string
      );

      return res.status(STATUS.SUCCESS).json(footfallDetails);
    } catch (error) {
      next(error);
    }
  }

  public static addOfficeFootfallAnalysis = async (req: Request<{}, {}, OfficeFootfallAnalysisType>, res: Response, next: NextFunction) => {
    try {
      const footfallData = req.body;

      if (!footfallData.office_Id || !footfallData.detection_Id || !footfallData.detected_camera_Id || !footfallData.person_Id) {
        return res.status(STATUS.BAD_REQUEST).json({ 
          message: 'office_Id, detection_Id, detected_camera_Id, and person_Id are required' 
        });
      }

      const result = await OfficesService.addOfficeFootfallAnalysisService(footfallData);
      return res.status(STATUS.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

}
export default OfficesController;
