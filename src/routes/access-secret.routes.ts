import { AccessSecretController } from "@/controllers";
import { Router } from "express";

const accessSecretRouter = Router();

accessSecretRouter.post('/update', AccessSecretController.updateAccessSecret)

accessSecretRouter.post('/start-cron', AccessSecretController.startCronJob)

export default accessSecretRouter;
