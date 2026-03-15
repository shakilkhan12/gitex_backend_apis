import { ParkType, ParkZone, ParkCamera, SettingInputTypes, ParkFootfallAnalysisType } from "@/typescript";
import { STATUS, } from "@/typescript"
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import DatabaseUtils from "@/utils/database.utils";
import { formatImageUrlsInArray } from "@/utils/imageUrl.utils";
import CronService from "./cron.service";

class ParkService {
  private static isEmployee = (item: any): boolean => {
    return item.person_Id !== null && 
           item.person_Id !== undefined && 
           item.person !== null &&
           item.person?.user_Id && 
           item.person.user_Id.toString().trim() !== '';
  };

  private static isGuest = (item: any): boolean => {
    return !ParkService.isEmployee(item);
  };

  private static mapAgeGroupToResponse(ageGroup: number | null): 'child' | 'adult' | 'middle_age' | 'elderly' | 'unknown' {
    if (ageGroup === null || ageGroup === undefined) return 'unknown';
    if (ageGroup >= 1 && ageGroup <= 4) return 'child';
    if (ageGroup >= 5 && ageGroup <= 6) return 'adult';
    if (ageGroup === 7) return 'middle_age';
    if (ageGroup >= 8 && ageGroup <= 9) return 'elderly';
    return 'unknown';
  }
   protected static addParkService = async (park: ParkType) => {
      const result = await db.parks.create({
      data: {...park, createdAt: new Date()},
  });
  return result;
   }
   protected static getParksService = async () => {
      return await DatabaseUtils.executeWithRetry(
         async () => {
            return await db.parks.findMany({
               include: {
               _count: {
               select: {
                park_zones: true,
                park_cameras: true,
              },
            },
            park_cameras: true,
          },
          orderBy: {
          Id: "desc",
        },
            });
         },
         'getParksService'
      );
   }
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
    protected static getParkCamerasService = async (park_Id: number) => {
      if(!park_Id) {
          throw new HttpException(STATUS.BAD_REQUEST, `park id is required`)
      }
    return await db.park_cameras.findMany({
      where: {
         park_Id: Number(park_Id)
      },
      include: {
         cameras_irrigation_section: {
            include: {
               park_zones: true
            }
         },
         cameras_landscaping_section: true
      },
      orderBy: {
         Id: "desc",
      },
   });
   }
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
   protected static addParCameraService = async (cameraData: ParkCamera) => {
      // Create the camera first
      const camera = await db.park_cameras.create({
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
            is_ptz_camera: cameraData.is_ptz_camera || false,
            createdAt: new Date()
         }
      });

      // If PTZ camera and has irrigation sections, create them
      if (cameraData.is_ptz_camera && cameraData.irrigation_sections && cameraData.irrigation_sections.length > 0) {
         await db.cameras_irrigation_section.createMany({
            data: cameraData.irrigation_sections.map(section => ({
               camera_Id: camera.Id,
               zone_Id: Number(section.zone_Id),
               working_time: section.working_time,
               createdAt: new Date(),
               updatedAt: new Date()
            }))
         });
      }

      // If PTZ camera and has landscaping sections, create them
      if (cameraData.is_ptz_camera && cameraData.landscaping_sections && cameraData.landscaping_sections.length > 0) {
         await db.cameras_landscaping_section.createMany({
            data: cameraData.landscaping_sections.map(section => ({
               camera_Id: camera.Id,
               area_name: section.area_name,
               working_time: section.working_time,
               createdAt: new Date(),
               updatedAt: new Date()
            }))
         });
      }

      // Return the camera with its sections
      const result = await db.park_cameras.findUnique({
         where: { Id: camera.Id },
         include: {
            cameras_irrigation_section: true,
            cameras_landscaping_section: true
         }
      });

      // Refresh landscaping section cron jobs if landscaping sections were added
      if (cameraData.is_ptz_camera && cameraData.landscaping_sections && cameraData.landscaping_sections.length > 0) {
         try {
            await CronService.refreshLandscapingSectionCronJobs();
         } catch (cronError: any) {
            console.error('[ParkService] Failed to refresh landscaping cron jobs:', cronError.message);
         }
      }

      // Refresh irrigation section cron jobs if irrigation sections were added
      if (cameraData.is_ptz_camera && cameraData.irrigation_sections && cameraData.irrigation_sections.length > 0) {
         try {
            await CronService.refreshIrrigationSectionCronJobs();
         } catch (cronError: any) {
            console.error('[ParkService] Failed to refresh irrigation cron jobs:', cronError.message);
         }
      }

