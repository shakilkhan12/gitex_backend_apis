import { ParkType, STATUS, ParkZone, ParkCamera, SettingInputTypes } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class ParkService {
   // add park service
   protected static addParkService = async (park: ParkType) => {
      const parkExist = await db.parks.findFirst({
               where: { park_Id: park.park_Id },
           });
      if(parkExist) {
         throw new HttpException(STATUS.BAD_REQUEST, `${park.park_Id} park id is already exist`);
      }
      const result = await db.parks.create({
      data: {...park, createdAt: new Date()},
  });
  return result;
   }
   // get parks service
   protected static getParksService = async () => {
      return await db.parks.findMany({
         include: {
         _count: {
         select: {
          park_zones: true,
          park_cameras: true,
        },
      },
    },
    orderBy: {
    Id: "desc",
  },
      });
   }
   // get park
   protected static getParkService = async (park_Id: number) => {
      if(!park_Id) {
         throw new HttpException(STATUS.BAD_REQUEST, `park id is required`)
      }
      return await db.parks.findFirst({
         where: {
         Id: park_Id
    },
      });
   }
   // get park zones service
   protected static getParkZonesService = async (park_Id: number) => {
      if(!park_Id) {
          throw new HttpException(STATUS.BAD_REQUEST, `park id is required`)
      }
   return await db.park_zones.findMany({
      where: {
         park_Id: Number(park_Id)
      },
      include: {
         parks: true
      },
      orderBy: {
    Id: "desc",
  },
   });
   }
   // get park cameras service
    protected static getParkCamerasService = async (park_Id: number) => {
      if(!park_Id) {
          throw new HttpException(STATUS.BAD_REQUEST, `park id is required`)
      }
    return await db.park_cameras.findMany({
      where: {
         park_Id: Number(park_Id)
      },
      orderBy: {
    Id: "desc",
  },
   });
   }
   // add park zone service
   protected static addParkZoneService = async (zoneData: ParkZone) => {
      const result = await db.park_zones.create({
         data: {...zoneData, createdAt: new Date() }
      });
      return result;
   }
   // add park camera service
   protected static addParCameraService = async (cameraData: ParkCamera) => {
      const result = await db.park_cameras.create({
         data: {...cameraData, createdAt: new Date()}
      })
      return result;
   }
   protected static changeParkCameraFunctionalityService = async ({fieldName, fieldValue, camera_Id}: {fieldName: string, fieldValue: any, camera_Id: string}) => {
      const cameraExist = await db.park_cameras.findFirst({
               where: { Id: Number(camera_Id) },
           });
           if(!cameraExist) {
              throw new HttpException(STATUS.BAD_REQUEST, `No camera found with the given ID`);
           }
        const result = db.park_cameras.update({
        where: { Id: Number(camera_Id) },
        data: {
        [fieldName]: fieldValue,
        updatedAt: new Date(),
      },
    });
    return result;
   }
   protected static changeParkSettingService = async (setting: SettingInputTypes) => {
      const {password, stream_api_key, stream_path, stream_url, park_Id} = setting;
      const parkExist = await db.parks.findFirst({
               where: { Id: Number(park_Id) },
           });
           if(!parkExist) {
              throw new HttpException(STATUS.NOT_FOUND, `No park found with the given ID`);
           }
   const result = await db.park_streams.upsert({
  where: { park_Id: Number(park_Id) }, // must be a unique field
  update: {
    password,
    stream_api_key,
    stream_path,
    stream_url
  },
  create: {
    park_Id: Number(park_Id),
    password,
    stream_api_key,
    stream_path,
    stream_url,
    createdAt: new Date()
  }
});
    return result;
   }
   // update park basic info service
   protected static updateParkBasicInfoService = async (basicInfo: ParkType) => {
      const {park_Id, park_arabic_name, park_english_name, latitude, longitude} = basicInfo
      const parkExist = await db.parks.findFirst({
               where: { Id: Number(park_Id) },
           });
           if(!parkExist) {
              throw new HttpException(STATUS.BAD_REQUEST, `No park found with the given ID`);
           }
       const result = db.parks.update({
        where: { Id: Number(park_Id) },
        data: {
        park_arabic_name,
        park_english_name,
        latitude,
        longitude
      },
    });
    return result;
   }
      protected static getParkCamerasFunctionalitiesService = async (park_Id: number) => {
      if(!park_Id) {
         throw new HttpException(STATUS.BAD_REQUEST, `Park id is required`);
      }
       const functionalities = await db.park_cameras.findMany({
               where: { park_Id:  park_Id},
           });
           
           if(functionalities) {
             return functionalities;
           } else {
            throw new HttpException(STATUS.NOT_FOUND, `No functionalities found with the given ID`);
           }
   }
   protected static getParkSettingService = async (parkId: number) => {
      if(!parkId) {
          throw new HttpException(STATUS.BAD_REQUEST, `Park id is required`);
      }
      const settings = await db.park_streams.findFirst({
         where: {Id: parkId}
      })
      if(settings) {
         return settings
      } else {
         throw new HttpException(STATUS.NOT_FOUND, `No Settings found with the given ID`);
      }
   }
   
}
export default ParkService;