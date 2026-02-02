import { OfficeSentimentAnalysisType, STATUS } from "@/typescript";
import db from "@/prisma/client";
import { HttpException } from "@/utils/HttpException.utils";
import { formatDate, formatTime } from "@/utils/dateTime.utils";
import { formatImageUrlsInArray } from "@/utils/imageUrl.utils";
import UserService from "./user.service";

class OfficeSentimentAnalysisService {
  protected static addOfficeSentimentAnalysisService = async (
    sentimentAnalysis: OfficeSentimentAnalysisType
  ) => {
    try {
      const officeExists = await db.offices.findFirst({
        where: { office_Id: sentimentAnalysis.office_Id },
      });
      if (!officeExists) {
       
        throw new HttpException(STATUS.BAD_REQUEST, "Office does not exist");
      }
     

      const entryCameraExists = await db.offices_cameras.findFirst({
        where: { camera_Id: sentimentAnalysis.entry_camera_Id },
      });
      if (!entryCameraExists) {
        
        throw new HttpException(
          STATUS.BAD_REQUEST,
          "Entry camera does not exist"
        );
      }
     

      const user = await db.users.findFirst({
        where: { emp_Id: sentimentAnalysis.person_Id },
      });

      const checkInDate = new Date(sentimentAnalysis.check_in_date);
      const checkInTime = new Date(
        `1970-01-01T${sentimentAnalysis.check_in_time}Z`
      );

      const createData: any = {
        person_Id: user ? user.Id.toString() : null,
        detection_Id: sentimentAnalysis.detection_Id,
        sentiment_of: user ? "employee" : "visitor",
        person_name: user ? user.emp__eng_name : "Visitor",
        person_image: user ? user.image : "",
        gender: sentimentAnalysis.gender,
        check_in_image: sentimentAnalysis.check_in_image,
        check_in_date: checkInDate,
        check_in_time: checkInTime,
        check_in_sentiment: sentimentAnalysis.check_in_sentiment,
        office_Id: officeExists.Id,
        entry_camera_Id: entryCameraExists.Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.offices_sentiment_analysis.create({
        data: createData,
      });

      return result;
    } catch (error: any) {
      
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Failed to add office sentiment analysis"
      );
    }
  };

