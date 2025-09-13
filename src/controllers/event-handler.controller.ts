import { EventHandlerService } from "@/services";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class EventHandlerController extends EventHandlerService {
   
   public static handleEvent = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const eventData = req.body;
         
         if (!eventData || Object.keys(eventData).length === 0) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "Event data is required" 
            });
         }

         const result = await EventHandlerService.handleEventService(eventData);
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }

}

export default EventHandlerController;
