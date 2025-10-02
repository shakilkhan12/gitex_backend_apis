import DashboardController from "@/controllers/dashboard.controller";
import { Router } from "express";

const dashboardRouter = Router();

dashboardRouter.get('/get', DashboardController.getDashboardData)

export default dashboardRouter;
