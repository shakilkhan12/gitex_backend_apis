import { STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import axios from "axios";

class UserService {

   protected static loginService = async (EmpCode: string, Password: string) => {
      console.log("🟢 [UserService] Attempting login for EmpCode:", EmpCode);

      try {
         // 1️⃣ Get SecretKey from Prisma
         const secretRecord = await db.access_secret.findFirst();
         if (!secretRecord?.value) {
            console.error("❌ [UserService] SecretKey not found in DB");
            throw new HttpException(STATUS.BAD_REQUEST, "Secret key not configured");
         }
         const secretKey = secretRecord.value;
         console.log("✅ [UserService] SecretKey retrieved successfully");

         // 2️⃣ Prepare payload for third-party API
         const payload = {
            EmpCode,
            Password,
            SecretKey: secretKey,
            Lang: "en"
         };
         console.log("📤 [UserService] Sending payload to third-party API:", payload);

         // 3️⃣ Call third-party API
         const response = await axios.post(
            "http://192.168.164.7/website_demo/middleware/?class=general&action=EmployeeLoginService",
            payload,
            {
               headers: { "Content-Type": "application/json" },
               timeout: 10000
            }
         );

         console.log("📥 [UserService] Third-party API response:", response.data);

         // 4️⃣ Return the response data
         return response.data;

      } catch (error: any) {
         console.error("💥 [UserService] Error during login:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Login failed");
      }
   };
}

export default UserService;
