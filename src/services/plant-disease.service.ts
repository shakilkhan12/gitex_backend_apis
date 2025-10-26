import { STATUS } from "@/typescript";
import db from "@/prisma/client";

class PlantDiseaseService {
    protected static getPlantDiseaseDataService = async () => {
        try {
            // Get the latest 3 plant disease records from landscaping table where plant_type === "Plant"
            const plantDiseaseRecords = await db.landscaping.findMany({
                where: {
                    plant_type: "Plant"
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

            // Transform the data to match the expected format for the dashboard
            const transformedData = plantDiseaseRecords.map((record: any) => ({
                caseid: record.case_Id || `PD-${record.id}`,
                location: record.parks?.park_english_name || 'Unknown Location',
                location_arabic: record.parks?.park_arabic_name || 'موقع غير معروف',
                disease: record.name || 'Unknown Disease',
                disease_arabic: record.name || 'مرض غير معروف', // You might want to add Arabic disease names
                status: record.current_status || record.status || 'Pending',
                suggestion: record.suggestion || '',
                confidence_score: record.confidence_score || '',
                rationale: record.rationale || '',
                estimated_height: record.estimated_height || '',
                needs_cutting: record.needs_cutting || false,
                recommendation_note: record.recommendation_note || '',
                assigned_to: record.assignedUser?.emp__eng_name || 'Unassigned',
                assigned_to_arabic: record.assignedUser?.emp__arabic_name || 'غير مخصص',
                park_name: record.parks?.park_english_name || 'Unknown Park',
                park_name_arabic: record.parks?.park_arabic_name || 'حديقة غير معروفة',
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            }));

            return {
                success: true,
                plantDiseaseData: transformedData,
                message: "Plant disease data retrieved successfully"
            };

        } catch (error: any) {
            console.error("Error fetching plant disease data:", error);
            throw new Error("Failed to fetch plant disease data");
        }
    };
}

export default PlantDiseaseService;
