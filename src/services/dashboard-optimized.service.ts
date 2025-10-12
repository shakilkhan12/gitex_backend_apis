import { db } from '@/prisma/client'
import { startOfDay, endOfDay } from 'date-fns'

type SentimentCounts = {
  happy: number;
  neutral: number;
  sad: number;
  angry: number;
  total: number;
};

class OptimizedDashboardService {
  public static getDashboardData = async (startDate?: string, endDate?: string) => {
    try {
      const now = new Date();
      const todayStart = startOfDay(new Date(startDate || now));
      const todayEnd = endOfDay(new Date(endDate || now));

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6);

      console.log('🚀 Loading essential dashboard data...');
      
      // PHASE 1: Load only essential data for immediate display
      const [officeCheckins, parkCheckins, officeAttendance, parkAttendance, parksSmokingDetectionToday, parksIntrusionDetectionToday] = await Promise.all([
        this.getOfficeCheckins(todayStart, todayEnd),
        this.getParkCheckins(todayStart, todayEnd),
        this.getOfficeAttendance(todayStart, todayEnd),
        this.getParkAttendance(todayStart, todayEnd),
        this.getParksSmokingDetection(todayStart, todayEnd),
        this.getParksIntrusionDetection(todayStart, todayEnd),
      ]);

      console.log('✅ Essential data loaded');

      // Calculate essential metrics immediately
      const allCheckins = [
        ...officeCheckins.map((item) => ({ ...item, type: "office" })),
        ...parkCheckins.map((item) => ({ ...item, type: "park" })),
      ];
      const sentimentCounts = this.countSentiments(allCheckins);
      const sentimentPercentages = this.getSentimentPercentages(sentimentCounts);

      const totalAttendance = officeAttendance.length + parkAttendance.length;
      const attendancePercentage = this.percent(totalAttendance, sentimentCounts.total + totalAttendance);

      const totalSmokingDetections = parksSmokingDetectionToday.length;
      const totalIntrusionDetections = parksIntrusionDetectionToday.length;
      const totalViolations = totalSmokingDetections + totalIntrusionDetections;
      const smokingViolationPercentage = this.percent(totalSmokingDetections, totalViolations);
      const intrusionViolationPercentage = this.percent(totalIntrusionDetections, totalViolations);
      const violationPercentage = this.percent(totalViolations, totalViolations);

      // Return essential data immediately with placeholders for heavy data
      return {
        sentimentPercentages,
        attendancePercentage,
        violation: {
          smokingViolationPercentage,
          intrusionViolationPercentage,
          violationPercentage,
        },
        // Placeholder data - will be loaded in background
        footfallVisitors: {
          footFallMaleVisitors: 0,
          footFallFemaleVisitors: 0,
          footfallMaleVisitorPercentage: 0,
          footfallFemaleVisitorPercentage: 0,
        },
        footfallSummary: { total: 0, daily: [] },
        zoneUsageSummary: { total: 0, daily: [] },
        litterDetectionSummary: { total: 0, daily: [] },
        sentimentAnalysisToday: [],
        violationSummary: { 
          counts: { smoking: 0, litter: 0, intrusion: 0, behavior: 0 }, 
          percentages: { smoking: 0, litter: 0, intrusion: 0, behavior: 0 }, 
          total: 0 
        },
        landscapingData: [],
        plantDiseaseData: [],
      };

    } catch (error: any) {
      console.error('❌ Dashboard service error:', error);
      throw new Error(`Dashboard data fetch failed: ${error.message || 'Unknown error'}`);
    }
  };

  public static getBackgroundData = async (startDate?: string, endDate?: string) => {
    try {
      const now = new Date();
      const todayStart = startOfDay(new Date(startDate || now));
      const todayEnd = endOfDay(new Date(endDate || now));

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6);

      console.log('🔄 Loading background data...');
      
      // Load heavy data in parallel with optimized queries
      const [parkFootfallMale, parkFootfallFemale, officeFootfallMale, officeFootfallFemale, footfallSummary, zoneUsageSummary, litterDetectionSummary, violationSummary, landscapingData, plantDiseaseData, parksSentimentAnalysisToday, officesSentimentAnalysisToday] = await Promise.all([
        this.getFootfall("parks", "Male.", sevenDaysAgo, now),
        this.getFootfall("parks", "Female.", sevenDaysAgo, now),
        this.getFootfall("offices", "Male.", sevenDaysAgo, now),
        this.getFootfall("offices", "Female.", sevenDaysAgo, now),
        this.getFootfallSummary(sevenDaysAgo, now),
        this.getZoneUsage(sevenDaysAgo, now),
        this.getLitterDetection(now),
        this.getViolationSummaryOptimized(sevenDaysAgo, now),
        this.getLandscaping(sevenDaysAgo, now),
        this.getPlantDiseaseData(),
        this.getSentimentAnalysis("parks", {
          where: {
            check_in_date: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        }),
        this.getSentimentAnalysis("offices", {
          where: {
            check_in_date: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        }),
      ]);

      console.log('✅ Background data loaded');

      const totalMaleVisitors = parkFootfallMale.length + officeFootfallMale.length;
      const totalFemaleVisitors = parkFootfallFemale.length + officeFootfallFemale.length;
      const totalFootfall = totalMaleVisitors + totalFemaleVisitors;
      const footfallMaleVisitorPercentage = this.percent(totalMaleVisitors, totalFootfall);
      const footfallFemaleVisitorPercentage = this.percent(totalFemaleVisitors, totalFootfall);

      const allSentimentAnalysisToday = [
        ...parksSentimentAnalysisToday,
        ...officesSentimentAnalysisToday,
      ];
      const sentimentAnalysisToday = await this.mapSentimentWithEmpId(allSentimentAnalysisToday);

      return {
        footfallVisitors: {
          footFallMaleVisitors: totalMaleVisitors,
          footFallFemaleVisitors: totalFemaleVisitors,
          footfallMaleVisitorPercentage,
          footfallFemaleVisitorPercentage,
        },
        footfallSummary,
        zoneUsageSummary,
        litterDetectionSummary,
        sentimentAnalysisToday,
        violationSummary,
        landscapingData,
        plantDiseaseData,
      };
    } catch (error) {
      console.error('Error loading background data:', error);
      return null;
    }
  };

  // Optimized violation summary with parallel queries
  private static getViolationSummaryOptimized = async (sevenDaysAgo: Date, now: Date) => {
    const [smokingDetections, litterDetections, intrusionDetections, behaviourDetections] = await Promise.all([
      db.parks_smoking_detection.findMany({
        where: { detection_date: { gte: sevenDaysAgo, lte: now } },
      }),
      db.parks_litter_detection.findMany({
        where: { detection_date: { gte: sevenDaysAgo, lte: now } },
      }),
      db.parks_intrusion_detection.findMany({
        where: { detection_date: { gte: sevenDaysAgo, lte: now } },
      }),
      db.parks_behaviour_alerts.findMany({
        where: { detection_date: { gte: sevenDaysAgo, lte: now } },
      }),
    ]);

    const counts = {
      smoking: smokingDetections.length,
      litter: litterDetections.length,
      intrusion: intrusionDetections.length,
      behavior: behaviourDetections.length,
    };

    const total = counts.smoking + counts.litter + counts.intrusion + counts.behavior;

    const percentages = {
      smoking: total > 0 ? Math.round((counts.smoking / total) * 100) : 0,
      litter: total > 0 ? Math.round((counts.litter / total) * 100) : 0,
      intrusion: total > 0 ? Math.round((counts.intrusion / total) * 100) : 0,
      behavior: total > 0 ? Math.round((counts.behavior / total) * 100) : 0,
    };

    return {
      counts,
      percentages,
      total,
    };
  };

  // Helper methods (copied from original service)
  private static percent = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  private static countSentiments = (checkins: any[]): SentimentCounts => {
    return checkins.reduce(
      (acc, curr) => {
        const sentiment = (curr.check_in_sentiment || "unknown").toLowerCase();
        acc.total += 1;
        if (sentiment === "happy") acc.happy += 1;
        else if (sentiment === "neutral") acc.neutral += 1;
        else if (sentiment === "sad") acc.sad += 1;
        else if (sentiment === "angry") acc.angry += 1;
        return acc;
      },
      { happy: 0, neutral: 0, sad: 0, angry: 0, total: 0 }
    );
  };

  private static getSentimentPercentages = (counts: SentimentCounts) => {
    const total = counts.total;
    return {
      happy: this.percent(counts.happy, total),
      neutral: this.percent(counts.neutral, total),
      sad: this.percent(counts.sad, total),
      angry: this.percent(counts.angry, total),
    };
  };

  // Placeholder methods - implement these from the original service
  private static getOfficeCheckins = async (todayStart: Date, todayEnd: Date) => {
    return db.offices_check_in.findMany({
      where: {
        check_in_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  };

  private static getParkCheckins = async (todayStart: Date, todayEnd: Date) => {
    return db.parks_check_in.findMany({
      where: {
        check_in_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  };

  private static getOfficeAttendance = async (todayStart: Date, todayEnd: Date) => {
    return db.offices_attendance.findMany({
      where: {
        check_in_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  };

  private static getParkAttendance = async (todayStart: Date, todayEnd: Date) => {
    return db.parks_attendance.findMany({
      where: {
        check_in_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  };

  private static getParksSmokingDetection = async (todayStart: Date, todayEnd: Date) => {
    return db.parks_smoking_detection.findMany({
      where: {
        detection_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  };

  private static getParksIntrusionDetection = async (todayStart: Date, todayEnd: Date) => {
    return db.parks_intrusion_detection.findMany({
      where: {
        detection_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  };

  private static getFootfall = async (type: "parks" | "offices", gender: string, from: Date, to: Date) => {
    if (type === "parks") {
      return db.parks_footfall_analysis.findMany({
        where: {
          gender,
          time: {
            gte: startOfDay(from),
            lte: endOfDay(to),
          },
        },
      });
    } else {
      return db.offices_footfall_analysis.findMany({
        where: {
          gender,
          time: {
            gte: startOfDay(from),
            lte: endOfDay(to),
          },
        },
      });
    }
  };

  private static getFootfallSummary = async (sevenDaysAgo: Date, now: Date) => {
    // Simplified version - just return basic data
    return { total: 0, daily: [] };
  };

  private static getZoneUsage = async (sevenDaysAgo: Date, now: Date) => {
    // Simplified version - just return basic data
    return { total: 0, daily: [] };
  };

  private static getLitterDetection = async (now: Date) => {
    // Simplified version - just return basic data
    return { total: 0, daily: [] };
  };

  private static getLandscaping = async (sevenDaysAgo: Date, now: Date) => {
    return [];
  };

  private static getPlantDiseaseData = async () => {
    return [];
  };

  private static getSentimentAnalysis = async (type: "parks" | "offices", args: any = {}) => {
    if (type === "parks") {
      return db.parks_sentiment_analysis.findMany(args);
    } else {
      return db.offices_sentiment_analysis.findMany(args);
    }
  };

  private static mapSentimentWithEmpId = async (data: any[]) => {
    return data;
  };
}

export default OptimizedDashboardService;
