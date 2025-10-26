import { Router } from "express";
import LandscapingDashboardController from "@/controllers/landscaping-dashboard.controller";

const landscapingDashboardRouter = Router();

// Get landscaping dashboard data
landscapingDashboardRouter.get('/dashboard', LandscapingDashboardController.getLandscapingDashboardData);

export default landscapingDashboardRouter;
