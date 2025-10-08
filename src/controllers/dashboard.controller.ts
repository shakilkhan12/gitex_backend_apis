import DashboardService from "@/services/dashboard.service";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class DashboardController {
    public static getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            if (startDate && endDate) {
                const dashboardData = await DashboardService.getDashboardData(startDate, endDate);
                return res.status(STATUS.SUCCESS).json(dashboardData);
            }

            const dashboardData = await DashboardService.getDashboardData();
            return res.status(STATUS.SUCCESS).json(dashboardData);
        } catch (error) {
            next(error);
        }
    }
}

export default DashboardController;