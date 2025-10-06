import { Decimal } from "@/prisma/generated/prisma/runtime/library";
import { ParksService } from "@/services";
import { ParkCamera, ParkType, ParkZone, SettingInputTypes, ParkFootfallAnalysisType } from "@/typescript";
import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class ParksController extends ParksService {
  
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
         if (error.code === "P2002") {
      return res.status(
        STATUS.BAD_REQUEST
      ).json({message: `Park ID ${req?.body?.park_Id} already exists`});
    } else {
     next(error)
    }
       }
   }
   public static getParks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parks = await ParksService.getParksService();
      return res.status(STATUS.SUCCESS).json(parks);
    } catch (error) {
      next(error)
    }
   }
  public static getParkZones = async (req: Request <{parkId: number}>, res: Response, next: NextFunction) => {
    const parkId = req.params.parkId
    try {
      const parkZones = await ParksService.getParkZonesService(parkId);
      return res.status(STATUS.SUCCESS).json(parkZones)
    } catch (error) {
      next(error)
    }
  }
    public static getParkCameras = async (req: Request <{parkId: number}>, res: Response, next: NextFunction) => {
    const parkId = req.params.parkId
    try {
      const parkCameras = await ParksService.getParkCamerasService(parkId);
      return res.status(STATUS.SUCCESS).json(parkCameras)
    } catch (error) {
      next(error)
    }
  }
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
  public static updateParkZone = async (req: Request <{id: string}, {}, ParkZone>, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    const id = Number(req.params.id);
    try {
      if(errors.isEmpty()) {
        const updatedZone = await ParksService.updateParkZoneService(req.body, id);
        return res.status(STATUS.CREATED).json(updatedZone)
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
  // update park camera
  public static updateParkCamera = async (req: Request <{id: number}, {}, ParkCamera>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    try {
      const id = req.params.id;
      if(errors.isEmpty()) {
        const parkCamera = await ParksService.updateParkCameraService(req.body, id);
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
    const updatedCamera = await ParksService.changeParkCameraFunctionalityService({fieldName, fieldValue, camera_Id})
    return res.status(STATUS.CREATED).json(updatedCamera)
    } catch (error) {
      next(error)
    }
  }
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
  public static updateParkImage = async (req: Request <{}, {}, {Id: number, image: string}>, res: Response, next: NextFunction) => {
    try {
      const {Id, image} = req.body;
     if (!Id || !image) {
  return res
    .status(STATUS.BAD_REQUEST)
    .json({ message: 'id & image url are required' })
}
     const imageUpdated = await ParksService.updateParkImageService({Id, image});
     return res.status(STATUS.SUCCESS).json(imageUpdated)

    } catch (error: any) {
      next(error)
    }
  }
  public static updateParkStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if(errors.isEmpty()) {
       const { Id, status } = req.body;
      const result = await ParksService.updateZoneStatusService(Number(Id), status);
      res.status(STATUS.SUCCESS).json({
        message: "Zone status updated successfully",
        data: result,
      });
      } else {
   return res.status(STATUS.BAD_REQUEST).json({errors: errors.array()})
      }

    } catch (error) {
      next(error)
    }
  }

  public static getParkFootfallAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🚀 [ParkController] getParkFootfallAnalysis called');
      console.log('📥 [ParkController] Request params:', req.params);
      console.log('📥 [ParkController] Request query:', req.query);
      
      const { park_Id } = req.params;
      const { fromDate, toDate, parkIds } = req.query;

      console.log('🔍 [ParkController] Extracted values:');
      console.log('  - park_Id:', park_Id, typeof park_Id);
      console.log('  - parkIds:', parkIds, typeof parkIds);
      console.log('  - fromDate:', fromDate, typeof fromDate);
      console.log('  - toDate:', toDate, typeof toDate);

      let parkIdsToUse;
      
      if (parkIds) {
        console.log('📋 [ParkController] Processing parkIds parameter');
        if (typeof parkIds === 'string' && parkIds.includes(',')) {
          parkIdsToUse = parkIds.split(',').map(id => Number(id.trim()));
          console.log('  - Split comma-separated string:', parkIdsToUse);
        } else if (Array.isArray(parkIds)) {
          parkIdsToUse = parkIds.map(id => Number(id));
          console.log('  - Processed array:', parkIdsToUse);
        } else {
          parkIdsToUse = [Number(parkIds)];
          console.log('  - Single value converted to array:', parkIdsToUse);
        }
      } else if (park_Id) {
        parkIdsToUse = Number(park_Id);
        console.log('📋 [ParkController] Using park_Id from params:', parkIdsToUse);
      } else {
        console.log('❌ [ParkController] No park IDs provided');
        return res.status(STATUS.BAD_REQUEST).json({ message: 'park_Id or parkIds is required' });
      }

      console.log('✅ [ParkController] Final parkIdsToUse:', parkIdsToUse, typeof parkIdsToUse);
      console.log('🔄 [ParkController] Calling ParksService.getParkFootfallAnalysisService...');

      const footfallData = await ParksService.getParkFootfallAnalysisService(
        parkIdsToUse,
        fromDate as string,
        toDate as string
      );

      console.log('✅ [ParkController] Service returned data:', {
        summary: footfallData?.summary,
        employeesCount: footfallData?.employees?.length,
        guestsCount: footfallData?.guests?.length,
        rawDataCount: footfallData?.rawData?.length
      });

      return res.status(STATUS.SUCCESS).json(footfallData);
    } catch (error) {
      console.log('❌ [ParkController] Error occurred:', error);
      console.log('❌ [ParkController] Error message:', error);
      console.log('❌ [ParkController] Error stack:', error);
      next(error);
    }
  };

  public static addParkFootfallAnalysis = async (req: Request<{}, {}, ParkFootfallAnalysisType>, res: Response, next: NextFunction) => {
    try {
      const footfallData = req.body;

      if (!footfallData.park_Id || !footfallData.detection_Id || !footfallData.detected_camera_Id) {
        return res.status(STATUS.BAD_REQUEST).json({ 
          message: 'park_Id, detection_Id, and detected_camera_Id are required' 
        });
      }

      const result = await ParksService.addParkFootfallAnalysisService(footfallData);
      return res.status(STATUS.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Get park zones job history
  public static getParkZonesJobHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { parkId } = req.params;
      const { zoneId, status, search } = req.query;

      const filters = {
        zoneId: zoneId ? parseInt(zoneId as string) : undefined,
        status: status as string,
        search: search as string
      };

      const result = await ParksService.getParkZonesJobHistoryService(
        parseInt(parkId),
        filters
      );

      return res.status(STATUS.SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  };

}
export default ParksController;
