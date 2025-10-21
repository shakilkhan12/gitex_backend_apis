import db from "@/prisma/client";
import { startOfDay, endOfDay } from "date-fns";
import { NextFunction, Request, Response } from "express";
import { STATUS } from "@/typescript";

class OptimizedComponentApisController {
    // Welcome Card API - Only attendance and violation data
    public static getWelcomeCardData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const todayStart = startOfDay(new Date(startDate || now));
            const todayEnd = endOfDay(new Date(endDate || now));

            // Get office and park check-ins for sentiment analysis
            const [officeCheckins, parkCheckins] = await Promise.all([
                db.offices_sentiment_analysis.findMany({
                    where: { check_in_date: { gte: todayStart, lte: todayEnd } },
                    select: { Id: true, check_in_sentiment: true }
                }),
                db.parks_sentiment_analysis.findMany({
                    where: { check_in_date: { gte: todayStart, lte: todayEnd } },
                    select: { Id: true, check_in_sentiment: true }
                })
            ]);

            // Get attendance data
            const [officeAttendance, parkAttendance] = await Promise.all([
                db.offices_attendance.findMany({
                    where: { entry_time: { gte: todayStart, lte: todayEnd } }
                }),
                db.parks_attendance.findMany({
                    where: { entry_time: { gte: todayStart, lte: todayEnd } }
                })
            ]);

            // Get violation data
            const [smokingDetections, intrusionDetections] = await Promise.all([
                db.parks_smoking_detection.findMany({
                    where: { occurrence_date: { gte: todayStart, lte: todayEnd } }
                }),
                db.parks_intrusion_detection.findMany({
                    where: { occurrence_date: { gte: todayStart, lte: todayEnd } }
                })
            ]);

            // Calculate attendance percentage
            const allCheckins = [...officeCheckins, ...parkCheckins];
            const totalAttendance = officeAttendance.length + parkAttendance.length;
            const attendancePercentage = totalAttendance > 0 ? 
                Math.round((totalAttendance / (allCheckins.length + totalAttendance)) * 100) : 0;

            // Calculate violation percentage
            const totalViolations = smokingDetections.length + intrusionDetections.length;
            const violationPercentage = totalViolations > 0 ? 100 : 0;

