import db from "@/prisma/client";
import { startOfDay, endOfDay } from "date-fns";

type SentimentCounts = {
  happy: number;
  neutral: number;
  sad: number;
  angry: number;
  total: number;
};

class DashboardService {
  public static getDashboardData = async (startDate?: string, endDate?: string) => {
    try {
      const now = new Date();
      const todayStart = startOfDay(new Date(startDate || now));
      const todayEnd = endOfDay(new Date(endDate || now));

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6);

    // Execute queries in batches to avoid connection pool exhaustion
    console.log('🔄 Starting dashboard data fetch...');
    
    // Batch 1: Basic check-ins and attendance
    const [officeCheckins, parkCheckins, officeAttendance, parkAttendance] = await Promise.all([
      getOfficeCheckins(todayStart, todayEnd),
      getParkCheckins(todayStart, todayEnd),
      getOfficeAttendance(todayStart, todayEnd),
      getParkAttendance(todayStart, todayEnd),
    ]);
    console.log('✅ Batch 1 completed: check-ins and attendance');

    // Batch 2: Detection data
    const [parksSmokingDetectionToday, parksIntrusionDetectionToday] = await Promise.all([
      getParksSmokingDetection(todayStart, todayEnd),
      getParksIntrusionDetection(todayStart, todayEnd),
    ]);
    console.log('✅ Batch 2 completed: detection data');

    // Batch 3: Footfall data
    const [parkFootfallMale, parkFootfallFemale, officeFootfallMale, officeFootfallFemale] = await Promise.all([
      getFootfall("parks", "Male.", sevenDaysAgo, now),
      getFootfall("parks", "Female.", sevenDaysAgo, now),
      getFootfall("offices", "Male.", sevenDaysAgo, now),
      getFootfall("offices", "Female.", sevenDaysAgo, now),
    ]);
    console.log('✅ Batch 3 completed: footfall data');

    // Batch 4: Summary data
    const [footfallSummary, zoneUsageSummary, litterDetectionSummary, violationSummary] = await Promise.all([
      getFootfallSummary(sevenDaysAgo, now),
      getZoneUsage(sevenDaysAgo, now),
      getLitterDetection(now),
      getViolationSummary(sevenDaysAgo, now),
    ]);
    console.log('✅ Batch 4 completed: summary data');

    // Batch 5: Final data
    const [landscapingData, plantDiseaseData, parksSentimentAnalysisToday, officesSentimentAnalysisToday] = await Promise.all([
      getLandscaping(sevenDaysAgo, now),
      getPlantDiseaseData(),
      getSentimentAnalysis("parks", {
        where: {
          check_in_date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      getSentimentAnalysis("offices", {
        where: {
          check_in_date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ]);
    console.log('✅ Batch 5 completed: landscaping, plant disease, and sentiment data');
    // Sentiment percentages
    const allCheckins = [
      ...officeCheckins.map((item) => ({ ...item, type: "office" })),
      ...parkCheckins.map((item) => ({ ...item, type: "park" })),
    ];
    const sentimentCounts = countSentiments(allCheckins);
    const sentimentPercentages = getSentimentPercentages(sentimentCounts);

    // Attendance
    const totalAttendance = officeAttendance.length + parkAttendance.length;
    const attendancePercentage = percent(
      totalAttendance,
      sentimentCounts.total + totalAttendance
    );

    // Violations
    const totalSmokingDetections = parksSmokingDetectionToday.length;
    const totalIntrusionDetections = parksIntrusionDetectionToday.length;
    const totalViolations = totalSmokingDetections + totalIntrusionDetections;
    const smokingViolationPercentage = percent(
      totalSmokingDetections,
      totalViolations
    );
    const intrusionViolationPercentage = percent(
      totalIntrusionDetections,
      totalViolations
    );
    const violationPercentage = percent(totalViolations, totalViolations);

    // Footfall
    const totalMaleVisitors =
      parkFootfallMale.length + officeFootfallMale.length;
    const totalFemaleVisitors =
      parkFootfallFemale.length + officeFootfallFemale.length;
    const totalFootfall = totalMaleVisitors + totalFemaleVisitors;
    const footfallMaleVisitorPercentage = percent(
      totalMaleVisitors,
      totalFootfall
    );
    const footfallFemaleVisitorPercentage = percent(
      totalFemaleVisitors,
      totalFootfall
    );

    // Sentiment analysis for today (guests and employees)
    const allSentimentAnalysisToday = [
      ...parksSentimentAnalysisToday,
      ...officesSentimentAnalysisToday,
    ];
    const sentimentAnalysisToday = await mapSentimentWithEmpId(
      allSentimentAnalysisToday
    );

    return {
      sentimentPercentages,
      attendancePercentage,
      violation: {
        smokingViolationPercentage,
        intrusionViolationPercentage,
        violationPercentage,
      },
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
    } catch (error:any) {
      console.error('❌ Dashboard service error:', error);
      throw new Error(`Dashboard data fetch failed: ${error.message || 'Unknown error'}`);
    }
  };
}

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

async function getLandscaping(sevenDaysAgo: Date, now: Date) {
  const landscapingRecords = await db.landscaping.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo, lte: now },
      assinged_to: {
        not: null,
      },
    },
    include: {
      assignedUser: {
        select: {
          emp__eng_name: true,
          dep_eng_name: true,
        },
      },
      parks: {
        select: {
          park_english_name: true,
        },
      },
    },
  });

  return landscapingRecords.map((record) => ({
    id: record.id,
    name: record.name || null,
    avatar: record.image || null,
    location: record.parks?.park_english_name || null,
    plantType: record.plant_type || null,
    status: record.current_status || null,
    incharge: record.assinged_to
      ? record.assignedUser?.emp__eng_name || null
      : null,
    createdAt: record.createdAt || null,
  }));
}

async function getPlantDiseaseData() {
  // Get last 5 plant disease records (filter by plant_type = 'Plant' and sort by createdAt desc)
  const plantDiseaseRecords = await db.landscaping.findMany({
    where: {
      plant_type: 'Plant',
    },
    include: {
      parks: {
        select: {
          park_english_name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  return plantDiseaseRecords.map((record) => ({
    caseid: record.case_Id || 'N/A',
    location: record.parks?.park_english_name || 'N/A',
    disease: record.name || 'N/A',
    status: record.current_status === 'in_progress' || record.current_status === 'In Progress' 
      ? 'In Progress' 
      : record.current_status || 'N/A',
  }));
}

async function getViolationSummary(sevenDaysAgo: Date, now: Date) {
  // Execute queries sequentially to avoid connection pool exhaustion
  const smokingDetections = await db.parks_smoking_detection.findMany({
    where: { detection_date: { gte: sevenDaysAgo, lte: now } },
  });
  
  const litterDetections = await db.parks_litter_detection.findMany({
    where: { detection_date: { gte: sevenDaysAgo, lte: now } },
  });
  
  const intrusionDetections = await db.parks_intrusion_detection.findMany({
    where: { detection_date: { gte: sevenDaysAgo, lte: now } },
  });
  
  const behaviourDetections = await db.parks_behaviour_alerts.findMany({
    where: { detection_date: { gte: sevenDaysAgo, lte: now } },
  });

  const counts = {
    smoking: smokingDetections.length,
    litter: litterDetections.length,
    intrusion: intrusionDetections.length,
    behavior: behaviourDetections.length,
  };

  const total =
    counts.smoking + counts.litter + counts.intrusion + counts.behavior;

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
}

function countSentiments(checkins: any[]): SentimentCounts {
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
}

async function getZoneUsage(sevenDaysAgo: Date, now: Date) {
  const results = await db.landscaping.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo, lte: now },
    },
    select: {
      plant_type: true,
      createdAt: true,
    },
  });

  const plantDaily: Array<{ date: string; count: number }> = [];
  const grossDaily: Array<{ date: string; count: number }> = [];

  function formatDate(d: Date) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  for (let i = 0; i < 7; i++) {
    const day = new Date(sevenDaysAgo);
    day.setDate(sevenDaysAgo.getDate() + i);

    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const plantCount = results.filter(
      (row) =>
        row.createdAt &&
        new Date(row.createdAt) >= dayStart &&
        new Date(row.createdAt) <= dayEnd &&
        row.plant_type === "Plant"
    ).length;

    const grossCount = results.filter(
      (row) =>
        row.createdAt &&
        new Date(row.createdAt) >= dayStart &&
        new Date(row.createdAt) <= dayEnd &&
        row.plant_type !== "Plant"
    ).length;

    plantDaily.push({
      date: formatDate(dayStart),
      count: plantCount,
    });

    grossDaily.push({
      date: formatDate(dayStart),
      count: grossCount,
    });
  }

  const totalPlant = results.filter((row) => row.plant_type === "Plant").length;
  const totalGross = results.filter((row) => row.plant_type !== "Plant").length;
  const total = totalPlant + totalGross;

  return {
    total: {
      plant: totalPlant,
      gross: totalGross,
      total: total,
    },
    daily: {
      plant: plantDaily,
      gross: grossDaily,
    },
    totalPercentage: percent(total, total),
  };
}

function getSentimentPercentages(sentimentCounts: SentimentCounts) {
  return {
    total: sentimentCounts.total,
    happy: percent(sentimentCounts.happy, sentimentCounts.total),
    neutral: percent(sentimentCounts.neutral, sentimentCounts.total),
    sad: percent(sentimentCounts.sad, sentimentCounts.total),
    angry: percent(sentimentCounts.angry, sentimentCounts.total),
  };
}

async function getOfficeCheckins(todayStart: Date, todayEnd: Date) {
  return db.offices_sentiment_analysis.findMany({
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
}

async function getLitterDetection(now: Date) {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(now.getDate() - i);
    days.push(d);
  }

  const start = new Date(days[0]);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const results = await db.parks_litter_detection.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
  });

  const countsByDate: Record<string, number> = {};
  for (const row of results) {
    if (row.createdAt) {
      const d = new Date(row.createdAt as string | number | Date);
      const dateStr =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    }
  }

  const daily: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < 7; i++) {
    const day = days[i];
    const dateStr =
      day.getFullYear() +
      "-" +
      String(day.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(day.getDate()).padStart(2, "0");
    daily.push({
      date: dateStr,
      count: countsByDate[dateStr] || 0,
    });
  }

  const total = results.length;

  return { total, daily };
}

async function getFootfallSummary(sevenDaysAgo: Date, now: Date) {
  const localStart = new Date(
    sevenDaysAgo.getFullYear(),
    sevenDaysAgo.getMonth(),
    sevenDaysAgo.getDate(),
    0,
    0,
    0,
    0
  );
  const localEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const [parks, offices] = await Promise.all([
    db.parks_footfall_analysis.findMany({
      where: { time: { gte: localStart, lte: localEnd } },
      select: { time: true },
    }),
    db.offices_footfall_analysis.findMany({
      where: { time: { gte: localStart, lte: localEnd } },
      select: { time: true },
    }),
  ]);

  const allTimes = [
    ...parks.map((p: any) => p.time),
    ...offices.map((o: any) => o.time),
  ];

  const total = allTimes.length;
  const daily: Array<{ date: string; count: number }> = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(localStart);
    day.setDate(localStart.getDate() + i);

    const dayStart = new Date(day);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const count = allTimes.filter((t: Date) => {
      const time = new Date(t);
      return time >= dayStart && time <= dayEnd;
    }).length;

    daily.push({
      date: dayStart.toLocaleDateString().slice(0, 10),
      count,
    });
  }

  return { total, daily };
}

async function getParkCheckins(todayStart: Date, todayEnd: Date) {
  return db.parks_sentiment_analysis.findMany({
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
      check_in_date: true,
    },
  });
}

