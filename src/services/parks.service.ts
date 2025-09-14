import { ParkType, ParkZone, ParkCamera, SettingInputTypes, ParkFootfallAnalysisType } from "@/typescript";
import { STATUS, } from "@/typescript"
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class ParkService {
   // add park service
   protected static addParkService = async (park: ParkType) => {
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
      return await db.parks.findUnique({
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
      protected static updateParkZoneService = async (zoneData: ParkZone, id: number) => {
      const result = await db.park_zones.update({
         where: { Id: id },
         data: {...zoneData,  latitude: Number(zoneData.latitude),
         longitude: Number(zoneData.longitude) , updatedAt: new Date() }
      });
      return result;
   }
   // add park camera service
   protected static addParCameraService = async (cameraData: ParkCamera) => {
      const result = await db.park_cameras.create({
         data: {
            park_Id: Number(cameraData.park_Id),
            camera_Id: cameraData.camera_Id,
            camera_english_name: cameraData.camera_english_name,
            camera_arabic_name: cameraData.camera_arabic_name,
            latitude: Number(cameraData.latitude),
            longitude: Number(cameraData.longitude),
            ip_address: cameraData.ip_address,
            last_active_date: cameraData.last_active_date,
            last_active_time: cameraData.last_active_time,
            status: cameraData.status === 'active' || cameraData.status === true,
            createdAt: new Date()
         }
      })
      return result;
   }
   // update park camera service 
      protected static updateParkCameraService = async (cameraData: ParkCamera, id: number) => {
      const result = await db.park_cameras.update({
         where: {Id: Number(id)},
         data: {
            park_Id: cameraData.park_Id ? Number(cameraData.park_Id) : undefined,
            camera_Id: cameraData.camera_Id,
            camera_english_name: cameraData.camera_english_name,
            camera_arabic_name: cameraData.camera_arabic_name,
            latitude: Number(cameraData?.latitude),
            longitude: Number(cameraData?.longitude),
            ip_address: cameraData.ip_address,
            last_active_date: cameraData.last_active_date,
            last_active_time: cameraData.last_active_time,
            status: cameraData.status === 'active' || cameraData.status === true,
            updatedAt: new Date()
         }
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
      const parkExist = await db.park_streams.findFirst({
               where: { Id: Number(park_Id) },
           });
  let result;
  if(parkExist) {
      result = await db.park_streams.update({
  where: { Id: Number(parkExist?.Id) }, // must be a unique field
  data: {
    password,
    stream_api_key,
    stream_path,
    stream_url
  }
})
  } else {
      result = await db.park_streams.create({
  data: {
   park_Id: Number(park_Id),
    password,
    stream_api_key,
    stream_path,
    stream_url
  }
})
  }
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
   // update park image 
   protected static updateParkImageService = async (data: {Id: number, image: string}) => {
      const {Id, image} = data;
      const result = await db.parks.update({
         where: {Id},
         data: {
            image
         }
      })
      return result;
   }
   // update park zone status 
    protected static updateZoneStatusService = async (id: number, status: "active" | "inactive") => {
    if (!id) {
      throw new HttpException(STATUS.BAD_REQUEST, "Zone Id is required");
    }

    const existingZone = await db.park_zones.findUnique({ where: { Id: Number(id) } });

    if (!existingZone) {
      throw new HttpException(STATUS.NOT_FOUND, "Zone not found");
    }

    const result = await db.park_zones.update({
      where: { Id: Number(id) },
      data: { status },
    });

    return result;
  };

  // Get park footfall analysis service
  protected static getParkFootfallAnalysisService = async (parkIds: number | number[], fromDate?: string, toDate?: string) => {
    // Build where clause
    let whereClause: any = {};
    
    // Handle park IDs (single or multiple)
    if (Array.isArray(parkIds)) {
      whereClause.park_Id = { in: parkIds };
    } else {
      whereClause.park_Id = parkIds;
    }
    
    // Add date range if provided
    if (fromDate && toDate) {
      whereClause.time = {
        gte: new Date(fromDate),
        lte: new Date(toDate)
      };
    }

    // Get footfall analysis data
    const footfallData = await db.parks_footfall_analysis.findMany({
      where: whereClause,
      include: {
        park: {
          select: {
            Id: true,
            park_english_name: true,
            park_arabic_name: true
          }
        }
      },
      orderBy: {
        time: 'desc'
      }
    });

    // Calculate statistics
    const totalFootfall = footfallData.length;
    
    // Use person.gender if available, otherwise fall back to item.gender
    const maleCount = footfallData.filter(item => {
      const gender = item.gender;
      return gender === 'M' || gender === 'Male';
    }).length;
    
    const femaleCount = footfallData.filter(item => {
      const gender = item.gender;
      return gender === 'F' || gender === 'Female';
    }).length;
    
    const childrenCount = footfallData.filter(item => item.is_child === true).length;
    const employeeCount = footfallData.filter(item => item.person_Id !== null).length;
    const guestCount = totalFootfall - employeeCount;

    // Get unique employees
    const uniqueEmployees = footfallData
      .filter(item => item.person_Id !== null)
      .reduce((acc: any[], item) => {
        if (!acc.find(emp => emp.Id === item.person_Id)) {
          acc.push({
            Id: item.person_Id,
            emp_Id: `EMP${item.person_Id}`,
            emp__eng_name: `Employee ${item.person_Id}`,
            emp__arabic_name: `موظف ${item.person_Id}`,
            gender: item.gender
          });
        }
        return acc;
      }, []);

    // Get hourly distribution
    const hourlyDistribution = footfallData.reduce((acc, item) => {
      const hour = new Date(item.time).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Get daily distribution
    const dailyDistribution = footfallData.reduce((acc, item) => {
      const date = new Date(item.time).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalFootfall,
        maleCount,
        femaleCount,
        childrenCount,
        employeeCount,
        guestCount
      },
      employees: uniqueEmployees,
      hourlyDistribution,
      dailyDistribution,
      rawData: footfallData
    };
  };

  // Add park footfall analysis service
  protected static addParkFootfallAnalysisService = async (footfallData: ParkFootfallAnalysisType) => {
    // Validate required fields
    if (!footfallData.person_Id) {
      throw new HttpException(STATUS.BAD_REQUEST, 'person_Id is required');
    }

    const result = await db.parks_footfall_analysis.create({
      data: {
        park_Id: footfallData.park_Id,
        detection_Id: footfallData.detection_Id,
        person_Id: footfallData.person_Id,
        gender: footfallData.gender,
        is_child: footfallData.is_child || false,
        detected_camera_Id: footfallData.detected_camera_Id,
        detected_camera_name: footfallData.detected_camera_name,
        time: footfallData.time || new Date(),
        abc1: footfallData.abc1,
        abc2: footfallData.abc2,
        abc3: footfallData.abc3
      }
    });

    return result;
  };

   
}
export default ParkService;