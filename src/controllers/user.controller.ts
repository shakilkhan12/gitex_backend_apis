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
         
         if (!user_Id) {
            return res.status(STATUS.BAD_REQUEST).json({ 
               error: "user_Id is required" 
            });
         }

         const userDetails = await UserService.getUserDetailsByUserIdService(user_Id);
         return res.status(STATUS.SUCCESS).json(userDetails);
      } catch (error) {
         next(error);
      }
   }

   
   public static updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number(req.params.userId);
        const { roleId } = req.body;
    
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
    
        const response = await UserService.updateUserRoleService(userId, Number(roleId));
        return res.status(STATUS.SUCCESS).json(response);
      } catch (error) {
        next(error);
      }
    }

    public static fetchAndStoreEmployeeListing = async (req: Request, res: Response, next: NextFunction) => {
      try {
        
        const result = await UserService.fetchAndStoreEmployeeListingService();
        
        return res.status(STATUS.SUCCESS).json({
          success: true,
          message: result.message,
          data: result.summary
        });
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
}

export default UserController;
