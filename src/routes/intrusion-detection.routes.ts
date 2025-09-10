import { IntrusionDetectionController } from "@/controllers";
import { intrusionDetectionValidations } from "@/validations";
import { Router } from "express";

const intrusionDetectionRouter = Router();

intrusionDetectionRouter.post('/add', intrusionDetectionValidations, IntrusionDetectionController.addIntrusionDetection)

intrusionDetectionRouter.get('/get', IntrusionDetectionController.viewIntrusionDetections)

intrusionDetectionRouter.get('/get/:id', IntrusionDetectionController.getIntrusionDetectionById)

intrusionDetectionRouter.put('/update/:id', IntrusionDetectionController.updateIntrusionDetection)

export default intrusionDetectionRouter;
