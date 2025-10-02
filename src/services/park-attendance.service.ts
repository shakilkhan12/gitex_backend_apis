import { ParkAttendanceType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatDuration, formatTime } from "@/utils/dateTime.utils";
import { format } from "date-fns";

class ParkAttendanceService {
  protected static addParkAttendanceService = async (
    attendance: ParkAttendanceType
  ) => {
    try {
      const parkExists = await db.parks.findFirst({
        where: { Id: attendance.park_Id },
      });
      if (!parkExists) {
        throw new HttpException(STATUS.BAD_REQUEST, "Park does not exist");
      }

      const userExists = await db.users.findFirst({
        where: { Id: attendance.person_Id },
      });
      if (!userExists) {
        throw new HttpException(STATUS.BAD_REQUEST, "User does not exist");
      }

      const result = await db.parks_attendance.create({
        data: {
          park_Id: attendance.park_Id,
          person_Id: attendance.person_Id,
          entry_time: attendance.entry_time
            ? new Date(attendance.entry_time)
            : null,
          exit_time: attendance.exit_time
            ? new Date(attendance.exit_time)
            : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return result;
    } catch (error: any) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Failed to add park attendance"
      );
    }
  };

  protected static viewParkAttendancesService = async () => {
    try {
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
              unique_id: true,
              emp__eng_name: true,
              emp__arabic_name: true,
              dep_eng_name: true,
              dep_arabic_name: true,
              gender: true,
              image: true,
            },
          },
        },
        orderBy: { entry_time: "desc" },
      });

      const convertTimeToString = (timeValue: any): string => {
        if (!timeValue) return "--";

        try {
          let dateObj: Date;

          if (typeof timeValue === "string") {
            if (timeValue.includes(" ") && timeValue.includes(":")) {
              dateObj = new Date(timeValue);
            } else {
              return timeValue;
            }
          } else if (timeValue instanceof Date) {
            dateObj = timeValue;
          } else {
            return "--";
          }

          if (isNaN(dateObj.getTime())) {
            return "--";
          }
          const hours = dateObj.getUTCHours().toString().padStart(2, "0");
          const minutes = dateObj.getUTCMinutes().toString().padStart(2, "0");
          const seconds = dateObj.getUTCSeconds().toString().padStart(2, "0");
          return `${hours}:${minutes}:${seconds}`;
        } catch (error) {
          return "--";
        }
      };

      const convertDateToString = (dateValue: any): string => {
        if (!dateValue) return "No date";

        try {
          let dateObj: Date;

          if (typeof dateValue === "string") {
            if (dateValue.includes(" ") && dateValue.includes(":")) {
              dateObj = new Date(dateValue);
            } else if (dateValue.includes("-") && dateValue.length === 10) {
              return dateValue;
            } else {
              return "No date";
            }
          } else if (dateValue instanceof Date) {
            dateObj = dateValue;
          } else {
            return "No date";
          }

          if (isNaN(dateObj.getTime())) {
            return "No date";
          }

          const year = dateObj.getUTCFullYear();
          const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
          const day = dateObj.getUTCDate().toString().padStart(2, "0");
          return `${year}-${month}-${day}`;
        } catch (error) {
          return "No date";
        }
      };

      const formatDateForDisplay = (dateString: string): string => {
        if (!dateString || dateString === "No date") return "No date";

        try {
          const [year, month, day] = dateString.split("-");

          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];

          const monthIndex = parseInt(month) - 1;
          if (monthIndex < 0 || monthIndex > 11) return dateString;

          return `${parseInt(day)} ${monthNames[monthIndex]} ${year}`;
        } catch (error) {
          return dateString;
        }
      };

      const calculateTimeDifference = (
        startTime: string,
        endTime: string
      ): number => {
        if (!startTime || !endTime || startTime === "--" || endTime === "--")
          return 0;

        try {
          if (startTime.includes(":") && endTime.includes(":")) {
            const [startHours, startMinutes, startSeconds] = startTime
              .split(":")
              .map(Number);
            const [endHours, endMinutes, endSeconds] = endTime
              .split(":")
              .map(Number);

            const startTotalMinutes =
              startHours * 60 + startMinutes + startSeconds / 60;
            const endTotalMinutes =
              endHours * 60 + endMinutes + endSeconds / 60;

            return Math.max(0, endTotalMinutes - startTotalMinutes);
          }

          return 0;
        } catch (error) {
          return 0;
        }
      };

      const grouped: Record<string, any[]> = {};
      results.forEach((att) => {
        const uniqueId =
          att.user?.unique_id?.toString() ??
          att.user?.unique_id ??
          "UNKNOWN_USER";
        const date = convertDateToString(att.entry_time || att.createdAt);
        const key = `${uniqueId}_${date}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(att);
      });

      const summaries = Object.values(grouped).map((records: any[]) => {
        const uniqueId = records[0].user?.unique_id;
        const user = records[0].user;

        // sort by time
        records.sort(
          (a, b) =>
            new Date(a.entry_time || a.createdAt).getTime() -
            new Date(b.entry_time || b.createdAt).getTime()
        );

        const attendanceTimes: Array<{
          type: string;
          time: string;
          datetime: any;
        }> = [];
        let inCount = 0;
        let outCount = 0;

        const allEvents: Array<{ type: string; time: string; datetime: any }> =
          [];

        records.forEach((record) => {
          if (record.entry_time) {
            inCount++;
            allEvents.push({
              type: "IN",
              time: convertTimeToString(record.entry_time),
              datetime: new Date(record.entry_time),
            });
          }
          if (record.exit_time) {
            outCount++;
            allEvents.push({
              type: "OUT",
              time: convertTimeToString(record.exit_time),
              datetime: new Date(record.exit_time),
            });
          }
        });

        allEvents.sort(
          (a, b) =>
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );
        attendanceTimes.push(...allEvents);

        const firstEntry = convertTimeToString(records[0]?.entry_time);
        const finalExit = convertTimeToString(
          records[records.length - 1]?.exit_time
        );

        const rawDate = convertDateToString(
          records[0]?.entry_time || records[0]?.createdAt
        );
        const formattedDate = formatDateForDisplay(rawDate);

        // === NEW CALCULATION ===
        let totalWorkingMinutes = 0;
        let totalBreakMinutes = 0;
        const now = new Date();

        for (let i = 0; i < allEvents.length; i++) {
          const curr = allEvents[i];
          const next = allEvents[i + 1];

          if (curr.type === "IN") {
            if (next && next.type === "OUT") {
              // IN → OUT = working
              totalWorkingMinutes +=
                (new Date(next.datetime).getTime() -
                  new Date(curr.datetime).getTime()) /
                60000;
            } else if (!next) {
              // last IN without OUT → till now
              totalWorkingMinutes +=
                (now.getTime() - new Date(curr.datetime).getTime()) / 60000;
            }
          }

          if (curr.type === "OUT" && next && next.type === "IN") {
            // OUT → next IN = break
            totalBreakMinutes +=
              (new Date(next.datetime).getTime() -
                new Date(curr.datetime).getTime()) /
              60000;
          }
        }

        const workingHours = totalWorkingMinutes / 60;
        const standardWorkDayHours = 8;
        const workingPercent = Math.min(
          100,
          Math.round((workingHours / standardWorkDayHours) * 100)
        );

        const breakPercent = Math.min(
          100,
          Math.round(
            (totalBreakMinutes / (totalWorkingMinutes + totalBreakMinutes)) *
              100
          )
        );

        const lastEvent = allEvents[allEvents.length - 1];
        const status = lastEvent?.type === "IN" ? "Inside" : "Outside";

        // format into HH:mm:ss
        const workingHHMMSS = formatDuration(totalWorkingMinutes);
        const breakHHMMSS = formatDuration(totalBreakMinutes);

        const isEmployee = user?.emp_Id?.startsWith("EMP") || false;
        const displayName =
          user?.emp__eng_name ||
          user?.emp__arabic_name ||
          (isEmployee ? `Employee ${uniqueId}` : `Visitor ${uniqueId}`);

        return {
          id: user?.emp_Id,
          name: displayName,
          status,
          avatarUrl: user?.image,
          department:
            user?.dep_eng_name ||
            user?.dep_arabic_name ||
            (isEmployee ? "Unknown Department" : "Visitor"),
          park_Id: records[0].park_Id,
          date: formattedDate,
          firstEntry,
          entryCount: inCount,
          finalExit,
          exitCount: outCount,
          attendanceTimes,
          summary: {
            workingPercent,
            workingHours: workingHHMMSS,
            breakPercent,
            breakMinutes: breakHHMMSS,
            status,
            breakStatus: totalBreakMinutes > 0 ? "On Break" : "No Break",
          },
        };
      });

      summaries.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      return summaries;
    } catch (error: any) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Failed to fetch park attendances summary"
      );
    }
  };
}

export default ParkAttendanceService;
