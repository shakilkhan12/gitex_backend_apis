import { EventHandlerController } from "@/controllers";
import { Router } from "express";

const eventHandlerRouter = Router();

eventHandlerRouter.post('/handle', EventHandlerController.handleEvent)

export default eventHandlerRouter;
