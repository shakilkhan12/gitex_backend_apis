import { Router } from "express";
import PlantDiseaseController from "@/controllers/plant-disease.controller";

const plantDiseaseRouter = Router();

// Get plant disease data for dashboard
plantDiseaseRouter.get('/dashboard', PlantDiseaseController.getPlantDiseaseData);

// Get paginated plant disease data
plantDiseaseRouter.get('/get', PlantDiseaseController.viewPlantDisease);
plantDiseaseRouter.get('/export/excel', PlantDiseaseController.exportPlantDiseaseExcel);
plantDiseaseRouter.get('/export/pdf', PlantDiseaseController.exportPlantDiseasePdf);

export default plantDiseaseRouter;