  protected static updateOfficeSentimentAnalysisService = async (
    detection_Id: string,
    updateData: Partial<OfficeSentimentAnalysisType>
  ) => {
    try {
      const existingSentiment = await db.offices_sentiment_analysis.findFirst({
        where: { detection_Id: detection_Id },
      });

      if (!existingSentiment) {
        throw new HttpException(
          STATUS.NOT_FOUND,
          "Office sentiment analysis not found with the provided detection ID"
        );
      }

      const { detection_Id: _, ...updateFields } = updateData;

      const updateDataForDb: any = {
        updatedAt: new Date(),
      };

      if (updateFields.person_Id !== undefined)
        updateDataForDb.person_Id = updateFields.person_Id;
      if (updateFields.sentiment_of !== undefined)
        updateDataForDb.sentiment_of = updateFields.sentiment_of;
      if (updateFields.check_in_date !== undefined)
        updateDataForDb.check_in_date = new Date(updateFields.check_in_date);
      if (updateFields.check_in_time !== undefined)
        updateDataForDb.check_in_time = new Date(
          `1970-01-01T${updateFields.check_in_time}Z`
        );
      if (updateFields.check_in_sentiment !== undefined)
        updateDataForDb.check_in_sentiment = updateFields.check_in_sentiment;
      if (updateFields.check_out_date !== undefined)
        updateDataForDb.check_out_date = new Date(updateFields.check_out_date);
      if (updateFields.check_out_time !== undefined)
        updateDataForDb.check_out_time = new Date(
          `1970-01-01T${updateFields.check_out_time}Z`
        );
      if (updateFields.check_out_capture !== undefined)
        updateDataForDb.check_out_capture = updateFields.check_out_capture;
      if (updateFields.person_name !== undefined)
        updateDataForDb.person_name = updateFields.person_name;
      if (updateFields.person_image !== undefined)
        updateDataForDb.person_image = updateFields.person_image;
      if (updateFields.gender !== undefined)
        updateDataForDb.gender = updateFields.gender;
      if (updateFields.check_in_image !== undefined)
        updateDataForDb.check_in_image = updateFields.check_in_image;
      if (updateFields.check_out_sentiment !== undefined)
        updateDataForDb.check_out_sentiment = updateFields.check_out_sentiment;

      if (updateFields.office_Id) {
        const officeExists = await db.offices.findFirst({
          where: { office_Id: updateFields.office_Id },
        });
        if (!officeExists) {
          throw new HttpException(STATUS.BAD_REQUEST, "Office does not exist");
        }
        updateDataForDb.office_Id = officeExists.Id;
      }

      if (updateFields.entry_camera_Id) {
        const entryCameraExists = await db.offices_cameras.findFirst({
          where: { camera_Id: updateFields.entry_camera_Id },
        });
        if (!entryCameraExists) {
          throw new HttpException(
            STATUS.BAD_REQUEST,
            "Entry camera does not exist"
          );
        }
        updateDataForDb.entry_camera_Id = entryCameraExists.Id;
      }

      if (updateFields.exit_camera_Id) {
        const exitCameraExists = await db.offices_cameras.findFirst({
          where: { camera_Id: updateFields.exit_camera_Id },
        });
        if (!exitCameraExists) {
          throw new HttpException(
            STATUS.BAD_REQUEST,
            "Exit camera does not exist"
          );
        }
        updateDataForDb.exit_camera_Id = exitCameraExists.Id;
      }

      const result = await db.offices_sentiment_analysis.update({
        where: { Id: existingSentiment.Id },
        data: updateDataForDb,
      });

      return result;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Failed to update office sentiment analysis"
      );
    }
  };

  protected static viewOfficeSentimentAnalysesService = async (filters?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    fromDateTime?: string;
    toDateTime?: string;
    entryMood?: string;
    exitMood?: string;
    employeeId?: string;
    sentimentOf?: string;
    gender?: string;
    cameraId?: number;
    officeId?: string;
  }) => {
    try {
      const whereClause: any = {};

      if (filters?.search) {
        whereClause.OR = [
          { person_name: { contains: filters.search, mode: 'insensitive' } },
          { offices: { office_english_name: { contains: filters.search, mode: 'insensitive' } } },
          { offices: { office_arabic_name: { contains: filters.search, mode: 'insensitive' } } }
        ];
      }

      if (filters?.fromDateTime || filters?.toDateTime) {
        whereClause.check_in_date = {};
        if (filters.fromDateTime) {
          whereClause.check_in_date.gte = new Date(filters.fromDateTime);
        }
        if (filters.toDateTime) {
          whereClause.check_in_date.lte = new Date(filters.toDateTime);
        }
      }

      if (filters?.entryMood && filters.entryMood !== 'All') {
        whereClause.check_in_sentiment = filters.entryMood;
      }

      if (filters?.exitMood && filters.exitMood !== 'All') {
        if (filters.exitMood === 'No Exit') {
          whereClause.check_out_sentiment = null;
        } else {
          whereClause.check_out_sentiment = filters.exitMood;
        }
      }

      if (filters?.employeeId) {
        const user = await db.users.findFirst({
          where: { emp_Id: filters.employeeId },
          select: { Id: true }
        });
        
        if (user) {
          whereClause.person_Id = user.Id.toString();
        } else {
          whereClause.person_Id = 'NOT_FOUND';
        }
      }

      if (filters?.sentimentOf && filters.sentimentOf !== 'All') {
        if (filters.sentimentOf === 'Employees') {
          whereClause.sentiment_of = 'employee';
        } else if (filters.sentimentOf === 'Guests') {
          whereClause.sentiment_of = 'visitor';
        }
      }

      if (filters?.officeId) {
        const office = await db.offices.findFirst({
          where: { office_Id: filters.officeId },
          select: { Id: true },
        });
        if (office) {
          whereClause.office_Id = office.Id;
        }
      }

      // Camera filter: combine with existing where (e.g. search OR) via AND so both apply
      const cameraOr = filters?.cameraId
        ? { OR: [{ entry_camera_Id: filters.cameraId }, { exit_camera_Id: filters.cameraId }] }
        : null;
      const finalWhere = cameraOr ? { AND: [whereClause, cameraOr] } : whereClause;

      // Note: Gender filtering is done in post-processing because gender can be in 
      // offices_sentiment_analysis.gender OR users.gender. We need to check both,
      // so we fetch all records and filter after joining with users table.

      const orderByClause: any = {
        updatedAt: 'desc'
      };

      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      
      // If gender filter is active, we need to fetch all records and filter in memory
      // because gender can be in either sentiment table or users table
      // So we'll fetch a larger set and then apply pagination after filtering
      const shouldPostFilterGender = filters?.gender && filters.gender !== 'All';
      const fetchLimit = shouldPostFilterGender ? 10000 : limit; // Fetch more if we need to post-filter
      const skip = shouldPostFilterGender ? 0 : (page - 1) * limit;

      // Count will be recalculated after post-filtering if gender filter is active
      let totalCount = await db.offices_sentiment_analysis.count({ where: finalWhere });

      const results = await db.offices_sentiment_analysis.findMany({
        where: finalWhere,
        include: {
          offices: {
            select: {
              office_english_name: true,
              office_arabic_name: true,
              latitude: true,
              longitude: true,
            },
          },
          offices_cameras_offices_sentiment_analysis_entry_camera_IdTooffices_cameras:
            {
              select: {
                camera_english_name: true,
                camera_arabic_name: true,
                ip_address: true,
              },
            },
          offices_cameras_offices_sentiment_analysis_exit_camera_IdTooffices_cameras:
            {
              select: {
                camera_english_name: true,
                camera_arabic_name: true,
                ip_address: true,
              },
            },
        },
        orderBy: orderByClause,
        skip: skip,
        take: fetchLimit
      });

      const personIds = Array.from(
        new Set(results.map((sentiment) => sentiment.person_Id).filter(Boolean))
      ) as string[];

      const users = await db.users.findMany({
        where: {
          Id: {
            in: personIds.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
          },
        },
        select: {
          Id: true,
          user_Id: true,
          emp_Id: true,
          emp__eng_name: true,
          emp__arabic_name: true,
          gender: true,
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
          image: true,
          createdAt: true,
          updatedAt: true,
          users_roles: {
            select: {
              role_name: true,
            },
          },
        },
      });

      const userMap = new Map(users.map((user) => [user.Id.toString(), user]));

      const sentimentWithUsers = results.map((sentiment) => {
        const user = sentiment.person_Id
          ? userMap.get(sentiment.person_Id)
          : null;

        let userImage = null;
        if (user?.image) {
          userImage = user.image;
        } else if (sentiment.person_image) {
          userImage = sentiment.person_image;
        }

        return {
          ...sentiment,
          user: user
            ? {
                Id: user.Id,
                user_Id: user.user_Id,
                emp_Id: user.emp_Id,
                image: userImage ? formatImageUrlsInArray([{ image: userImage }], ['image'])[0].image : null,
                emp__eng_name: user.emp__eng_name,
                emp__arabic_name: user.emp__arabic_name,
                gender: user.gender,
                country_code: user.country_code,
                phone: user.phone,
                email: user.email,
                dep_eng_name: user.dep_eng_name,
                dep_arabic_name: user.dep_arabic_name,
                desig_eng_name: user.desig_eng_name,
                desig_arabic_name: user.desig_arabic_name,
                unit_eng_name: user.unit_eng_name,
                unit_arabic_name: user.unit_arabic_name,
                committe_eng_name: user.committe_eng_name,
                committe_arabic_name: user.committe_arabic_name,
                ai_engine_access: user.ai_engine_access,
                last_login: user.last_login,
                role: user.users_roles?.role_name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }
            : null,
        };
      });

      // Post-filter by gender - check both sentiment.gender and user.gender
      // This is necessary because gender can be stored in either table
      let filteredResults = sentimentWithUsers;
      if (filters?.gender && filters.gender !== 'All') {
        const genderValue = filters.gender.toLowerCase();
        // Build comprehensive list of gender value variations
        const genderFilterValues = genderValue === 'male' || genderValue === 'm'
          ? ['M', 'Male', 'male', 'm', 'MALE', 'MALE.', 'Male.', 'male.']
          : genderValue === 'female' || genderValue === 'f'
          ? ['F', 'Female', 'female', 'f', 'FEMALE', 'FEMALE.', 'Female.', 'female.']
          : genderValue === 'unknown'
          ? ['Unknown', 'unknown', 'UNKNOWN', 'Unknown.', 'unknown.']
          : [filters.gender, filters.gender.toLowerCase(), filters.gender.toUpperCase()];

        // Helper function to check if a gender value matches (case-insensitive)
        const matchesGender = (gender: string | null | undefined): boolean => {
          if (!gender) {
            // For "Unknown" filter, null/empty is considered Unknown
            return genderValue === 'unknown';
          }
          const genderLower = String(gender).toLowerCase().trim();
          return genderFilterValues.some(val => val.toLowerCase().trim() === genderLower);
        };

        // Helper function to check if a gender is explicitly Male or Female
        const isExplicitlyMaleOrFemale = (gender: string | null | undefined): boolean => {
          if (!gender) return false;
          const genderLower = String(gender).toLowerCase().trim();
          const maleValues = ['m', 'male', 'male.'];
          const femaleValues = ['f', 'female', 'female.'];
          return maleValues.includes(genderLower) || femaleValues.includes(genderLower);
        };

        filteredResults = sentimentWithUsers.filter((sentiment) => {
          const sentimentGender = sentiment.gender;
          const userGender = sentiment.user?.gender;
          
          // For "Unknown" filter, exclude records where either gender is explicitly Male or Female
          if (genderValue === 'unknown') {
            // If either gender is explicitly Male or Female, exclude this record
            if (isExplicitlyMaleOrFemale(sentimentGender) || isExplicitlyMaleOrFemale(userGender)) {
              return false;
            }
            // Include if gender is null/empty or explicitly "Unknown"
            return matchesGender(sentimentGender) || matchesGender(userGender) || (!sentimentGender && !userGender);
          } else {
            // For Male/Female filters, check both sentiment and user gender
            if (matchesGender(sentimentGender)) {
              return true;
            }
            if (matchesGender(userGender)) {
              return true;
            }
            return false;
          }
        });
        
        // Recalculate total count and pagination after filtering
        totalCount = filteredResults.length;
        
        // Apply pagination to filtered results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        filteredResults = filteredResults.slice(startIndex, endIndex);
      } else {
        // No gender filter, use normal pagination (already applied in query)
      }

      const formattedResults = filteredResults.map((sentiment) => ({
        ...sentiment,
        check_in_date: formatDate(sentiment.check_in_date),
        check_in_time: formatTimeFetchFromFullDate(sentiment.check_in_time),
        check_out_date: formatDate(sentiment.check_out_date),
        check_out_time: formatTimeFetchFromFullDate(sentiment.check_out_time),
      }));

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

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

      const allDataForStats = await db.offices_sentiment_analysis.findMany({
        where: finalWhere,
        select: {
          check_in_sentiment: true,
          check_out_sentiment: true
        }
      });

      const statsData = {
        totalEvents: allDataForStats.length,
        totalHappy: allDataForStats.filter(d => d.check_in_sentiment === 'happy').length,
        totalNormal: allDataForStats.filter(d => d.check_in_sentiment === 'neutral').length,
        totalSad: allDataForStats.filter(d => d.check_in_sentiment === 'sad').length,
        totalAngry: allDataForStats.filter(d => d.check_in_sentiment === 'angry').length
      };

   
      const imageFields = ['check_in_image', 'check_out_capture', 'image'];
      const formattedResultsWithImages = formatImageUrlsInArray(formattedResults, imageFields);

      return {
        success: true,
        data: formattedResultsWithImages,
        total: totalCount,
        pagination: paginationData,
        stats: statsData
      };
    } catch (error: any) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Failed to fetch office sentiment analyses"
      );
    }
  };

  protected static getOfficeSentimentAnalysisFiltersService = async () => {
    try {
      const userFiltersResult = await UserService.getUsersFiltersService();

      const offices = await db.offices.findMany({
        select: {
          Id: true,
          office_english_name: true,
          office_arabic_name: true,
          office_Id: true,
        },
        orderBy: {
          office_english_name: 'asc',
        },
      });

      const cameras = await db.offices_cameras.findMany({
        select: {
          Id: true,
          camera_Id: true,
          camera_english_name: true,
          camera_arabic_name: true,
          office_Id: true,
        },
        orderBy: {
          camera_english_name: 'asc',
        },
      });

      return {
        success: true,
        data: {
          employees: userFiltersResult.data.employees,
          offices: offices.map((office) => ({
            id: office.Id,
            officeId: office.office_Id,
            name_en: office.office_english_name,
            name_ar: office.office_arabic_name,
          })),
          cameras: cameras.map((camera) => ({
            id: camera.Id,
            cameraId: camera.camera_Id,
            name_en: camera.camera_english_name,
            name_ar: camera.camera_arabic_name,
            office_Id: camera.office_Id,
          })),
        },
      };
    } catch (error) {
      throw new HttpException(
        STATUS.INTERNAL_SERVER_ERROR,
        "Failed to fetch office sentiment analysis filters"
      );
    }
  };
}


export function formatTimeFetchFromFullDate(date: Date | string | null) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().substring(11, 19);
}

export default OfficeSentimentAnalysisService;
export { OfficeSentimentAnalysisService };
