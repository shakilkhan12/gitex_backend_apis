import { NextFunction, Request, Response } from "express";
import PlantDiseaseService from "@/services/plant-disease.service";
import { STATUS } from "@/typescript";

class PlantDiseaseController extends PlantDiseaseService {
    public static getPlantDiseaseData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await PlantDiseaseService.getPlantDiseaseDataService();
            
            return res.status(STATUS.SUCCESS).json(result);
        } catch (error) {
            next(error);
        }
    };

    public static viewPlantDisease = async (req: Request, res: Response, next: NextFunction) => {
        console.log("🟡 [PlantDiseaseController] viewPlantDisease called");
        try {
            // Extract pagination parameters from query
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string || '';
            const status = req.query.status as string || '';
            const sortBy = req.query.sortBy as string || 'createdAt';
            const sortOrder = req.query.sortOrder as string || 'desc';
            const startDate = req.query.startDate as string || '';
            const endDate = req.query.endDate as string || '';

            const result = await PlantDiseaseService.viewPlantDiseaseService({
                page,
                limit,
                search,
                status,
                sortBy,
                sortOrder,
                startDate,
                endDate
            });
            
            console.log("✅ [PlantDiseaseController] Successfully retrieved plant disease data");
            
            // Handle both paginated and non-paginated responses
            if (Array.isArray(result)) {
                // Non-paginated response (backward compatibility)
                return res.status(STATUS.SUCCESS).json({
                    success: true,
                    message: "Plant disease records retrieved successfully",
                    data: result
                });
            } else {
                // Paginated response
                return res.status(STATUS.SUCCESS).json({
                    success: true,
                    message: "Plant disease records retrieved successfully",
                    data: result.data,
                    pagination: result.pagination,
                    stats: result.stats
                });
            }
        } catch (error) {
            console.error("❌ [PlantDiseaseController] Error in viewPlantDisease:", error);
            next(error);
        }
    };
}

export default PlantDiseaseController;
