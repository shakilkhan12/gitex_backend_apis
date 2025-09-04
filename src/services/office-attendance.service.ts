import { OfficeAttendanceType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";

class OfficeAttendanceService {
   protected static addOfficeAttendanceService = async (attendance: OfficeAttendanceType) => {
      console.log("🟢 [OfficeAttendanceService] Adding new office attendance:", attendance);

      try {
         // Check if office exists
         const officeExists = await db.offices.findFirst({
            where: { Id: attendance.office_Id },
         });
         if (!officeExists) {
            console.error("❌ [OfficeAttendanceService] Office not found with Id:", attendance.office_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Office does not exist");
         }
         console.log("✅ [OfficeAttendanceService] Office exists:", officeExists.office_english_name);

         // Check if user exists
         const userExists = await db.users.findFirst({
            where: { Id: attendance.person_Id },
         });
         if (!userExists) {
            console.error("❌ [OfficeAttendanceService] User not found with Id:", attendance.person_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "User does not exist");
         }
         console.log("✅ [OfficeAttendanceService] User exists:", userExists.emp__eng_name);

         const result = await db.offices_attendance.create({
            data: {
               office_Id: attendance.office_Id,
               person_Id: attendance.person_Id,
               entry_time: attendance.entry_time ? new Date(attendance.entry_time) : null,
               exit_time: attendance.exit_time ? new Date(attendance.exit_time) : null,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [OfficeAttendanceService] Office attendance saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [OfficeAttendanceService] Error adding office attendance:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add office attendance");
      }
   }

   protected static viewOfficeAttendancesService = async () => {
      console.log("🟡 [OfficeAttendanceService] Fetching summarized office attendances...");
    
      try {
         // Fetch all office attendance records with office and user details
         const results = await db.offices_attendance.findMany({
            include: {
               office: {
                  select: {
                     office_english_name: true,
                     office_arabic_name: true,
                     latitude: true,
                     longitude: true,
                  },
               },
               user: {
                  select: {
                     emp_Id: true,
                     emp__eng_name: true,
                     emp__arabic_name: true,
                     dep_eng_name: true,
                     dep_arabic_name: true,
                     gender: true,
                  },
               },
            },
            orderBy: { createdAt: "desc" },
         });
    
         // Function to handle time conversion from UTC to local time
         const convertTimeToString = (timeValue: any): string => {
            if (!timeValue) return "--";
            
            // If it's already a string, return it
            if (typeof timeValue === 'string') {
               return timeValue;
            }
            
            // If it's a Date object, format it
            if (timeValue instanceof Date) {
               const hours = timeValue.getHours().toString().padStart(2, '0');
               const minutes = timeValue.getMinutes().toString().padStart(2, '0');
               const seconds = timeValue.getSeconds().toString().padStart(2, '0');
               return `${hours}:${minutes}:${seconds}`;
            }
            
            return "--";
         };
    
         // Function to convert Date objects to date strings
         const convertDateToString = (dateValue: any): string => {
            if (!dateValue) return "No date";
            
            // If it's already a string, return it
            if (typeof dateValue === 'string') {
               return dateValue;
            }
            
            // If it's a Date object, format it as YYYY-MM-DD
            if (dateValue instanceof Date) {
               const year = dateValue.getFullYear();
               const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
               const day = dateValue.getDate().toString().padStart(2, '0');
               return `${year}-${month}-${day}`;
            }
            
            return "No date";
         };
    
         // Format date for display
         const formatDateForDisplay = (dateString: string): string => {
            if (!dateString || dateString === "No date") return "No date";
            
            try {
               const [year, month, day] = dateString.split('-');
               const monthNames = [
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
               ];
               
               const monthIndex = parseInt(month) - 1;
               if (monthIndex < 0 || monthIndex > 11) return dateString;
               
               return `${parseInt(day)} ${monthNames[monthIndex]} ${year}`;
            } catch (error) {
               return dateString;
            }
         };
    
         // Function to calculate time difference in minutes
         const calculateTimeDifference = (startTime: string, endTime: string): number => {
            if (!startTime || !endTime || startTime === "--" || endTime === "--") return 0;
            
            try {
               const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number);
               const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number);
               
               const startTotalMinutes = startHours * 60 + startMinutes + startSeconds / 60;
               const endTotalMinutes = endHours * 60 + endMinutes + endSeconds / 60;
               
               return Math.max(0, endTotalMinutes - startTotalMinutes);
            } catch (error) {
               return 0;
            }
         };
    
         // Group by person_Id
         const grouped: Record<string, any[]> = {};
         results.forEach((att) => {
            const key = att.person_Id?.toString() ?? "UNKNOWN_USER";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(att);
         });
    
         // Transform each group into summary object
         const summaries = Object.values(grouped).map((records: any[]) => {
            const personId = records[0].person_Id;
            const user = records[0].user;
            
            // Get the first entry time and last exit time
            const firstEntry = convertTimeToString(records[0]?.entry_time);
            const finalExit = convertTimeToString(records[records.length - 1]?.exit_time);
            
            // Get the date from the first record
            const rawDate = convertDateToString(records[0]?.entry_time || records[0]?.createdAt);
            const formattedDate = formatDateForDisplay(rawDate);
    
            // Calculate actual working time based on entry and exit times
            let totalWorkingMinutes = 0;
            
            // Calculate total time spent for all entries
            records.forEach(record => {
               if (record.entry_time && record.exit_time) {
                  const entryTime = convertTimeToString(record.entry_time);
                  const exitTime = convertTimeToString(record.exit_time);
                  totalWorkingMinutes += calculateTimeDifference(entryTime, exitTime);
               }
            });
    
            // Convert minutes to hours and minutes
            const workingHours = Math.floor(totalWorkingMinutes / 60);
            const workingMinutes = totalWorkingMinutes % 60;
            const totalWorkingHours = workingHours + (workingMinutes / 60);
    
            // Calculate percentages (assuming 8-hour work day as standard)
            const standardWorkDayHours = 8;
            const workingPercent = Math.min(100, Math.round((totalWorkingHours / standardWorkDayHours) * 100));
            
            // For break time, assume 10% break time of total working time
            const breakMinutes = Math.round(totalWorkingMinutes * 0.1);
            const breakPercent = 10;
    
            // Determine status based on current time and last activity
            const currentTime = new Date();
            const lastRecord = records[records.length - 1];
            const isCurrentlyInside = lastRecord.exit_time === null;
            const status = isCurrentlyInside ? "Inside" : "Outside";
    
            // Determine if user is employee
            const isEmployee = user?.emp_Id?.startsWith('EMP') || false;
            const displayName = user?.emp__eng_name || user?.emp__arabic_name || 
                              (isEmployee ? `Employee ${personId}` : `Visitor ${personId}`);
    
            return {
               id: personId,
               name: displayName,
               status: status,
               avatarUrl: user?.avatarUrl || `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50)}.jpg`,
               department: user?.dep_eng_name || user?.dep_arabic_name || (isEmployee ? "Unknown Department" : "Visitor"),
               date: formattedDate,
               firstEntry: firstEntry,
               entryCount: records.length,
               finalExit: finalExit,
               exitCount: records.filter((r) => r.exit_time).length,
               summary: {
                  workingPercent: workingPercent,
                  workingHours: parseFloat(totalWorkingHours.toFixed(1)),
                  breakPercent: breakPercent,
                  breakMinutes: breakMinutes,
                  status: status,
                  breakStatus: breakMinutes > 0 ? "On Break" : "No Break",
               },
            };
         });
    
         console.log(`📦 [OfficeAttendanceService] Built ${summaries.length} summarized attendances.`);
         return summaries;
    
      } catch (error: any) {
         console.error("💥 [OfficeAttendanceService] Error fetching summarized attendances:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch office attendances summary");
      }
   }
}

export default OfficeAttendanceService;