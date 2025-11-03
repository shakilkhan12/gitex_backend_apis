import { UserService } from "@/services";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class UserController extends UserService {
   public static login = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { EmpCode, Password } = req.body;
         
         if (!EmpCode || !Password) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "EmpCode and Password are required" 
            });
         }

         const loginResult = await UserService.loginService(EmpCode, Password);
         return res.status(STATUS.SUCCESS).json(loginResult);
      } catch (error) {
         next(error);
      }
   }

   public static getUsers = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { page, limit, search, sortBy, sortOrder, department, employeeId, aiLogin } = req.query;
         
         const filters = {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc',
            department: department as string,
            employeeId: employeeId as string,
            aiLogin: aiLogin as string
         };

         const result = await UserService.getAllUsersWithRoleNestedService(filters);
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }

   public static getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { emp_Id } = req.body;
         
         console.log(`[UserController] getUserDetails called with user_Id: ${emp_Id}`);
         
         if (!emp_Id) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "emp_Id is required" 
            });
         }

         const userDetails = await UserService.getUserDetailsByUserIdService(emp_Id);
         return res.status(STATUS.SUCCESS).json(userDetails);
      } catch (error) {
         console.error(`[UserController] Error in getUserDetails:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            user_Id: req.body?.user_Id
         });
         next(error);
      }
   }

   
   public static updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number(req.params.userId);
        const { 
          roleId, 
          landscapingAccess, 
          plantDiseaseAccess, 
          litterDetectionAccess 
        } = req.body;
    
        if (isNaN(userId)) {
          return res.status(STATUS.BAD_REQUEST).json({
            status: STATUS.BAD_REQUEST,
            message: "Invalid user ID"
          });
        }
    
        if (!roleId || isNaN(Number(roleId))) {
          return res.status(STATUS.BAD_REQUEST).json({
            status: STATUS.BAD_REQUEST,
            message: "Invalid role ID"
          });
        }

        // Prepare supervisor access data
        const supervisorAccess = {
          landscapingAccess: landscapingAccess !== undefined ? Boolean(landscapingAccess) : undefined,
          plantDiseaseAccess: plantDiseaseAccess !== undefined ? Boolean(plantDiseaseAccess) : undefined,
          litterDetectionAccess: litterDetectionAccess !== undefined ? Boolean(litterDetectionAccess) : undefined
        };
    
        const response = await UserService.updateUserRoleService(userId, Number(roleId), supervisorAccess);
        return res.status(STATUS.SUCCESS).json(response);
      } catch (error) {
        next(error);
      }
    }

    public static fetchAndStoreEmployeeListing = async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log('[UserController] Starting fetchAndStoreEmployeeListing');
        
        const result = await UserService.fetchAndStoreEmployeeListingService();
        console.log('[UserController] Service result received:', result);
        
        const response = {
          success: true,
          message: result.message,
          data: result.summary
        };
        
        console.log('[UserController] Sending response:', response);
        res.status(STATUS.SUCCESS).json(response);
        console.log('[UserController] Response sent successfully');
        return;
      } catch (error) {
        console.error('[UserController] Error in fetchAndStoreEmployeeListing:', error);
        next(error);
      }
    }

    public static addUser = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userData = req.body;
        
        const result = await UserService.addUserService(userData);
        
        return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
        next(error);
      }
   }

    public static getUsersFilters = async (_req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await UserService.getUsersFiltersService();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }

   public static fetchAndStoreEmployeeListingWithProgress = async (req: Request, res: Response, next: NextFunction) => {
      try {
         // Set headers for SSE
         res.setHeader('Content-Type', 'text/event-stream');
         res.setHeader('Cache-Control', 'no-cache');
         res.setHeader('Connection', 'keep-alive');
         res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

         // Send initial connection message immediately
         res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connection established' })}\n\n`);
         
         // Force flush to send data immediately (if available)
         if (typeof (res as any).flush === 'function') {
            (res as any).flush();
         }

         // Send status update - fetching secret key
         res.write(`data: ${JSON.stringify({ type: 'status', message: 'Fetching authentication...', current: 0, total: 0 })}\n\n`);
         
         // Force flush again
         if (typeof (res as any).flush === 'function') {
            (res as any).flush();
         }

         // Progress callback function
         const onProgress = (progress: { current: number; total: number; processed: number; errors: number }) => {
            try {
               const progressData = {
                  type: 'progress',
                  current: progress.current,
                  total: progress.total,
                  processed: progress.processed,
                  errors: progress.errors,
                  message: `${progress.processed}/${progress.total} employees synced`
               };
               res.write(`data: ${JSON.stringify(progressData)}\n\n`);
               // Force flush for immediate delivery
               if (typeof (res as any).flush === 'function') {
                  (res as any).flush();
               }
            } catch (error) {
               console.error('[UserController] Error sending progress update:', error);
            }
         };

         // Status callback for intermediate steps
         const onStatus = (status: { message: string; current?: number; total?: number }) => {
            try {
               const statusData = {
                  type: 'status',
                  message: status.message,
                  current: status.current || 0,
                  total: status.total || 0
               };
               res.write(`data: ${JSON.stringify(statusData)}\n\n`);
               // Force flush for immediate delivery
               if (typeof (res as any).flush === 'function') {
                  (res as any).flush();
               }
            } catch (error) {
               console.error('[UserController] Error sending status update:', error);
            }
         };

         // Execute the service with progress callback
         UserService.fetchAndStoreEmployeeListingServiceWithProgress(onProgress, onStatus)
            .then((result) => {
               // Send completion message
               const completionData = {
                  type: 'complete',
                  success: true,
                  message: result.message,
                  data: result.summary
               };
               res.write(`data: ${JSON.stringify(completionData)}\n\n`);
               res.end();
            })
            .catch((error) => {
               // Send error message
               const errorData = {
                  type: 'error',
                  success: false,
                  message: error instanceof Error ? error.message : 'Failed to sync employees'
               };
               res.write(`data: ${JSON.stringify(errorData)}\n\n`);
               res.end();
            });
      } catch (error) {
         console.error('[UserController] Error in fetchAndStoreEmployeeListingWithProgress:', error);
         next(error);
      }
   }
}

export default UserController;
