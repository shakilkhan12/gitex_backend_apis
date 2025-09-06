import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class UserRolesService {
  protected static getAllRolesWithUserCounts=async () =>{
    try {
      const roles = await db.users_roles.findMany({
        include: {
            users_permissions:true,
          _count: {
            select: { users: true },
          },
        },
      });

      return {
        status: STATUS.SUCCESS,
        data: roles.map((role) => ({
          id: role.Id,
          role_name: role.role_name,
          users_permissions:role.users_permissions,
          total_users: role._count.users,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        })),
      };
    } catch (error: any) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        error.message || "Failed to fetch roles with user counts"
      );
    }
  }

   // ✅ Add new user role (with optional permissions)
   protected static addUserRole=async (roleData: { role_name: string; permissions?: any })=> {
    try {
      const newRole = await db.users_roles.create({
        data: {
          role_name: roleData.role_name,
          users_permissions: roleData.permissions
            ? {
                create: roleData.permissions,
              }
            : undefined,
        },
        include: {
          users_permissions: true,
        },
      });

      return {
        status: STATUS.SUCCESS,
        data: newRole,
        message: "Role created successfully",
      };
    } catch (error: any) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        error.message || "Failed to create role"
      );
    }
  }

  // ✅ Update existing user role (and permissions if provided)
  protected static updateUserRole = async (
    roleId: number,
    updateData: { role_name?: string; permissions?: any }
  ) => {
    try {
      console.log('roleId', roleId);
      console.log('updateData', updateData);
  
      // Extract permission ID and remove it from the update data
      const permissionId = updateData.permissions?.Id;
      const { Id, ...permissionsWithoutId } = updateData.permissions || {};
  
      const updatedRole = await db.users_roles.update({
        where: { Id: roleId },
        data: {
          role_name: updateData.role_name,
          updatedAt: new Date(),
          users_permissions: updateData.permissions && permissionId
            ? {
                update: {
                  where: { Id: permissionId },
                  data: permissionsWithoutId, // Use data without the Id field
                },
              }
            : updateData.permissions && !permissionId
            ? {
                create: permissionsWithoutId, // Create new permissions if no ID exists
              }
            : undefined,
        },
        include: {
          users_permissions: true,
        },
      });
  
      return {
        status: STATUS.SUCCESS,
        data: updatedRole,
        message: "Role updated successfully",
      };
    } catch (error: any) {
      console.error('Update role error details:', error);
      throw new HttpException(
        STATUS.BAD_REQUEST,
        error.message || "Failed to update role"
      );
    }
  }
}

export default UserRolesService;
