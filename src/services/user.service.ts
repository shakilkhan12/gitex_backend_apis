import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import axios from "axios";
import https from "https";
import { UserType, AddUserType } from "@/typescript/interfaces";

import fetch from "node-fetch";


export async function urlToBase64(url: string): Promise<string | string> {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false }); // ✅ Ignore SSL errors
    const options: any = { agent };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    console.log("\n✅ BASE64 OUTPUT:\n");
   //  console.log(base64);

    return base64;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
    }
    return "";
  }
}

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
            where:{
               user_Id: {
                  not: null
               }
            },
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
               landscaping_access: true,
               plant_disease_access: true,
               litter_detection_access: true,
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
         console.log(`[UserService] Starting getUserDetailsByUserIdService for user_Id: ${user_Id}`);
         
         // First, get the basic user information
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
               role_Id: true,
               landscaping_access: true,
               plant_disease_access: true,
               litter_detection_access: true
            }
         });

         console.log(`[UserService] Basic user query completed for user_Id: ${user_Id}`);

         if (!user) {
            console.log(`[UserService] User not found for user_Id: ${user_Id}`);
            throw new HttpException(STATUS.NOT_FOUND, "User not found");
         }

         // If user has a role, fetch role and permissions separately
         let users_roles = null;
         if (user.role_Id) {
            console.log(`[UserService] Fetching role and permissions for role_Id: ${user.role_Id}`);
            
            users_roles = await db.users_roles.findUnique({
               where: {
                  Id: user.role_Id
               },
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
            });
            
            console.log(`[UserService] Role and permissions query completed for role_Id: ${user.role_Id}`);
         }

         // Remove role_Id from the response and add users_roles
         const { role_Id, ...userWithoutRoleId } = user;
         const result = {
            ...userWithoutRoleId,
            users_roles
         };

         console.log(`[UserService] Successfully retrieved user details for user_Id: ${user_Id}`);
         return result;

      } catch (error: any) {
         console.error(`[UserService] Error in getUserDetailsByUserIdService for user_Id: ${user_Id}`, {
            error: error.message,
            stack: error.stack,
            name: error.name
         });
         
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch user details");
      }
   }

   protected static updateUserRoleService = async (userId: number, roleId: number, supervisorAccess?: {
      landscapingAccess?: boolean,
      plantDiseaseAccess?: boolean,
      litterDetectionAccess?: boolean
   }) => {

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

         // Prepare update data
         const updateData: any = {
               role_Id: roleId,
               updatedAt: new Date()
         };

         // Add supervisor access fields if provided
         if (supervisorAccess) {
            if (supervisorAccess.landscapingAccess !== undefined) {
               updateData.landscaping_access = supervisorAccess.landscapingAccess;
            }
            if (supervisorAccess.plantDiseaseAccess !== undefined) {
               updateData.plant_disease_access = supervisorAccess.plantDiseaseAccess;
            }
            if (supervisorAccess.litterDetectionAccess !== undefined) {
               updateData.litter_detection_access = supervisorAccess.litterDetectionAccess;
            }
         }

         const updatedUser = await db.users.update({
            where: { Id: userId },
            data: updateData,
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
            message: "User role and supervisor access updated successfully"
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
            console.log('response', response)
            
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
         console.log('[UserService] Starting fetchAndStoreEmployeeListingService');
         const secretKey = await this.fetchSecretFromAPI();
         console.log('[UserService] Secret key obtained:', secretKey);

         const payload = {
            SecretKey: `${secretKey}`,
            Lang: "en"
         };

         console.log('[UserService] Making API request to EmployeeListingGet with payload:', payload);
         const response = await axios.post(
            "https://192.168.164.7/middleware/?class=general&action=EmployeeListingGet",
            payload,
            {
               headers: {
                  'Content-Type': 'application/json',
               },
               timeout: 30000, // 30 seconds timeout
               httpsAgent: new https.Agent({
                  rejectUnauthorized: false
               })
            }
         )
         console.log('[UserService] API response received:', response.status, response.data);

         if (!response.data?.data?.UserListing || !Array.isArray(response.data.data.UserListing)) {
            if (response.data?.error) {
               throw new HttpException(STATUS.BAD_REQUEST, `API Error: ${response.data.error}`);
            }
            
            throw new HttpException(STATUS.BAD_REQUEST, "Invalid response format from third-party API");
         }

         const userListing = response.data.data.UserListing;

         let successCount = 0;
         let errorCount = 0;
         let deletedCount = 0;

         // Get all emp_ids from API response
         const apiEmpIds = new Set(userListing.map((user: any) => user.EmpCode as string));

         // Find users in DB that are not in API response (excluding EMP001)
         const usersToDelete = await db.users.findMany({
            where: {
               AND: [
                  {
                     emp_Id: {
                        notIn: Array.from(apiEmpIds) as string[]
                     }
                  },
                  {
                     emp_Id: {
                        not: 'EMP001'
                     }
                  }
               ]
            },
            select: {
               Id: true,
               emp_Id: true,
               emp__eng_name: true
            }
         });

         // Delete users not present in API response (batch deletion for better performance)
         if (usersToDelete.length > 0) {
            console.log(`[UserService] Starting batch deletion of ${usersToDelete.length} users`);
            
            try {
               // Use deleteMany for batch deletion instead of individual deletes
               const deleteResult = await db.users.deleteMany({
                  where: {
                     Id: {
                        in: usersToDelete.map(user => user.Id)
                     }
                  }
               });
               
               deletedCount = deleteResult.count;
               console.log(`[UserService] Successfully deleted ${deletedCount} users in batch`);
               
               // Log some examples of deleted users (first 5)
               const sampleDeleted = usersToDelete.slice(0, 5);
               sampleDeleted.forEach(user => {
                  console.log(`Deleted user: ${user.emp_Id} - ${user.emp__eng_name}`);
               });
               
               if (usersToDelete.length > 5) {
                  console.log(`... and ${usersToDelete.length - 5} more users`);
               }
               
            } catch (deleteError) {
               console.error(`[UserService] Failed to delete users in batch:`, deleteError);
               
               // Fallback to individual deletion if batch fails
               console.log(`[UserService] Falling back to individual deletion`);
               for (const userToDelete of usersToDelete) {
                  try {
                     await db.users.delete({
                        where: { Id: userToDelete.Id }
                     });
                     deletedCount++;
                  } catch (individualDeleteError) {
                     console.error(`Failed to delete user ${userToDelete.emp_Id}:`, individualDeleteError);
                  }
               }
            }
         }

         console.log(`[UserService] Processing ${userListing.length} users from API`);
         
         for (const userData of userListing) {
            try {
               const existingUser = await db.users.findFirst({
                  where: { user_Id: userData.UserID }
               });

               // Helper function to safely parse dates
               const parseDate = (dateString: string | null | undefined): Date | undefined => {
                  if (!dateString || dateString.trim() === '') {
                     return undefined;
                  }
                  
                  try {
                     const date = new Date(dateString);
                     // Check if the date is valid
                     if (isNaN(date.getTime())) {
                        console.warn(`Invalid date format: ${dateString}`);
                        return undefined;
                     }
                     return date;
                  } catch (error) {
                     console.warn(`Error parsing date: ${dateString}`, error);
                     return undefined;
                  }
               };

               const userDataToProcess: UserType = {
                  user_Id: userData.UserID,
                  emp_Id: userData.EmpCode,
                  emp_code: userData.EmpCode,
                  image: userData.EmployeeImage1 ||userData.EmployeeImage2,
                  gender: userData.Gender,
                  emp__eng_name: userData.Name,
                  location: userData.Location,
                  telephone: userData.Telephone,
                  email: userData.Email,
                  office_extension: userData.OfficeExtension,
                  nationality: userData.Nationality,
                  joining_date: parseDate(userData.JoiningDate),
                  date_of_birth: parseDate(userData.DateOfBirth),
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

               // Log progress every 100 users
               if (successCount % 100 === 0) {
                  console.log(`[UserService] Processed ${successCount} users so far...`);
               }

            } catch (userError) {
               errorCount++;
               console.error(`[UserService] Error processing user ${userData.UserID}:`, userError);
            }
         }

         const summary = {
            total: userListing.length,
            processed: successCount,
            errors: errorCount,
            deleted: deletedCount
         };

         console.log('[UserService] Processing completed. Summary:', summary);
         
         const result = {
            message: "Employee listing fetch and store completed - existing users updated, new users created, obsolete users deleted (excluding EMP001)",
            summary
         };
         
         console.log('[UserService] Returning result:', result);
         return result;

      } catch (error) {
         console.error('[UserService] Error in fetchAndStoreEmployeeListingService:', error);
         
         if (error instanceof HttpException) {
            console.error('[UserService] HttpException thrown:', error.message);
            throw error;
         }
         
         if (axios.isAxiosError(error)) {
            console.error('[UserService] Axios error:', {
               code: error.code,
               message: error.message,
               response: error.response?.data,
               status: error.response?.status
            });
            
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

   protected static addUserService = async (userData: AddUserType) => {
      try {
         // Check if user already exists by user_Id
         const existingUser = await db.users.findFirst({
            where: {
               user_Id: userData.user_Id.toString()
            }
         });

         if (existingUser) {
            throw new HttpException(STATUS.BAD_REQUEST, "User with this User ID already exists");
         }

         // Check if user already exists by emp_Id
         const existingEmpUser = await db.users.findFirst({
            where: {
               emp_Id: userData.emp_Id
            }
         });

         if (existingEmpUser) {
            throw new HttpException(STATUS.BAD_REQUEST, "User with this Employee ID already exists");
         }

         // Check if user already exists by unique_id
         const existingUniqueUser = await db.users.findFirst({
            where: {
               unique_id: userData.unique_id
            }
         });

         if (existingUniqueUser) {
            throw new HttpException(STATUS.BAD_REQUEST, "User with this Unique ID already exists");
         }

         // Create new user
         const newUser = await db.users.create({
            data: {
               unique_id: userData.unique_id,
               user_Id: userData.user_Id.toString(),
               emp_Id: userData.emp_Id,
               emp_code: userData.emp_code,
               image: userData.image,
               gender: userData.gender,
               emp__eng_name: userData.emp__eng_name,
               location: userData.location,
               telephone: userData.telephone,
               email: userData.email,
               office_extension: userData.office_extension,
               nationality: userData.nationality,
               joining_date: userData.joining_date,
               date_of_birth: userData.date_of_birth,
               dep_eng_name: userData.dep_eng_name,
               desig_eng_name: userData.desig_eng_name,
               unit_arabic_name: userData.unit_arabic_name,
               is_attendance_user: userData.is_attendance_user || false,
               is_ai_login_user: userData.is_ai_login_user || false,
               ai_engine_access: userData.ai_engine_access || false,
               createdAt: new Date(),
               updatedAt: new Date()
            }
         });

         return {
            success: true,
            message: "User added successfully",
            data: newUser
         };

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         
         throw new HttpException(
            STATUS.BAD_REQUEST,
            error.message || "Failed to add user"
         );
      }
   }

   /**
    * Upload user to HIK Vision NVR system
    * @param user - User object to upload
    * @returns Promise with upload result
    */
   public static uploadUserToHikVision = async (user: any) => {
      try {
         console.log(`[UserService] Starting HIK Vision upload for user: ${user.emp_Id}`);

         // Helper function to get image as base64
         const getImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
            if (!imageUrl) {
               console.warn(`[UserService] No image URL provided for user: ${user.emp_Id}`);
               return null;
            }

            try {
               // Use the same image data endpoint as in event-handler
               // const response = await UserService.callHikVisionAPI(
               //    'https://10.70.90.183:443',
               //    '/artemis/api/eventService/v1/image_data',
               //    '59315117',
               //    'YuWS8qCb61xbD8fEbwFJ',
               //    { picUri: imageUrl }
               // );

               const response1  = await urlToBase64(imageUrl);

               // const base64Image = response1.replace(/^data:image\/[a-z]+;base64,/, '');
               //  const base64Image = response1.replace(/^data:image\/[a-z]+;base64,/, '');
               

               if (response1 && typeof response1 === 'string') {
                  const base64Image = response1.replace(/^data:image\/[a-z]+;base64,/, '');
                  // const base64WithoutPrefix = response1.replace(/^data:image\/[a-z]+;base64,/, "");
                  return base64Image;
               }
               
               console.warn(`[UserService] Invalid image data response for user: ${user.emp_Id}`);
               return null;
            } catch (error: any) {
               console.error(`[UserService] Failed to get image data for user ${user.emp_Id}:`, error.message);
               return null;
            }
         };

         console.log("Useeeeeeeeeeeeeeeeeeeeeer", user);

         // Get image as base64
         const faceData = await getImageAsBase64(user.image);
         
         // Prepare the payload
         const nameParts = user.emp__eng_name ? user.emp__eng_name.trim().split(' ') : [];
         const personGivenName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
         const personFamilyName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : user.emp__eng_name || '';

         const payload = {
            personCode: user.emp_Id,
            personFamilyName: personFamilyName,
            personGivenName: personGivenName,
            gender: user.gender === "M" ? 1 : 2,
            orgIndexCode: "2",
            faces: faceData ? [{ faceData: faceData }] : []
         };

         console.log(`[UserService] Uploading user to HIK Vision:`, {
            personCode: payload.personCode,
            personFamilyName: payload.personGivenName,            
            personGivenName: payload.personFamilyName,
            gender: payload.gender,
            hasFaceData: !!faceData
         });

         // Call HIK Vision API to add person
         const response = await UserService.callHikVisionAPI(
            'https://10.70.90.183:443',
            '/artemis/api/resource/v1/person/single/add',
            '59315117',
            'YuWS8qCb61xbD8fEbwFJ',
            payload
         );

         if (response && response.code === '0' && response.data) {
            console.log(`[UserService] Successfully uploaded user to HIK Vision:`, {
               personCode: payload.personCode,
               hikVisionId: response.data
            });

            // Update user's unique_id with the response data
            await db.users.update({
               where: { Id: user.Id },
               data: { unique_id: response.data }
            });

            console.log(`[UserService] Updated user unique_id: ${response.data}`);

            return {
               success: true,
               message: "User uploaded to HIK Vision successfully",
               data: {
                  personCode: payload.personCode,
                  hikVisionId: response.data,
                  unique_id: response.data
               }
            };
         } else {
            console.error(`[UserService] HIK Vision API returned error:`, response);
            throw new Error(`HIK Vision API error: ${response?.msg || 'Unknown error'}`);
         }

      } catch (error: any) {
         console.error(`[UserService] Failed to upload user to HIK Vision:`, error);
         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            `Failed to upload user to HIK Vision: ${error.message}`
         );
      }
   };

   /**
    * Upload multiple users to HIK Vision NVR system
    * @param users - Array of user objects to upload
    * @returns Promise with upload results
    */
   public static uploadUsersToHikVision = async (users: any[]) => {
      try {
         console.log(`[UserService] Starting batch upload of ${users.length} users to HIK Vision`);

         const results = {
            success: 0,
            failed: 0,
            errors: [] as any[]
         };

         for (const user of users) {
            try {
               await this.uploadUserToHikVision(user);
               results.success++;
               console.log(`[UserService] Successfully uploaded user ${user.emp_Id} (${results.success}/${users.length})`);
            } catch (error: any) {
               results.failed++;
               results.errors.push({
                  user: user.emp_Id,
                  error: error.message
               });
               console.error(`[UserService] Failed to upload user ${user.emp_Id}:`, error.message);
            }
         }

         console.log(`[UserService] Batch upload completed:`, {
            total: users.length,
            success: results.success,
            failed: results.failed
         });

         return {
            success: results.failed === 0,
            message: `Uploaded ${results.success} out of ${users.length} users to HIK Vision`,
            data: results
         };

      } catch (error: any) {
         console.error(`[UserService] Batch upload to HIK Vision failed:`, error);
         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            `Failed to upload users to HIK Vision: ${error.message}`
         );
      }
   };

   /**
    * Call HIK Vision API with proper authentication
    * @param baseUrl - Base URL for the API
    * @param endpoint - API endpoint
    * @param appKey - Application key
    * @param appSecret - Application secret
    * @param requestData - Request payload
    * @returns Promise with API response
    */
   private static async callHikVisionAPI(baseUrl: string, endpoint: string, appKey: string, appSecret: string, requestData: any) {
      const axios = require('axios');
      const https = require('https');
      const crypto = require('crypto');

      try {
         const method = 'POST';
         const accept = '*/*';
         const contentType = 'application/json;charset=UTF-8';
         const timestamp = Date.now();
         const nonce = crypto.randomUUID();

         const requestBody = JSON.stringify(requestData);

         const bodyBytes = Buffer.from(requestBody, 'utf-8');
         const md5Hash = crypto.createHash('md5').update(bodyBytes).digest();
         const contentMD5 = md5Hash.toString('base64');

         const date = new Date().toUTCString();

         const customHeaders: { [key: string]: string } = {
            'x-ca-key': appKey,
            'x-ca-timestamp': timestamp.toString(),
            'x-ca-nonce': nonce,
         };

         const sortedHeaderKeys = Object.keys(customHeaders).sort();

         let signatureString = `${method}\n${accept}\n${contentMD5}\n${contentType}\n${date}\n`;
         for (const key of sortedHeaderKeys) {
            signatureString += `${key}:${customHeaders[key]}\n`;
         }
         signatureString += endpoint;

         const hmac = crypto.createHmac('sha256', appSecret);
         hmac.update(signatureString, 'utf-8');
         const signature = hmac.digest('base64');

         const headers = {
            Accept: accept,
            'Content-Type': contentType,
            'Content-MD5': contentMD5,
            Date: date,
            'X-Ca-Key': appKey,
            'X-Ca-Signature': signature,
            'X-Ca-Signature-Headers': sortedHeaderKeys.join(','),
            'X-Ca-Timestamp': timestamp.toString(),
            'X-Ca-Nonce': nonce,
         };

         const response = await axios({
            method,
            url: `${baseUrl}${endpoint}`,
            headers,
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            data: requestBody,
            timeout: 30000,
         });

         return response.data;
      } catch (error: any) {
         console.error(`[UserService] HIK Vision API call failed:`, error);
         throw error;
      }
   }

   /**
    * Upload the first two users (index 1 and 2) to HIK Vision NVR system
    * Skips the user at index 0
    * @returns Promise with upload results
    */
   public static uploadAllUsersToHikVision = async () => {
      try {
         console.log(`[UserService] Starting upload of first two users to HIK Vision (skipping index 0)`);

         // Get all users ordered by Id
         const allUsers = await db.users.findMany({
            orderBy: { Id: 'asc' }
         });

         if (allUsers.length < 3) {
            throw new HttpException(
               STATUS.BAD_REQUEST,
               `Not enough users in database. Found ${allUsers.length} users, need at least 3 to skip index 0 and upload 2 users.`
            );
         }

         // Get users at index 1 and 2 (skip index 0)
         const usersToUpload = allUsers.slice(1, 3); 

         console.log(`[UserService] Found ${allUsers.length} total users. Uploading users at index 1 and 2:`, {
            user1: { id: usersToUpload[0].Id, emp_Id: usersToUpload[0].emp_Id, name: usersToUpload[0].emp__eng_name },
            user2: { id: usersToUpload[1].Id, emp_Id: usersToUpload[1].emp_Id, name: usersToUpload[1].emp__eng_name }
         });

         // Upload the two users
         const result = await this.uploadUsersToHikVision(usersToUpload);

         console.log(`[UserService] Upload of first two users completed:`, result);

         return {
            success: result.success,
            message: `Uploaded first two users (index 1 and 2) to HIK Vision. ${result.message}`,
            data: {
               ...result.data,
               uploadedUsers: usersToUpload.map(user => ({
                  id: user.Id,
                  emp_Id: user.emp_Id,
                  name: user.emp__eng_name,
                  unique_id: user.unique_id
               }))
            }
         };

      } catch (error: any) {
         console.error(`[UserService] Failed to upload first two users to HIK Vision:`, error);
         
         if (error instanceof HttpException) {
            throw error;
         }
         
         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            `Failed to upload first two users to HIK Vision: ${error.message}`
         );
      }
   };

   


}

export default UserService;
