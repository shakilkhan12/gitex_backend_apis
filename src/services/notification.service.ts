import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

interface CreateNotificationData {
   type: string;
   title: string;
   description: string;
}

class NotificationService {
   public static createNotificationService = async (notificationData: CreateNotificationData) => {
      try {
         const notification = await db.notications.create({
            data: {
               type: notificationData.type,
               title: notificationData.title,
               description: notificationData.description,
               is_read: false,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });

         return notification;
      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to create notification");
      }
   }

   protected static getAllNotificationsService = async (paginationParams?: {
      page: number;
      limit: number;
      is_read?: boolean;
      type?: string;
   }) => {
      try {
         if (!paginationParams) {
            const notifications = await db.notications.findMany({
               orderBy: {
                  createdAt: 'desc'
               }
            });

            return notifications;
         }

         const whereClause: any = {};

         if (paginationParams.is_read !== undefined) {
            whereClause.is_read = paginationParams.is_read;
         }

         if (paginationParams.type) {
            whereClause.type = paginationParams.type;
         }

         const skip = (paginationParams.page - 1) * paginationParams.limit;
         const totalCount = await db.notications.count({ where: whereClause });

         const notifications = await db.notications.findMany({
            where: whereClause,
            orderBy: {
               createdAt: 'desc'
            },
            skip: skip,
            take: paginationParams.limit
         });

         const totalPages = Math.ceil(totalCount / paginationParams.limit);
         const hasNextPage = paginationParams.page < totalPages;
         const hasPreviousPage = paginationParams.page > 1;

         const unreadCount = await db.notications.count({
            where: { is_read: false }
         });

         return {
            data: notifications,
            pagination: {
               currentPage: paginationParams.page,
               totalPages,
               totalCount,
               limit: paginationParams.limit,
               hasNextPage,
               hasPreviousPage,
               nextPage: hasNextPage ? paginationParams.page + 1 : null,
               previousPage: hasPreviousPage ? paginationParams.page - 1 : null
            },
            unreadCount
         };
      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch notifications");
      }
   }

   protected static markAsReadService = async (notificationId: number) => {
      try {
         const notification = await db.notications.findUnique({
            where: { id: notificationId }
         });

         if (!notification) {
            throw new HttpException(STATUS.NOT_FOUND, "Notification not found");
         }

         const updatedNotification = await db.notications.update({
            where: { id: notificationId },
            data: {
               is_read: true,
               updatedAt: new Date()
            }
         });

         return updatedNotification;
      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to mark notification as read");
      }
   }

   protected static markAllAsReadService = async () => {
      try {
         const result = await db.notications.updateMany({
            where: { is_read: false },
            data: {
               is_read: true,
               updatedAt: new Date()
            }
         });

         return { count: result.count };
      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to mark all notifications as read");
      }
   }

   protected static deleteNotificationService = async (notificationId: number) => {
      try {
         const notification = await db.notications.findUnique({
            where: { id: notificationId }
         });

         if (!notification) {
            throw new HttpException(STATUS.NOT_FOUND, "Notification not found");
         }

         await db.notications.delete({
            where: { id: notificationId }
         });

         return { message: "Notification deleted successfully" };
      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to delete notification");
      }
   }

   protected static getUnreadCountService = async () => {
      try {
         const count = await db.notications.count({
            where: { is_read: false }
         });

         return { unreadCount: count };
      } catch (error: any) {
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to get unread count");
      }
   }
}

export default NotificationService;

