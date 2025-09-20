import {  OfficeType, OfficeCamera, OfficeSettingInputTypes, OfficeFootfallAnalysisType } from "@/typescript";
import { STATUS } from "@/typescript"
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
   // add office camera service
   protected static addOfficeCameraService = async (cameraData: OfficeCamera) => {
     console.log('Data -> ', cameraData)
      const result = await db.offices_cameras.create({
         data: {
            office_Id: Number(cameraData.office_Id),
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
        status,
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
         data: {
            office_Id: cameraData.office_Id,
            camera_Id: cameraData.camera_Id,
            camera_english_name: cameraData.camera_english_name,
            camera_arabic_name: cameraData.camera_arabic_name,
            ip_address: cameraData.ip_address,
            latitude: Number(cameraData?.latitude), 
            longitude: Number(cameraData?.longitude), 
            last_active_date: cameraData.last_active_date,
            last_active_time: cameraData.last_active_time,
            status: cameraData.status === 'active' || cameraData.status === true,
            updatedAt: new Date()
         }
      })
      return result;
   }

   // Get office footfall analysis data
   protected static getOfficeFootfallAnalysisService = async (officeIds: number | number[], fromDate?: string, toDate?: string) => {
      if (!officeIds) {
         throw new HttpException(STATUS.BAD_REQUEST, 'office_Id is required');
      }

      try {
         // Build where clause for date filtering
         const whereClause: any = {
            office_Id: Array.isArray(officeIds) ? { in: officeIds } : Number(officeIds)
         };

         if (fromDate && toDate) {
            whereClause.time = {
               gte: new Date(fromDate),
               lte: new Date(toDate)
            };
         }

         // Get footfall analysis data
         const footfallData = await db.offices_footfall_analysis.findMany({
            where: whereClause,
            include: {
               person: {
                  select: {
                     Id: true,
                     emp_Id: true,
                     emp__eng_name: true,
                     emp__arabic_name: true,
                     gender: true,
                     image: true
                  }
               },
               office: {
                  select: {
                     Id: true,
                     office_english_name: true,
                     office_arabic_name: true
                  }
               }
            },
            orderBy: {
               time: 'desc'
            }
         });

         // Calculate statistics
         const totalFootfall = footfallData.length;
         
         // Separate data for employees and guests
         const employeeData = footfallData.filter(item => item.person_Id !== null);
         const guestData = footfallData.filter(item => item.person_Id === null || item.person_Id === undefined);
         
         // Employee counts
         const employeeCount = employeeData.length;
         const employeeMaleCount = employeeData.filter(item => {
            const gender = item.person?.gender || item.gender;
            return gender === 'M' || gender === 'Male';
         }).length;
         const employeeFemaleCount = employeeData.filter(item => {
            const gender = item.person?.gender || item.gender;
            return gender === 'F' || gender === 'Female';
         }).length;
         const employeeChildrenCount = employeeData.filter(item => item.is_child === true).length;
         
         // Guest counts
         const guestCount = guestData.length;
         const guestMaleCount = guestData.filter(item => {
            const gender = item.gender;
            return gender === 'M' || gender === 'Male';
         }).length;
         const guestFemaleCount = guestData.filter(item => {
            const gender = item.gender;
            return gender === 'F' || gender === 'Female';
         }).length;
         const guestChildrenCount = guestData.filter(item => item.is_child === true).length;

         // Get unique employees
         const uniqueEmployees = footfallData
            .filter(item => item.person_Id !== null && item.person !== null)
            .reduce((acc: any[], item) => {
               if (item.person && !acc.find(emp => emp.Id === item.person?.Id)) {
                  acc.push(item.person);
               }
               return acc;
            }, []);

         // Create unique guests list based on detection_Id (since guests don't have person_Id)
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
            const isEmployee = item.person_Id !== null;
            
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
            const isEmployee = item.person_Id !== null;
            
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
   }

   // Add footfall analysis entry
   protected static addOfficeFootfallAnalysisService = async (footfallData: OfficeFootfallAnalysisType) => {
      try {
         // person_Id can be null for guest entries, so we don't validate it as required

         const result = await db.offices_footfall_analysis.create({
            data: {
               office_Id: Number(footfallData.office_Id),
               detection_Id: footfallData.detection_Id,
               person_Id: footfallData.person_Id || null, // Allow null for guests
               gender: footfallData.gender || undefined,
               is_child: footfallData.is_child || false,
               detected_camera_Id: footfallData.detected_camera_Id,
               detected_camera_name: footfallData.detected_camera_name || undefined,
               time: footfallData.time || new Date()
            }
         });
         return result;
      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to add footfall analysis entry');
      }
   }
   
}
export default OfficesService;