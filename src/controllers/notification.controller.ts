import { NotificationService } from "@/services";
import SocketService from "@/services/socket.service";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class NotificationController extends NotificationService {
   public static createNotification = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { type, title, description } = req.body;

         if (!type || !title || !description) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "type, title, and description are required"
            });
         }

         const notification = await NotificationService.createNotificationService({
            type,
            title,
            description
         });

         // Emit notification via socket for real-time updates
         SocketService.emitNotificationUpdate({
            type: 'new_notification',
            data: notification
         });

         return res.status(STATUS.CREATED).json({
            success: true,
            message: "Notification created successfully",
            data: notification
         });
      } catch (error) {
         next(error);
      }
   }

   public static getAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const page = parseInt(req.query.page as string) || 1;
         const limit = parseInt(req.query.limit as string) || 10;
         const is_read = req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined;
         const type = req.query.type as string || undefined;

         const result = await NotificationService.getAllNotificationsService({
            page,
            limit,
            is_read,
            type
         });

         if (Array.isArray(result)) {
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Notifications retrieved successfully",
               data: result
            });
         } else {
            return res.status(STATUS.SUCCESS).json({
               success: true,
               message: "Notifications retrieved successfully",
               data: result.data,
               pagination: result.pagination,
               unreadCount: result.unreadCount
            });
         }
      } catch (error) {
         next(error);
      }
   }

   public static markAsRead = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { id } = req.params;

         if (!id) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "Notification ID is required"
            });
         }

         const notification = await NotificationService.markAsReadService(Number(id));

         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Notification marked as read",
            data: notification
         });
      } catch (error) {
         next(error);
      }
   }

   public static markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await NotificationService.markAllAsReadService();

         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "All notifications marked as read",
            data: result
         });
      } catch (error) {
         next(error);
      }
   }

   public static deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { id } = req.params;

         if (!id) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "Notification ID is required"
            });
         }

         const result = await NotificationService.deleteNotificationService(Number(id));

         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: result.message,
            data: result
         });
      } catch (error) {
         next(error);
      }
   }

   public static getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await NotificationService.getUnreadCountService();

         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: "Unread count retrieved successfully",
            data: result
         });
      } catch (error) {
         next(error);
      }
   }

   public static createTestNotification = async (req: Request, res: Response, next: NextFunction) => {
      try {
         // Generate dummy notification data
         const types = ['litter_detection', 'smoking_detection', 'intrusion_detection', 'behavior_alert'];
         const titles = [
            'New Litter Detection',
            'New Smoking Detection',
            'Intrusion Alert',
            'Behavior Alert'
         ];
         const descriptions = [
            'Litter detected at Central Park. Case ID: TEST-001',
            'Smoking activity detected at Playground Area. Detection ID: SMOKE-001',
            'Unauthorized access detected at Main Gate. Detection ID: INTR-001',
            'Suspicious behavior detected at Parking Lot. Alert ID: BEHAV-001'
         ];

         const randomIndex = Math.floor(Math.random() * types.length);
         const type = req.body.type || types[randomIndex];
         const title = req.body.title || titles[randomIndex];
         const description = req.body.description || descriptions[randomIndex];

         const notification = await NotificationService.createNotificationService({
            type,
            title,
            description
         });

         // Emit notification via socket for real-time updates
         SocketService.emitNotificationUpdate({
            type: 'new_notification',
            data: notification
         });

         return res.status(STATUS.CREATED).json({
            success: true,
            message: "Test notification created and emitted successfully",
            data: notification
         });
      } catch (error) {
         next(error);
      }
   }
}

export default NotificationController;

