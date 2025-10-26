import { Router } from "express";
import DailyLogsDashboardController from "@/controllers/daily-logs-dashboard.controller";

const dailyLogsDashboardRouter = Router();

// Get daily logs dashboard data with pagination
dailyLogsDashboardRouter.get('/dashboard', DailyLogsDashboardController.getDailyLogsDashboardData);

export default dailyLogsDashboardRouter;
