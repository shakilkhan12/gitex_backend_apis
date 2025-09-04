import { OfficeSentimentAnalysisService } from "@/services";
import { OfficeSentimentAnalysisType, STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class OfficeSentimentAnalysisController extends OfficeSentimentAnalysisService {
   public static addOfficeSentimentAnalysis = async (req: Request<{}, {}, OfficeSentimentAnalysisType>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const sentimentAnalysis = await OfficeSentimentAnalysisService.addOfficeSentimentAnalysisService(req.body)
            return res.status(STATUS.CREATED).json(sentimentAnalysis)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewOfficeSentimentAnalyses = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const sentimentAnalyses = await OfficeSentimentAnalysisService.viewOfficeSentimentAnalysesService();
         return res.status(STATUS.SUCCESS).json(sentimentAnalyses);
      } catch (error) {
         next(error)
      }
   }
}

export default OfficeSentimentAnalysisController; 