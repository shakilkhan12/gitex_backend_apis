import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";

class UserRolesService {
  // Define valid permission fields based on the database schema
  private static readonly VALID_PERMISSION_FIELDS = [
    'dashboard_view',
    'role_permission_view', 'role_permission_add', 'role_permission_update',
    'offices_view', 'offices_add', 'offices_update',
    'parks_view', 'parks_add', 'parks_update',
    'system_report_view',
    'alerts_view',
    'office_attendance_view', 'office_attendance_add', 'office_attendance_update',
    'office_footfall_view', 'office_footfall_add', 'office_footfall_update',
    'office_sentimental_view', 'office_sentimental_add', 'office_sentimental_update',
    'park_attendance_view', 'park_attendance_add', 'park_attendance_update',
    'park_footfall_view', 'park_footfall_add', 'park_footfall_update',
    'park_sentimental_view', 'park_sentimental_add', 'park_sentimental_update',
    'park_irrigation_view', 'park_irrigation_add', 'park_irrigation_update',
    'park_landscaping_view', 'park_landscaping_add', 'park_landscaping_update',
    'park_litter_detection_view', 'park_litter_detection_add', 'park_litter_detection_update',
    'park_intrusion_detection_view', 'park_intrusion_detection_add', 'park_intrusion_detection_update',
    'park_smoking_detection_view', 'park_smoking_detection_add', 'park_smoking_detection_update',
    'my_account_view',
    'settings_view'
  ];

  // Helper method to filter permissions to only include valid fields
  private static filterValidPermissions(permissions: any): any {
    if (!permissions) return undefined;
    
    return Object.keys(permissions)
      .filter(key => this.VALID_PERMISSION_FIELDS.includes(key))
      .reduce((obj, key) => {
        obj[key] = permissions[key];
        return obj;
      }, {} as any);
  }

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
      // Filter permissions to only include valid fields
      const filteredPermissions = this.filterValidPermissions(roleData.permissions);

      const newRole = await db.users_roles.create({
        data: {
          role_name: roleData.role_name,
          users_permissions: filteredPermissions
            ? {
                create: filteredPermissions,
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
  
      // Filter permissions to only include valid fields
      const filteredPermissions = this.filterValidPermissions(permissionsWithoutId);
  
      console.log('Filtered permissions:', filteredPermissions);
  
      const updatedRole = await db.users_roles.update({
        where: { Id: roleId },
        data: {
          role_name: updateData.role_name,
          updatedAt: new Date(),
          users_permissions: updateData.permissions && permissionId
            ? {
                update: {
                  where: { Id: permissionId },
                  data: filteredPermissions, // Use filtered data without invalid fields
                },
              }
            : updateData.permissions && !permissionId
            ? {
                create: filteredPermissions, // Create new permissions with only valid fields
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
