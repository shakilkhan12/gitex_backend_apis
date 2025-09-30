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
         const allUsers = await UserService.getAllUsersWithRoleNestedService();
         return res.status(STATUS.SUCCESS).json(allUsers);
      } catch (error) {
         next(error);
      }
   }

   public static getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { user_Id } = req.body;
         
         console.log(`[UserController] getUserDetails called with user_Id: ${user_Id}`);
         
         if (!user_Id) {
            console.log(`[UserController] Missing user_Id in request body`);
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "user_Id is required" 
            });
         }

         const userDetails = await UserService.getUserDetailsByUserIdService(user_Id);
         console.log(`[UserController] Successfully retrieved user details for user_Id: ${user_Id}`);
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
}

export default UserController;
