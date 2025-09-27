import CamerasController from "@/controllers/cameras.controller";
import { Router } from "express";

const camerasRouter = Router();

// Get all offices and parks cameras in a single response
camerasRouter.get('/get-all', CamerasController.getAllCameras);

export default camerasRouter;
