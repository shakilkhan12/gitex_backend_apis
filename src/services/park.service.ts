import { ParkType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class ParkService {
   protected static addParkService = async (park: ParkType) => {
    console.log("🟢 [ParkService] Adding new park:", park);

    try {
      const exist = await db.parks.findFirst({
               where: { park_Id: park.park_Id },
           });
      if (exist) {
        console.error("❌ [ParkService] Park ID already exists:", park.park_Id);
         throw new HttpException(STATUS.BAD_REQUEST, "park id is already exist");
      }
      console.log("✅ [ParkService] Park ID is unique:", park.park_Id);

      const result = await db.parks.create({
        data: { ...park, createdAt: new Date() },
  });

      console.log("🎉 [ParkService] Park saved successfully:", result.Id);
  return result;

    } catch (error: any) {
      console.error("💥 [ParkService] Error adding park:", error.message || error);
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to add park");
    }
   }

   protected static viewParksService = async () => {
    console.log("🟡 [ParkService] Fetching all parks...");

    try {
      const results = await db.parks.findMany({
        include: {
          park_cameras: true,
          park_streams: true,
          park_zones: true,
          parks_attendance: {
            include: {
              user: {
                select: {
                  Id: true,
                  emp_Id: true,
                  emp__eng_name: true,
                  emp__arabic_name: true,
                  gender: true,
                  email: true,
                  dep_eng_name: true,
                  desig_eng_name: true
                }
              }
            }
          },
          parks_sentiment_analysis: true,
          parks_behaviour_alerts: true,
          parks_intrusion_detection: true,
          parks_smoking_detection: true,
          parks_landscaping: true,
          parks_litter_detection: true,
          parks_irrigation_job_history: {
            include: {
              park_zones: true
            }
          },
          parks_footfall_analysis: true
        }
      });

      console.log(`📦 [ParkService] Retrieved ${results.length} parks with related data.`);
      return results;

    } catch (error: any) {
      console.error("💥 [ParkService] Error fetching parks:", error.message || error);
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch parks");
    }
  }

  protected static getParkByIdService = async (parkId: number) => {
    console.log(`🟢 [ParkService] Getting park with ID ${parkId}...`);

    try {
      const park = await db.parks.findUnique({
        where: { Id: parkId },
        include: {
          park_cameras: true,
          park_streams: true,
          park_zones: true,
          parks_attendance: {
            include: {
              user: {
                select: {
                  Id: true,
                  emp_Id: true,
                  emp__eng_name: true,
                  emp__arabic_name: true,
                  gender: true,
                  email: true,
                  dep_eng_name: true,
                  desig_eng_name: true
                }
              }
            }
          },
          parks_sentiment_analysis: true,
          parks_behaviour_alerts: true,
          parks_intrusion_detection: true,
          parks_smoking_detection: true,
          parks_landscaping: true,
          parks_litter_detection: true,
          parks_irrigation_job_history: {
            include: {
              park_zones: true
            }
          },
          parks_footfall_analysis: true
        }
      });

      if (!park) {
        console.log("🟡 [ParkService] Park not found");
        throw new HttpException(STATUS.NOT_FOUND, "Park not found");
      }

      console.log("✅ [ParkService] Successfully retrieved park data");
      return park;

    } catch (error: any) {
      console.error("💥 [ParkService] Error getting park by ID:", error.message || error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch park");
    }
  }

  protected static getParkByParkIdService = async (parkId: string) => {
    console.log(`🟢 [ParkService] Getting park with park_Id ${parkId}...`);

    try {
      const park = await db.parks.findUnique({
        where: { park_Id: parkId },
        include: {
          park_cameras: true,
          park_streams: true,
          park_zones: true,
          parks_attendance: {
            include: {
              user: {
                select: {
                  Id: true,
                  emp_Id: true,
                  emp__eng_name: true,
                  emp__arabic_name: true,
                  gender: true,
                  email: true,
                  dep_eng_name: true,
                  desig_eng_name: true
                }
              }
            }
          },
          parks_sentiment_analysis: true,
          parks_behaviour_alerts: true,
          parks_intrusion_detection: true,
          parks_smoking_detection: true,
          parks_landscaping: true,
          parks_litter_detection: true,
          parks_irrigation_job_history: {
            include: {
              park_zones: true
            }
          },
          parks_footfall_analysis: true
        }
      });

      if (!park) {
        console.log("🟡 [ParkService] Park not found");
        throw new HttpException(STATUS.NOT_FOUND, "Park not found");
      }

      console.log("✅ [ParkService] Successfully retrieved park data");
      return park;

    } catch (error: any) {
      console.error("💥 [ParkService] Error getting park by park_Id:", error.message || error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch park");
    }
  }

  protected static getParkStatisticsService = async (parkId: number) => {
    console.log(`🟢 [ParkService] Getting statistics for park ID ${parkId}...`);

    try {
      const [
        attendanceCount,
        sentimentCount,
        behaviorAlertsCount,
        intrusionCount,
        smokingCount,
        landscapingCount,
        litterCount,
        irrigationCount,
        footfallCount
      ] = await Promise.all([
        db.parks_attendance.count({ where: { park_Id: parkId } }),
        db.parks_sentiment_analysis.count({ where: { park_Id: parkId } }),
        db.parks_behaviour_alerts.count({ where: { park_Id: parkId } }),
        db.parks_intrusion_detection.count({ where: { park_Id: parkId } }),
        db.parks_smoking_detection.count({ where: { park_Id: parkId } }),
        db.parks_landscaping.count({ where: { park_Id: parkId } }),
        db.parks_litter_detection.count({ where: { park_Id: parkId } }),
        db.parks_irrigation_job_history.count({ where: { park_Id: parkId } }),
        db.parks_footfall_analysis.count({ where: { park_Id: parkId } })
      ]);

      const statistics = {
        attendance: attendanceCount,
        sentimentAnalysis: sentimentCount,
        behaviorAlerts: behaviorAlertsCount,
        intrusionDetection: intrusionCount,
        smokingDetection: smokingCount,
        landscaping: landscapingCount,
        litterDetection: litterCount,
        irrigationJobs: irrigationCount,
        footfallAnalysis: footfallCount
      };

      console.log("✅ [ParkService] Successfully retrieved park statistics");
      return statistics;

    } catch (error: any) {
      console.error("💥 [ParkService] Error getting park statistics:", error.message || error);
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch park statistics");
    }
  }
}

export default ParkService;