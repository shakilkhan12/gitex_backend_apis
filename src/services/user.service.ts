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

   // Test mode: Set to true to use static secret key instead of fetching from API
   private static readonly USE_TEST_SECRET_KEY = false;
   private static readonly TEST_SECRET_KEY = 'TWpBeU5TOHhNUzh5Tmc9PQ==';

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
         let endpoint = EmpCode === '5455' ? "https://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeLoginService" : "https://192.168.164.7/middleware/?class=general&action=EmployeeLoginService";
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
      all?: boolean; // If true, skip pagination and return all users
   } = {}) => {

      try {
         // If all=true, skip pagination
         const skipPagination = filters?.all === true;
         const page = skipPagination ? 1 : (filters?.page || 1);
         const limit = skipPagination ? undefined : (filters?.limit || 10);
         const skip = skipPagination ? undefined : (page - 1) * (limit || 10);

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

         const usersPromise = db.users.findMany({
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
                  is_ai_login_user: true,
                  createdAt: true,
                  updatedAt: true,
                  landscaping_access: true,
                  plant_disease_access: true,
                  litter_detection_access: true,
                  users_roles: {
                     select: {
                        role_name: true,
                        users_permissions: {
                           select: {
                              park_landscaping_view: true,
                              park_landscaping_add: true,
                              park_landscaping_update: true,
                              park_plant_disease_view: true,
                              park_plant_disease_add: true,
                              park_plant_disease_update: true,
                              park_litter_detection_view: true,
                              park_litter_detection_add: true,
                              park_litter_detection_update: true
                           }
                        }
                     }
                  },
                  live_stream_favourites: false,
                  parks_attendance: false,
                  offices_attendance: false,
                  offices_footfall_analysis: false
               },
               orderBy: orderByClause,
               // Only apply pagination if not fetching all
               ...(skipPagination ? {} : { skip, take: limit })
            });

         const totalCountPromise = db.users.count({ where: whereClause });

         const [users, totalCount] = await Promise.all([usersPromise, totalCountPromise]);

         const imageFields = ['image'];
         const formattedUsers = formatImageUrlsInArray(users, imageFields);

         // Attach linked users for each returned user
         const parentIds = formattedUsers.map((u: any) => u.Id).filter((id: any) => id != null);
         const linkedChildren = parentIds.length
            ? await db.users.findMany({
               where: { linked_with_user_Id: { in: parentIds }, isDeleted:true },
               select: {
                  Id: true,
                  linked_with_user_Id: true,
                  gender: true,
                  image: true,
                  emp__eng_name: true,
                  emp__arabic_name: true,
               }
            })
            : [];

         const formattedLinkedChildren = formatImageUrlsInArray(linkedChildren, imageFields);
         const linkedByParentId = new Map<number, any[]>();
         for (const child of formattedLinkedChildren as any[]) {
            const parentId = Number(child.linked_with_user_Id);
            if (!linkedByParentId.has(parentId)) linkedByParentId.set(parentId, []);
            linkedByParentId.get(parentId)!.push(child);
         }

         const usersWithLinked = (formattedUsers as any[]).map(u => ({
            ...u,
            linkedUsers: linkedByParentId.get(Number(u.Id)) || []
         }));

         // If fetching all, return without pagination metadata
         if (skipPagination) {
            return {
               success: true,
               data: usersWithLinked,
               pagination: {
                  currentPage: 1,
                  totalPages: 1,
                  totalCount,
                  limit: totalCount,
                  hasNextPage: false,
                  hasPreviousPage: false,
                  nextPage: null,
                  previousPage: null
               }
            };
         }

         const actualLimit = limit || 10;
         const totalPages = Math.ceil(totalCount / actualLimit);
         const hasNextPage = page < totalPages;
         const hasPreviousPage = page > 1;

         const paginationData = {
            currentPage: page,
            totalPages,
            totalCount,
            limit: actualLimit,
            hasNextPage,
            hasPreviousPage,
            nextPage: hasNextPage ? page + 1 : null,
            previousPage: hasPreviousPage ? page - 1 : null
         };

         return {
            success: true,
            data: usersWithLinked,
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

   /**
    * Resolve the first-entry camera for a visitor from office/park sentiments,
    * footfalls, and behaviour alerts (earliest record by time across all data).
    */
   private static getFirstEntryCameraForVisitor = async (
      visitorId: number,
      visitorCreatedAt: Date | null
   ): Promise<{ type: 'office' | 'park'; cameraId: number; cameraNameEn: string | null; cameraNameAr: string | null } | null> => {
      const visitorDate = visitorCreatedAt ? new Date(visitorCreatedAt) : new Date(0);
      visitorDate.setHours(0, 0, 0, 0);
      const visitorIdStr = String(visitorId);

      type Candidate = { at: Date; type: 'office' | 'park'; cameraId: number; nameEn: string | null; nameAr: string | null };

      const candidates: Candidate[] = [];

      const [firstOfficeSentiment, firstParkSentiment, firstOfficeFootfall, firstParkFootfall, firstBehaviour] = await Promise.all([
         db.offices_sentiment_analysis.findFirst({
            where: {
               person_Id: visitorIdStr,
               sentiment_of: 'visitor'
            },
            orderBy: { createdAt: 'asc' },
            select: { entry_camera_Id: true, createdAt: true }
         }),
         db.parks_sentiment_analysis.findFirst({
            where: {
               person_Id: visitorIdStr,
               sentiment_of: 'visitor'
            },
            orderBy: { createdAt: 'asc' },
            select: { entry_camera_Id: true, createdAt: true }
         }),
         db.offices_footfall_analysis.findFirst({
            where: {
               person_Id: visitorId
            },
            orderBy: { time: 'asc' },
            select: { detected_camera_Id: true, time: true }
         }),
         db.parks_footfall_analysis.findFirst({
            where: {
               person_Id: visitorId
            },
            orderBy: { time: 'asc' },
            select: { detected_camera_Id: true, time: true }
         }),
         db.parks_behaviour_alerts.findFirst({
            where: {
               person_Id: visitorIdStr,
               is_employee: false
            },
            orderBy: { detection_date: 'asc' },
            select: { camera_Id: true, detection_date: true, detection_time: true }
         })
      ]);

      // Resolve office sentiment camera
      if (firstOfficeSentiment?.entry_camera_Id) {
         const cam = await db.offices_cameras.findUnique({
            where: { Id: firstOfficeSentiment.entry_camera_Id },
            select: { Id: true, camera_english_name: true, camera_arabic_name: true }
         });
         if (cam)
            candidates.push({
               at: firstOfficeSentiment.createdAt || visitorDate,
               type: 'office',
               cameraId: cam.Id,
               nameEn: cam.camera_english_name,
               nameAr: cam.camera_arabic_name
            });
      }

      // Resolve park sentiment camera
      if (firstParkSentiment?.entry_camera_Id) {
         const cam = await db.park_cameras.findUnique({
            where: { Id: firstParkSentiment.entry_camera_Id },
            select: { Id: true, camera_english_name: true, camera_arabic_name: true }
         });
         if (cam)
            candidates.push({
               at: firstParkSentiment.createdAt || visitorDate,
               type: 'park',
               cameraId: cam.Id,
               nameEn: cam.camera_english_name,
               nameAr: cam.camera_arabic_name
            });
      }

      // Resolve office footfall camera (detected_camera_Id is string, match offices_cameras.camera_Id)
      if (firstOfficeFootfall?.detected_camera_Id) {
         const cam = await db.offices_cameras.findFirst({
            where: { camera_Id: firstOfficeFootfall.detected_camera_Id },
            select: { Id: true, camera_english_name: true, camera_arabic_name: true }
         });
         if (cam)
            candidates.push({
               at: firstOfficeFootfall.time,
               type: 'office',
               cameraId: cam.Id,
               nameEn: cam.camera_english_name,
               nameAr: cam.camera_arabic_name
            });
      }

      // Resolve park footfall camera
      if (firstParkFootfall?.detected_camera_Id) {
         const cam = await db.park_cameras.findFirst({
            where: { camera_Id: firstParkFootfall.detected_camera_Id },
            select: { Id: true, camera_english_name: true, camera_arabic_name: true }
         });
         if (cam)
            candidates.push({
               at: firstParkFootfall.time,
               type: 'park',
               cameraId: cam.Id,
               nameEn: cam.camera_english_name,
               nameAr: cam.camera_arabic_name
            });
      }

      // Behaviour camera (park_cameras)
      if (firstBehaviour?.camera_Id) {
         const cam = await db.park_cameras.findUnique({
            where: { Id: firstBehaviour.camera_Id },
            select: { Id: true, camera_english_name: true, camera_arabic_name: true }
         });
         if (cam) {
            const at = firstBehaviour.detection_date && firstBehaviour.detection_time
               ? new Date(
                  new Date(firstBehaviour.detection_date).toDateString() + ' ' + new Date(firstBehaviour.detection_time).toTimeString()
               )
               : (firstBehaviour.detection_date as Date) || visitorDate;
            candidates.push({
               at: at instanceof Date ? at : visitorDate,
               type: 'park',
               cameraId: cam.Id,
               nameEn: cam.camera_english_name,
               nameAr: cam.camera_arabic_name
            });
         }
      }

      // If no entry camera found, fallback: any camera from any related record on the same date as visitor
      if (candidates.length === 0 && visitorCreatedAt) {
         const visitorDateEnd = new Date(visitorDate);
         visitorDateEnd.setDate(visitorDateEnd.getDate() + 1);
         const [fallbackOffice, fallbackPark, fallbackOfficeFootfall, fallbackParkFootfall, fallbackBehaviour] = await Promise.all([
            db.offices_sentiment_analysis.findFirst({
               where: {
                  person_Id: visitorIdStr,
                  sentiment_of: 'visitor',
                  createdAt: { gte: visitorDate, lt: visitorDateEnd },
                  entry_camera_Id: { not: null }
               },
               orderBy: { createdAt: 'asc' },
               select: { entry_camera_Id: true }
            }),
            db.parks_sentiment_analysis.findFirst({
               where: {
                  person_Id: visitorIdStr,
                  sentiment_of: 'visitor',
                  createdAt: { gte: visitorDate, lt: visitorDateEnd },
                  entry_camera_Id: { not: null }
               },
               orderBy: { createdAt: 'asc' },
               select: { entry_camera_Id: true }
            }),
            db.offices_footfall_analysis.findFirst({
               where: { person_Id: visitorId, time: { gte: visitorDate, lt: visitorDateEnd } },
               orderBy: { time: 'asc' },
               select: { detected_camera_Id: true }
            }),
            db.parks_footfall_analysis.findFirst({
               where: { person_Id: visitorId, time: { gte: visitorDate, lt: visitorDateEnd } },
               orderBy: { time: 'asc' },
               select: { detected_camera_Id: true }
            }),
            db.parks_behaviour_alerts.findFirst({
               where: { person_Id: visitorIdStr, is_employee: false, camera_Id: { not: null }, detection_date: { gte: visitorDate, lt: visitorDateEnd } },
               orderBy: { detection_date: 'asc' },
               select: { camera_Id: true }
            })
         ]);
         if (fallbackOffice?.entry_camera_Id) {
            const cam = await db.offices_cameras.findUnique({ where: { Id: fallbackOffice.entry_camera_Id }, select: { Id: true, camera_english_name: true, camera_arabic_name: true } });
            if (cam) return { type: 'office', cameraId: cam.Id, cameraNameEn: cam.camera_english_name, cameraNameAr: cam.camera_arabic_name };
         }
         if (fallbackPark?.entry_camera_Id) {
            const cam = await db.park_cameras.findUnique({ where: { Id: fallbackPark.entry_camera_Id }, select: { Id: true, camera_english_name: true, camera_arabic_name: true } });
            if (cam) return { type: 'park', cameraId: cam.Id, cameraNameEn: cam.camera_english_name, cameraNameAr: cam.camera_arabic_name };
         }
         if (fallbackOfficeFootfall?.detected_camera_Id) {
            const cam = await db.offices_cameras.findFirst({ where: { camera_Id: fallbackOfficeFootfall.detected_camera_Id }, select: { Id: true, camera_english_name: true, camera_arabic_name: true } });
            if (cam) return { type: 'office', cameraId: cam.Id, cameraNameEn: cam.camera_english_name, cameraNameAr: cam.camera_arabic_name };
         }
         if (fallbackParkFootfall?.detected_camera_Id) {
            const cam = await db.park_cameras.findFirst({ where: { camera_Id: fallbackParkFootfall.detected_camera_Id }, select: { Id: true, camera_english_name: true, camera_arabic_name: true } });
            if (cam) return { type: 'park', cameraId: cam.Id, cameraNameEn: cam.camera_english_name, cameraNameAr: cam.camera_arabic_name };
         }
         if (fallbackBehaviour?.camera_Id) {
            const cam = await db.park_cameras.findUnique({ where: { Id: fallbackBehaviour.camera_Id }, select: { Id: true, camera_english_name: true, camera_arabic_name: true } });
            if (cam) return { type: 'park', cameraId: cam.Id, cameraNameEn: cam.camera_english_name, cameraNameAr: cam.camera_arabic_name };
         }
      }

      if (candidates.length === 0) return null;
      const first = candidates.reduce((min, c) => (c.at < min.at ? c : min));
      return {
         type: first.type,
         cameraId: first.cameraId,
         cameraNameEn: first.nameEn,
         cameraNameAr: first.nameAr
      };
   };

   public static getVisitorsService = async (filters: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      gender?: string;
      cameraFilter?: string;
      startDate?: string;
      endDate?: string;
   } = {}) => {
      const startTime = Date.now();
      const log = (msg: string, data?: object) => {
         const elapsed = Date.now() - startTime;
         console.log(`[getVisitors] +${elapsed}ms ${msg}`, data ?? '');
      };
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
               },
               
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

         const dateRange: { gte?: Date; lte?: Date } = {};
         if (filters?.startDate) {
            const start = new Date(filters.startDate);
            if (!isNaN(start.getTime())) dateRange.gte = start;
         }
         if (filters?.endDate) {
            const end = new Date(filters.endDate);
            if (!isNaN(end.getTime())) dateRange.lte = end;
         }
         if (Object.keys(dateRange).length > 0) {
            whereClause.AND.push({ createdAt: dateRange });
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

         const useCameraFilter = Boolean(filters?.cameraFilter && String(filters.cameraFilter).trim());

         const [officeCameras, parkCameras] = await Promise.all([
            db.offices_cameras.findMany({
               select: { Id: true, camera_Id: true, camera_english_name: true, camera_arabic_name: true },
               orderBy: { camera_english_name: 'asc' }
            }),
            db.park_cameras.findMany({
               select: { Id: true, camera_Id: true, camera_english_name: true, camera_arabic_name: true },
               orderBy: { camera_english_name: 'asc' }
            })
         ]);

         const uniqueByCameraId = <T extends { camera_Id: string | null; Id: number }>(items: T[]) => {
            const seen = new Set<string>();
            return items.filter(i => {
               const key = (i.camera_Id || String(i.Id)).trim();
               if (seen.has(key)) return false;
               seen.add(key);
               return true;
            });
         };

         const cameras = {
            office: uniqueByCameraId(officeCameras).map(c => ({ id: c.Id, type: 'office' as const, nameEn: c.camera_english_name, nameAr: c.camera_arabic_name })),
            park: uniqueByCameraId(parkCameras).map(c => ({ id: c.Id, type: 'park' as const, nameEn: c.camera_english_name, nameAr: c.camera_arabic_name }))
         };

         let visitors: any[];
         let totalCount: number;

         if (useCameraFilter) {
            const parts = String(filters.cameraFilter || '').trim().split('_');
            const filterType = parts[0] ? String(parts[0]).toLowerCase() : '';
            const filterIdStr = parts[1];
            const filterId = filterIdStr != null && filterIdStr !== '' ? parseInt(String(filterIdStr), 10) : NaN;
            if (!filterType || isNaN(filterId)) {
               visitors = [];
               totalCount = 0;
            } else {
               const visitorIdsSet = new Set<number>();
               if (filterType === 'office') {
                  const [officeSentimentPersons, officeCam] = await Promise.all([
                     db.offices_sentiment_analysis.findMany({
                        where: { entry_camera_Id: filterId, sentiment_of: 'visitor' },
                        select: { person_Id: true }
                     }),
                     db.offices_cameras.findUnique({ where: { Id: filterId }, select: { camera_Id: true } })
                  ]);
                  officeSentimentPersons.forEach(r => {
                     if (r.person_Id) {
                        const n = parseInt(String(r.person_Id), 10);
                        if (!isNaN(n)) visitorIdsSet.add(n);
                     }
                  });
                  if (officeCam?.camera_Id) {
                     const officeFootfall = await db.offices_footfall_analysis.findMany({
                        where: { detected_camera_Id: officeCam.camera_Id },
                        select: { person_Id: true }
                     });
                     officeFootfall.forEach(r => { if (r.person_Id != null) visitorIdsSet.add(r.person_Id); });
                  }
                  const officeNonNumeric = officeSentimentPersons.filter(r => r.person_Id && isNaN(parseInt(String(r.person_Id), 10))).map(r => String(r.person_Id));
                  if (officeNonNumeric.length > 0) {
                     const usersByUniqueId = await db.users.findMany({
                        where: { ...whereClause, unique_id: { in: officeNonNumeric } },
                        select: { Id: true }
                     });
                     usersByUniqueId.forEach(u => visitorIdsSet.add(u.Id));
                  }
               } else if (filterType === 'park') {
                  const [parkSentimentPersons, parkBehaviourPersons, parkCam] = await Promise.all([
                     db.parks_sentiment_analysis.findMany({
                        where: { entry_camera_Id: filterId, sentiment_of: 'visitor' },
                        select: { person_Id: true }
                     }),
                     db.parks_behaviour_alerts.findMany({
                        where: { camera_Id: filterId, is_employee: false },
                        select: { person_Id: true }
                     }),
                     db.park_cameras.findUnique({ where: { Id: filterId }, select: { camera_Id: true } })
                  ]);
                  parkSentimentPersons.forEach(r => {
                     if (r.person_Id) { const n = parseInt(String(r.person_Id), 10); if (!isNaN(n)) visitorIdsSet.add(n); }
                  });
                  parkBehaviourPersons.forEach(r => {
                     if (r.person_Id) { const n = parseInt(String(r.person_Id), 10); if (!isNaN(n)) visitorIdsSet.add(n); }
                  });
                  if (parkCam?.camera_Id) {
                     const parkFootfall = await db.parks_footfall_analysis.findMany({
                        where: { detected_camera_Id: parkCam.camera_Id },
                        select: { person_Id: true }
                     });
                     parkFootfall.forEach(r => { if (r.person_Id != null) visitorIdsSet.add(r.person_Id); });
                  }
                  const parkNonNumeric = [
                     ...parkSentimentPersons.filter(r => r.person_Id && isNaN(parseInt(String(r.person_Id), 10))),
                     ...parkBehaviourPersons.filter(r => r.person_Id && isNaN(parseInt(String(r.person_Id), 10)))
                  ].map(r => String(r.person_Id));
                  const parkNonNumericUniq = Array.from(new Set(parkNonNumeric));
                  if (parkNonNumericUniq.length > 0) {
                     const usersByUniqueId = await db.users.findMany({
                        where: { ...whereClause, isDeleted: false, unique_id: { in: parkNonNumericUniq } },
                        select: { Id: true }
                     });
                     usersByUniqueId.forEach(u => visitorIdsSet.add(u.Id));
                  }
               }
               const visitorIds = Array.from(visitorIdsSet);

               if (visitorIds.length === 0) {
                  visitors = [];
                  totalCount = 0;
               } else {
                  const whereWithCamera = { AND: [whereClause, { Id: { in: visitorIds } }] };
                  totalCount = await db.users.count({ where: whereWithCamera });
                  visitors = await db.users.findMany({
                     where: whereWithCamera,
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
                  });
               }
            }
         } else {
            const [visitorsList, count] = await Promise.all([
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
               db.users.count({ where: whereClause })
            ]);
            visitors = visitorsList;
            totalCount = count;
            log('visitors fetched from DB', { count: visitors.length, totalCount });
         }

         const statsStart = Date.now();
         let visitorsWithStats = await Promise.all(
            visitors.map(async (visitor) => {
               const visitorIdStr = visitor.Id.toString();
               const [officeSentimentCount, parkSentimentCount, behaviourAlertsCount, officeFootfallCount, parkFootfallCount, entryCamera] = await Promise.all([
                  db.offices_sentiment_analysis.count({
                     where: { person_Id: visitorIdStr, sentiment_of: 'visitor' }
                  }),
                  db.parks_sentiment_analysis.count({
                     where: { person_Id: visitorIdStr, sentiment_of: 'visitor' }
                  }),
                  db.parks_behaviour_alerts.count({
                     where: {
                        OR: [{ person_Id: visitorIdStr }, { person_Id: visitor.unique_id || '' }],
                        is_employee: false
                     }
                  }),
                  db.offices_footfall_analysis.count({ where: { person_Id: visitor.Id } }),
                  db.parks_footfall_analysis.count({ where: { person_Id: visitor.Id } }),
                  UserService.getFirstEntryCameraForVisitor(visitor.Id, visitor.createdAt)
               ]);

               return {
                  ...visitor,
                  totalSentiment: officeSentimentCount + parkSentimentCount,
                  totalBehaviourAlerts: behaviourAlertsCount,
                  totalFootfall: officeFootfallCount + parkFootfallCount,
                  entryCamera: entryCamera
                     ? {
                        type: entryCamera.type,
                        cameraId: entryCamera.cameraId,
                        cameraNameEn: entryCamera.cameraNameEn,
                        cameraNameAr: entryCamera.cameraNameAr
                     }
                     : null
               };
            })
         );
         log('stats and entry cameras resolved', { visitorCount: visitorsWithStats.length, durationMs: Date.now() - statsStart });

         let totalCountFinal = totalCount;
         if (useCameraFilter && filters?.cameraFilter) {
            const parts = String(filters.cameraFilter).trim().split('_');
            const filterType = parts[0] ? String(parts[0]).toLowerCase() : '';
            const filterId = parts[1] != null && parts[1] !== '' ? parseInt(String(parts[1]), 10) : NaN;
            if (filterType && !isNaN(filterId)) {
               const before = visitorsWithStats.length;
               visitorsWithStats = visitorsWithStats.filter((v: any) => {
                  const ec = v.entryCamera;
                  if (!ec) return false;
                  return (ec.type || '').toLowerCase() === filterType && Number(ec.cameraId) === filterId;
               });
               log('filtered by entry camera', { filterType, filterId, before, after: visitorsWithStats.length });
            }
         }

         const totalPages = Math.ceil(totalCountFinal / limit);
         const hasNextPage = page < totalPages;
         const hasPreviousPage = page > 1;

         const imageFields = ['image'];
         const formattedVisitors = formatImageUrlsInArray(visitorsWithStats, imageFields);

         const paginationData = {
            currentPage: page,
            totalPages,
            totalCount: totalCountFinal,
            limit: limit,
            hasNextPage,
            hasPreviousPage,
            nextPage: hasNextPage ? page + 1 : null,
            previousPage: hasPreviousPage ? page - 1 : null
         };

         log('response ready', { dataLength: formattedVisitors.length, totalCount: totalCountFinal, totalMs: Date.now() - startTime });
         return {
            success: true,
            data: formattedVisitors,
            pagination: paginationData,
            cameras
         };

      } catch (error: any) {
         console.error('[getVisitors] error', { elapsedMs: Date.now() - startTime, message: error?.message });
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

   /**
    * Switch visitor to employee: replace all visitor-related references in sentiments, footfalls, behaviour alerts
    * with the given employee Id, create attendance in/out records from sentiment check_in/check_out per day for both
    * offices and parks, then permanently delete the visitor from users table.
    */
   public static switchVisitorToEmployeeService = async (visitorId: number, employeeId: number) => {
      try {
         const visitor = await db.users.findUnique({
            where: { Id: visitorId }
         });
         if (!visitor) {
            throw new HttpException(STATUS.NOT_FOUND, "Visitor not found");
         }
         const isVisitor =
            (visitor.user_Id == null || visitor.user_Id === '') &&
            (visitor.emp_Id == null || visitor.emp_Id === '');
         if (!isVisitor) {
            throw new HttpException(STATUS.BAD_REQUEST, "Given user is not a visitor (has emp_Id or user_Id)");
         }

         const employee = await db.users.findUnique({
            where: { Id: employeeId }
         });
         if (!employee) {
            throw new HttpException(STATUS.NOT_FOUND, "Employee not found");
         }
         if (employeeId === visitorId) {
            throw new HttpException(STATUS.BAD_REQUEST, "Visitor and employee must be different users");
         }
         const hasEmpId = employee.emp_Id != null && employee.emp_Id !== '';
         if (!hasEmpId) {
            throw new HttpException(STATUS.BAD_REQUEST, "Given user is not an employee (no emp_Id)");
         }

         const visitorIdStr = visitorId.toString();
         const employeeIdStr = employeeId.toString();
         const visitorPersonIds = [visitorIdStr, ...(visitor.unique_id ? [visitor.unique_id] : [])];

         // Fetch visitor sentiments BEFORE update (to create attendance from check_in/check_out per day)
         const [officeSentiments, parkSentiments] = await Promise.all([
            db.offices_sentiment_analysis.findMany({
               where: {
                  OR: visitorPersonIds.map(pid => ({ person_Id: pid })),
                  sentiment_of: 'visitor'
               },
               select: {
                  office_Id: true,
                  check_in_date: true,
                  check_in_time: true,
                  check_in_image: true,
                  check_out_date: true,
                  check_out_time: true,
                  check_out_capture: true,
                  age_group: true,
                  gender: true
               }
            }),
            db.parks_sentiment_analysis.findMany({
               where: {
                  OR: visitorPersonIds.map(pid => ({ person_Id: pid })),
                  sentiment_of: 'visitor'
               },
               select: {
                  park_Id: true,
                  check_in_date: true,
                  check_in_time: true,
                  check_in_image: true,
                  check_out_date: true,
                  check_out_time: true,
                  check_out_capture: true,
                  age_group: true,
                  gender: true
               }
            })
         ]);

         // Sentiments: replace person_Id and set sentiment_of to employee
         await db.offices_sentiment_analysis.updateMany({
            where: {
               OR: visitorPersonIds.map(pid => ({ person_Id: pid })),
               sentiment_of: 'visitor'
            },
            data: { person_Id: employeeIdStr, sentiment_of: 'employee' }
         });

         await db.parks_sentiment_analysis.updateMany({
            where: {
               OR: visitorPersonIds.map(pid => ({ person_Id: pid })),
               sentiment_of: 'visitor'
            },
            data: { person_Id: employeeIdStr, sentiment_of: 'employee' }
         });

         // Create attendance records from sentiments: check_in_sentiment -> entry, check_out_sentiment -> exit
         const combineDateAndTime = (dateVal: Date | string | null, timeVal: Date | string | null): Date | null => {
            if (!dateVal) return null;
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return null;
            if (!timeVal) return d;
            const t = new Date(timeVal);
            if (isNaN(t.getTime())) return d;
            return new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds());
         };

         const parseGender = (val: string | number | null): number | null => {
            if (val == null) return null;
            if (typeof val === 'number') return val;
            const s = String(val).toLowerCase();
            if (s === 'm' || s === 'male' || s === '1') return 1;
            if (s === 'f' || s === 'female' || s === '0') return 0;
            const n = parseInt(String(val), 10);
            return isNaN(n) ? null : n;
         };

         // Group office sentiments by (office_Id, date) and create one attendance per day
         const officeAttendanceByDay = new Map<string, { office_Id: number | null; entry_time: Date | null; entry_image: string | null; exit_time: Date | null; exit_image: string | null; age_group: number | null; gender: number | null }>();
         for (const s of officeSentiments) {
            if (!s.office_Id) continue;
            const dateKey = `${s.office_Id}-${s.check_in_date ? new Date(s.check_in_date).toISOString().slice(0, 10) : 'nodate'}`;
            const entryTime = combineDateAndTime(s.check_in_date, s.check_in_time);
            const exitTime = combineDateAndTime(s.check_out_date, s.check_out_time);
            const existing = officeAttendanceByDay.get(dateKey);
            if (!existing) {
               officeAttendanceByDay.set(dateKey, {
                  office_Id: s.office_Id,
                  entry_time: entryTime,
                  entry_image: s.check_in_image,
                  exit_time: exitTime || null,
                  exit_image: s.check_out_capture || null,
                  age_group: s.age_group ?? null,
                  gender: parseGender(s.gender)
               });
            } else {
               if (entryTime && (!existing.entry_time || entryTime < existing.entry_time)) {
                  existing.entry_time = entryTime;
                  existing.entry_image = s.check_in_image || existing.entry_image;
               }
               if (exitTime && (!existing.exit_time || exitTime > existing.exit_time)) {
                  existing.exit_time = exitTime;
                  existing.exit_image = s.check_out_capture || existing.exit_image;
               }
            }
         }

         const officeAttList = Array.from(officeAttendanceByDay.entries()).map(([, v]) => v);
         const createdOfficeAttendances: Array<{ Id: number; office_Id: number; person_Id: number; entry_time: Date; exit_time?: Date }> = [];
         for (const att of officeAttList) {
            if (!att.office_Id || !att.entry_time) continue;
            try {
               const created = await db.offices_attendance.create({
                  data: {
                     office_Id: att.office_Id,
                     person_Id: employeeId,
                     entry_time: att.entry_time,
                     entry_image: att.entry_image ?? undefined,
                     exit_time: att.exit_time ?? undefined,
                     exit_image: att.exit_image ?? undefined,
                     age_group: att.age_group ?? undefined,
                     gender: att.gender ?? undefined
                  }
               });
               createdOfficeAttendances.push({
                  Id: created.Id,
                  office_Id: created.office_Id!,
                  person_Id: created.person_Id!,
                  entry_time: created.entry_time!,
                  exit_time: created.exit_time ?? undefined
               });
              
            } catch (attErr: any) {
               console.log('[switchVisitorToEmployee] Error creating office attendance:', attErr?.message);
            }
         }

         // Group park sentiments by (park_Id, date) and create one attendance per day
         const parkAttendanceByDay = new Map<string, { park_Id: number | null; entry_time: Date | null; entry_image: string | null; exit_time: Date | null; exit_image: string | null; age_group: number | null; gender: number | null }>();
         for (const s of parkSentiments) {
            if (!s.park_Id) continue;
            const dateKey = `${s.park_Id}-${s.check_in_date ? new Date(s.check_in_date).toISOString().slice(0, 10) : 'nodate'}`;
            const entryTime = combineDateAndTime(s.check_in_date, s.check_in_time);
            const exitTime = combineDateAndTime(s.check_out_date, s.check_out_time);
            const existing = parkAttendanceByDay.get(dateKey);
            if (!existing) {
               parkAttendanceByDay.set(dateKey, {
                  park_Id: s.park_Id,
                  entry_time: entryTime,
                  entry_image: s.check_in_image,
                  exit_time: exitTime || null,
                  exit_image: s.check_out_capture || null,
                  age_group: s.age_group ?? null,
                  gender: parseGender(s.gender)
               });
            } else {
               if (entryTime && (!existing.entry_time || entryTime < existing.entry_time)) {
                  existing.entry_time = entryTime;
                  existing.entry_image = s.check_in_image || existing.entry_image;
               }
               if (exitTime && (!existing.exit_time || exitTime > existing.exit_time)) {
                  existing.exit_time = exitTime;
                  existing.exit_image = s.check_out_capture || existing.exit_image;
               }
            }
         }

         const parkAttList = Array.from(parkAttendanceByDay.entries()).map(([, v]) => v);
         const createdParkAttendances: Array<{ Id: number; park_Id: number; person_Id: number; entry_time: Date; exit_time?: Date }> = [];
         for (const att of parkAttList) {
            if (!att.park_Id || !att.entry_time) continue;
            try {
               const created = await db.parks_attendance.create({
                  data: {
                     park_Id: att.park_Id,
                     person_Id: employeeId,
                     entry_time: att.entry_time,
                     entry_image: att.entry_image ?? undefined,
                     exit_time: att.exit_time ?? undefined,
                     exit_image: att.exit_image ?? undefined,
                     age_group: att.age_group ?? undefined,
                     gender: att.gender ?? undefined
                  }
               });
               createdParkAttendances.push({
                  Id: created.Id,
                  park_Id: created.park_Id!,
                  person_Id: created.person_Id!,
                  entry_time: created.entry_time!,
                  exit_time: created.exit_time ?? undefined
               });
              
            } catch (attErr: any) {
               console.log('[switchVisitorToEmployee] Error creating park attendance:', attErr?.message);
            }
         }

        

         // Footfalls: replace person_Id (Int)
         await db.offices_footfall_analysis.updateMany({
            where: { person_Id: visitorId },
            data: { person_Id: employeeId }
         });

         await db.parks_footfall_analysis.updateMany({
            where: { person_Id: visitorId },
            data: { person_Id: employeeId }
         });

         // Behaviour alerts (parks): replace person_Id and set is_employee true
         await db.parks_behaviour_alerts.updateMany({
            where: {
               OR: visitorPersonIds.map(pid => ({ person_Id: pid })),
               is_employee: false
            },
            data: { person_Id: employeeIdStr, is_employee: true }
         });

         // const visitorUniqueId = visitor.unique_id;
         // update the linked_with_user_Id of the visitor from users table
         await db.users.update({
            where: { Id: visitorId },
            data: { linked_with_user_Id: employeeId, isDeleted: true }
         });
         

         // if (visitorUniqueId) {
         //    try {
         //       const visitorToDelete = {
         //          personId: visitorUniqueId,
         //       };
         //       const deleteFromHikVisionResponse = await UserService.callHikVisionAPI(
         //          UserService.HIK_CONFIG.baseURL,
         //          '/artemis/api/resource/v1/person/single/delete',
         //          UserService.HIK_CONFIG.appKey,
         //          UserService.HIK_CONFIG.appSecret,
         //          visitorToDelete
         //       );
         //       console.log('deleteFromHikVisionResponse', deleteFromHikVisionResponse)
         //       if (deleteFromHikVisionResponse && deleteFromHikVisionResponse.code === '0') {
         //          console.log('User deleted from HikVision successfully');
         //       } else {
         //          console.log('Failed to delete user from HikVision');
         //       }
         //    } catch (hikVisionError: any) {
         //       console.log('Error deleting user from HikVision', hikVisionError);
         //    }
         // }

         return {
            success: true,
            message: "Visitor records switched to employee successfully",
            visitorId,
            employeeId,
            employeeName: employee.emp__eng_name || employee.emp__arabic_name || null,
         };
      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }
         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            error?.message || "Failed to switch visitor to employee"
         );
      }
   };

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
            console.log('User not found', emp_Id);
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
                        visitors_view: true,
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
      // Use static secret key for testing if enabled
      if (this.USE_TEST_SECRET_KEY) {
         console.log('[UserService] 🧪 Using static test secret key (bypassing API)');
         return this.TEST_SECRET_KEY;
      }

      const maxRetries = 3;
      const baseTimeout = 20000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
         try {
            if (attempt > 1) {
               console.log(`[UserService] 🔄 Retrying secret key fetch (attempt ${attempt}/${maxRetries})...`);
            } else {
               console.log('[UserService] 🔑 Fetching secret key from API...');
            }

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
               console.log('[UserService] ✅ Secret key fetched successfully');
               return response.data.SecretKey;
            }

            console.error('[UserService] ❌ Secret key not found in API response');
            throw new HttpException(
               STATUS.BAD_REQUEST,
               "Secret key not found in API response"
            );
         } catch (error: any) {

            if (axios.isAxiosError(error)) {
               if (error.code === 'ECONNABORTED') {
                  console.warn(`[UserService] ⚠️ Secret key API request timed out (attempt ${attempt}/${maxRetries})`);
                  if (attempt === maxRetries) {
                     console.error('[UserService] ❌ Secret key API request timed out after all retries');
                     throw new HttpException(STATUS.BAD_REQUEST, `Secret key API request timed out after ${maxRetries} attempts`);
                  }
                  continue;
               } else if (error.code === 'ECONNREFUSED') {
                  console.error('[UserService] ❌ Unable to connect to secret key API');
                  throw new HttpException(STATUS.BAD_REQUEST, "Unable to connect to secret key API");
               } else if (error.response) {
                  console.error('[UserService] ❌ Secret key API error:', {
                     status: error.response.status,
                     statusText: error.response.statusText
                  });
                  throw new HttpException(STATUS.BAD_REQUEST, `Secret key API error: ${error.response.status} - ${error.response.statusText}`);
               }
            }

            if (attempt === maxRetries) {
               console.error(`[UserService] ❌ Failed to fetch secret from API after ${maxRetries} attempts:`, error.message);
               throw new HttpException(
                  STATUS.BAD_REQUEST,
                  `Failed to fetch secret from API after ${maxRetries} attempts: ${error.message}`
               );
            }

            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`[UserService] ⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
         }
      }

      console.error('[UserService] ❌ Failed to fetch secret key after all retry attempts');
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
      const startTime = Date.now();
      const syncStartTime = new Date();

      try {
         console.log('[UserService] 🔄 Starting user sync process...');
         console.log('[UserService] Sync started at:', syncStartTime.toLocaleString());

         if (onStatus) {
            onStatus({ message: 'Authenticating...' });
         }

         console.log('[UserService] 🔐 Authenticating with secret key API...');
         const secretKey = await this.fetchSecretFromAPI();
         console.log('[UserService] ✅ Authentication successful');

         if (onStatus) {
            onStatus({ message: 'Fetching employee data from intranet...' });
         }

         console.log('[UserService] 📡 Fetching employee listing from intranet API...');
         const payload = {
            SecretKey: `${secretKey}`,
            Lang: "en"
         };

         const endpoint = "https://192.168.164.7/middleware/?class=general&action=EmployeeListingUpdated";
         const requestTimeout = 90000;

         console.log('[UserService] 📤 Request details:', {
            endpoint,
            payload: { ...payload, SecretKey: '***hidden***' },
            timeout: `${requestTimeout}ms (${requestTimeout / 1000}s)`
         });

         const requestStartTime = Date.now();
         const response = await axios.post(
            endpoint,
            payload,
            {
               headers: {
                  'Content-Type': 'application/json',
               },
               timeout: requestTimeout,
               httpsAgent: new https.Agent({
                  rejectUnauthorized: false
               })
            }
         )

         const requestDuration = ((Date.now() - requestStartTime) / 1000).toFixed(2);
         console.log(`[UserService] ⏱️ Request completed in ${requestDuration}s`);

         // Log the full response from HikVision API endpoint
         console.log('[UserService] 📥 HikVision API Response:', {
            status: response.status,
            statusText: response.statusText,
            responseData: {
               status: response.data?.status,
               code: response.data?.code,
               userListingCount: response.data?.data?.UserListing?.length || 0,
               hasUserListing: !!response.data?.data?.UserListing,
               isUserListingArray: Array.isArray(response.data?.data?.UserListing)
            },
            fullResponse: JSON.stringify(response.data, null, 2)
         });

         // Handle response - use empty array if UserListing is missing or not an array
         const userListing = Array.isArray(response.data?.data?.UserListing)
            ? response.data.data.UserListing
            : [];
         console.log('[UserService] ✅ Received employee listing:', {
            totalEmployees: userListing.length,
            responseStatus: response.data?.status,
            responseCode: response.data?.code,
            responseTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
         });

         let successCount = 0;
         let errorCount = 0;
         let deletedCount = 0;
         let updatedCount = 0;
         let createdCount = 0;

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

         console.log('[UserService] 🔄 Starting to process', userListing.length, 'employees...');

         let currentIndex = 0;
         const processStartTime = Date.now();
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
                        console.warn(`[UserService] ⚠️ Failed to update HikVision face for user ${userData.EmpCode}:`, hikVisionError.message);
                     }
                  }

                  updatedCount++;
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
                                    faceGroupIndexCode: "11"
                                 };

                                 await UserService.callHikVisionAPI(
                                    UserService.HIK_CONFIG.baseURL,
                                    '/artemis/api/frs/v1/face/single/addition',
                                    UserService.HIK_CONFIG.appKey,
                                    UserService.HIK_CONFIG.appSecret,
                                    faceAdditionPayload
                                 );
                              } catch (faceAdditionError: any) {
                                 console.warn(`[UserService] ⚠️ Failed to add face to HikVision group for user ${userData.EmpCode}:`, faceAdditionError.message);
                              }
                           }
                        }
                     } catch (hikVisionError: any) {
                        console.warn(`[UserService] ⚠️ Failed to upload user ${userData.EmpCode} to HikVision:`, hikVisionError.message);
                     }
                  }

                  createdCount++;
                  successCount++;
               }

               // Log progress every 50 users or at milestones
               if (currentIndex % 50 === 0 || currentIndex === userListing.length) {
                  const progressPercent = ((currentIndex / userListing.length) * 100).toFixed(1);
                  const elapsedTime = ((Date.now() - processStartTime) / 1000).toFixed(2);
                  const avgTimePerUser = (parseFloat(elapsedTime) / currentIndex).toFixed(3);
                  const estimatedRemaining = ((userListing.length - currentIndex) * parseFloat(avgTimePerUser)).toFixed(0);

                  console.log(`[UserService] 📊 Progress: ${currentIndex}/${userListing.length} (${progressPercent}%) | Success: ${successCount} | Errors: ${errorCount} | Updated: ${updatedCount} | Created: ${createdCount} | Elapsed: ${elapsedTime}s | Avg: ${avgTimePerUser}s/user | ETA: ${estimatedRemaining}s`);
               }

               if (onProgress && (currentIndex % 10 === 0 || currentIndex === userListing.length)) {
                  onProgress({
                     current: currentIndex,
                     total: userListing.length,
                     processed: successCount,
                     errors: errorCount
                  });
               }

            } catch (userError: any) {
               errorCount++;
               // Error logging removed - only counting errors

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

         const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
         const processDuration = ((Date.now() - processStartTime) / 1000).toFixed(2);

         const summary = {
            total: userListing.length,
            processed: successCount,
            errors: errorCount,
            deleted: deletedCount,
            updated: updatedCount,
            created: createdCount
         };

         console.log('[UserService] ✅ User sync completed successfully!');
         console.log('[UserService] 📈 Summary:', {
            totalEmployees: summary.total,
            successfullyProcessed: summary.processed,
            updated: summary.updated,
            created: summary.created,
            errors: summary.errors,
            deleted: summary.deleted,
            successRate: summary.total > 0 ? `${((summary.processed / summary.total) * 100).toFixed(2)}%` : 'N/A',
            totalDuration: `${totalDuration}s`,
            processingDuration: `${processDuration}s`,
            averageTimePerUser: summary.total > 0 ? `${(parseFloat(processDuration) / summary.total).toFixed(3)}s` : 'N/A'
         });
         console.log('[UserService] Sync completed at:', new Date().toLocaleString());

         const result = {
            message: "Employee listing fetch and store completed - existing users updated, new users created, obsolete users deleted (excluding EMP001)",
            summary
         };

         return result;

      } catch (error: any) {
         // Log error response if it's an axios error with response data
         if (axios.isAxiosError(error) && error.response) {
            console.log('[UserService] 📥 Error Response from API:', {
               status: error.response.status,
               statusText: error.response.statusText,
               data: error.response.data,
               fullResponse: JSON.stringify(error.response.data, null, 2)
            });
         } else {
            // Log other errors without throwing
            console.log('[UserService] ⚠️ Error occurred:', {
               message: error.message,
               type: error.constructor.name
            });
         }

         // Return success response even on error since we're only logging
         const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
         return {
            message: "Response logged (error occurred but not thrown)",
            summary: {
               total: 0,
               processed: 0,
               errors: 1,
               deleted: 0,
               updated: 0,
               created: 0
            },
            duration: `${totalDuration}s`
         };
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
               const response1 = await urlToBase64(imageUrl);

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
                        faceGroupIndexCode: "11"
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

   public static updateUserImageOnHikVisionService = async (empId: string) => {
      try {
         const user = await db.users.findFirst({
            where: {
               emp_Id: empId
            },
            select: {
               Id: true,
               emp_Id: true,
               emp__eng_name: true,
               unique_id: true,
               actuall_image: true,
               image: true,
               gender: true
            }
         });

         if (!user) {
            throw new HttpException(STATUS.NOT_FOUND, `User with emp_Id ${empId} not found`);
         }

         if (!user.unique_id) {
            throw new HttpException(STATUS.BAD_REQUEST, `User with emp_Id ${empId} does not have a unique_id. Please sync to HikVision first.`);
         }

         if (!user.image) {
            throw new HttpException(STATUS.BAD_REQUEST, `User with emp_Id ${empId} does not have an image`);
         }

         // Get face data from user.image (can be HTTP URL, local file path, etc.)
         let faceData: string | null = null;
         let lastError: string | null = null;

         try {
            // First, always try local file path if it's a relative path
            if (!user.image.startsWith('http')) {
               const filePath = path.join(process.cwd(), user.image.replace(/^\//, ''));
               console.log(`[UserService] Checking local file path: ${filePath}`);

               if (fs.existsSync(filePath)) {
                  console.log(`[UserService] ✅ Local file exists, reading...`);
                  try {
                     const imageBuffer = fs.readFileSync(filePath);
                     if (imageBuffer && imageBuffer.length > 0) {
                        faceData = imageBuffer.toString('base64');
                        console.log(`[UserService] ✅ Successfully read local file and converted to base64 (length: ${faceData.length})`);
                     } else {
                        lastError = 'Local file is empty';
                        console.log(`[UserService] ❌ ${lastError}`);
                     }
                  } catch (fileError: any) {
                     lastError = `Failed to read local file: ${fileError.message}`;
                     console.log(`[UserService] ❌ ${lastError}`);
                  }
               } else {
                  console.log(`[UserService] Local file not found at: ${filePath}`);
               }
            }

            // If local file didn't work, try as URL
            if (!faceData) {
               let imageUrl: string;

               if (user.image.startsWith('http')) {
                  imageUrl = user.image;
               } else {
                  const apiBaseUrl = process.env.API_BASE_URL || 'http://10.160.133.77:5000';
                  imageUrl = `${apiBaseUrl}${user.image}`;
               }

               console.log(`[UserService] Trying to fetch image from URL: ${imageUrl}`);

               try {
                  console.log(`[UserService] Fetching image from: ${imageUrl}`);

                  // Use axios for more reliable HTTP requests
                  const response = await axios.get(imageUrl, {
                     responseType: 'arraybuffer',
                     timeout: 30000,
                     httpsAgent: imageUrl.startsWith('https')
                        ? new https.Agent({ rejectUnauthorized: false })
                        : undefined
                  });

                  if (response.data && response.data.length > 0) {
                     faceData = Buffer.from(response.data).toString('base64');
                     console.log(`[UserService] ✅ Successfully fetched image from URL and converted to base64 (length: ${faceData.length})`);
                  } else {
                     throw new Error('Response body is empty');
                  }
               } catch (urlError: any) {
                  lastError = `Failed to fetch image from URL ${imageUrl}: ${urlError.message || urlError.response?.statusText || 'Unknown error'}`;
                  console.log(`[UserService] ❌ ${lastError}`);
               }
            }
         } catch (imageError: any) {
            lastError = imageError.message || 'Unknown error';
            console.log(`[UserService] ❌ Error processing image: ${lastError}`);
            throw new HttpException(STATUS.BAD_REQUEST, `Failed to process image: ${lastError}. Image path: ${user.image}`);
         }

         if (!faceData || faceData.length === 0) {
            const errorMessage = lastError
               ? `Failed to convert image to base64 for user ${empId}. ${lastError}. Image path: ${user.image}`
               : `Failed to convert image to base64 for user ${empId}. Image path: ${user.image}`;
            throw new HttpException(STATUS.BAD_REQUEST, errorMessage);
         }

         // First, verify the person exists in HikVision and get the correct personId
         let actualPersonId = user.unique_id;

         try {
            const searchPayload = {
               pageNo: 1,
               pageSize: 1,
               personCode: user.emp_Id
            };

            console.log('[UserService] Searching for person in HikVision...');
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
                  const foundPerson = personList.find((p: any) => p.personCode === user.emp_Id) || personList[0];
                  actualPersonId = foundPerson.personIndexCode || foundPerson.personId || user.unique_id;
                  console.log(`[UserService] Found person in HikVision with personId: ${actualPersonId}`);

                  // Update unique_id in database if it's different
                  if (actualPersonId !== user.unique_id) {
                     await db.users.update({
                        where: { Id: user.Id },
                        data: { unique_id: actualPersonId }
                     });
                     console.log(`[UserService] Updated unique_id in database from ${user.unique_id} to ${actualPersonId}`);
                  }
               } else {
                  throw new HttpException(STATUS.NOT_FOUND, `Person with emp_Id ${empId} not found in HikVision. Please sync the person first.`);
               }
            } else {
               throw new HttpException(STATUS.NOT_FOUND, `Person with emp_Id ${empId} not found in HikVision. Please sync the person first.`);
            }
         } catch (searchError: any) {
            if (searchError instanceof HttpException) {
               throw searchError;
            }
            console.log(`[UserService] ⚠️ Could not search for person, using stored unique_id: ${user.unique_id}`);
         }

         // Parse name for person data
         const nameParts = user.emp__eng_name ? user.emp__eng_name.trim().split(' ') : [];
         const personGivenName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
         const personFamilyName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : user.emp__eng_name || '';

         // Use person update endpoint with face data (face update endpoint is not supported)
         const personUpdatePayload = {
            personId: actualPersonId,
            personCode: user.emp_Id,
            personFamilyName: personFamilyName,
            personGivenName: personGivenName,
            gender: user.gender === "M" ? 1 : 2,
            orgIndexCode: "2",
            faces: [{ faceData: faceData }]
         };

         console.log('[UserService] Updating person with face data using person update endpoint...');

         const hikVisionResponse = await UserService.callHikVisionAPI(
            UserService.HIK_CONFIG.baseURL,
            '/artemis/api/resource/v1/person/single/update',
            UserService.HIK_CONFIG.appKey,
            UserService.HIK_CONFIG.appSecret,
            personUpdatePayload
         );

         if (hikVisionResponse && hikVisionResponse.code === '0') {
            console.log('[UserService] ✅ Success with person update endpoint');
            return {
               success: true,
               message: `Successfully updated image on HikVision for user with emp_Id ${empId}`,
               data: {
                  userId: user.Id,
                  emp_Id: user.emp_Id,
                  emp__eng_name: user.emp__eng_name,
                  unique_id: actualPersonId
               }
            };
         } else {
            const errorMsg = hikVisionResponse?.msg || 'Unknown error';
            console.log(`[UserService] ❌ Face update failed: ${errorMsg}`);
            throw new HttpException(STATUS.BAD_REQUEST, `HikVision API error: ${errorMsg}`);
         }

      } catch (error: any) {
         if (error instanceof HttpException) {
            throw error;
         }

         throw new HttpException(
            STATUS.INTERNAL_SERVER_ERROR,
            `Failed to update user image on HikVision: ${error.message}`
         );
      }
   }

   /**
    * Upload all users with emp_Id to HikVision API
    * Gets all users where emp_Id is not empty, prepares payload and uploads to HikVision
    * Updates user.unique_id with the response from HikVision API on success
    * @returns Promise with upload results
    */
   public static uploadAllUsersWithEmpIdToHikVisionService = async () => {
      try {
         console.log('[UserService] 🔄 Starting upload of all users with emp_Id to HikVision...');

         const usersWithEmpId = await db.users.findMany({
            where: {
               AND: [
                  {
                     OR: [
                        { emp_Id: { not: null } },
                        { emp_Id: { not: '' } }
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
               image: true,
               unique_id: true
            }
         });

         if (usersWithEmpId.length === 0) {
            return {
               success: true,
               message: "No users with emp_Id found to upload",
               data: {
                  total: 0,
                  processed: 0,
                  success: 0,
                  failed: 0,
                  errors: []
               }
            };
         }

         console.log(`[UserService] 📊 Found ${usersWithEmpId.length} users with emp_Id to upload`);

         const results = {
            total: usersWithEmpId.length,
            processed: 0,
            success: 0,
            failed: 0,
            errors: [] as any[]
         };

         for (const user of usersWithEmpId) {
            try {
               // Get face data from user image
               let faceData: string | null = null;

               if (user.image) {
                  try {
                     let imageUrl: string;

                     if (user.image.startsWith('http')) {
                        imageUrl = user.image;
                     } else if (user.image.startsWith('/uploads/')) {
                        const filePath = path.join(process.cwd(), user.image.replace(/^\//, ''));
                        if (fs.existsSync(filePath)) {
                           const imageBuffer = fs.readFileSync(filePath);
                           faceData = imageBuffer.toString('base64');
                        } else {
                           const apiBaseUrl = process.env.API_BASE_URL
                           imageUrl = `${apiBaseUrl}${user.image}`;
                           const base64Image = await urlToBase64(imageUrl);
                           if (base64Image && typeof base64Image === 'string') {
                              faceData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
                           }
                        }
                     } else {
                        const apiBaseUrl = process.env.API_BASE_URL
                        imageUrl = `${apiBaseUrl}${user.image}`;
                        const base64Image = await urlToBase64(imageUrl);
                        if (base64Image && typeof base64Image === 'string') {
                           faceData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
                        }
                     }
                  } catch (imageError: any) {
                     console.warn(`[UserService] ⚠️ Failed to process image for user ${user.emp_Id}:`, imageError.message);
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

               // Prepare name parts
               const nameParts = user.emp__eng_name ? user.emp__eng_name.trim().split(' ') : [];
               const personGivenName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
               const personFamilyName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : user.emp__eng_name || '';

               // If name is empty, use emp_Id as fallback
               const finalPersonGivenName = personGivenName || trimmedEmpId;
               const finalPersonFamilyName = personFamilyName || trimmedEmpId;

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
                  console.log(`[UserService] ✅ Successfully uploaded user ${user.emp_Id} to HikVision`, hikVisionResponse.data);
                  await db.users.update({
                     where: { Id: user.Id },
                     data: { unique_id: hikVisionResponse.data, updatedAt: new Date() }
                  });

                  try {
                     const faceAdditionPayload = {
                        personIndexCode: hikVisionResponse.data,
                        faceGroupIndexCode: "11"
                     };

                     const faceAdditionResponse = await UserService.callHikVisionAPI(
                        UserService.HIK_CONFIG.baseURL,
                        '/artemis/api/frs/v1/face/single/addition',
                        UserService.HIK_CONFIG.appKey,
                        UserService.HIK_CONFIG.appSecret,
                        faceAdditionPayload
                     );
                     console.log(`[UserService] ✅ Successfully added face to HikVision group for user ${user.emp_Id}`, faceAdditionResponse);
                  } catch (faceAdditionError: any) {
                     console.warn(`[UserService] ⚠️ Failed to add face to HikVision group for user ${user.emp_Id}:`, faceAdditionError.message);
                  }

                  results.success++;
                  results.processed++;
                  console.log(`[UserService] ✅ Successfully uploaded user ${user.emp_Id} to HikVision`);
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
                                 console.log(`[UserService] ✅ Found existing person in HikVision and updated unique_id for user ${user.emp_Id}`);
                                 continue;
                              }
                           }
                        }
                     } catch (searchError: any) {
                        console.warn(`[UserService] ⚠️ Failed to search for existing person ${user.emp_Id}:`, searchError.message);
                     }
                  }

                  results.failed++;
                  results.processed++;
                  results.errors.push({
                     userId: user.Id,
                     emp_Id: trimmedEmpId,
                     error: `HIK Vision API error: ${errorMsg}`
                  });
                  console.warn(`[UserService] ❌ Failed to upload user ${user.emp_Id}: ${errorMsg}`);
               }
            } catch (error: any) {
               results.failed++;
               results.processed++;
               results.errors.push({
                  userId: user.Id,
                  emp_Id: user.emp_Id,
                  error: error.message || 'Unknown error'
               });
               console.error(`[UserService] ❌ Error processing user ${user.emp_Id}:`, error.message);
            }
         }

         console.log('[UserService] ✅ Upload process completed!');
         console.log('[UserService] 📈 Summary:', {
            total: results.total,
            processed: results.processed,
            success: results.success,
            failed: results.failed,
            successRate: results.total > 0 ? `${((results.success / results.total) * 100).toFixed(2)}%` : 'N/A'
         });

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
            `Failed to upload users to HikVision: ${error.message}`
         );
      }
   }
}

export default UserService;
