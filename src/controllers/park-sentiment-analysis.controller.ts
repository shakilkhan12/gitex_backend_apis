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

   public static updateParkSentimentAnalysis = async (req: Request<{ detection_Id: string }, {}, Partial<ParkSentimentAnalysisType>>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const { detection_Id } = req.params;
            const sentimentAnalysis = await ParkSentimentAnalysisService.updateParkSentimentAnalysisService(detection_Id, req.body)
            return res.status(STATUS.SUCCESS).json(sentimentAnalysis)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewParkSentimentAnalyses = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { page, limit, search, sortBy, sortOrder, fromDateTime, toDateTime, entryMood, exitMood, employee } = req.query;

         const filters = {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as string,
            fromDateTime: fromDateTime as string,
            toDateTime: toDateTime as string,
            entryMood: entryMood as string,
            exitMood: exitMood as string,
            employee: employee as string
         };

         const result = await ParkSentimentAnalysisService.viewParkSentimentAnalysesService(filters);

         // Handle both paginated and non-paginated responses
         if (result.pagination) {
            // Paginated response
            const response: any = {
               success: true,
               message: "Park sentiment analyses retrieved successfully",
               data: result.data,
               pagination: result.pagination
            };
            
            // Include stats if available
            if (result.stats) {
               response.stats = result.stats;
            }
            
            return res.status(STATUS.SUCCESS).json(response);
         } else {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json(result);
         }
      } catch (error) {
         next(error)
      }
   }
}

export default ParkSentimentAnalysisController; 