      return result;
   }
      protected static updateParkCameraService = async (cameraData: ParkCamera, id: number) => {
      // Update the camera
      const camera = await db.park_cameras.update({
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
            is_ptz_camera: cameraData.is_ptz_camera ?? undefined,
            updatedAt: new Date()
         }
      });

      // If PTZ camera setting is explicitly provided, handle sections
      if (cameraData.is_ptz_camera !== undefined) {
         // Delete existing sections first
         await db.cameras_irrigation_section.deleteMany({
            where: { camera_Id: Number(id) }
         });
         await db.cameras_landscaping_section.deleteMany({
            where: { camera_Id: Number(id) }
         });

         // If PTZ camera is enabled and has new sections, create them
         if (cameraData.is_ptz_camera) {
            if (cameraData.irrigation_sections && cameraData.irrigation_sections.length > 0) {
               await db.cameras_irrigation_section.createMany({
                  data: cameraData.irrigation_sections.map(section => ({
                     camera_Id: Number(id),
                     zone_Id: Number(section.zone_Id),
                     working_time: section.working_time,
                     createdAt: new Date(),
                     updatedAt: new Date()
                  }))
               });
            }

            if (cameraData.landscaping_sections && cameraData.landscaping_sections.length > 0) {
               await db.cameras_landscaping_section.createMany({
                  data: cameraData.landscaping_sections.map(section => ({
                     camera_Id: Number(id),
                     area_name: section.area_name,
                     working_time: section.working_time,
                     createdAt: new Date(),
                     updatedAt: new Date()
                  }))
               });
            }
         }
      }

      // Return the camera with its sections
      const result = await db.park_cameras.findUnique({
         where: { Id: Number(id) },
         include: {
            cameras_irrigation_section: true,
            cameras_landscaping_section: true
         }
      });

      // Refresh landscaping section cron jobs if sections were modified
      if (cameraData.is_ptz_camera !== undefined) {
         try {
            await CronService.refreshLandscapingSectionCronJobs();
         } catch (cronError: any) {
            console.error('[ParkService] Failed to refresh landscaping cron jobs:', cronError.message);
         }
      }

      // Refresh irrigation section cron jobs if sections were modified
      if (cameraData.is_ptz_camera !== undefined) {
         try {
            await CronService.refreshIrrigationSectionCronJobs();
         } catch (cronError: any) {
            console.error('[ParkService] Failed to refresh irrigation cron jobs:', cronError.message);
         }
      }

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
  where: { Id: Number(parkExist?.Id) }, 
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
   protected static updateParkBasicInfoService = async (basicInfo: ParkType) => {
      const {Id,park_Id, park_arabic_name, park_english_name, latitude, longitude, status} = basicInfo
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
        longitude,
        status
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
    protected static updateZoneStatusService = async (id: number, status: "active" | "inactive") => {
    if (!id) {
      throw new HttpException(STATUS.BAD_REQUEST, "Controller Id is required");
    }

    const existingZone = await db.park_zones.findUnique({ where: { Id: Number(id) } });

    if (!existingZone) {
      throw new HttpException(STATUS.NOT_FOUND, "Controller not found");
    }

    const result = await db.park_zones.update({
      where: { Id: Number(id) },
      data: { status },
    });

    return result;
  };

  protected static getParkFootfallAnalysisService = async (
    parkIds: number | number[],
    fromDate?: string,
    toDate?: string,
    cameraId?: string
  ) => {
    if (!parkIds || (Array.isArray(parkIds) && parkIds.length === 0)) {
      throw new HttpException(STATUS.BAD_REQUEST, 'park_Id is required');
    }

    try {
      const whereClause: any = {
        park_Id: Array.isArray(parkIds) ? { in: parkIds } : Number(parkIds),
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

      if (cameraId && cameraId.trim() !== '') {
        whereClause.detected_camera_Id = cameraId;
      }

      const footfallData = await db.parks_footfall_analysis.findMany({
        where: whereClause,
        select: {
          id: true,
          park_Id: true,
          detection_Id: true,
          person_Id: true,
          gender: true,
          age_group: true,
          is_child: true,
          detected_camera_Id: true,
          detected_camera_name: true,
          time: true,
          image: true,
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

      const cameraIds = footfallData.map(item => item.detected_camera_Id);
      const uniqueCameraIds = cameraIds.filter((id, index) => cameraIds.indexOf(id) === index);
      const camerasData = await db.park_cameras.findMany({
        where: {
          camera_Id: {
            in: uniqueCameraIds
          }
        },
        select: {
          camera_Id: true,
          camera_english_name: true,
          camera_arabic_name: true
        }
      });

      const cameraMap = new Map();
      camerasData.forEach(camera => {
        cameraMap.set(camera.camera_Id, {
          camera_english_name: camera.camera_english_name,
          camera_arabic_name: camera.camera_arabic_name
        });
      });

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
            age_group: {
               child: 0,
               adult: 0,
               middle_age: 0,
               elderly: 0,
               unknown: 0
            },
            employees: [],
            guests: [],
            hourlyDistribution: {},
            dailyDistribution: {},
            rawData: []
         };
      }
      
      const employeeData = footfallData.filter(item => ParkService.isEmployee(item));
      const guestData = footfallData.filter(item => ParkService.isGuest(item));
      
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
      
      // Calculate age group distribution
      const ageGroupCounts = {
         child: 0,
         adult: 0,
         middle_age: 0,
         elderly: 0,
         unknown: 0
      };

      footfallData.forEach(item => {
         const ageGroupKey = ParkService.mapAgeGroupToResponse(item.age_group);
         ageGroupCounts[ageGroupKey]++;
      });
      
      const uniqueEmployees = footfallData
        .filter(item => ParkService.isEmployee(item))
        .reduce((acc: any[], item) => {
          if (item.person && !acc.find(emp => emp.Id === item.person?.Id)) {
            acc.push({
               ...item.person,
               detection_Id: item.detection_Id,
               detected_camera_Id: item.detected_camera_Id,
               detected_camera_name: item.detected_camera_name,
               time: item.time,
               footfall_image: item.image
            });
          }
          return acc;
        }, []);

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
              time: item.time,
              image: item.image 
            });
          }
          return acc;
        }, []);

      const hourlyDistribution = footfallData.reduce((acc, item) => {
        try {
          const hour = new Date(item.time).getHours();
          const isEmployee = ParkService.isEmployee(item);
          
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
        } catch (error) {
        }
        
        return acc;
      }, {} as Record<number, { total: number; employees: number; guests: number }>);

      const dailyDistribution = footfallData.reduce((acc, item) => {
        try {
          const date = new Date(item.time).toISOString().split('T')[0];
          const isEmployee = ParkService.isEmployee(item);
          
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
        } catch (error) {
        }
        
        return acc;
      }, {} as Record<string, { total: number; employees: number; guests: number }>);

      const enhancedRawData = footfallData.map(item => {
        const cameraInfo = cameraMap.get(item.detected_camera_Id);
        return {
          ...item,
          camera_english_name: cameraInfo?.camera_english_name || item.detected_camera_name,
          camera_arabic_name: cameraInfo?.camera_arabic_name || item.detected_camera_name
        };
      });

      const imageFields = ['image'];
      const formattedEmployees = formatImageUrlsInArray(uniqueEmployees, imageFields);
      const formattedGuests = formatImageUrlsInArray(uniqueGuests, imageFields);
      const formattedRawData = formatImageUrlsInArray(enhancedRawData, imageFields);

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
        age_group: ageGroupCounts,
        employees: formattedEmployees,
        guests: formattedGuests,
        hourlyDistribution,
        dailyDistribution,
        rawData: formattedRawData
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to fetch footfall analysis data');
    }
  };

  protected static addParkFootfallAnalysisService = async (footfallData: ParkFootfallAnalysisType) => {
    try {

      const result = await db.parks_footfall_analysis.create({
        data: {
          park_Id: Number(footfallData.park_Id),
          detection_Id: footfallData.detection_Id,
          person_Id: footfallData.person_Id || null, 
          gender: footfallData.gender || undefined,
          is_child: footfallData.is_child || false,
          detected_camera_Id: footfallData.detected_camera_Id,
          detected_camera_name: footfallData.detected_camera_name || undefined,
          time: footfallData.time || new Date(),
          image: footfallData.image || undefined,
          abc2: footfallData.abc2 || undefined,
          abc3: footfallData.abc3 || undefined
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

    // Helper function to calculate next capture time based on working_time
    private static async calculateNextCaptureTimeForZone(zoneId: number | null, parkId: number | null): Promise<Date | null> {
      if (!zoneId) {
        console.log(`[ParkService] calculateNextCaptureTimeForZone: zoneId is null`);
        return null;
      }
      
      try {
        // Get the working_time for this zone from cameras_irrigation_section
        // zone_Id in cameras_irrigation_section references park_zones.Id (database ID)
        const irrigationSection = await db.cameras_irrigation_section.findFirst({
          where: {
            zone_Id: zoneId
          },
          select: {
            working_time: true
          }
        });
        
        if (!irrigationSection) {
          console.log(`[ParkService] No irrigation section found for zone ${zoneId}`);
          return null;
        }
        
        if (!irrigationSection.working_time) {
          console.log(`[ParkService] No working_time found for zone ${zoneId}`);
          return null;
        }
        
        // Parse working_time (format: "HH:MM", "HHMM", "HH:MM AM/PM", or "HH:MMAM/PM")
        const workingTime = irrigationSection.working_time.trim().toUpperCase();
        let hours = 0;
        let minutes = 0;
        
        // Check for 12-hour format with AM/PM
        const hasAMPM = workingTime.includes('AM') || workingTime.includes('PM');
        
        if (hasAMPM) {
          // Handle 12-hour format: "10:56 PM", "10:56PM", "10:56 PM", etc.
          const timePart = workingTime.replace(/\s*(AM|PM)\s*/i, '');
          const isPM = workingTime.includes('PM');
          
          if (timePart.includes(':')) {
            const [h, m] = timePart.split(':');
            hours = parseInt(h, 10) || 0;
            minutes = parseInt(m, 10) || 0;
            
            // Convert to 24-hour format
            if (isPM && hours !== 12) {
              hours += 12;
            } else if (!isPM && hours === 12) {
              hours = 0;
            }
          } else {
            console.log(`[ParkService] Invalid 12-hour format: ${workingTime} for zone ${zoneId}`);
            return null;
          }
        } else if (workingTime.includes(':')) {
          // 24-hour format: "HH:MM"
          const [h, m] = workingTime.split(':');
          hours = parseInt(h, 10) || 0;
          minutes = parseInt(m, 10) || 0;
        } else if (workingTime.length === 4) {
          // Format: "HHMM"
          hours = parseInt(workingTime.substring(0, 2), 10) || 0;
          minutes = parseInt(workingTime.substring(2, 4), 10) || 0;
        } else {
          console.log(`[ParkService] Invalid working_time format: ${workingTime} for zone ${zoneId}`);
          return null;
        }
        
        // Validate hours and minutes
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          console.log(`[ParkService] Invalid hours/minutes: ${hours}:${minutes} for zone ${zoneId}`);
          return null;
        }
        
        // Calculate next capture time
        const now = new Date();
        const nextCapture = new Date();
        nextCapture.setHours(hours, minutes, 0, 0);
        
        // If the time has already passed today, set it for tomorrow
        if (nextCapture <= now) {
          nextCapture.setDate(nextCapture.getDate() + 1);
        }
        
        console.log(`[ParkService] Calculated next capture time for zone ${zoneId}: ${nextCapture.toISOString()} (working_time: ${workingTime})`);
        return nextCapture;
      } catch (error: any) {
        // Log error but don't break the entire request
        console.error(`[ParkService] Error calculating next capture time for zone ${zoneId}:`, error.message, error.stack);
        return null;
      }
    }

    protected static getParkZonesJobHistoryService = async (parkId: number, filters?: {
      zoneId?: number;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      fromDateTime?: string;
      toDateTime?: string;
    }) => {
      try {
        
        const whereClause: any = {
          park_Id: parkId
        };

      if (filters?.zoneId) {
        whereClause.zone_Id = filters.zoneId;
      }

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.search) {
        whereClause.job_Id = {
          contains: filters.search,
          mode: 'insensitive'
        };
      }

      if (filters?.fromDateTime && filters?.toDateTime) {
        whereClause.started_at = {
          gte: new Date(filters.fromDateTime),
          lte: new Date(filters.toDateTime)
        };
      } else if (filters?.fromDateTime) {
        whereClause.started_at = {
          gte: new Date(filters.fromDateTime)
        };
      } else if (filters?.toDateTime) {
        whereClause.started_at = {
          lte: new Date(filters.toDateTime)
        };
      }


      const orderByClause: any = {};
      const sortBy = filters?.sortBy || 'started_at';
      const sortOrder = filters?.sortOrder || 'desc';
      orderByClause[sortBy] = sortOrder;

      if (!filters?.page || !filters?.limit) {
        const jobHistory = await db.parks_zones_job_history.findMany({
          where: whereClause,
          include: {
            parks: {
              select: {
                Id: true,
                park_english_name: true,
                park_arabic_name: true
              }
            },
            park_zones: {
              select: {
                Id: true,
                zone_Id: true,
                zone_english_name: true,
                zone_arabic_name: true
              }
            }
          },
          orderBy: orderByClause
        });

        // Fetch next capture times for all zones in parallel (with error handling)
        const uniqueZoneIds = new Set(jobHistory.map(job => job.zone_Id).filter((id): id is number => id !== null));
        const zoneIds = Array.from(uniqueZoneIds);
        console.log(`[ParkService] Fetching next capture times for ${zoneIds.length} zones:`, zoneIds);
        const nextCaptureTimesMap = new Map<number, Date | null>();
        
        // Use Promise.allSettled to prevent one failure from breaking all
        const results = await Promise.allSettled(
          zoneIds.map(async (zoneId) => {
            const nextCaptureTime = await ParkService.calculateNextCaptureTimeForZone(zoneId, parkId);
            return { zoneId, nextCaptureTime };
          })
        );
        
        // Process results
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            nextCaptureTimesMap.set(result.value.zoneId, result.value.nextCaptureTime);
            console.log(`[ParkService] Zone ${result.value.zoneId}: nextCaptureTime = ${result.value.nextCaptureTime?.toISOString() || 'null'}`);
          } else {
            console.error(`[ParkService] Failed to get next capture time for zone:`, result.reason);
          }
        });

        const formattedHistory = jobHistory.map(job => {
          const jobInitiated = job.started_at;
          const durationInMinutes = parseDurationToMinutes(job.start_for_time);
          
          const jobCompletion = jobInitiated ? new Date(new Date(jobInitiated).getTime() + (durationInMinutes * 60 * 1000)) : null;
          
          const currentTime = new Date();
          const status = jobCompletion && currentTime > jobCompletion ? 'Completed' : 'Pending';
          
          const zoneDetails = job.park_zones;
          const nextCaptureTime = job.zone_Id ? nextCaptureTimesMap.get(job.zone_Id) || null : null;
          
          // Convert Date to ISO string for JSON serialization
          const nextCaptureTimeISO = nextCaptureTime ? nextCaptureTime.toISOString() : null;
          
          return {
            id: job.Id,
            zoneId: job.zone_Id,
            zoneDetails: zoneDetails ? {
              zoneId: zoneDetails.zone_Id,
              zoneEnglishName: zoneDetails.zone_english_name,
              zoneArabicName: zoneDetails.zone_arabic_name
            } : null,
            jobId: job.job_Id,
            jobInitiated: jobInitiated,
            jobCompletion: jobCompletion,
            nextCaptureTime: nextCaptureTimeISO, // Add next capture time from DB (as ISO string)
            image: job.image,
            afterImage: job.after_image,
            status: status, 
            grassStatus: job.status,
            parkName: job.parks?.park_english_name,
            parkArabicName: job.parks?.park_arabic_name,
            suggestion: job.suggestion,
            confidenceScore: job.confidence_score,
            rationale: job.rationale,
            gallonsRequiredEstimate: job.gallons_required_estimate,
            calculationNote: job.calculation_note
          };
        });

        const imageFields = ['image', 'afterImage'];
        const formattedHistoryWithImages = formatImageUrlsInArray(formattedHistory, imageFields);

        return {
          success: true,
          data: formattedHistoryWithImages,
          total: formattedHistoryWithImages.length
        };
      }

      const skip = (filters.page - 1) * filters.limit;

      const totalCount = await db.parks_zones_job_history.count({ where: whereClause });

      const jobHistory = await db.parks_zones_job_history.findMany({
        where: whereClause,
        include: {
          parks: {
            select: {
              Id: true,
              park_english_name: true,
              park_arabic_name: true
            }
          },
          park_zones: {
            select: {
              Id: true,
              zone_Id: true,
              zone_english_name: true,
              zone_arabic_name: true
            }
          }
        },
        orderBy: orderByClause,
        skip: skip,
        take: filters.limit
      });
      
        
      const parseDurationToMinutes = (durationText: string | null): number => {
        if (!durationText) return 0;
        
        const text = durationText.toLowerCase().trim();
        
        if (text.includes('second')) {
          const seconds = parseInt(text.replace(/[^\d]/g, '')) || 0;
          return seconds / 60; 
        }
        
        if (text.includes('minute')) {
          return parseInt(text.replace(/[^\d]/g, '')) || 0;
        }
        
        if (text.includes('hour')) {
          const hours = parseInt(text.replace(/[^\d]/g, '')) || 0;
          return hours * 60; 
        }
        
        const number = parseInt(text.replace(/[^\d]/g, ''));
        return isNaN(number) ? 0 : number;
      };

      // Fetch next capture times for all zones in parallel (with error handling)
      const uniqueZoneIds = new Set(jobHistory.map(job => job.zone_Id).filter((id): id is number => id !== null));
      const zoneIds = Array.from(uniqueZoneIds);
      console.log(`[ParkService] Fetching next capture times for ${zoneIds.length} zones:`, zoneIds);
      const nextCaptureTimesMap = new Map<number, Date | null>();
      
      // Use Promise.allSettled to prevent one failure from breaking all
      const results = await Promise.allSettled(
        zoneIds.map(async (zoneId) => {
          const nextCaptureTime = await ParkService.calculateNextCaptureTimeForZone(zoneId, parkId);
          return { zoneId, nextCaptureTime };
        })
      );
      
      // Process results
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          nextCaptureTimesMap.set(result.value.zoneId, result.value.nextCaptureTime);
          console.log(`[ParkService] Zone ${result.value.zoneId}: nextCaptureTime = ${result.value.nextCaptureTime?.toISOString() || 'null'}`);
        } else {
          console.error(`[ParkService] Failed to get next capture time for zone:`, result.reason);
        }
      });

      const formattedHistory = jobHistory.map(job => {
        const jobInitiated = job.started_at;
        const durationInMinutes = parseDurationToMinutes(job.start_for_time);
        
        const jobCompletion = jobInitiated ? new Date(new Date(jobInitiated).getTime() + (durationInMinutes * 60 * 1000)) : null;
        
        const currentTime = new Date();
        const status = jobCompletion && currentTime > jobCompletion ? 'Completed' : 'Pending';
        
        const zoneDetails = job.park_zones;
        const nextCaptureTime = job.zone_Id ? nextCaptureTimesMap.get(job.zone_Id) || null : null;
        
        // Convert Date to ISO string for JSON serialization
        const nextCaptureTimeISO = nextCaptureTime ? nextCaptureTime.toISOString() : null;
        
        return {
          id: job.Id,
          zoneId: job.zone_Id,
          zoneDetails: zoneDetails ? {
            zoneId: zoneDetails.zone_Id,
            zoneEnglishName: zoneDetails.zone_english_name,
            zoneArabicName: zoneDetails.zone_arabic_name
          } : null,
          jobId: job.job_Id,
          jobInitiated: jobInitiated,
          jobCompletion: jobCompletion,
          nextCaptureTime: nextCaptureTimeISO, // Add next capture time from DB (as ISO string)
          image: job.image,
          afterImage: job.after_image,
          status: status, 
          grassStatus: job.status,
          parkName: job.parks?.park_english_name,
          parkArabicName: job.parks?.park_arabic_name,
          suggestion: job.suggestion,
          confidenceScore: job.confidence_score,
          rationale: job.rationale,
          gallonsRequiredEstimate: job.gallons_required_estimate,
          calculationNote: job.calculation_note
        };
      });

      const totalPages = Math.ceil(totalCount / filters.limit);
      const hasNextPage = filters.page < totalPages;
      const hasPreviousPage = filters.page > 1;

      const paginationData = {
        currentPage: filters.page,
        totalPages,
        totalCount,
        limit: filters.limit,
        hasNextPage,
        hasPreviousPage,
        nextPage: hasNextPage ? filters.page + 1 : null,
        previousPage: hasPreviousPage ? filters.page - 1 : null
      };

      const imageFields = ['image', 'afterImage'];
      const formattedHistoryWithImages = formatImageUrlsInArray(formattedHistory, imageFields);

      return {
        success: true,
        data: formattedHistoryWithImages,
        total: totalCount,
        pagination: paginationData
      };
    } catch (error: any) {
        console.error('[ParkService] Error fetching zones job history:', error);
        throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, `Failed to fetch zones job history: ${error.message || 'Unknown error'}`);
    }
  };

   
}
export default ParkService;