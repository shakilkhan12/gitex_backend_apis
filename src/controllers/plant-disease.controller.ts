import { NextFunction, Request, Response } from "express";
import PlantDiseaseService from "@/services/plant-disease.service";
import { STATUS } from "@/typescript";

class PlantDiseaseController extends PlantDiseaseService {
    public static getPlantDiseaseData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await PlantDiseaseService.getPlantDiseaseDataService();
            
            return res.status(STATUS.SUCCESS).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export default PlantDiseaseController;
