import AlertController from "@/controllers/alert.controller";
import { Router } from "express";

const alertRouter = Router();

alertRouter.get('/get', AlertController.getAlertData)

export default alertRouter;
