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

   public static updateOfficeSentimentAnalysis = async (req: Request<{ detection_Id: string }, {}, Partial<OfficeSentimentAnalysisType>>, res: Response, next: NextFunction) => {
      const errors = validationResult(req)
      try {
         if (errors.isEmpty()) {
            const { detection_Id } = req.params;
            const sentimentAnalysis = await OfficeSentimentAnalysisService.updateOfficeSentimentAnalysisService(detection_Id, req.body)
            return res.status(STATUS.SUCCESS).json(sentimentAnalysis)
         } else {
            return res.status(STATUS.BAD_REQUEST).json({ errors: errors.array() });
         }
      } catch (error) {
         next(error)
      }
   }

   public static viewOfficeSentimentAnalyses = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { page, limit, search, sortBy, sortOrder, fromDateTime, toDateTime, entryMood, exitMood, employeeId, sentimentOf, gender } = req.query;

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
            employeeId: employeeId as string,
            sentimentOf: sentimentOf as string,
            gender: gender as string
         };

         const result = await OfficeSentimentAnalysisService.viewOfficeSentimentAnalysesService(filters);

         // Handle both paginated and non-paginated responses
         if (result.pagination) {
            // Paginated response
            const response: any = {
               success: true,
               message: "Office sentiment analyses retrieved successfully",
               data: result.data,
               pagination: result.pagination,
               stats: result.stats
            };
            
            return res.status(STATUS.SUCCESS).json(response);
         } else {
            // Non-paginated response (backward compatibility)
            return res.status(STATUS.SUCCESS).json(result);
         }
      } catch (error) {
         next(error)
      }
   }

   public static getOfficeSentimentAnalysisFilters = async (_req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await OfficeSentimentAnalysisService.getOfficeSentimentAnalysisFiltersService();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }
}

export default OfficeSentimentAnalysisController; 