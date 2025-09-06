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
}

export default UserController;
