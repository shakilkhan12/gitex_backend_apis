import { UsersRolesService } from "@/services";
import { STATUS } from "@/typescript";
import { NextFunction, Request, Response } from "express";

class UsersRolesController extends UsersRolesService {
  // ✅ Get all roles with user counts
  public static getAllRolesWithUsers=async(req: Request, res: Response, next: NextFunction) =>{
    try {
      const result = await UsersRolesService.getAllRolesWithUserCounts();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ✅ Add new role
  public static addUserNewRole=async(req: Request, res: Response, next: NextFunction) =>{
    try {
      const { role_name, permissions } = req.body;

      if (!role_name) {
        return res.status(400).json({
          status: STATUS.BAD_REQUEST,
          message: "Role name is required",
        });
      }

      const result = await UsersRolesService.addUserRole({ role_name, permissions });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ✅ Update role
  public static updateUsersRole=async (req: Request, res: Response, next: NextFunction)=> {
    try {
      const roleId = Number(req.params.roleId);
      const { role_name, permissions } = req.body;

      if (isNaN(roleId)) {
        return res.status(400).json({
          status: STATUS.BAD_REQUEST,
          message: "Invalid role ID",
        });
      }

      const result = await UsersRolesService.updateUserRole(roleId, { role_name, permissions });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default UsersRolesController;
