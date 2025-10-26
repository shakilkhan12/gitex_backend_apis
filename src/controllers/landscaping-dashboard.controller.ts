import { NextFunction, Request, Response } from "express";
import LandscapingDashboardService from "@/services/landscaping-dashboard.service";
import { STATUS } from "@/typescript";

class LandscapingDashboardController extends LandscapingDashboardService {
    public static getLandscapingDashboardData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await LandscapingDashboardService.getLandscapingDashboardDataService();
            
            return res.status(STATUS.SUCCESS).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export default LandscapingDashboardController;
