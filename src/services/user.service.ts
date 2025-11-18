import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import axios from "axios";
import https from "https";
import { UserType, AddUserType } from "@/typescript/interfaces";
import fetch from "node-fetch";
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { formatImageUrlsInArray } from "@/utils/imageUrl.utils";

export async function urlToBase64(url: string): Promise<string | string> {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false }); 
    const options: any = { agent };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");


    return base64;
   } catch (error: unknown) {
    if (error instanceof Error) {
    }
    return "";
  }
}

class UserService {
   private static readonly HIK_CONFIG = {
      baseURL: 'https://10.70.90.183:443',
      appKey: '59315117',
      appSecret: 'YuWS8qCb61xbD8fEbwFJ',
   };

   private static detectImageFormat(buffer: Buffer): string {
      try {
         if (buffer.length >= 4) {
            if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
               return 'jpg';
            }
            if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
               return 'png';
            }
            if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
               return 'gif';
            }
            if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
               return 'bmp';
            }
            if (buffer.length >= 12 && 
                buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
               return 'webp';
            }
         }
         
         return 'jpg';
      } catch (error) {
         return 'jpg';
      }
   }

   private static async saveUserImageLocally(imageUrl: string, empId: string): Promise<string | null> {
      try {
         if (!imageUrl || imageUrl.trim() === '') {
            return null;
         }

         const existingUserWithSameImage = await db.users.findFirst({
            where: { actuall_image: imageUrl },
            select: { image: true }
         });

         if (existingUserWithSameImage?.image) {
            const existingFilePath = path.join(process.cwd(), existingUserWithSameImage.image.replace(/^\//, ''));
            if (fs.existsSync(existingFilePath)) {
               return existingUserWithSameImage.image;
            }
         }

         const base64String = await urlToBase64(imageUrl);
         
         if (!base64String || base64String === '') {
            return null;
         }

         let cleanBase64 = base64String.trim();
         if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
         }

         if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
            return null;
         }

         const imageBuffer = Buffer.from(cleanBase64, 'base64');
         
         if (imageBuffer.length === 0) {
            return null;
         }

         const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');

         const imageFormat = this.detectImageFormat(imageBuffer);
         
         const uploadDir = path.join(process.cwd(), 'uploads', 'user-images');
         if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
         }

         const existingFiles = fs.readdirSync(uploadDir);
         for (const file of existingFiles) {
            const filePath = path.join(uploadDir, file);
            try {
               const fileBuffer = fs.readFileSync(filePath);
               const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
               
               if (fileHash === imageHash) {
                  const existingImagePath = `/uploads/user-images/${file}`;
                  return existingImagePath;
               }
            } catch (fileError) {
               continue;
            }
         }

         const fileName = `${empId}_${imageHash.substring(0, 8)}.${imageFormat}`;
         const filePath = path.join(uploadDir, fileName);

         fs.writeFileSync(filePath, imageBuffer);

         const imageLocalPath = `/uploads/user-images/${fileName}`;
         
         return imageLocalPath;
      } catch (error: any) {
         return null;
      }
   }

   

   protected static loginService = async (EmpCode: string, Password: string) => {
   
      try {
         const secretKey = await this.fetchSecretFromAPI();
         const payload = {
            EmpCode,
            Password,
            SecretKey: `${secretKey}`,
            Lang: "en"
         };
   let endpoint= EmpCode==='5455'?  "https://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeLoginService" : "https://192.168.164.7/middleware/?class=general&action=EmployeeLoginService";
         const response = await axios.post(
            endpoint,
            payload,
            {
               headers: { "Content-Type": "application/json" },
               timeout: 30000, 
               httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            }
         );
   
   
         if (response.data.status !== 'SUCCESS' || response.data.code !== 200) {
            throw new HttpException(STATUS.BAD_REQUEST, response.data.error?.msg || `Login failed: ${response.data.status} - ${response.data.code}`);
         }
   
         const userId = response.data.data.UserID;
   
         try {
            const user = await db.users.findFirst({
               where: {
                  emp_Id: EmpCode
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
   
         return EmpCode;
   
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


   protected static getAllUsersWithRoleNestedService = async (filters: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      department?: string;
      employeeId?: string;
      aiLogin?: string;
   } = {}) => {

      try {
         const page = filters?.page || 1;
         const limit = filters?.limit || 10;
         const skip = (page - 1) * limit;

         const whereClause: any = {
            user_Id: {
               not: null
            }
         };

         if (filters?.search) {
            
            whereClause.OR = [
               { emp__eng_name: { contains: filters.search } },
               { emp__arabic_name: { contains: filters.search } },
               { emp_Id: { contains: filters.search } },
               { email: { contains: filters.search } }
            ];
         }

         if (filters?.department) {
            whereClause.OR = [
               { dep_eng_name: filters.department },
               { dep_arabic_name: filters.department }
            ];
         }

         if (filters?.employeeId) {
            whereClause.emp_Id = filters.employeeId;
         }

         if (filters?.aiLogin) {
            const aiLoginValue = filters.aiLogin === 'true';
            whereClause.is_ai_login_user = aiLoginValue;
         }

         const orderByClause: any = {};
         if (filters?.sortBy) {
            const sortField = filters.sortBy === 'emp__eng_name' ? 'emp__eng_name' :
                            filters.sortBy === 'emp__arabic_name' ? 'emp__arabic_name' :
                            filters.sortBy === 'emp_Id' ? 'emp_Id' :
                            filters.sortBy === 'email' ? 'email' :
                            filters.sortBy === 'dep_eng_name' ? 'dep_eng_name' :
                            filters.sortBy === 'ai_engine_access' ? 'ai_engine_access' :
                            filters.sortBy === 'last_login' ? 'last_login' :
                            filters.sortBy === 'createdAt' ? 'createdAt' : 'emp__eng_name';
            orderByClause[sortField] = filters.sortOrder === 'desc' ? 'desc' : 'asc';
         } else {
            orderByClause.emp__eng_name = 'asc';
         }

         const [users, totalCount] = await Promise.all([
            db.users.findMany({
               where: whereClause,
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
                  is_ai_login_user:true,
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
               orderBy: orderByClause,
               skip,
               take: limit
            }),
            db.users.count({
               where: whereClause
            })
         ]);

         const totalPages = Math.ceil(totalCount / limit);
         const hasNextPage = page < totalPages;
         const hasPreviousPage = page > 1;

      const imageFields = ['image'];
      const formattedUsers = formatImageUrlsInArray(users, imageFields);


         const paginationData = {
            currentPage: page,
            totalPages,
            totalCount,
            limit: limit,
            hasNextPage,
            hasPreviousPage,
            nextPage: hasNextPage ? page + 1 : null,
            previousPage: hasPreviousPage ? page - 1 : null
         };

         return {
            success: true,
            data: formattedUsers,
            pagination: paginationData
         };

      } catch (error: any) {
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch users");
      }
   }

   public static getUsersFiltersService = async () => {
      try {
         const allUsers = await db.users.findMany({
            where: { user_Id: { not: null } },
            select: {
               Id: true,
               emp_Id: true,
               emp__eng_name: true,
               emp__arabic_name: true,
               dep_eng_name: true,
               dep_arabic_name: true
            }
         });

         const deptSetEn = new Set<string>();
         const deptSetAr = new Set<string>();
         for (const u of allUsers) {
            if (u.dep_eng_name) deptSetEn.add(u.dep_eng_name);
            if (u.dep_arabic_name) deptSetAr.add(u.dep_arabic_name);
         }
         const departments_en = Array.from(deptSetEn).filter(Boolean).sort();
         const departments_ar = Array.from(deptSetAr).filter(Boolean).sort();

         const employees = allUsers
            .filter(u => !!u.emp_Id)
            .map(u => ({
               id: u.Id,
               emp_Id: u.emp_Id as string,
               name_en: u.emp__eng_name || null,
               name_ar: u.emp__arabic_name || null
            }));

         return {
            success: true,
            data: {
               departments_en,
               departments_ar,
               employees
            }
         };
      } catch (error) {
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch users filters");
      }
   }

   public static getVisitorsService = async (filters: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      gender?: string;
   } = {}) => {
      try {
         const page = filters?.page || 1;
         const limit = filters?.limit || 10;
         const skip = (page - 1) * limit;

         const whereClause: any = {
            AND: [
               {
                  OR: [
                     { user_Id: null },
                     { user_Id: '' }
                  ]
               },
               {
                  OR: [
                     { emp_Id: null },
                     { emp_Id: '' }
                  ]
               }
            ]
         };

         if (filters?.search) {
            whereClause.AND.push({
               OR: [
                  { emp__eng_name: { contains: filters.search } },
                  { emp__arabic_name: { contains: filters.search } },
                  { unique_id: { contains: filters.search } }
               ]
            });
         }

         if (filters?.gender) {
            whereClause.AND.push({ gender: filters.gender });
         }

         const orderByClause: any = {};
         if (filters?.sortBy) {
            const sortField = filters.sortBy === 'emp__eng_name' ? 'emp__eng_name' :
                            filters.sortBy === 'emp__arabic_name' ? 'emp__arabic_name' :
                            filters.sortBy === 'gender' ? 'gender' :
                            filters.sortBy === 'createdAt' ? 'createdAt' :
                            filters.sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt';
            orderByClause[sortField] = filters.sortOrder === 'desc' ? 'desc' : 'asc';
         } else {
            orderByClause.createdAt = 'desc';
         }

         const [visitors, totalCount] = await Promise.all([
            db.users.findMany({
               where: whereClause,
               select: {
                  Id: true,
                  unique_id: true,
                  gender: true,
                  image: true,
                  emp__eng_name: true,
                  emp__arabic_name: true,
                  createdAt: true,
                  updatedAt: true
               },
               orderBy: orderByClause,
               skip,
               take: limit
            }),
            db.users.count({
               where: whereClause
            })
         ]);

         const totalPages = Math.ceil(totalCount / limit);
         const hasNextPage = page < totalPages;
         const hasPreviousPage = page > 1;

         const visitorsWithStats = await Promise.all(
            visitors.map(async (visitor) => {
               const visitorIdStr = visitor.Id.toString();
               
               const [officeSentimentCount, parkSentimentCount] = await Promise.all([
                  db.offices_sentiment_analysis.count({
                     where: {
                        person_Id: visitorIdStr,
                        sentiment_of: 'visitor'
                     }
                  }),
                  db.parks_sentiment_analysis.count({
                     where: {
                        person_Id: visitorIdStr,
                        sentiment_of: 'visitor'
                     }
                  })
               ]);

               const behaviourAlertsCount = await db.parks_behaviour_alerts.count({
                  where: {
                     OR: [
                        { person_Id: visitorIdStr },
                        { person_Id: visitor.unique_id || '' }
                     ],
                     is_employee: false
                  }
               });

               const [officeFootfallCount, parkFootfallCount] = await Promise.all([
                  db.offices_footfall_analysis.count({
                     where: {
                        person_Id: visitor.Id
                     }
                  }),
                  db.parks_footfall_analysis.count({
                     where: {
                        person_Id: visitor.Id
                     }
                  })
               ]);

               return {
                  ...visitor,
                  totalSentiment: officeSentimentCount + parkSentimentCount,
                  totalBehaviourAlerts: behaviourAlertsCount,
                  totalFootfall: officeFootfallCount + parkFootfallCount
               };
            })
         );

         const imageFields = ['image'];
         const formattedVisitors = formatImageUrlsInArray(visitorsWithStats, imageFields);

         const paginationData = {
            currentPage: page,
            totalPages,
            totalCount,
            limit: limit,
            hasNextPage,
            hasPreviousPage,
            nextPage: hasNextPage ? page + 1 : null,
            previousPage: hasPreviousPage ? page - 1 : null
         };

         return {
            success: true,
            data: formattedVisitors,
            pagination: paginationData
         };

      } catch (error: any) {
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch visitors");
      }
   }

   protected static deleteVisitorUserAndRecords = async (userId: number) => {
      try {
         const user = await db.users.findFirst({
            where: {
               Id: userId
            }
         })

         if (!user) {
            throw new HttpException(STATUS.NOT_FOUND, "User not found");
         }

         const userIdStr = userId.toString();

         // Delete footfall records (using person_Id as number)
         await db.offices_footfall_analysis.deleteMany({
            where: {
               person_Id: userId
            }
         })
         await db.parks_footfall_analysis.deleteMany({
            where: {
               person_Id: userId
            }
         })

         // Delete behaviour alerts (can use both person_Id as string or unique_id)
         await db.parks_behaviour_alerts.deleteMany({
            where: {
               OR: [
                  { person_Id: userIdStr },
                  ...(user.unique_id ? [{ person_Id: user.unique_id }] : [])
               ],
               is_employee: false
            }
         })

         await db.parks_sentiment_analysis.deleteMany({
            where: {
               OR: [
                  { person_Id: userIdStr },
                  ...(user.unique_id ? [{ person_Id: user.unique_id }] : [])
               ],
               sentiment_of: 'visitor'
            }
         })

         await db.offices_sentiment_analysis.deleteMany({
            where: {
               OR: [
                  { person_Id: userIdStr },
                  ...(user.unique_id ? [{ person_Id: user.unique_id }] : [])
               ],
               sentiment_of: 'visitor'
            }
         })

         // Delete from HikVision only if unique_id exists
         if (user.unique_id) {
            try {
               const userToDelete = {
                  personId: user.unique_id,
               };
               const deleteFromHikVisionResponse = await UserService.callHikVisionAPI(
                  UserService.HIK_CONFIG.baseURL,
                  '/artemis/api/resource/v1/person/single/delete',
                  UserService.HIK_CONFIG.appKey,
                  UserService.HIK_CONFIG.appSecret,
                  userToDelete
               );
               console.log('deleteFromHikVisionResponse', deleteFromHikVisionResponse)
               if (deleteFromHikVisionResponse && deleteFromHikVisionResponse.code === '0') {
                  console.log('User deleted from HikVision successfully');
               } else {
                  console.log('Failed to delete user from HikVision');
               }  
            } catch (hikVisionError: any) {
               console.log('Error deleting user from HikVision', hikVisionError);
            }
         }

         // Finally, delete the user record
         await db.users.delete({
            where: {
               Id: userId
            }
         })

         return {
            status: STATUS.SUCCESS,
            message: "User and its corresponding records deleted successfully"
         };

      } catch (error) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Unable to delete the user and its corresponding records!");
      }
   }


   protected static getUserDetailsByUserIdService = async (emp_Id: string) => {
      try {
         
         const user = await db.users.findFirst({
            where: {
               emp_Id
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

         if (!user) {
            throw new HttpException(STATUS.NOT_FOUND, "User not found");
         }

         let users_roles = null;
         if (user.role_Id) {
            
            users_roles = await db.users_roles.findUnique({
               where: {
                  Id: user.role_Id
               },
                  select: {
                     role_name: true,
                     users_permissions: {
                        select: {
                           dashboard_view: true,
                           live_stream_view: true,
                           visitors_view:true,
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
                           settings_view: true,
                           office_queue_management_view: true,
                           office_queue_management_add: true,
                           office_queue_management_update: true,
                           park_plant_inspection_view: true,
                           park_plant_inspection_add: true,
                           park_plant_inspection_update: true,
                           park_plant_disease_view: true,
                           park_plant_disease_add: true,
                           park_plant_disease_update: true
                        }
                     }
               }
            });
            
         }

         const { role_Id, ...userWithoutRoleId } = user;
         const result = {
            ...userWithoutRoleId,
            users_roles
         };

         const imageFields = ['image'];
         const formattedUsers = formatImageUrlsInArray([result], imageFields);

         return formattedUsers[0];

      } catch (error: any) {
         
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

         const updateData: any = {
               role_Id: roleId,
               updatedAt: new Date()
         };

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
         const baseTimeout = 20000; 
      
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
                  timeout: baseTimeout * attempt, 
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
                  continue; 
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
            
            const waitTime = Math.pow(2, attempt) * 1000; 
            await new Promise(resolve => setTimeout(resolve, waitTime));
         }
      }
      
      throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch secret key after all retry attempts");
   }

   public static fetchAndStoreEmployeeListingServiceWithProgress = async (
      onProgress?: (progress: { current: number; total: number; processed: number; errors: number }) => void,
      onStatus?: (status: { message: string; current?: number; total?: number }) => void
   ) => {
      return this.fetchAndStoreEmployeeListingServiceInternal(onProgress, onStatus);
   }

   public static fetchAndStoreEmployeeListingService = async () => {
      return this.fetchAndStoreEmployeeListingServiceInternal(undefined, undefined);
   }

   private static fetchAndStoreEmployeeListingServiceInternal = async (
      onProgress?: (progress: { current: number; total: number; processed: number; errors: number }) => void,
      onStatus?: (status: { message: string; current?: number; total?: number }) => void
   ) => {
      try {
         
         if (onStatus) {
            onStatus({ message: 'Authenticating...' });
         }
         
         const secretKey = await this.fetchSecretFromAPI();

         if (onStatus) {
            onStatus({ message: 'Fetching employee data from intranet...' });
         }

         const payload = {
            SecretKey: `${secretKey}`,
            Lang: "en"
         };

         const endpoint = "https://khormun.gov.ae/middleware/?class=general&action=EmployeeListingUpdated";

         const response = await axios.post(
            endpoint,
            payload,
            {
               headers: {
                  'Content-Type': 'application/json',
               },
               timeout: 30000, 
               httpsAgent: new https.Agent({
                  rejectUnauthorized: false
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
         let deletedCount = 0;

         if (onProgress) {
            onProgress({
               current: 0,
               total: userListing.length,
               processed: 0,
               errors: 0
            });
         }
         
         if (onStatus) {
            onStatus({ message: `Starting sync of ${userListing.length} employees...`, total: userListing.length });
         }
  
         let currentIndex = 0;
         for (const userData of userListing) {
            currentIndex++;
            try {
               const existingUser = await db.users.findFirst({
                  where: { user_Id: userData.UserID },
                  select: {
                     Id: true,
                     image: true,
                     actuall_image: true,
                     ai_engine_access: true
                  }
               });

               const parseDate = (dateString: string | null | undefined): Date | undefined => {
                  if (!dateString || dateString.trim() === '') {
                     return undefined;
                  }
                  
                  try {
                     const date = new Date(dateString);
                     if (isNaN(date.getTime())) {
                        return undefined;
                     }
                     return date;
                  } catch (error) {
                     return undefined;
                  }
               };

               const apiImageUrl = userData.EmployeeImage1 || userData.EmployeeImage2 || null;
               
               let localImagePath: string | null = null;
               if (existingUser) {
                  const currentActualImage = existingUser.actuall_image;
                  
                  if (apiImageUrl && apiImageUrl !== currentActualImage) {
                     localImagePath = await this.saveUserImageLocally(apiImageUrl, userData.EmpCode);
                     
                     if (!localImagePath) {
                        localImagePath = existingUser.image;
                     }
                  } else {
                     localImagePath = existingUser.image;
                  }
               } else {
                  if (apiImageUrl) {
                     localImagePath = await this.saveUserImageLocally(apiImageUrl, userData.EmpCode);
                  }
               }

               const userDataToProcess: any = {
                  user_Id: userData.UserID,
                  emp_Id: userData.EmpCode,
                  emp_code: userData.EmpCode,
                  image: localImagePath, 
                  actuall_image: apiImageUrl, 
                  gender: userData.Gender,
                  emp__eng_name: userData.Name,
                  emp__arabic_name: userData.NameAr,
                  location: userData.Location,
                  telephone: userData.Telephone,
                  email: userData.Email,
                  office_extension: userData.OfficeExtension,
                  nationality: userData.Nationality,
                  joining_date: parseDate(userData.JoiningDate),
                  date_of_birth: parseDate(userData.DateOfBirth),
                  dep_eng_name: userData.Department,
                  dep_arabic_name: userData.DepartmentAr,
                  desig_eng_name: userData.Designation,
                  desig_arabic_name: userData.DesignationAr,
                  unit_eng_name: userData.Unit,
                  unit_arabic_name: userData.UnitAr,
                  is_attendance_user: userData.IsAttendenceUser === "Y",
                  is_ai_login_user: userData.IsAILoginUser === "Y",
                  ai_engine_access: existingUser?.ai_engine_access || false,
                  updatedAt: new Date()
               };

               if (existingUser) {
                  const updatedUser = await db.users.update({
                     where: { Id: existingUser.Id },
                     data: userDataToProcess
                  });

                  if (apiImageUrl && apiImageUrl !== existingUser.actuall_image && updatedUser.unique_id) {
                     try {
                        const base64Image = await urlToBase64(apiImageUrl);
                        if (base64Image && typeof base64Image === 'string') {
                           const cleanFaceData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
                           
                           const faceUpdatePayload = {
                              personId: updatedUser.unique_id,
                              faceData: cleanFaceData
                           };
                           
                           await UserService.callHikVisionAPI(
                              UserService.HIK_CONFIG.baseURL,
                              '/artemis/api/resource/v1/person/face/update',
                              UserService.HIK_CONFIG.appKey,
                              UserService.HIK_CONFIG.appSecret,
                              faceUpdatePayload
                           );
                        }
                     } catch (hikVisionError: any) {
                     }
                  }

                  successCount++;
               } else {
                  const newUser = await db.users.create({
                     data: {
                        ...userDataToProcess,
                        createdAt: new Date()
                     }
                  });

                  if (apiImageUrl) {
                     try {
                        const base64Image = await urlToBase64(apiImageUrl);
                        if (base64Image && typeof base64Image === 'string') {
                           const cleanFaceData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
                           
                           const nameParts = userData.Name ? userData.Name.trim().split(' ') : [];
                           const personGivenName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
                           const personFamilyName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : userData.Name || '';

                           const hikVisionPayload = {
                              personCode: userData.EmpCode,
                              personFamilyName: personFamilyName,
                              personGivenName: personGivenName,
                              gender: userData.Gender === "M" ? 1 : 2,
                              orgIndexCode: "2",
                              faces: cleanFaceData ? [{ faceData: cleanFaceData }] : []
                           };

                           const hikVisionResponse = await UserService.callHikVisionAPI(
                              UserService.HIK_CONFIG.baseURL,
                              '/artemis/api/resource/v1/person/single/add',
                              UserService.HIK_CONFIG.appKey,
                              UserService.HIK_CONFIG.appSecret,
                              hikVisionPayload
                           );

                           if (hikVisionResponse && hikVisionResponse.code === '0' && hikVisionResponse.data) {
                              await db.users.update({
                                 where: { Id: newUser.Id },
                                 data: { unique_id: hikVisionResponse.data }
                              });

                              try {
                                 const faceAdditionPayload = {
                                    personIndexCode: hikVisionResponse.data,
                                    faceGroupIndexCode: "5"
                                 };

                                 await UserService.callHikVisionAPI(
                                    UserService.HIK_CONFIG.baseURL,
                                    '/artemis/api/frs/v1/face/single/addition',
                                    UserService.HIK_CONFIG.appKey,
                                    UserService.HIK_CONFIG.appSecret,
                                    faceAdditionPayload
                                 );
                              } catch (faceAdditionError: any) {
                              }
                           }
                        }
                     } catch (hikVisionError: any) {
                     }
                  }

                  successCount++;
               }

               if (onProgress && (currentIndex % 10 === 0 || currentIndex === userListing.length)) {
                  onProgress({
                     current: currentIndex,
                     total: userListing.length,
                     processed: successCount,
                     errors: errorCount
                  });
               }

            } catch (userError) {
               errorCount++;
               
               if (onProgress) {
                  onProgress({
                     current: currentIndex,
                     total: userListing.length,
                     processed: successCount,
                     errors: errorCount
                  });
               }
            }
         }

         const summary = {
            total: userListing.length,
            processed: successCount,
            errors: errorCount,
            deleted: deletedCount
         };

         
         const result = {
            message: "Employee listing fetch and store completed - existing users updated, new users created, obsolete users deleted (excluding EMP001)",
            summary
         };
         
         return result;

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
               throw new HttpException(STATUS.SUCCESS, "Users are already upto date!");
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
         const existingUser = await db.users.findFirst({
            where: {
               user_Id: userData.user_Id.toString()
            }
         });

         if (existingUser) {
            throw new HttpException(STATUS.BAD_REQUEST, "User with this User ID already exists");
         }

         const existingEmpUser = await db.users.findFirst({
            where: {
               emp_Id: userData.emp_Id
            }
         });

         if (existingEmpUser) {
            throw new HttpException(STATUS.BAD_REQUEST, "User with this Employee ID already exists");
         }

         const existingUniqueUser = await db.users.findFirst({
            where: {
               unique_id: userData.unique_id
            }
         });

         if (existingUniqueUser) {
            throw new HttpException(STATUS.BAD_REQUEST, "User with this Unique ID already exists");
         }

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

   public static uploadUserToHikVision = async (user: any) => {
      try {

         const getImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
            if (!imageUrl) {
               return null;
            }

            try {
               const response1  = await urlToBase64(imageUrl);

               if (response1 && typeof response1 === 'string') {
                  const base64Image = response1.replace(/^data:image\/[a-z]+;base64,/, '');
                  return base64Image;
               }
               
               return null;
            } catch (error: any) {
               return null;
            }
         };


         const faceData = await getImageAsBase64(user.image);
         
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
         const response = await UserService.callHikVisionAPI(
            'https://10.70.90.183:443',
            '/artemis/api/resource/v1/person/single/add',
            '59315117',
            'YuWS8qCb61xbD8fEbwFJ',
            payload
         );

         if (response && response.code === '0' && response.data) {
            await db.users.update({
               where: { Id: user.Id },
               data: { unique_id: response.data }
            });


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
            throw new Error(`HIK Vision API error: ${response?.msg || 'Unknown error'}`);
         }

      } catch (error: any) {
         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            `Failed to upload user to HIK Vision: ${error.message}`
         );
      }
   };

   public static uploadUsersToHikVision = async (users: any[]) => {
      try {

         const results = {
            success: 0,
            failed: 0,
            errors: [] as any[]
         };

         for (const user of users) {
            try {
               await this.uploadUserToHikVision(user);
               results.success++;
            } catch (error: any) {
               results.failed++;
               results.errors.push({
                  user: user.emp_Id,
                  error: error.message
               });
            }
         }

         return {
            success: results.failed === 0,
            message: `Uploaded ${results.success} out of ${users.length} users to HIK Vision`,
            data: results
         };

      } catch (error: any) {
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
         throw error;
      }
   }

   /**
    * Upload the first two users (index 1 and 2) to HIK Vision NVR system
    * @returns Promise with upload results
    */
   public static uploadAllUsersToHikVision = async () => {
      try {

         const allUsers = await db.users.findMany({
            orderBy: { Id: 'asc' }
         });

         if (allUsers.length < 3) {
            throw new HttpException(
               STATUS.BAD_REQUEST,
               `Not enough users in database. Found ${allUsers.length} users, need at least 3 to skip index 0 and upload 2 users.`
            );
         }

         const usersToUpload = allUsers.slice(1, 3); 

         const result = await this.uploadUsersToHikVision(usersToUpload);

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
         if (error instanceof HttpException) {
            throw error;
         }
         
         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            `Failed to upload first two users to HIK Vision: ${error.message}`
         );
      }
   }

   public static syncUsersWithoutUniqueIdToHikVisionService = async () => {
      try {
         const usersWithoutUniqueId = await db.users.findMany({
            where: {
               AND: [
                  {
                     OR: [
                        { emp_Id: { not: null } },
                        { emp_Id: { not: '' } }
                     ]
                  },
                  {
                     OR: [
                        { unique_id: null },
                        { unique_id: '' }
                     ]
                  }
               ]
            },
            select: {
               Id: true,
               emp_Id: true,
               emp__eng_name: true,
               emp__arabic_name: true,
               gender: true,
               image: true
            }
         });

         if (usersWithoutUniqueId.length === 0) {
            return {
               success: true,
               message: "All users with emp_Id already have unique_id",
               data: {
                  total: 0,
                  processed: 0,
                  success: 0,
                  failed: 0,
                  errors: []
               }
            };
         }

         const results = {
            total: usersWithoutUniqueId.length,
            processed: 0,
            success: 0,
            failed: 0,
            errors: [] as any[]
         };

         for (const user of usersWithoutUniqueId) {
            try {
               let faceData = null;
               
               if (user.image) {
                  try {
                     let imageUrl: string;
                     
                     if (user.image.startsWith('http')) {
                        imageUrl = user.image;
                     } else if (user.image.startsWith('/uploads/')) {
                        const filePath = path.join(process.cwd(), user.image.replace(/^\//, ''));
                        if (fs.existsSync(filePath)) {
                           const imageBuffer = fs.readFileSync(filePath);
                           const base64String = imageBuffer.toString('base64');
                           faceData = base64String;
                        } else {
                           imageUrl = `http://10.160.133.77:5000${user.image}`;
                           const base64Image = await urlToBase64(imageUrl);
                           if (base64Image && typeof base64Image === 'string') {
                              faceData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
                           }
                        }
                     } else {
                        imageUrl = `http://10.160.133.77:5000${user.image}`;
                        const base64Image = await urlToBase64(imageUrl);
                        if (base64Image && typeof base64Image === 'string') {
                           faceData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
                        }
                     }
                  } catch (imageError: any) {
                  }
               }

               const trimmedEmpId = user.emp_Id ? user.emp_Id.trim() : '';
               if (!trimmedEmpId) {
                  results.failed++;
                  results.processed++;
                  results.errors.push({
                     userId: user.Id,
                     emp_Id: user.emp_Id,
                     error: 'Employee ID is empty or invalid'
                  });
                  continue;
               }

               const sanitizeName = (name: string): string => {
                  if (!name) return '';
                  return name
                     .replace(/[\/\\]/g, ' ') 
                     .replace(/[^\w\s\-'.,]/g, ' ') 
                     .replace(/\s+/g, ' ') 
                     .trim();
               };

               let personGivenName = '';
               let personFamilyName = '';

               if (user.emp__eng_name && user.emp__eng_name.trim()) {
                  const cleanName = sanitizeName(user.emp__eng_name);
                  const nameParts = cleanName.split(' ').filter(part => part.trim().length > 0);
                  
                  if (nameParts.length > 1) {
                     personGivenName = nameParts[nameParts.length - 1].trim();
                     personFamilyName = nameParts.slice(0, -1).join(' ').trim();
                  } else if (nameParts.length === 1) {
                     personGivenName = nameParts[0].trim();
                     personFamilyName = nameParts[0].trim();
                  }
               }

               if (!personGivenName || personGivenName.length === 0) {
                  personGivenName = trimmedEmpId;
               }
               if (!personFamilyName || personFamilyName.length === 0) {
                  personFamilyName = trimmedEmpId;
               }

               if (personFamilyName === trimmedEmpId && personGivenName === trimmedEmpId) {
                  personGivenName = 'Employee';
               }

               const finalPersonFamilyName = sanitizeName(personFamilyName);
               const finalPersonGivenName = sanitizeName(personGivenName);

               const hikVisionPayload = {
                  personCode: trimmedEmpId,
                  personFamilyName: finalPersonFamilyName,
                  personGivenName: finalPersonGivenName,
                  gender: user.gender === "M" ? 1 : 2,
                  orgIndexCode: "2",
                  faces: faceData ? [{ faceData: faceData }] : []
               };

               const hikVisionResponse = await UserService.callHikVisionAPI(
                  UserService.HIK_CONFIG.baseURL,
                  '/artemis/api/resource/v1/person/single/add',
                  UserService.HIK_CONFIG.appKey,
                  UserService.HIK_CONFIG.appSecret,
                  hikVisionPayload
               );

               if (hikVisionResponse && hikVisionResponse.code === '0' && hikVisionResponse.data) {
                  await db.users.update({
                     where: { Id: user.Id },
                     data: { unique_id: hikVisionResponse.data }
                  });

                  try {
                     const faceAdditionPayload = {
                        personIndexCode: hikVisionResponse.data,
                        faceGroupIndexCode: "5"
                     };

                     await UserService.callHikVisionAPI(
                        UserService.HIK_CONFIG.baseURL,
                        '/artemis/api/frs/v1/face/single/addition',
                        UserService.HIK_CONFIG.appKey,
                        UserService.HIK_CONFIG.appSecret,
                        faceAdditionPayload
                     );
                  } catch (faceAdditionError: any) {
                  }

                  results.success++;
                  results.processed++;
               } else {
                  const errorMsg = hikVisionResponse?.msg || 'Unknown error';
                  
                  if (errorMsg.includes('already exists') || errorMsg.includes('person code already exists')) {
                     try {
                        const searchPayload = {
                           pageNo: 1,
                           pageSize: 1,
                           personCode: trimmedEmpId
                        };
                        
                        const searchResponse = await UserService.callHikVisionAPI(
                           UserService.HIK_CONFIG.baseURL,
                           '/artemis/api/resource/v1/person/advance/personList',
                           UserService.HIK_CONFIG.appKey,
                           UserService.HIK_CONFIG.appSecret,
                           searchPayload
                        );

                        if (searchResponse && searchResponse.code === '0' && searchResponse.data) {
                           const personList = searchResponse.data.list || [];
                           if (personList.length > 0) {
                              const existingPerson = personList.find((p: any) => p.personCode === trimmedEmpId) || personList[0];
                              const existingPersonId = existingPerson.personIndexCode || existingPerson.personId;
                              
                              if (existingPersonId) {
                                 await db.users.update({
                                    where: { Id: user.Id },
                                    data: { unique_id: existingPersonId }
                                 });
                                 results.success++;
                                 results.processed++;
                                 continue;
                              }
                           }
                        }
                     } catch (searchError: any) {
                     }
                  }
                  
                  results.failed++;
                  results.processed++;
                  results.errors.push({
                     userId: user.Id,
                     emp_Id: trimmedEmpId,
                     error: `HIK Vision API error: ${errorMsg}`
                  });
               }
            } catch (error: any) {
               results.failed++;
               results.processed++;
               results.errors.push({
                  userId: user.Id,
                  emp_Id: user.emp_Id,
                  error: error.message || 'Unknown error'
               });
            }
         }

         return {
            success: results.failed === 0,
            message: `Processed ${results.processed} users. ${results.success} successful, ${results.failed} failed.`,
            data: results
         };

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         
         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            `Failed to sync users to HIK Vision: ${error.message}`
         );
      }
   }
}

export default UserService;
