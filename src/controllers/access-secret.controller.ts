import { AccessSecretService } from "@/services";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class AccessSecretController {
   public static updateAccessSecret = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await AccessSecretService.updateAccessSecret();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }

   public static startCronJob = async (req: Request, res: Response, next: NextFunction) => {
      try {
         AccessSecretService.startCronJob();
         return res.status(STATUS.SUCCESS).json({ message: "Cron job started successfully" });
      } catch (error) {
         next(error);
      }
   }
}

export default AccessSecretController;
