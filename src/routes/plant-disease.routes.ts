import { Router } from "express";
import PlantDiseaseController from "@/controllers/plant-disease.controller";

const plantDiseaseRouter = Router();

// Get plant disease data for dashboard
plantDiseaseRouter.get('/dashboard', PlantDiseaseController.getPlantDiseaseData);

export default plantDiseaseRouter;
