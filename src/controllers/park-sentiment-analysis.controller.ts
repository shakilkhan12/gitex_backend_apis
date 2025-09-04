import { ParkSentimentAnalysisService } from "@/services";
import { ParkSentimentAnalysisType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class ParkSentimentAnalysisController extends ParkSentimentAnalysisService {
   public static addParkSentimentAnalysis = async (req: Request<{}, {}, ParkSentimentAnalysisType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const sentimentAnalysis = await ParkSentimentAnalysisService.addParkSentimentAnalysisService(req.body)
            return res.status(STATUS.CREATED).json(sentimentAnalysis)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewParkSentimentAnalyses = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const sentimentAnalyses = await ParkSentimentAnalysisService.viewParkSentimentAnalysesService();
         return res.status(STATUS.SUCCESS).json(sentimentAnalyses);
      } catch (error) {
         next(error)
      }
   }
}

export default ParkSentimentAnalysisController; 