async function getOfficeAttendance(todayStart: Date, todayEnd: Date) {
  return db.offices_attendance.findMany({
    where: {
      entry_time: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
}

async function getParkAttendance(todayStart: Date, todayEnd: Date) {
  return db.parks_attendance.findMany({
    where: {
      entry_time: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
}

async function getParksSmokingDetection(todayStart: Date, todayEnd: Date) {
  return db.parks_smoking_detection.findMany({
    where: {
      occurrence_date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
}

async function getParksIntrusionDetection(todayStart: Date, todayEnd: Date) {
  return db.parks_intrusion_detection.findMany({
    where: {
      occurrence_date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
}

async function getFootfall(
  type: "parks" | "offices",
  gender: string,
  from: Date,
  to: Date
) {
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
}

async function getSentimentAnalysis(
  type: "parks" | "offices",
  args: Parameters<typeof db.parks_sentiment_analysis.findMany>[0] = {}
) {
  if (type === "parks") {
    return db.parks_sentiment_analysis.findMany(args);
  } else {
    const { select, include, omit, ...rest } = args || {};
    let officesArgs: any = { ...rest };
    if (select) officesArgs.select = select;
    if (args && "include" in args && include) officesArgs.include = include;
    if (args && "omit" in args && omit) officesArgs.omit = omit;
    return db.offices_sentiment_analysis.findMany(officesArgs);
  }
}

async function mapSentimentWithEmpId(sentiments: any[]) {
  const allPersonIds = Array.from(
    new Set(sentiments.map((sentiment) => sentiment.person_Id).filter(Boolean))
  ) as string[];

  if (allPersonIds.length === 0) return [];

  const users = await db.users.findMany({
    where: {
      Id: {
        in: allPersonIds.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
      },
    },
    select: {
      Id: true,
      emp_Id: true,
    },
  });

  const userMap = new Map(users.map((user) => [user.Id.toString(), user]));

  return sentiments.map((sentiment) => {
    const user = sentiment.person_Id ? userMap.get(sentiment.person_Id) : null;
    return {
      emp_id: user ? user.emp_Id || user.Id : null,
      person_name: sentiment.person_name,
      person_image: sentiment.person_image,
      sentiment_of: sentiment.sentiment_of,
      check_in_time: sentiment.check_in_time,
      check_in_date: sentiment.check_in_date,
    };
  });
}

export default DashboardService;
