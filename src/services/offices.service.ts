import {  STATUS, OfficeType, OfficeCamera, OfficeSettingInputTypes } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class OfficesService {
   // add park service
   protected static addOfficeService = async (office: OfficeType) => {
      const result = await db.offices.create({
      data: {...office, createdAt: new Date()},
  });
  return result;
   }
   // get parks service
   protected static getOfficesService = async () => {
      return await db.offices.findMany({
         include: {
          offices_cameras: true,
    },
    orderBy: {
    Id: "desc",
  },
      });
   }

   // get park cameras service
    protected static getOfficeCamerasService = async (office_Id: number) => {
      if(!office_Id) {
          throw new HttpException(STATUS.BAD_REQUEST, `office id is required`)
      }
    return await db.offices_cameras.findMany({
      where: {
         office_Id: Number(office_Id)
      },
       orderBy: {
    Id: "desc",
  },
   });
   }
   // add park camera service
   protected static addOfficeCameraService = async (cameraData: OfficeCamera) => {
      const result = await db.offices_cameras.create({
         data: {...cameraData, office_Id: Number(cameraData.office_Id), createdAt: new Date()}
      })
      return result;
   }
   protected static changeOfficeCameraFunctionalityService = async ({fieldName, fieldValue, camera_Id, }: {fieldName: string, fieldValue: any, camera_Id: string}) => {
        const result = db.offices_cameras.update({
        where: { Id: Number(camera_Id)},
        data: {
        [fieldName]: fieldValue,
        updatedAt: new Date(),
      },
    });
    return result;
   }
protected static changeOfficeSettingService = async (setting: OfficeSettingInputTypes) => {
  const { password, stream_api_key, stream_path, stream_url, office_Id } = setting;

  // Try to find an existing record with this office_Id
  const existing = await db.office_streams.findFirst({
    where: { office_Id: Number(office_Id) }
  });

  let result;
  if (existing) {
    // Update the existing record
    result = await db.office_streams.update({
      where: { Id: existing.Id }, // use the unique `id` field
      data: {
        password,
        stream_api_key,
        stream_path,
        stream_url
      }
    });
  } else {
    // Create a new record
    result = await db.office_streams.create({
      data: {
        office_Id: Number(office_Id),
        password,
        stream_api_key,
        stream_path,
        stream_url
      }
    });
  }

  return result;
}

   protected static updateOfficeBasicInfoService = async (basicInfo: OfficeType) => {
      const {office_Id, office_arabic_name, office_english_name, longitude, latitude, Id, location, status} = basicInfo
      const parkExist = await db.offices.findFirst({
               where: { Id: Id },
           });
           if(!parkExist) {
              throw new HttpException(STATUS.NOT_FOUND, `No office found with the given ID`);
           }
       const result = db.offices.update({
        where: { Id: Id },
        data: {
        office_arabic_name,
        office_english_name,
        latitude,
        longitude,
        location,
        status
      },
    });
    return result;
   }
   protected static getOfficeService = async (office_Id: number) => {
      if(!office_Id) {
         throw new HttpException(STATUS.BAD_REQUEST, `Office id is required`);
      }
       const office = await db.offices.findFirst({
               where: { Id:  office_Id},
           });
           if(office) {
             return office;
           } else {
            throw new HttpException(STATUS.NOT_FOUND, `No office found with the given ID`);
           }
   }
   // get office setting
      protected static getOfficeSettingService = async (office_Id: number) => {
      if(!office_Id) {
         throw new HttpException(STATUS.BAD_REQUEST, `Office id is required`);
      }
       const office = await db.office_streams.findFirst({
               where: { office_Id:  Number(office_Id)},
           });
           if(office) {
             return office;
           } else {
            throw new HttpException(STATUS.NOT_FOUND, `No office stream found with the given ID`);
           }
   }
      protected static getOfficeCamerasFunctionalitiesService = async (office_Id: number) => {
      if(!office_Id) {
         throw new HttpException(STATUS.BAD_REQUEST, `Office id is required`);
      }
       const functionalities = await db.offices_cameras.findMany({
               where: { office_Id:  office_Id},
           });
           if(functionalities) {
             return functionalities;
           } else {
            throw new HttpException(STATUS.NOT_FOUND, `No functionalities found with the given ID`);
           }
   }
      // update office image 
   protected static updateOfficeImageService = async (data: {Id: number, image: string}) => {
      const {Id, image} = data;
      const result = await db.offices.update({
         where: {Id},
         data: {
            image
         }
      })
      return result;
   }
      // update office camera service 
      protected static updateOfficeCameraService = async (cameraData: OfficeCamera, id: number) => {
      const result = await db.offices_cameras.update({
         where: {Id: Number(id)},
         data: {...cameraData, latitude: Number(cameraData?.latitude), longitude: Number(cameraData?.longitude), updatedAt: new Date()}
      })
      return result;
   }
   
}
export default OfficesService;