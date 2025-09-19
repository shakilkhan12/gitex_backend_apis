import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import axios from "axios";
import https from "https";
import { UserType } from "@/typescript/interfaces";

class UserService {

   protected static loginService = async (EmpCode: string, Password: string) => {
   
      try {
         const secretKey = await this.fetchSecretFromAPI();
         console.log('secretKey',secretKey)
         const payload = {
            EmpCode,
            Password,
            SecretKey: `${secretKey}`,
            Lang: "en"
         };
   
         const response = await axios.post(
            "https://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeLoginService",
            payload,
            {
               headers: { "Content-Type": "application/json" },
               timeout: 30000, // 30 seconds timeout (increased to accommodate secret key retries)
               httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            }
         );
   
   
         if (response.data.status !== 'SUCCESS' || response.data.code !== 200) {
            throw new HttpException(STATUS.BAD_REQUEST, response.data.error?.msg || "Login failed");
         }
   
         const userId = response.data.data.UserID;
   
         try {
            const user = await db.users.findFirst({
               where: {
                  user_Id: userId
               }
            });
   
            if (user) {
               const updatedUser = await db.users.update({
                  where: {
                     Id: user.Id
                  },
                  data: {
                     last_login: new Date()
                  }
               });
   
            }
         } catch (dbError) {
            
         }
   
         return response.data;
   
      } catch (error: any) {
         
         if (error instanceof HttpException) {
            throw error;
         }
         
         if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
               throw new HttpException(STATUS.BAD_REQUEST, "Login request timed out - please try again");
            } else if (error.code === 'ECONNREFUSED') {
               throw new HttpException(STATUS.BAD_REQUEST, "Unable to connect to login service");
            } else if (error.response) {
               throw new HttpException(STATUS.BAD_REQUEST, `Login service error: ${error.response.status} - ${error.response.statusText}`);
            }
         }
         
