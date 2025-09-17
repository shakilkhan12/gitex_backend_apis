import { BehaviorAlertsController } from "@/controllers";
import { behaviorAlertsValidations } from "@/validations";
import { Router } from "express";

const behaviorAlertsRouter = Router();

behaviorAlertsRouter.post('/add', behaviorAlertsValidations, BehaviorAlertsController.addBehaviorAlert)

behaviorAlertsRouter.get('/get', BehaviorAlertsController.viewBehaviorAlerts)

export default behaviorAlertsRouter; 