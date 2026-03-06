import { NextFunction, Request, Response } from "express";
import PlantDiseaseService from "@/services/plant-disease.service";
import { STATUS } from "@/typescript";
import { formatExportDateTime, sendExcelExport, sendPdfTableExport } from "@/utils/export.utils";

const buildPlantDiseaseFilters = (req: Request) => {
    const { page, limit, search, status, sortBy, sortOrder, startDate, endDate } = req.query;

    return {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
        startDate: startDate as string,
        endDate: endDate as string
    };
};

const mapPlantDiseaseExportRows = (records: any[]) => {
    return records.map(item => ({
        "Case ID": item.case_Id || "-",
        "Park": item.parks?.park_english_name || item.parks?.park_arabic_name || "-",
        "Occurrence Date": formatExportDateTime(item.createdAt),
        "Assigned To": item.assignedUser
            ? `${item.assignedUser.emp__eng_name || item.assignedUser.emp__arabic_name || "-"} (${item.assignedUser.emp_Id || item.assignedUser.Id || item.assignedUser.id || "-"})`
            : "-",
        "Disease": item.name || "-",
        "Status": item.current_status || "-"
    }));
};

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

    public static exportPlantDiseaseExcel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = { ...buildPlantDiseaseFilters(req), page: 1, limit: 50000 };
            const result = await PlantDiseaseService.viewPlantDiseaseService(filters);
            const records = Array.isArray(result) ? result : result.data || [];
            const rows = mapPlantDiseaseExportRows(records);

            return sendExcelExport(res, {
                rows,
                sheetName: "Plant Disease",
                fileName: `plant_disease_${new Date().toISOString().slice(0, 10)}.xlsx`
            });
        } catch (error) {
            next(error);
        }
    };

    public static exportPlantDiseasePdf = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = { ...buildPlantDiseaseFilters(req), page: 1, limit: 50000 };
            const result = await PlantDiseaseService.viewPlantDiseaseService(filters);
            const records = Array.isArray(result) ? result : result.data || [];
            const rows = mapPlantDiseaseExportRows(records);

            return sendPdfTableExport(res, {
                title: "Plant Disease Export",
                headers: ["Case ID", "Park", "Occurrence Date", "Assigned To", "Disease", "Status"],
                widths: [60, 110, 120, 130, 110, 70],
                rows,
                fileName: `plant_disease_${new Date().toISOString().slice(0, 10)}.pdf`
            });
        } catch (error) {
            next(error);
        }
    };
}

export default PlantDiseaseController;
