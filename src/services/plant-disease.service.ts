import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatImageUrlsInArray } from "@/utils/imageUrl.utils";

class PlantDiseaseService {
    protected static getPlantDiseaseDataService = async () => {
        try {
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

            const transformedData = plantDiseaseRecords.map((record: any) => ({
                caseid: record.case_Id || `PD-${record.id}`,
                location: record.parks?.park_english_name || 'Unknown Location',
                location_arabic: record.parks?.park_arabic_name || 'موقع غير معروف',
                disease: record.name || 'Unknown Disease',
                disease_arabic: record.name || 'مرض غير معروف',
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

            const imageFields = ['image', 'disease_image'];
            const formattedTransformedData = formatImageUrlsInArray(transformedData, imageFields);

            return {
                success: true,
                plantDiseaseData: formattedTransformedData,
                message: "Plant disease data retrieved successfully"
            };

        } catch (error: any) {
            throw new Error("Failed to fetch plant disease data");
        }
    };

    protected static viewPlantDiseaseService = async (paginationParams?: {
        page: number;
        limit: number;
        search: string;
        status: string;
        sortBy: string;
        sortOrder: string;
        startDate?: string;
        endDate?: string;
    }) => {
        try {
            if (!paginationParams) {
                const results = await db.landscaping.findMany({
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
                    }
                });

                return results;
            }

            const whereClause: any = {
                plant_type: "Plant"
            };
            
            if (paginationParams.search) {
                whereClause.OR = [
                    { case_Id: { contains: paginationParams.search, mode: 'insensitive' } },
                    { name: { contains: paginationParams.search, mode: 'insensitive' } },
                    { description: { contains: paginationParams.search, mode: 'insensitive' } },
                    { parks: { park_english_name: { contains: paginationParams.search, mode: 'insensitive' } } },
                    { parks: { park_arabic_name: { contains: paginationParams.search, mode: 'insensitive' } } }
                ];
            }

            if (paginationParams.status) {
                whereClause.current_status = paginationParams.status;
            }

            if (paginationParams.startDate || paginationParams.endDate) {
                whereClause.createdAt = {};
                
                if (paginationParams.startDate) {
                    whereClause.createdAt.gte = new Date(paginationParams.startDate);
                }
                
                if (paginationParams.endDate) {
                    const endDate = new Date(paginationParams.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    whereClause.createdAt.lte = endDate;
                }
            }

            const orderByClause: any = {};
            orderByClause[paginationParams.sortBy] = paginationParams.sortOrder;

            const skip = (paginationParams.page - 1) * paginationParams.limit;

            const totalCount = await db.landscaping.count({ where: whereClause });

            const results = await db.landscaping.findMany({
                where: whereClause,
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
                orderBy: orderByClause,
                skip: skip,
                take: paginationParams.limit
            });

            const totalPages = Math.ceil(totalCount / paginationParams.limit);
            const hasNextPage = paginationParams.page < totalPages;
            const hasPreviousPage = paginationParams.page > 1;

            const allDataForStats = await db.landscaping.findMany({
                where: whereClause,
                select: {
                    current_status: true
                }
            });

            const stats = {
                pending: allDataForStats.filter(
                    item => {
                        const status = item.current_status?.toLowerCase()?.trim();
                        return status === 'pending';
                    }
                ).length,
                underProcess: allDataForStats.filter(
                    item => {
                        const status = item.current_status?.toLowerCase()?.trim();
                        return status === 'in progress' || 
                               status === 'under process' ||
                               status === 'assigned';
                    }
                ).length,
                completed: allDataForStats.filter(
                    item => {
                        const status = item.current_status?.toLowerCase()?.trim();
                        return status === 'completed' || 
                               status === 'closed' || 
                               status === 'resolved';
                    }
                ).length,
                total: allDataForStats.length
            };

            const imageFields = ['image', 'disease_image'];
            const formattedResultsWithImages = formatImageUrlsInArray(results, imageFields);

            return {
                data: formattedResultsWithImages,
                pagination: {
                    currentPage: paginationParams.page,
                    totalPages,
                    totalCount,
                    limit: paginationParams.limit,
                    hasNextPage,
                    hasPreviousPage,
                    nextPage: hasNextPage ? paginationParams.page + 1 : null,
                    previousPage: hasPreviousPage ? paginationParams.page - 1 : null
                },
                stats
            };

        } catch (error: any) {
            throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch plant disease data");
        }
    };
}

export default PlantDiseaseService;
