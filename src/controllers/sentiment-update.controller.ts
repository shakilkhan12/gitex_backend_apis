import SentimentUpdateService from '@/services/sentiment-update.service'
import { STATUS } from '@/typescript'
import { NextFunction, Request, Response } from 'express'

class SentimentUpdateController {
  public static updateParksSentiment = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SentimentUpdateService.updateParksSentimentAnalysis()
      return res.status(STATUS.SUCCESS).json(result)
    } catch (error) {
      next(error)
    }
  }

  public static updateOfficesSentiment = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SentimentUpdateService.updateOfficesSentimentAnalysis()
      return res.status(STATUS.SUCCESS).json(result)
    } catch (error) {
      next(error)
    }
  }

  public static updateAllSentiment = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SentimentUpdateService.updateAllSentimentAnalysis()
      return res.status(STATUS.SUCCESS).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default SentimentUpdateController

