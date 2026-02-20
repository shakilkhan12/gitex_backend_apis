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
         const { page, limit, search, sortBy, sortOrder, department, employeeId, aiLogin, all } = req.query;
         
         const filters = {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc',
            department: department as string,
            employeeId: employeeId as string,
            aiLogin: aiLogin as string,
            all: all === 'true' // If all=true, skip pagination
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
         
         
         if (!emp_Id) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "emp_Id is required" 
            });
         }

         const userDetails = await UserService.getUserDetailsByUserIdService(emp_Id);
         return res.status(STATUS.SUCCESS).json(userDetails);
      } catch (error) {
        
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
        
        const result = await UserService.fetchAndStoreEmployeeListingService();
        
        const response = {
          success: true,
          message: result.message,
          data: result.summary
        };
        
        res.status(STATUS.SUCCESS).json(response);
        return;
      } catch (error) {
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

   public static getVisitors = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { page, limit, search, sortBy, sortOrder, gender } = req.query;
         
         const filters = {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc',
            gender: gender as string
         };

         const result = await UserService.getVisitorsService(filters);
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }

   public static deleteVisitorUser = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { userId } = req.body;
         if (!userId) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "User ID is required" 
            });
         }
         
         const userIdNumber = Number(userId);
         if (isNaN(userIdNumber)) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "Invalid User ID format" 
            });
         }
         
         const deleteResult = await UserService.deleteVisitorUserAndRecords(userIdNumber);
         return res.status(STATUS.SUCCESS).json(deleteResult);
      
      } catch (error) {
         next(error);
      }
   }

   public static switchVisitorToEmployee = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { visitorId, employeeId } = req.body;
         if (visitorId == null || employeeId == null) {
            return res.status(STATUS.BAD_REQUEST).json({
               error: "visitorId and employeeId are required"
            });
         }
         const visitorIdNum = Number(visitorId);
         const employeeIdNum = Number(employeeId);
         if (isNaN(visitorIdNum) || isNaN(employeeIdNum)) {
            return res.status(STATUS.BAD_REQUEST).json({
               error: "visitorId and employeeId must be valid numbers"
            });
         }
         const result = await UserService.switchVisitorToEmployeeService(visitorIdNum, employeeIdNum);
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }

   public static fetchAndStoreEmployeeListingWithProgress = async (req: Request, res: Response, next: NextFunction) => {
      try {
         res.setHeader('Content-Type', 'text/event-stream');
         res.setHeader('Cache-Control', 'no-cache');
         res.setHeader('Connection', 'keep-alive');
         res.setHeader('X-Accel-Buffering', 'no');

         res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connection established' })}\n\n`);
         
         if (typeof (res as any).flush === 'function') {
            (res as any).flush();
         }

         res.write(`data: ${JSON.stringify({ type: 'status', message: 'Fetching authentication...', current: 0, total: 0 })}\n\n`);
         
         if (typeof (res as any).flush === 'function') {
            (res as any).flush();
         }

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
               if (typeof (res as any).flush === 'function') {
                  (res as any).flush();
               }
            } catch (error) {
            }
         };

         const onStatus = (status: { message: string; current?: number; total?: number }) => {
            try {
               const statusData = {
                  type: 'status',
                  message: status.message,
                  current: status.current || 0,
                  total: status.total || 0
               };
               res.write(`data: ${JSON.stringify(statusData)}\n\n`);
               if (typeof (res as any).flush === 'function') {
                  (res as any).flush();
               }
            } catch (error) {
            }
         };

         UserService.fetchAndStoreEmployeeListingServiceWithProgress(onProgress, onStatus)
            .then((result) => {
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
               const errorData = {
                  type: 'error',
                  success: false,
                  message: error instanceof Error ? error.message : 'Failed to sync employees'
               };
               res.write(`data: ${JSON.stringify(errorData)}\n\n`);
               res.end();
            });
      } catch (error) {
         next(error);
      }
   }

   public static syncUsersWithoutUniqueIdToHikVision = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await UserService.syncUsersWithoutUniqueIdToHikVisionService();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }

   public static updateUserImageOnHikVision = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { empId } = req.body;
         
         if (!empId) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "empId is required" 
            });
         }

         const result = await UserService.updateUserImageOnHikVisionService(empId);
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }

   public static uploadAllUsersWithEmpIdToHikVision = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const result = await UserService.uploadAllUsersWithEmpIdToHikVisionService();
         return res.status(STATUS.SUCCESS).json(result);
      } catch (error) {
         next(error);
      }
   }
}

export default UserController;
