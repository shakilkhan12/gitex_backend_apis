import { ParkAttendanceType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import { format } from "date-fns";

class ParkAttendanceService {
   protected static addParkAttendanceService = async (attendance: ParkAttendanceType) => {
      console.log("🟢 [ParkAttendanceService] Adding new park attendance:", attendance);

      try {
         // Check if park exists
         const parkExists = await db.parks.findFirst({
            where: { Id: attendance.park_Id },
         });
         if (!parkExists) {
            console.error("❌ [ParkAttendanceService] Park not found with Id:", attendance.park_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
         }
         console.log("✅ [ParkAttendanceService] Park exists:", parkExists.park_english_name);

         // Check if user exists
         const userExists = await db.users.findFirst({
            where: { Id: attendance.person_Id },
         });
         if (!userExists) {
            console.error("❌ [ParkAttendanceService] User not found with Id:", attendance.person_Id);
            throw new HttpException(STATUS.BAD_REQUEST, "User does not exist");
         }
         console.log("✅ [ParkAttendanceService] User exists:", userExists.emp__eng_name);

         const result = await db.parks_attendance.create({
            data: {
               park_Id: attendance.park_Id,
               person_Id: attendance.person_Id,
               entry_time: attendance.entry_time ? new Date(attendance.entry_time) : null,
               exit_time: attendance.exit_time ? new Date(attendance.exit_time) : null,
               createdAt: new Date(),
               updatedAt: new Date()
            },
         });

         console.log("🎉 [ParkAttendanceService] Park attendance saved successfully:", result.Id);
         return result;

      } catch (error: any) {
         console.error("💥 [ParkAttendanceService] Error adding park attendance:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to add park attendance");
      }
   }

   protected static viewParkAttendancesService = async () => {
      console.log("🟡 [ParkAttendanceService] Fetching summarized park attendances...");
    
      try {
         // Fetch all park attendance records with park and user details
         const results = await db.parks_attendance.findMany({
            include: {
               park: {
                  select: {
                     park_english_name: true,
                     park_arabic_name: true,
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
                     image:true
                  },
               },
            },
            orderBy: { createdAt: "desc" },
         });
    
         // Debug: Log the raw database results to see what fields are available
         console.log('🔍 [ParkAttendanceService] Total records found:', results.length);
         console.log('🔍 [ParkAttendanceService] Raw database results sample:', results.slice(0, 2));
         console.log('🔍 [ParkAttendanceService] First record structure:', results[0] ? Object.keys(results[0]) : 'No records');
         
         if (results.length > 0) {
            console.log('🔍 [ParkAttendanceService] First record park_Id:', results[0].park_Id);
            console.log('🔍 [ParkAttendanceService] First record park relation:', results[0].park);
            console.log('🔍 [ParkAttendanceService] First record person_Id:', results[0].person_Id);
            
            // Check if park_Id is null in any records
            const nullParkIds = results.filter(r => r.park_Id === null || r.park_Id === undefined);
            console.log('🔍 [ParkAttendanceService] Records with null park_Id:', nullParkIds.length);
            
            // Show unique park_Id values
            const uniqueParkIds = Array.from(new Set(results.map(r => r.park_Id).filter(id => id !== null)));
            console.log('🔍 [ParkAttendanceService] Unique park_Id values:', uniqueParkIds);
         }
    
         // Function to handle time conversion from datetime string or Date object
         const convertTimeToString = (timeValue: any): string => {
            if (!timeValue) return "--";
            
            try {
               let dateObj: Date;
               
               // If it's already a string in format "2025-09-25 19:03:40"
               if (typeof timeValue === 'string') {
                  // Handle datetime string format "2025-09-25 19:03:40"
                  if (timeValue.includes(' ') && timeValue.includes(':')) {
                     dateObj = new Date(timeValue);
                  } else {
                     // If it's just time format "19:03:40"
                     return timeValue;
                  }
               } else if (timeValue instanceof Date) {
                  dateObj = timeValue;
               } else {
                  return "--";
               }
               
               // Check if date is valid
               if (isNaN(dateObj.getTime())) {
                  return "--";
               }
               
               const hours = dateObj.getHours().toString().padStart(2, '0');
               const minutes = dateObj.getMinutes().toString().padStart(2, '0');
               const seconds = dateObj.getSeconds().toString().padStart(2, '0');
               return `${hours}:${minutes}:${seconds}`;
            } catch (error) {
               return "--";
            }
         };
    
         // Function to convert Date objects or datetime strings to date strings
         const convertDateToString = (dateValue: any): string => {
            if (!dateValue) return "No date";
            
            try {
               let dateObj: Date;
               
               // If it's already a string in format "2025-09-25 19:03:40"
               if (typeof dateValue === 'string') {
                  // Handle datetime string format "2025-09-25 19:03:40"
                  if (dateValue.includes(' ') && dateValue.includes(':')) {
                     dateObj = new Date(dateValue);
                  } else if (dateValue.includes('-') && dateValue.length === 10) {
                     // If it's just date format "2025-09-25"
                     return dateValue;
                  } else {
                     return "No date";
                  }
               } else if (dateValue instanceof Date) {
                  dateObj = dateValue;
               } else {
                  return "No date";
               }
               
               // Check if date is valid
               if (isNaN(dateObj.getTime())) {
                  return "No date";
               }
               
               const year = dateObj.getFullYear();
               const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
               const day = dateObj.getDate().toString().padStart(2, '0');
               return `${year}-${month}-${day}`;
            } catch (error) {
               return "No date";
            }
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
               // Handle time format "HH:MM:SS"
               if (startTime.includes(':') && endTime.includes(':')) {
                  const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number);
                  const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number);
                  
                  const startTotalMinutes = startHours * 60 + startMinutes + startSeconds / 60;
                  const endTotalMinutes = endHours * 60 + endMinutes + endSeconds / 60;
                  
                  return Math.max(0, endTotalMinutes - startTotalMinutes);
               }
               
               return 0;
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
         
         // Debug: Log grouping information
         console.log('🔍 [ParkAttendanceService] Grouped records count:', Object.keys(grouped).length);
         Object.entries(grouped).forEach(([personId, records]) => {
            const parkIds = records.map(r => r.park_Id);
            const uniqueParkIds = Array.from(new Set(parkIds));
            if (uniqueParkIds.length > 1) {
               console.log(`⚠️ [ParkAttendanceService] Person ${personId} has records in multiple parks:`, uniqueParkIds);
            }
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
    
            const result = {
               id: personId,
               name: displayName,
               status: status,
               avatarUrl: user?.image,
               department: user?.dep_eng_name || user?.dep_arabic_name || (isEmployee ? "Unknown Department" : "Visitor"),
               park_Id: records[0].park_Id,
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
            
            // Debug: Log the park_Id being returned
            console.log(`[ParkAttendanceService] Returning record for ${displayName} with park_Id: ${records[0].park_Id}`);
            
            return result;
         });
    
         console.log(`📦 [ParkAttendanceService] Built ${summaries.length} summarized attendances.`);
         return summaries;
    
      } catch (error: any) {
         console.error("💥 [ParkAttendanceService] Error fetching summarized attendances:", error.message || error);
         throw new HttpException(STATUS.BAD_REQUEST, "Failed to fetch park attendances summary");
      }
   }
}

export default ParkAttendanceService;