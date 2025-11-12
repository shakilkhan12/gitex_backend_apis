import db from "@/prisma/client";
import { startOfDay, endOfDay } from "date-fns";

interface GenderCounts {
  male: number;
  female: number;
  unknown: number;
}

interface AgeGroupCounts {
  child: number;
  adult: number;
  middle_age: number;
  elderly: number;
  unknown: number;
}

interface FootfallData {
  total: number;
  gender: GenderCounts;
  age_group: AgeGroupCounts;
}

class FootfallAnalyticsService {
    private static mapGenderToResponse(gender: string | null): keyof GenderCounts {
        if (!gender) return 'unknown';
        const normalized = gender.trim().toLowerCase().replace(/\./g, '');
      
        // handle numeric/letter encodings too
        if (normalized === '2' || normalized === 'f' || normalized === 'female') return 'female';
        if (normalized === '1' || normalized === 'm' || normalized === 'male') return 'male';
        if (normalized === 'unknown' || normalized === '0') return 'unknown';
      
        // fallback: check female before male to avoid substring trap ('female' contains 'male')
        if (normalized.includes('female')) return 'female';
        if (normalized.includes('male')) return 'male';
        return 'unknown';
      }

  private static mapAgeGroupToResponse(ageGroup: number | null): keyof AgeGroupCounts {
    if (ageGroup === null || ageGroup === undefined) return 'unknown';
    
    // Age group mapping rules:
    // child: 1, 2, 3, 4 (INFANT, KID, CHILD, TEENAGER, adolescent)
    // adult: 5, 6 (YOUNG/Youth, PRIME/Adult)
    // middle_age: 7 (MIDDLE)
    // elderly: 8, 9 (MIDDLEAGED/Middle to old age, OLD/Elderly)
    // unknown: 0 (UNKNOWN)
    
    if (ageGroup >= 1 && ageGroup <= 4) return 'child';
    if (ageGroup >= 5 && ageGroup <= 6) return 'adult';
    if (ageGroup === 7) return 'middle_age';
    if (ageGroup >= 8 && ageGroup <= 9) return 'elderly';
    return 'unknown';
  }

  private static aggregateFootfallData(data: any[]): FootfallData {
    const genderCounts: GenderCounts = { male: 0, female: 0, unknown: 0 };
    const ageGroupCounts: AgeGroupCounts = { child: 0, adult: 0, middle_age: 0, elderly: 0, unknown: 0 };

    data.forEach(record => {
      // Count gender
      const genderKey = this.mapGenderToResponse(record.gender);
      genderCounts[genderKey]++;

      // Count age group
      const ageGroupKey = this.mapAgeGroupToResponse(record.age_group);
      ageGroupCounts[ageGroupKey]++;
    });

    return {
      total: data.length,
      gender: genderCounts,
      age_group: ageGroupCounts
    };
  }

  public static getFootfallAnalytics = async (fromDate: string, toDate: string) => {
    try {
      const start = startOfDay(new Date(fromDate));
      const end = endOfDay(new Date(toDate));

      console.log('🔄 Fetching footfall analytics data...', { fromDate, toDate, start, end });

      // Query offices footfall data
      const officesData = await db.offices_footfall_analysis.findMany({
        where: {
          time: {
            gte: start,
            lte: end
          }
        },
        select: {
          gender: true,
          age_group: true
        }
      });

      // Query parks footfall data
      const parksData = await db.parks_footfall_analysis.findMany({
        where: {
          time: {
            gte: start,
            lte: end
          }
        },
        select: {
          gender: true,
          age_group: true
        }
      });

      console.log('✅ Footfall data fetched', { 
        officesCount: officesData.length, 
        parksCount: parksData.length 
      });

      // Aggregate data for each location type
      const offices = this.aggregateFootfallData(officesData);
      const parks = this.aggregateFootfallData(parksData);

      // Calculate total (combined offices + parks)
      const total: FootfallData = {
        total: offices.total + parks.total,
        gender: {
          male: offices.gender.male + parks.gender.male,
          female: offices.gender.female + parks.gender.female,
          unknown: offices.gender.unknown + parks.gender.unknown
        },
        age_group: {
          child: offices.age_group.child + parks.age_group.child,
          adult: offices.age_group.adult + parks.age_group.adult,
          middle_age: offices.age_group.middle_age + parks.age_group.middle_age,
          elderly: offices.age_group.elderly + parks.age_group.elderly,
          unknown: offices.age_group.unknown + parks.age_group.unknown
        }
      };

      console.log('📊 Analytics data aggregated', { total: total.total });

      return {
        status: "success",
        message: "Footfall data fetched successfully.",
        data: {
          total,
          offices,
          parks
        }
      };

    } catch (error: any) {
      console.error('❌ Error fetching footfall analytics:', error);
      throw new Error(`Failed to fetch footfall analytics: ${error.message}`);
    }
  };
}

export default FootfallAnalyticsService;