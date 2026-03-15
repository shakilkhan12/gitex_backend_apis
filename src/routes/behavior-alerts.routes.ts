import { BehaviorAlertsController } from "@/controllers";
import { behaviorAlertsValidations } from "@/validations";
import { Router } from "express";

const behaviorAlertsRouter = Router();

behaviorAlertsRouter.post('/add', behaviorAlertsValidations, BehaviorAlertsController.addBehaviorAlert)

behaviorAlertsRouter.get('/filters', BehaviorAlertsController.getBehaviorAlertsFilters)
behaviorAlertsRouter.get('/get', BehaviorAlertsController.viewBehaviorAlerts)
behaviorAlertsRouter.get('/export/excel', BehaviorAlertsController.exportBehaviorAlertsExcel)
behaviorAlertsRouter.get('/export/pdf', BehaviorAlertsController.exportBehaviorAlertsPdf)

export default behaviorAlertsRouter; 