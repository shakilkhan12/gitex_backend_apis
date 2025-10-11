import DashboardController from "@/controllers/dashboard.controller";
import FootfallAnalyticsController from "@/controllers/footfall-analytics.controller";
import { Router } from "express";

const dashboardRouter = Router();

dashboardRouter.get('/get', DashboardController.getDashboardData);
dashboardRouter.post('/footfall-analytics', FootfallAnalyticsController.getFootfallAnalytics);

export default dashboardRouter;