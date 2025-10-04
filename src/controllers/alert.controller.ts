import AlertService from "@/services/alert.service";
import { STATUS } from "@/typescript/enums/httpsStatus";
import { HttpException } from "@/utils/HttpException.utils";
import { Request, Response } from "express";

class AlertController {
  public static getAlertData = async (req: Request, res: Response) => {
    const { range } = req.query as { range: string };
    try {
      const alertData = await AlertService.getAlertData(range);
      return res.status(STATUS.SUCCESS).json(alertData);
    } catch (error: any) {
      throw new HttpException(STATUS.BAD_REQUEST, error.message);
    }
  };
}

export default AlertController;
