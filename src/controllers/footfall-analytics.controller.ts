import FootfallAnalyticsService from "@/services/footfall-analytics.service";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class FootfallAnalyticsController {
  public static getFootfallAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from_date, to_date } = req.body;
      
      // Validate required fields
      if (!from_date || !to_date) {
        return res.status(STATUS.BAD_REQUEST).json({
          status: "error",
          message: "from_date and to_date are required"
        });
      }

      // Validate date format
      const fromDate = new Date(from_date);
      const toDate = new Date(to_date);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(STATUS.BAD_REQUEST).json({
          status: "error",
          message: "Invalid date format. Please use YYYY-MM-DD format"
        });
      }

      // Validate date range
      if (fromDate > toDate) {
        return res.status(STATUS.BAD_REQUEST).json({
          status: "error",
          message: "from_date cannot be later than to_date"
        });
      }
      
      const result = await FootfallAnalyticsService.getFootfallAnalytics(from_date, to_date);
      return res.status(STATUS.SUCCESS).json(result);
    } catch (error: any) {
      console.error('❌ FootfallAnalyticsController error:', error);
      next(error);
    }
  };
}

export default FootfallAnalyticsController;
