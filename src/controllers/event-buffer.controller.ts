import EventBufferService from "@/services/event-buffer.service";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class EventBufferController {
  public static getBufferStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const stats = EventBufferService.getBufferStats();

      return res.status(STATUS.SUCCESS).json({
        success: true,
        message: "Buffer statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  public static getEventBySrcIndex = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { srcIndex } = req.params;
      const { maxAge } = req.query; // Optional max age in seconds

      if (!srcIndex) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: "srcIndex is required",
        });
      }

      const maxAgeSeconds = maxAge ? parseInt(maxAge as string) : 3600;
      const event = EventBufferService.getLatestEventBySrcIndex(
        srcIndex,
        maxAgeSeconds
      );

      if (!event) {
        return res.status(STATUS.NOT_FOUND).json({
          success: false,
          message: `No recent event found for srcIndex: ${srcIndex}`,
        });
      }

      return res.status(STATUS.SUCCESS).json({
        success: true,
        message: "Event retrieved successfully",
        data: {
          srcIndex: event.srcIndex,
          srcName: event.srcName,
          eventType: event.eventType,
          timestamp: event.timestamp,
          receivedAt: event.receivedAt,
          ageSeconds: Math.round(
            (Date.now() - event.receivedAt.getTime()) / 1000
          ),
          data: event.data,
          fullPayload: event.fullPayload,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public static getAllEventsBySrcIndex = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { srcIndex } = req.params;
      const { maxAge } = req.query;

      if (!srcIndex) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: "srcIndex is required",
        });
      }

      const maxAgeSeconds = maxAge ? parseInt(maxAge as string) : 3600;
      const events = EventBufferService.getAllEventsBySrcIndex(
        srcIndex,
        maxAgeSeconds
      );

      return res.status(STATUS.SUCCESS).json({
        success: true,
        message: `Retrieved ${events.length} events for srcIndex: ${srcIndex}`,
        data: {
          count: events.length,
          events: events.map((event) => ({
            srcIndex: event.srcIndex,
            srcName: event.srcName,
            eventType: event.eventType,
            timestamp: event.timestamp,
            receivedAt: event.receivedAt,
            ageSeconds: Math.round(
              (Date.now() - event.receivedAt.getTime()) / 1000
            ),
            data: event.data,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public static clearBuffer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      EventBufferService.clearBuffer();

      return res.status(STATUS.SUCCESS).json({
        success: true,
        message: "Buffer cleared successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default EventBufferController;

