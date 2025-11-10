import { STATUS } from "@/typescript";
import db from "@/prisma/client";

class LandscapingDashboardService {
    protected static getLandscapingDashboardDataService = async () => {
        try {
            const landscapingRecords = await db.landscaping.findMany({
                where: {
                    plant_type: {
                        not: "Plant"
                    }
                },
                include: {
                    parks: {
                        select: {
                            Id: true,
                            park_Id: true,
                            park_english_name: true,
                            park_arabic_name: true,
                            latitude: true,
                            longitude: true
                        }
                    },
                    assignedUser: {
                        select: {
                            Id: true,
                            user_Id: true,
                            emp__eng_name: true,
                            emp__arabic_name: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 3
            });


            const transformedData = landscapingRecords.map((record: any) => ({
                caseid: record.case_Id || `LS-${record.id}`,
                location: record.parks?.park_english_name || 'Unknown Location',
                location_arabic: record.parks?.park_arabic_name || 'موقع غير معروف',
                task: record.name || 'Unknown Task',
                task_arabic: record.name || 'مهمة غير معروفة',
                status: record.current_status || record.status || 'Pending',
                suggestion: record.suggestion || '',
                confidence_score: record.confidence_score || '',
                rationale: record.rationale || '',
                estimated_height: record.estimated_height || '',
                needs_cutting: record.needs_cutting || false,
                recommendation_note: record.recommendation_note || '',
                incharge: record.assignedUser?.emp__eng_name || 'Unassigned',
                incharge_arabic: record.assignedUser?.emp__arabic_name || 'غير مخصص',
                assigned_to: record.assignedUser?.emp__eng_name || 'Unassigned',
                assigned_to_arabic: record.assignedUser?.emp__arabic_name || 'غير مخصص',
                park_name: record.parks?.park_english_name || 'Unknown Park',
                park_name_arabic: record.parks?.park_arabic_name || 'حديقة غير معروفة',
                plant_type: record.plant_type || 'Unknown',
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            }));

            return {
                success: true,
                landscapingData: transformedData,
                message: "Landscaping dashboard data retrieved successfully"
            };

        } catch (error: any) {
            throw new Error("Failed to fetch landscaping dashboard data");
        }
    };
}

export default LandscapingDashboardService;
