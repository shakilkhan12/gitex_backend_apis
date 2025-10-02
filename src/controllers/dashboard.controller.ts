import DashboardService from "@/services/dashboard.service";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class DashboardController {
    public static getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dashboardData = await DashboardService.getDashboardData();
            return res.status(STATUS.SUCCESS).json(dashboardData);
        } catch (error) {
            next(error);
        }
    }
}

export default DashboardController;