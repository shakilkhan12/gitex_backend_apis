import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { startOfDay, endOfDay } from "date-fns";

class DailyLogsDashboardService {
    protected static getDailyLogsDashboardDataService = async (filters?: {
        page?: number;
        limit?: number;
        tab?: 'guests' | 'employees';
    }) => {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 10;
            const skip = (page - 1) * limit;
            const tab = filters?.tab || 'guests';

            // Use today's date range by default
            const now = new Date();
            const todayStart = startOfDay(now);
            const todayEnd = endOfDay(now);

            // Get sentiment analysis data from both parks and offices
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
                    },
                    orderBy: { check_in_time: 'desc' }
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
                    },
                    orderBy: { check_in_time: 'desc' }
                })
            ]);

            // Combine and sort all records
            const allSentimentAnalysisToday = [...parksSentiment, ...officesSentiment]
                .sort((a, b) => {
                    const timeA = a.check_in_time ? new Date(a.check_in_time).getTime() : 0;
                    const timeB = b.check_in_time ? new Date(b.check_in_time).getTime() : 0;
                    return timeB - timeA;
                });

            // Filter by tab (guests or employees)
            const filteredData = allSentimentAnalysisToday.filter(item => {
                if (tab === 'guests') {
                    return item.sentiment_of === 'visitor';
                } else if (tab === 'employees') {
                    return item.sentiment_of === 'employee';
                }
                return true; // Show all if no tab specified
            });

            // Get total count for pagination
            const totalCount = filteredData.length;

            // Apply pagination
            const paginatedData = filteredData.slice(skip, skip + limit);

            // Get user data for mapping
            const allPersonIds = Array.from(new Set(
                paginatedData.map(sentiment => sentiment.person_Id).filter(Boolean)
            )) as string[];

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

            // Transform the data
            const sentimentAnalysisToday = paginatedData.map(sentiment => {
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

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;

            const paginationData = {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage,
                hasPreviousPage,
                nextPage: hasNextPage ? page + 1 : null,
                previousPage: hasPreviousPage ? page - 1 : null
            };

            return {
                success: true,
                sentimentAnalysisToday,
                pagination: paginationData,
                message: "Daily logs data retrieved successfully"
            };

        } catch (error: any) {
            console.error("Error fetching daily logs dashboard data:", error);
            throw new Error("Failed to fetch daily logs dashboard data");
        }
    };
}

export default DailyLogsDashboardService;
