import db from "@/prisma/client";
import { startOfDay, endOfDay } from "date-fns";

class DashboardService {
  public static getDashboardData = async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const officeCheckins = await db.offices_sentiment_analysis.findMany({
      where: {
        check_in_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        Id: true,
        office_Id: true,
        check_in_sentiment: true,
        check_out_sentiment: true,
      },
    });

    const parkCheckins = await db.parks_sentiment_analysis.findMany({
      where: {
        check_in_date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        Id: true,
        park_Id: true,
        person_Id: true,
        check_in_sentiment: true,
        check_out_sentiment: true,
      },
    });

    const allCheckins = [
      ...officeCheckins.map((item) => ({ ...item, type: "office" })),
      ...parkCheckins.map((item) => ({ ...item, type: "park" })),
    ];

    const sentimentCounts = allCheckins.reduce(
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

    const percent = (count: number, total: number) =>
      total > 0 ? Math.round((count / total) * 100) : 0;

    const sentimentPercentages = {
      happy: percent(sentimentCounts.happy, sentimentCounts.total),
      neutral: percent(sentimentCounts.neutral, sentimentCounts.total),
      sad: percent(sentimentCounts.sad, sentimentCounts.total),
      angry: percent(sentimentCounts.angry, sentimentCounts.total),
    };

    const officeAttendance = await db.offices_attendance.findMany({
      where: {
        entry_time: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
    const parkAttendance = await db.parks_attendance.findMany({
      where: {
        entry_time: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
    const attendancePercentage = percent(
      [...officeAttendance, ...parkAttendance].length,
      sentimentCounts.total + [...officeAttendance, ...parkAttendance].length
    );

    return {
      sentimentPercentages,
      attendancePercentage,
    };
  };
}

export default DashboardService;
