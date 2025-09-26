import { ParkType, ParkZone, ParkCamera, SettingInputTypes, ParkFootfallAnalysisType } from "@/typescript";
import { STATUS, } from "@/typescript"
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class ParkService {
  private static isEmployee = (item: any): boolean => {
    return item.person_Id !== null && 
           item.person_Id !== undefined && 
           item.person !== null &&
           item.person?.user_Id && 
           item.person.user_Id.toString().trim() !== '';
  };

  private static isGuest = (item: any): boolean => {
    return !this.isEmployee(item);
  };
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
   // get park service
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
      // update park zone service
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
               where: { park_Id: Number(park_Id) },
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
   // update park service
   protected static updateParkBasicInfoService = async (basicInfo: ParkType) => {
      const {Id,park_Id, park_arabic_name, park_english_name, latitude, longitude} = basicInfo
      const parkExist = await db.parks.findFirst({
               where: { Id: Id },
           });
           if(!parkExist) {
              throw new HttpException(STATUS.BAD_REQUEST, `No park found with the given ID`);
           }
       const result = await db.parks.update({
        where: { park_Id: park_Id },
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
         where: {park_Id: parkId}
      })
      if(settings) {
         return settings
      } else {
         throw new HttpException(STATUS.NOT_FOUND, `No Settings found with the given ID`);
      }
   }
   // update park image service
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
   // update park status 
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
    if (!parkIds) {
      throw new HttpException(STATUS.BAD_REQUEST, 'park_Id is required');
    }

    try {
      // Build where clause for date filtering and exclude exit cameras
      const whereClause: any = {
        park_Id: Array.isArray(parkIds) ? { in: parkIds } : Number(parkIds),
        // Exclude cameras with "exit" in their name to count only entry events
        detected_camera_name: {
          not: {
            contains: 'exit'
          }
        }
      };

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
          person: {
            select: {
              Id: true,
              user_Id: true,
              emp_Id: true,
              emp__eng_name: true,
              emp__arabic_name: true,
              gender: true,
              image: true
            }
          },
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
      
      if (totalFootfall === 0) {
         return {
            summary: {
               totalFootfall: 0,
               employeeCount: 0,
               employeeMaleCount: 0,
               employeeFemaleCount: 0,
               employeeChildrenCount: 0,
               guestCount: 0,
               guestMaleCount: 0,
               guestFemaleCount: 0,
               guestChildrenCount: 0
            },
            employees: [],
            guests: [],
            hourlyDistribution: {},
            dailyDistribution: {},
            rawData: []
         };
      }
      
      // Separate data for employees and guests based on user_Id
      const employeeData = footfallData.filter(item => this.isEmployee(item));
      const guestData = footfallData.filter(item => this.isGuest(item));
      
      // Debug: Log sample employee data to understand gender format
      if (employeeData.length > 0) {
         console.log('Sample park employee data:', {
            totalEmployees: employeeData.length,
            sampleEmployee: employeeData[0],
            genderValues: employeeData.slice(0, 5).map(emp => ({
               personGender: emp.person?.gender,
               itemGender: emp.gender,
               personId: emp.person_Id,
               userId: emp.person?.user_Id
            }))
         });
      }
      
      // Employee counts
      const employeeCount = employeeData.length;
      const employeeMaleCount = employeeData.filter(item => {
        const gender = item.person?.gender || item.gender;
        if (!gender) return false;
        const genderStr = gender.toString().toLowerCase();
        return genderStr === 'm' || genderStr === 'male' || genderStr === 'male.' || genderStr === '1';
      }).length;
      const employeeFemaleCount = employeeData.filter(item => {
        const gender = item.person?.gender || item.gender;
        if (!gender) return false;
        const genderStr = gender.toString().toLowerCase();
        return genderStr === 'f' || genderStr === 'female' || genderStr === 'female.' || genderStr === '2';
      }).length;
      const employeeChildrenCount = employeeData.filter(item => item.is_child === true).length;
      
      // Guest counts
      const guestCount = guestData.length;
      const guestMaleCount = guestData.filter(item => {
        const gender = item.gender;
        if (!gender) return false;
        const genderStr = gender.toString().toLowerCase();
        return genderStr === 'm' || genderStr === 'male' || genderStr === 'male.' || genderStr === '1';
      }).length;
      const guestFemaleCount = guestData.filter(item => {
        const gender = item.gender;
        if (!gender) return false;
        const genderStr = gender.toString().toLowerCase();
        return genderStr === 'f' || genderStr === 'female' || genderStr === 'female.' || genderStr === '2';
      }).length;
      const guestChildrenCount = guestData.filter(item => item.is_child === true).length;
      
      // Debug: Log calculated counts
      console.log('Calculated park counts:', {
         totalFootfall,
         employeeCount,
         employeeMaleCount,
         employeeFemaleCount,
         employeeChildrenCount,
         guestCount,
         guestMaleCount,
         guestFemaleCount,
         guestChildrenCount
      });

      // Get unique employees (those with valid user_Id)
      const uniqueEmployees = footfallData
        .filter(item => this.isEmployee(item))
        .reduce((acc: any[], item) => {
          if (item.person && !acc.find(emp => emp.Id === item.person?.Id)) {
            acc.push({
               ...item.person,
               detection_Id: item.detection_Id,
               detected_camera_Id: item.detected_camera_Id,
               detected_camera_name: item.detected_camera_name,
               time: item.time
            });
          }
          return acc;
        }, []);

      // Create unique guests list based on detection_Id (for those without valid user_Id)
      const uniqueGuests = guestData
        .reduce((acc: any[], item) => {
          if (!acc.find(guest => guest.detection_Id === item.detection_Id)) {
            acc.push({
              detection_Id: item.detection_Id,
              guest_Id: `GUEST${item.detection_Id}`,
              guest_eng_name: `Guest ${item.detection_Id}`,
              guest_arabic_name: `زائر ${item.detection_Id}`,
              gender: item.gender,
              is_child: item.is_child,
              detected_camera_Id: item.detected_camera_Id,
              detected_camera_name: item.detected_camera_name,
              time: item.time
            });
          }
          return acc;
        }, []);

      // Enhanced hourly distribution with employee and guest breakdown
      const hourlyDistribution = footfallData.reduce((acc, item) => {
        const hour = new Date(item.time).getHours();
        const isEmployee = this.isEmployee(item);
        
        if (!acc[hour]) {
          acc[hour] = {
            total: 0,
            employees: 0,
            guests: 0
          };
        }
        
        acc[hour].total += 1;
        if (isEmployee) {
          acc[hour].employees += 1;
        } else {
          acc[hour].guests += 1;
        }
        
        return acc;
      }, {} as Record<number, { total: number; employees: number; guests: number }>);

      // Enhanced daily distribution with employee and guest breakdown
      const dailyDistribution = footfallData.reduce((acc, item) => {
        const date = new Date(item.time).toISOString().split('T')[0];
        const isEmployee = this.isEmployee(item);
        
        if (!acc[date]) {
          acc[date] = {
            total: 0,
            employees: 0,
            guests: 0
          };
        }
        
        acc[date].total += 1;
        if (isEmployee) {
          acc[date].employees += 1;
        } else {
          acc[date].guests += 1;
        }
        
        return acc;
      }, {} as Record<string, { total: number; employees: number; guests: number }>);

      return {
        summary: {
          totalFootfall,
          employeeCount,
          employeeMaleCount,
          employeeFemaleCount,
          employeeChildrenCount,
          guestCount,
          guestMaleCount,
          guestFemaleCount,
          guestChildrenCount
        },
        employees: uniqueEmployees,
        guests: uniqueGuests,
        hourlyDistribution,
        dailyDistribution,
        rawData: footfallData
      };
    } catch (error: any) {
      throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to fetch footfall analysis data');
    }
  };

  // Add park footfall analysis service
  protected static addParkFootfallAnalysisService = async (footfallData: ParkFootfallAnalysisType) => {
    try {
      // person_Id can be null for guest entries, so we don't validate it as required

      const result = await db.parks_footfall_analysis.create({
        data: {
          park_Id: Number(footfallData.park_Id),
          detection_Id: footfallData.detection_Id,
          person_Id: footfallData.person_Id || null, // Allow null for guests
          gender: footfallData.gender || undefined,
          is_child: footfallData.is_child || false,
          detected_camera_Id: footfallData.detected_camera_Id,
          detected_camera_name: footfallData.detected_camera_name || undefined,
          time: footfallData.time || new Date(),
          abc1: footfallData.abc1,
          abc2: footfallData.abc2,
          abc3: footfallData.abc3
        }
      });
      return result;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to add footfall analysis entry');
    }
  };

   
}
export default ParkService;