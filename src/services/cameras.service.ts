import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class CamerasService {
  // Get all offices and parks cameras in a single response
  protected static getAllCamerasService = async (userId?: number) => {
    try {
      // Get all offices with their cameras
      const offices = await db.offices.findMany({
        include: {
          offices_cameras: {
            where: {
              status: true
            },
            include: {
              live_stream_favourites: userId ? {
                where: {
                  emp_Id: userId
                }
              } : false
            },
            orderBy: {
              Id: "desc"
            }
          }
        },
        orderBy: {
          Id: "desc"
        }
      });

      // Get all parks with their cameras
      const parks = await db.parks.findMany({
        include: {
          park_cameras: {
            where: {
              status: true // Only active cameras
            },
            orderBy: {
              Id: "desc"
            }
          }
        },
        orderBy: {
          Id: "desc"
        }
      });

      // Transform the data to match frontend requirements
      const transformedOffices = offices.map(office => ({
        id: office.Id,
        name: office.office_english_name,
        arabicName: office.office_arabic_name,
        type: 'office',
        location: office.location,
        latitude: office.latitude,
        longitude: office.longitude,
        status: office.status,
        image: office.image,
        cameras: office.offices_cameras.map(camera => ({
          id: camera.Id,
          cameraId: camera.camera_Id,
          name: camera.camera_english_name,
          arabicName: camera.camera_arabic_name,
          ipAddress: camera.ip_address,
          latitude: camera.latitude,
          longitude: camera.longitude,
          status: camera.status,
          isFavorite: camera.is_favorite,
          lastActiveDate: camera.last_active_date,
          lastActiveTime: camera.last_active_time,
         
        }))
      }));

      const transformedParks = parks.map(park => ({
        id: park.Id,
        name: park.park_english_name,
        arabicName: park.park_arabic_name,
        type: 'park',
      
        image: park.image,
        cameras: park.park_cameras.map(camera => ({
          id: camera.Id,
          cameraId: camera.camera_Id,
          name: camera.camera_english_name,
          arabicName: camera.camera_arabic_name,
          ipAddress: camera.ip_address,
          latitude: camera.latitude,
          longitude: camera.longitude,
          status: camera.status,
          isFavorite: camera.is_favorite,
          lastActiveDate: camera.last_active_date,
       
        }))
      }));

      // Combine all locations (offices and parks)
      const allLocations = [...transformedOffices, ...transformedParks];

      // Create a flat list of all cameras with location info
      const allCameras: any[] = [];
      
      transformedOffices.forEach(office => {
        office.cameras.forEach(camera => {
          allCameras.push({
            ...camera,
            locationId: office.id,
            locationName: office.name,
            locationType: 'office',
            locationArabicName: office.arabicName
          });
        });
      });

      transformedParks.forEach(park => {
        park.cameras.forEach(camera => {
          allCameras.push({
            ...camera,
            locationId: park.id,
            locationName: park.name,
            locationType: 'park',
            locationArabicName: park.arabicName
          });
        });
      });

      return {
        locations: allLocations,
        cameras: allCameras,
        summary: {
          totalLocations: allLocations.length,
          totalOffices: transformedOffices.length,
          totalParks: transformedParks.length,
          totalCameras: allCameras.length,
          officeCameras: transformedOffices.reduce((sum, office) => sum + office.cameras.length, 0),
          parkCameras: transformedParks.reduce((sum, park) => sum + park.cameras.length, 0)
        }
      };
    } catch (error: any) {
      throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to fetch cameras data');
    }
  };

  // Toggle camera favorite status
  protected static toggleCameraFavoriteService = async (cameraId: number, cameraType: string, isFavorite: boolean) => {
    try {
      let updatedCamera;
      
      if (cameraType === 'office') {
        updatedCamera = await db.offices_cameras.update({
          where: {
            Id: cameraId
          },
          data: {
            is_favorite: isFavorite,
            updatedAt: new Date()
          }
        });
      } else if (cameraType === 'park') {
        updatedCamera = await db.park_cameras.update({
          where: {
            Id: cameraId
          },
          data: {
            is_favorite: isFavorite,
            updatedAt: new Date()
          }
        });
      } else {
        throw new HttpException(STATUS.BAD_REQUEST, 'Invalid camera type');
      }

      return {
        message: `Camera ${isFavorite ? 'added to' : 'removed from'} favorites`,
        camera: updatedCamera
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException(STATUS.NOT_FOUND, 'Camera not found');
      }
      throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to update camera favorite status');
    }
  };
}

export default CamerasService;