            return res.status(STATUS.SUCCESS).json({
                attendancePercentage,
                violation: {
                    violationPercentage
                }
            });
        } catch (error) {
            next(error);
        }
    };

    // Gender Count Card API - Only footfall visitor data
    public static getGenderCountData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 6);

            // Get footfall data for parks and offices
            const [parkFootfallMale, parkFootfallFemale, officeFootfallMale, officeFootfallFemale] = await Promise.all([
                db.parks_footfall_analysis.findMany({
                    where: {
                        gender: "Male.",
                        time: { gte: startOfDay(sevenDaysAgo), lte: endOfDay(now) }
                    }
                }),
                db.parks_footfall_analysis.findMany({
                    where: {
                        gender: "Female.",
                        time: { gte: startOfDay(sevenDaysAgo), lte: endOfDay(now) }
                    }
                }),
                db.offices_footfall_analysis.findMany({
                    where: {
                        gender: "Male.",
                        time: { gte: startOfDay(sevenDaysAgo), lte: endOfDay(now) }
                    }
                }),
                db.offices_footfall_analysis.findMany({
                    where: {
                        gender: "Female.",
                        time: { gte: startOfDay(sevenDaysAgo), lte: endOfDay(now) }
                    }
                })
            ]);

            const totalMaleVisitors = parkFootfallMale.length + officeFootfallMale.length;
            const totalFemaleVisitors = parkFootfallFemale.length + officeFootfallFemale.length;

            return res.status(STATUS.SUCCESS).json({
                footfallVisitors: {
                    footFallMaleVisitors: totalMaleVisitors,
                    footFallFemaleVisitors: totalFemaleVisitors
                }
            });
        } catch (error) {
            next(error);
        }
    };

    // Website Analytics API - Only sentiment data
    public static getWebsiteAnalyticsData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const todayStart = startOfDay(new Date(startDate || now));
            const todayEnd = endOfDay(new Date(endDate || now));

            // Get sentiment data
            const [officeCheckins, parkCheckins] = await Promise.all([
                db.offices_sentiment_analysis.findMany({
                    where: { check_in_date: { gte: todayStart, lte: todayEnd } },
                    select: { check_in_sentiment: true }
                }),
                db.parks_sentiment_analysis.findMany({
                    where: { check_in_date: { gte: todayStart, lte: todayEnd } },
                    select: { check_in_sentiment: true }
                })
            ]);

            const allCheckins = [...officeCheckins, ...parkCheckins];
            const sentimentCounts = allCheckins.reduce((acc, curr) => {
                const sentiment = (curr.check_in_sentiment || "unknown").toLowerCase();
                acc.total += 1;
                if (sentiment === "happy") acc.happy += 1;
                else if (sentiment === "neutral") acc.neutral += 1;
                else if (sentiment === "sad") acc.sad += 1;
                else if (sentiment === "angry") acc.angry += 1;
                return acc;
            }, { happy: 0, neutral: 0, sad: 0, angry: 0, total: 0 });

            const sentimentPercentages = {
                total: sentimentCounts.total,
                happy: sentimentCounts.total > 0 ? Math.round((sentimentCounts.happy / sentimentCounts.total) * 100) : 0,
                neutral: sentimentCounts.total > 0 ? Math.round((sentimentCounts.neutral / sentimentCounts.total) * 100) : 0,
                sad: sentimentCounts.total > 0 ? Math.round((sentimentCounts.sad / sentimentCounts.total) * 100) : 0,
                angry: sentimentCounts.total > 0 ? Math.round((sentimentCounts.angry / sentimentCounts.total) * 100) : 0
            };

            return res.status(STATUS.SUCCESS).json({
                sentimentPercentages
            });
        } catch (error) {
            next(error);
        }
    };

    // Earning Reports API - Only footfall summary data
    public static getEarningReportsData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 6);

            const localStart = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 0, 0, 0, 0);
            const localEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            const [parks, offices] = await Promise.all([
                db.parks_footfall_analysis.findMany({
                    where: { time: { gte: localStart, lte: localEnd } },
                    select: { time: true }
                }),
                db.offices_footfall_analysis.findMany({
                    where: { time: { gte: localStart, lte: localEnd } },
                    select: { time: true }
                })
            ]);

            const allTimes = [...parks.map((p: any) => p.time), ...offices.map((o: any) => o.time)];
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
                    count
                });
            }

            return res.status(STATUS.SUCCESS).json({
                footfallSummary: { total, daily }
            });
        } catch (error) {
            next(error);
        }
    };

    // Notifications Card API - Only violation summary data
    public static getNotificationsData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 6);

            const [smokingDetections, litterDetections, intrusionDetections, behaviourDetections] = await Promise.all([
                db.parks_smoking_detection.findMany({
                    where: { detection_date: { gte: sevenDaysAgo, lte: now } }
                }),
                db.parks_litter_detection.findMany({
                    where: { detection_date: { gte: sevenDaysAgo, lte: now } }
                }),
                db.parks_intrusion_detection.findMany({
                    where: { detection_date: { gte: sevenDaysAgo, lte: now } }
                }),
                db.parks_behaviour_alerts.findMany({
                    where: { detection_date: { gte: sevenDaysAgo, lte: now } }
                })
            ]);

            const counts = {
                smoking: smokingDetections.length,
                litter: litterDetections.length,
                intrusion: intrusionDetections.length,
                behavior: behaviourDetections.length
            };

            const total = counts.smoking + counts.litter + counts.intrusion + counts.behavior;

            const percentages = {
                smoking: total > 0 ? Math.round((counts.smoking / total) * 100) : 0,
                litter: total > 0 ? Math.round((counts.litter / total) * 100) : 0,
                intrusion: total > 0 ? Math.round((counts.intrusion / total) * 100) : 0,
                behavior: total > 0 ? Math.round((counts.behavior / total) * 100) : 0
            };

            return res.status(STATUS.SUCCESS).json({
                violationSummary: { counts, percentages, total }
            });
        } catch (error) {
            next(error);
        }
    };

    // Park Live Stats API - Only zone usage data
    public static getParkLiveStatsData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 6);

            const results = await db.landscaping.findMany({
                where: { createdAt: { gte: sevenDaysAgo, lte: now } },
                select: { plant_type: true, createdAt: true }
            });

            const plantDaily: Array<{ date: string; count: number }> = [];
            const grossDaily: Array<{ date: string; count: number }> = [];

            const formatDate = (d: Date) => {
                return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
            };

            for (let i = 0; i < 7; i++) {
                const day = new Date(sevenDaysAgo);
                day.setDate(sevenDaysAgo.getDate() + i);
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);

                const plantCount = results.filter(row =>
                    row.createdAt && new Date(row.createdAt) >= dayStart && new Date(row.createdAt) <= dayEnd && row.plant_type === "Plant"
                ).length;

                const grossCount = results.filter(row =>
                    row.createdAt && new Date(row.createdAt) >= dayStart && new Date(row.createdAt) <= dayEnd && row.plant_type !== "Plant"
                ).length;

                plantDaily.push({ date: formatDate(dayStart), count: plantCount });
                grossDaily.push({ date: formatDate(dayStart), count: grossCount });
            }

            const totalPlant = results.filter(row => row.plant_type === "Plant").length;
            const totalGross = results.filter(row => row.plant_type !== "Plant").length;
            const total = totalPlant + totalGross;

            return res.status(STATUS.SUCCESS).json({
                zoneUsageSummary: {
                    total: { plant: totalPlant, gross: totalGross, total },
                    daily: { plant: plantDaily, gross: grossDaily }
                }
            });
        } catch (error) {
            next(error);
        }
    };

    // Zone Usage API - Only zone usage data
    public static getZoneUsageData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const todayStart = startOfDay(new Date(startDate || now));
            const todayEnd = endOfDay(new Date(endDate || now));

            const zones = await db.park_zones.findMany({
                where: { createdAt: { gte: todayStart, lte: todayEnd } },
                include: { parks: true }
            });

            return res.status(STATUS.SUCCESS).json({
                zones: zones.map((zone: any) => ({
                    id: zone.Id,
                    name: zone.zone_english_name,
                    park: zone.parks?.park_english_name,
                    usage: Math.floor(Math.random() * 100) // Mock usage data
                }))
            });
        } catch (error) {
            next(error);
        }
    };

    // Daily Logs Card API - Only sentiment analysis data
    public static getDailyLogsData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            console.log('📊 Daily Logs API called with dates:', { startDate, endDate });

            const now = new Date();
            const todayStart = startOfDay(new Date(startDate || now));
            const todayEnd = endOfDay(new Date(endDate || now));

            console.log('📅 Date range:', { todayStart, todayEnd });

            const [parksSentiment, officesSentiment] = await Promise.all([
                db.parks_sentiment_analysis.findMany({
                    where: { check_in_date: { gte: todayStart, lte: todayEnd } },
                    select: {
                        Id: true,
                        person_Id: true,
                        person_name: true,
                        person_image: true,
                        sentiment_of: true,
                        check_in_time: true,
                        check_in_date: true
                    }
                }),
                db.offices_sentiment_analysis.findMany({
                    where: { check_in_date: { gte: todayStart, lte: todayEnd } },
                    select: {
                        Id: true,
                        person_Id: true,
                        person_name: true,
                        person_image: true,
                        sentiment_of: true,
                        check_in_time: true,
                        check_in_date: true
                    }
                })
            ]);

            const allSentimentAnalysisToday = [...parksSentiment, ...officesSentiment];
            
            console.log('📈 Found sentiment records:', {
                parks: parksSentiment.length,
                offices: officesSentiment.length,
                total: allSentimentAnalysisToday.length
            });
            
            // Get user data for mapping
            const allPersonIds = Array.from(new Set(
                allSentimentAnalysisToday.map(sentiment => sentiment.person_Id).filter(Boolean)
            )) as string[];

            console.log('👥 Person IDs found:', allPersonIds);

            let users: any[] = [];
            if (allPersonIds.length > 0) {
                users = await db.users.findMany({
                    where: {
                        Id: {
                            in: allPersonIds.map(id => parseInt(id)).filter(id => !isNaN(id))
                        }
                    },
                    select: { Id: true, emp_Id: true }
                });
            }

            const userMap = new Map(users.map(user => [user.Id.toString(), user]));

            const sentimentAnalysisToday = allSentimentAnalysisToday.map(sentiment => {
                const user = sentiment.person_Id ? userMap.get(sentiment.person_Id) : null;
                return {
                    emp_id: user ? user.emp_Id || user.Id : null,
                    person_name: sentiment.person_name,
                    person_image: sentiment.person_image,
                    sentiment_of: sentiment.sentiment_of,
                    check_in_time: sentiment.check_in_time,
                    check_in_date: sentiment.check_in_date
                };
            });

            console.log('✅ Daily Logs API response:', {
                recordsCount: sentimentAnalysisToday.length,
                sampleRecord: sentimentAnalysisToday[0] || 'No records found'
            });

            return res.status(STATUS.SUCCESS).json({
                sentimentAnalysisToday
            });
        } catch (error) {
            console.error('❌ Daily Logs API Error:', error);
            next(error);
        }
    };

    // Violation Summary API - Only violation summary data
    public static getViolationSummaryData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 6);

            const [smokingDetections, litterDetections, intrusionDetections, behaviourDetections] = await Promise.all([
                db.parks_smoking_detection.findMany({
                    where: { detection_date: { gte: sevenDaysAgo, lte: now } }
                }),
                db.parks_litter_detection.findMany({
                    where: { detection_date: { gte: sevenDaysAgo, lte: now } }
                }),
                db.parks_intrusion_detection.findMany({
                    where: { detection_date: { gte: sevenDaysAgo, lte: now } }
                }),
                db.parks_behaviour_alerts.findMany({
                    where: { detection_date: { gte: sevenDaysAgo, lte: now } }
                })
            ]);

            const counts = {
                smoking: smokingDetections.length,
                litter: litterDetections.length,
                intrusion: intrusionDetections.length,
                behavior: behaviourDetections.length
            };

            const total = counts.smoking + counts.litter + counts.intrusion + counts.behavior;

            const percentages = {
                smoking: total > 0 ? Math.round((counts.smoking / total) * 100) : 0,
                litter: total > 0 ? Math.round((counts.litter / total) * 100) : 0,
                intrusion: total > 0 ? Math.round((counts.intrusion / total) * 100) : 0,
                behavior: total > 0 ? Math.round((counts.behavior / total) * 100) : 0
            };

            return res.status(STATUS.SUCCESS).json({
                violationSummary: { counts, percentages, total }
            });
        } catch (error) {
            next(error);
        }
    };

    // Littering Frequency API - Only litter detection data
    public static getLitteringFrequencyData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
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
                select: { createdAt: true }
            });

            const countsByDate: Record<string, number> = {};
            for (const row of results) {
                if (row.createdAt) {
                    const d = new Date(row.createdAt as string | number | Date);
                    const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
                    countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
                }
            }

            const daily: Array<{ date: string; count: number }> = [];
            for (let i = 0; i < 7; i++) {
                const day = days[i];
                const dateStr = day.getFullYear() + "-" + String(day.getMonth() + 1).padStart(2, "0") + "-" + String(day.getDate()).padStart(2, "0");
                daily.push({
                    date: dateStr,
                    count: countsByDate[dateStr] || 0
                });
            }

            const total = results.length;

            return res.status(STATUS.SUCCESS).json({
                litterDetectionSummary: { total, daily }
            });
        } catch (error) {
            next(error);
        }
    };

    // Irrigation Log API - Only irrigation data
    public static getIrrigationLogData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const todayStart = startOfDay(new Date(startDate || now));
            const todayEnd = endOfDay(new Date(endDate || now));

            const irrigationLogs = await db.parks_irrigation_job_history.findMany({
                where: { createdAt: { gte: todayStart, lte: todayEnd } },
                orderBy: { createdAt: 'desc' }
            });

            const irrigationData = irrigationLogs.map((log: any) => ({
                id: log.Id,
                zone: log.zone_name || 'Unknown Zone',
                duration: log.duration || 0,
                status: log.status || 'completed',
                startTime: log.start_time,
                endTime: log.end_time,
                createdAt: log.createdAt
            }));

            return res.status(STATUS.SUCCESS).json({
                irrigationData
            });
        } catch (error) {
            next(error);
        }
    };

    // Plant Disease API - Only plant disease data
    public static getPlantDiseaseData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 6);

            // For now, return empty array since plant disease data might not be implemented yet
            const plantDiseaseData: any[] = [];

            return res.status(STATUS.SUCCESS).json({
                plantDiseaseData
            });
        } catch (error) {
            next(error);
        }
    };
}

export default OptimizedComponentApisController;
                