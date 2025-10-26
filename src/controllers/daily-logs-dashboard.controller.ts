import { NextFunction, Request, Response } from "express";
import DailyLogsDashboardService from "@/services/daily-logs-dashboard.service";
import { STATUS } from "@/typescript";

class DailyLogsDashboardController extends DailyLogsDashboardService {
    public static getDailyLogsDashboardData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, tab } = req.query;
            
            const filters = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                tab: tab as 'guests' | 'employees' || 'guests'
            };

            const result = await DailyLogsDashboardService.getDailyLogsDashboardDataService(filters);
            
            return res.status(STATUS.SUCCESS).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export default DailyLogsDashboardController;