         throw new HttpException(STATUS.BAD_REQUEST, `Login failed: ${error.message}`);
      }
   }


   protected static getAllUsersWithRoleNestedService = async () => {

      try {
         const users = await db.users.findMany({
            select: {
               Id: true,
               emp_Id: true,
               gender: true,
               image:true,
               emp__eng_name: true,
               emp__arabic_name: true,
               country_code: true,
               phone: true,
               email: true,
               dep_eng_name: true,
               dep_arabic_name: true,
               desig_eng_name: true,
               desig_arabic_name: true,
               unit_eng_name: true,
               unit_arabic_name: true,
               committe_eng_name: true,
               committe_arabic_name: true,
               ai_engine_access: true,
               last_login: true,
               createdAt: true,
               updatedAt: true,
               users_roles: {
                  select: {
                     role_name: true
                  }
               },
               live_stream_favourites: false,
               parks_attendance: false,
               offices_attendance: false,
               offices_footfall_analysis: false
            },
            orderBy: {
               emp__eng_name: 'asc'
            }
         })
         return users;

      } catch (error: any) {
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch users");
      }
   }

   protected static getUserDetailsByUserIdService = async (user_Id: string) => {
      try {
         const user = await db.users.findFirst({
            where: {
               user_Id: user_Id
            },
            select: {
               Id: true,
               emp_Id: true,
               gender: true,
               image: true,
               emp__eng_name: true,
               emp__arabic_name: true,
               country_code: true,
               phone: true,
               email: true,
               dep_eng_name: true,
               dep_arabic_name: true,
               desig_eng_name: true,
               desig_arabic_name: true,
               unit_eng_name: true,
               unit_arabic_name: true,
               committe_eng_name: true,
               committe_arabic_name: true,
               ai_engine_access: true,
               last_login: true,
               createdAt: true,
               updatedAt: true,
               users_roles: {
                  select: {
                     role_name: true,
                     users_permissions: {
                        select: {
                           dashboard_view: true,
                           role_permission_view: true,
                           role_permission_add: true,
                           role_permission_update: true,
                           offices_view: true,
                           offices_add: true,
                           offices_update: true,
                           parks_view: true,
                           parks_add: true,
                           parks_update: true,
                           system_report_view: true,
                           alerts_view: true,
                           office_attendance_view: true,
                           office_attendance_add: true,
                           office_attendance_update: true,
                           office_footfall_view: true,
                           office_footfall_add: true,
                           office_footfall_update: true,
                           office_sentimental_view: true,
                           office_sentimental_add: true,
                           office_sentimental_update: true,
                           park_attendance_view: true,
                           park_attendance_add: true,
                           park_attendance_update: true,
                           park_footfall_view: true,
                           park_footfall_add: true,
                           park_footfall_update: true,
                           park_sentimental_view: true,
                           park_sentimental_add: true,
                           park_sentimental_update: true,
                           park_irrigation_view: true,
                           park_irrigation_add: true,
                           park_irrigation_update: true,
                           park_landscaping_view: true,
                           park_landscaping_add: true,
                           park_landscaping_update: true,
                           park_litter_detection_view: true,
                           park_litter_detection_add: true,
                           park_litter_detection_update: true,
                           park_intrusion_detection_view: true,
                           park_intrusion_detection_add: true,
                           park_intrusion_detection_update: true,
                           park_smoking_detection_view: true,
                           park_smoking_detection_add: true,
                           park_smoking_detection_update: true,
                           my_account_view: true,
                           settings_view: true
                        }
                     }
                  }
               },
               live_stream_favourites: false,
               parks_attendance: false,
               offices_attendance: false,
               offices_footfall_analysis: false
            }
         });

         if (!user) {
            throw new HttpException(STATUS.NOT_FOUND, "User not found");
         }

         return user;

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch user details");
      }
   }

   protected static updateUserRoleService = async (userId: number, roleId: number) => {

      try {
         const roleExists = await db.users_roles.findUnique({
            where: { Id: roleId }
         });

         if (!roleExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "Role not found");
         }

         const userExists = await db.users.findUnique({
            where: { Id: userId }
         });

         if (!userExists) {
            throw new HttpException(STATUS.BAD_REQUEST, "User not found");
         }

         const updatedUser = await db.users.update({
            where: { Id: userId },
            data: {
               role_Id: roleId,
               updatedAt: new Date()
            },
            include: {
               users_roles: {
                  select: {
                     role_name: true
                  }
               }
            }
         });

         
         return {
            status: STATUS.SUCCESS,
            data: updatedUser,
            message: "User role updated successfully"
         };

      } catch (error: any) {
         
         if (error instanceof HttpException) {
            throw error;
         }
         
         throw new HttpException(
            STATUS.BAD_REQUEST,
            error.message || "Failed to update user role"
         );
      }
   }

   private static async fetchSecretFromAPI(): Promise<string> {
      const maxRetries = 3;
      const baseTimeout = 20000; // 20 seconds base timeout
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
            const response = await axios.post(
               "https://192.168.164.7/middleware/?action=Secretkey&class=general",
               {
                  Username: "WebServiceUser",
                  Pwd: "A01834h123ds2",
               },
               {
                  headers: { "Content-Type": "application/json" },
                  timeout: baseTimeout * attempt, // Progressive timeout: 20s, 40s, 60s
                  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
               }
            );
            
            if (response.data?.SecretKey) {
               return response.data.SecretKey;
            }

            throw new HttpException(
               STATUS.BAD_REQUEST,
               "Secret key not found in API response"
            );
         } catch (error: any) {
            
            if (axios.isAxiosError(error)) {
               if (error.code === 'ECONNABORTED') {
                  if (attempt === maxRetries) {
                     throw new HttpException(STATUS.BAD_REQUEST, `Secret key API request timed out after ${maxRetries} attempts`);
                  }
                  continue; // Retry on timeout
               } else if (error.code === 'ECONNREFUSED') {
                  throw new HttpException(STATUS.BAD_REQUEST, "Unable to connect to secret key API");
               } else if (error.response) {
                  throw new HttpException(STATUS.BAD_REQUEST, `Secret key API error: ${error.response.status} - ${error.response.statusText}`);
               }
            }
            
            if (attempt === maxRetries) {
               throw new HttpException(
                  STATUS.BAD_REQUEST,
                  `Failed to fetch secret from API after ${maxRetries} attempts: ${error.message}`
               );
            }
            
            const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            await new Promise(resolve => setTimeout(resolve, waitTime));
         }
      }
      
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch secret key after all retry attempts");
   }

   public static fetchAndStoreEmployeeListingService = async () => {
      
      try {
         const secretKey = await this.fetchSecretFromAPI();

         const payload = {
            SecretKey: `${secretKey}`,
            Lang: "en"
         };

         const response = await axios.post(
            "https://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeListingGet",
            payload,
            {
               headers: {
                  'Content-Type': 'application/json',
               },
               timeout: 30000, // 30 seconds timeout
               httpsAgent: new https.Agent({
               })
            }
         )

         if (!response.data?.data?.UserListing || !Array.isArray(response.data.data.UserListing)) {
            if (response.data?.error) {
               throw new HttpException(STATUS.BAD_REQUEST, `API Error: ${response.data.error}`);
            }
            
            throw new HttpException(STATUS.BAD_REQUEST, "Invalid response format from third-party API");
         }

         const userListing = response.data.data.UserListing;

         let successCount = 0;
         let errorCount = 0;

         for (const userData of userListing) {
            try {
               const existingUser = await db.users.findFirst({
                  where: { user_Id: userData.UserID }
               });

               const userDataToProcess: UserType = {
                  user_Id: userData.UserID,
                  emp_Id: userData.EmpCode,
                  emp_code: userData.EmpCode,
                  image: userData.Image,
                  gender: userData.Gender,
                  emp__eng_name: userData.Name,
                  location: userData.Location,
                  telephone: userData.Telephone,
                  email: userData.Email,
                  office_extension: userData.OfficeExtension,
                  nationality: userData.Nationality,
                  joining_date: userData.JoiningDate ? new Date(userData.JoiningDate) : undefined,
                  date_of_birth: userData.DateOfBirth ? new Date(userData.DateOfBirth) : undefined,
                  dep_eng_name: userData.Department,
                  desig_eng_name: userData.Designation,
                  unit_arabic_name: userData.Unit,
                  is_attendance_user: userData.IsAttendenceUser === "Y",
                  is_ai_login_user: userData.IsAILoginUser === "Y",
                  ai_engine_access: existingUser?.ai_engine_access || false, // Keep existing value or default
                  updatedAt: new Date()
               };

               if (existingUser) {
                  await db.users.update({
                     where: { Id: existingUser.Id },
                     data: userDataToProcess
                  });

                  successCount++;
               } else {
                  await db.users.create({
                     data: {
                        ...userDataToProcess,
                        createdAt: new Date()
                     }
                  });

                  successCount++;
               }

            } catch (userError) {
               errorCount++;
            }
         }

         const summary = {
            total: userListing.length,
            processed: successCount,
            errors: errorCount
         };

         return {
            message: "Employee listing fetch and store completed - existing users updated, new users created",
            summary
         };

      } catch (error) {
         
         if (error instanceof HttpException) {
            throw error;
         }
         
         if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
               throw new HttpException(STATUS.BAD_REQUEST, "Unable to connect to third-party API");
            } else if (error.response) {
               throw new HttpException(STATUS.BAD_REQUEST, `Third-party API error: ${error.response.status} - ${error.response.statusText}`);
            } else if (error.request) {
               throw new HttpException(STATUS.BAD_REQUEST, "No response received from third-party API");
            }
         }
         
         throw new HttpException(
            STATUS.BAD_REQUEST,
            (error as Error).message || "Failed to fetch and store employee listing"
         );
      }
   }

}

export default UserService;
