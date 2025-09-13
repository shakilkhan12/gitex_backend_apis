import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import db from "@/prisma/client";

class EventHandlerService {

   // Handle event processing
   public static handleEventService = async (eventData: any) => {
       try { 
         const office_cameras=['35','36','71','72','73','74']
         const park_cameras=['3','4','5','6','75','76','77','78','79','106','107','108']
         let intrusion_detection_code=131585
         let attendance_code=131659
         
         const age_groups = [
            { code: 'UNKNOWN', name: 'Unknown.', remarks: 0 },
            { code: 'CHILD', name: 'Teenager.', remarks: 3 },
            { code: 'YOUNG', name: 'Youth.', remarks: 5 },
            { code: 'MIDDLE', name: 'Middle age.', remarks: 7 },
            { code: 'OLD', name: 'Elderly.', remarks: 9 },
            { code: 'INFANT', name: 'Infant.', remarks: 1 },
            { code: 'KID', name: 'Child.', remarks: 2 },
            { code: 'TEENAGER', name: 'Early youth.', remarks: 4 },
            { code: 'PRIME', name: 'Prime.', remarks: 6 },
            { code: 'MIDDLEAGED', name: 'Middle to old age.', remarks: 8 }
         ]
         
         const gender_types = [
            { code: 0, name: 'Unknown.' },
            { code: 1, name: 'Male.' },
            { code: 2, name: 'Female.' }
         ]

          if(eventData){
             let eventType=eventData.event.params.events[0].eventType
             console.log("📝 [EVENT HANDLER] Processing event:", {
                eventType: eventType,
                srcIndex: eventData.event.params.events[0].srcIndex,
                srcName: eventData.event.params.events[0].srcName,
                eventId: eventData.event.params.events[0].eventId,
                similarity: eventData.event.params.events[0].data.alarmResult.faces.identify.candidate.similarity,
                human_id: eventData.event.params.events[0].data.alarmResult.faces.identify.candidate.human_id
             });
             
             if(eventType===intrusion_detection_code){
                let park_Id;

                let parkcamera=await db.park_cameras.findFirst({
                   where:{
                      camera_Id:eventData.event.params.events[0].srcIndex
                   }
                })
                if(parkcamera){
                   park_Id=parkcamera.park_Id

                   const intrusionData = {
                      park_Id:park_Id,
                      camera_Id:parkcamera.Id,
                      occurrence_date:eventData.event.params.events[0].happenTime,
                      occurrence_time:eventData.event.params.events[0].happenTime,
                      snap_shot:eventData.event.params.events[0].data.alarmResult.faces.URL,
                      posted_to_intranet_date:eventData.timestamp,
                      posted_to_intranet_time:eventData.timestamp,
                      detection_Id:eventData.event.params.events[0].eventId,
                      detection_date:eventData.event.params.events[0].happenTime,
                      detection_time:eventData.event.params.events[0].happenTime,
                      is_employee:eventData.event.params.events[0].data.alarmResult.faces.identify.candidate.similarity===1?true:false,
                      description: `Intrusion detected at ${eventData.event.params.events[0].srcName} camera. Age Group: ${age_groups.find(ag => ag.remarks === eventData.event.params.events[0].data.alarmResult.faces.age.ageGroup)?.name || 'Unknown'}, Gender: ${gender_types.find(gt => gt.code === eventData.event.params.events[0].data.alarmResult.faces.gender.value)?.name || 'Unknown'}`
                   }
                   
                   console.log("🚨 [INTRUSION DETECTION] Creating intrusion record:", JSON.stringify(intrusionData, null, 2));
                   const new_intrusion_detection=await db.parks_intrusion_detection.create({
                      data: intrusionData
                   })
                   console.log("✅ [INTRUSION DETECTION] Record created with ID:", new_intrusion_detection.Id);
                }
                else{
                   return new HttpException(STATUS.NOT_FOUND, "Park camera not found")
                }
             }
             else if(eventType===attendance_code){
                // Check if it's office or park camera
                const isOfficeCamera = office_cameras.includes(eventData.event.params.events[0].srcIndex)
                const isParkCamera = park_cameras.includes(eventData.event.params.events[0].srcIndex)
                
                if(isOfficeCamera){
                   // Handle office attendance and footfall
                   const officeCamera = await db.offices_cameras.findFirst({
                      where: {
                         camera_Id: eventData.event.params.events[0].srcIndex
                      }
                   })
                   
                   if(officeCamera && officeCamera.office_Id){
                      const office_Id = officeCamera.office_Id
                      const isEntry = eventData.event.params.events[0].srcName === "ENTRY"
                      const isExit = eventData.event.params.events[0].srcName === "EXIT"
                      
                      // Create footfall analysis record
                      const genderValue = eventData.event.params.events[0].data.alarmResult.faces.gender.value
                      const ageGroup = eventData.event.params.events[0].data.alarmResult.faces.age.ageGroup
                      const genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                      const isChild = ageGroup <= 2 // INFANT, KID, CHILD
                      
                      // Check similarity to determine person_Id
                      const similarity = eventData.event.params.events[0].data.alarmResult.faces.identify.candidate.similarity
                      const humanId = eventData.event.params.events[0].data.alarmResult.faces.identify.candidate.human_id
                      
                      // Look up person_Id in users database
                      let person_Id = 1; // Default fallback
                      if (similarity !== 0 && humanId) {
                         const user = await db.users.findFirst({
                            where: { Id: humanId.toString() }
                         });
                         if (user) {
                            person_Id = user.Id;
                            console.log("👤 [USER LOOKUP] Found user:", { Id: user.Id, user_Id: user.user_Id, name: user.emp__eng_name });
                         } else {
                            console.log("⚠️ [USER LOOKUP] User not found for Id:", humanId);
                         }
                      }
                      
                      const officeFootfallData = {
                         office_Id: office_Id,
                         detection_Id: eventData.event.params.events[0].eventId,
                         person_Id: person_Id,
                         gender: genderName,
                         is_child: isChild,
                         time: eventData.event.params.events[0].happenTime,
                         detected_camera_Id: eventData.event.params.events[0].srcIndex,
                         detected_camera_name: eventData.event.params.events[0].srcName
                      }
                      
                      console.log("🏢 [OFFICE FOOTFALL] Creating footfall record:", JSON.stringify(officeFootfallData, null, 2));
                      const officeFootfallRecord = await db.offices_footfall_analysis.create({
                         data: officeFootfallData
                      })
                      console.log("✅ [OFFICE FOOTFALL] Record created with ID:", officeFootfallRecord.id);
                      
                      // Handle attendance (entry/exit)
                      if(isEntry){
                         // Create new attendance record for entry
                         const officeAttendanceData = {
                            office_Id: office_Id,
                            person_Id: person_Id,
                            entry_time: eventData.event.params.events[0].happenTime
                         }
                         
                         console.log("🏢 [OFFICE ATTENDANCE] Creating entry record:", JSON.stringify(officeAttendanceData, null, 2));
                         const officeAttendanceRecord = await db.offices_attendance.create({
                            data: officeAttendanceData
                         })
                         console.log("✅ [OFFICE ATTENDANCE] Entry record created with ID:", officeAttendanceRecord.Id);
                      } else if(isExit){
                         // Find latest attendance record without exit_time and update it
                         const latestAttendance = await db.offices_attendance.findFirst({
                            where: {
                               office_Id: office_Id,
                               person_Id: person_Id,
                               exit_time: null
                            },
                            orderBy: {
                               entry_time: 'desc'
                            }
                         })
                         
                         if(latestAttendance){
                            console.log("🏢 [OFFICE ATTENDANCE] Updating exit time for record ID:", latestAttendance.Id);
                            await db.offices_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventData.event.params.events[0].happenTime
                               }
                            })
                            console.log("✅ [OFFICE ATTENDANCE] Exit time updated successfully");
                         } else {
                            console.log("⚠️ [OFFICE ATTENDANCE] No open attendance record found for person_Id:", person_Id);
                         }
                      }
                   }
                }
                else if(isParkCamera){
                   // Handle park attendance and footfall
                   const parkCamera = await db.park_cameras.findFirst({
                      where: {
                         camera_Id: eventData.event.params.events[0].srcIndex
                      }
                   })
                   
                   if(parkCamera && parkCamera.park_Id){
                      const park_Id = parkCamera.park_Id
                      const isEntry = eventData.event.params.events[0].srcName === "ENTRY"
                      const isExit = eventData.event.params.events[0].srcName === "EXIT"
                      
                      // Create footfall analysis record
                      const genderValue = eventData.event.params.events[0].data.alarmResult.faces.gender.value
                      const ageGroup = eventData.event.params.events[0].data.alarmResult.faces.age.ageGroup
                      const genderName = gender_types.find(gt => gt.code === genderValue)?.name || 'Unknown'
                      const isChild = ageGroup <= 2 // INFANT, KID, CHILD
                      
                      // Check similarity to determine person_Id
                      const similarity = eventData.event.params.events[0].data.alarmResult.faces.identify.candidate.similarity
                      const humanId = eventData.event.params.events[0].data.alarmResult.faces.identify.candidate.human_id
                      
                      // Look up person_Id in users database
                      let person_Id = 1; // Default fallback
                      if (similarity !== 0 && humanId) {
                         const user = await db.users.findFirst({
                            where: { Id: humanId.toString() }
                         });
                         if (user) {
                            person_Id = user.Id;
                            console.log("👤 [USER LOOKUP] Found user:", { Id: user.Id, user_Id: user.user_Id, name: user.emp__eng_name });
                         } else {
                            console.log("⚠️ [USER LOOKUP] User not found for Id:", humanId);
                         }
                      }
                      
                      const parkFootfallData = {
                         park_Id: park_Id,
                         detection_Id: eventData.event.params.events[0].eventId,
                         person_Id: person_Id,
                         gender: genderName,
                         is_child: isChild,
                         time: eventData.event.params.events[0].happenTime,
                         detected_camera_Id: eventData.event.params.events[0].srcIndex,
                         detected_camera_name: eventData.event.params.events[0].srcName
                      }
                      
                      console.log("🌳 [PARK FOOTFALL] Creating footfall record:", JSON.stringify(parkFootfallData, null, 2));
                      const parkFootfallRecord = await db.parks_footfall_analysis.create({
                         data: parkFootfallData
                      })
                      console.log("✅ [PARK FOOTFALL] Record created with ID:", parkFootfallRecord.id);
                      
                      // Handle attendance (entry/exit)
                      if(isEntry){
                         // Create new attendance record for entry
                         const parkAttendanceData = {
                            park_Id: park_Id,
                            person_Id: person_Id,
                            entry_time: eventData.event.params.events[0].happenTime
                         }
                         
                         console.log("🌳 [PARK ATTENDANCE] Creating entry record:", JSON.stringify(parkAttendanceData, null, 2));
                         const parkAttendanceRecord = await db.parks_attendance.create({
                            data: parkAttendanceData
                         })
                         console.log("✅ [PARK ATTENDANCE] Entry record created with ID:", parkAttendanceRecord.Id);
                      } else if(isExit){
                         // Find latest attendance record without exit_time and update it
                         const latestAttendance = await db.parks_attendance.findFirst({
                            where: {
                               park_Id: park_Id,
                               person_Id: person_Id,
                               exit_time: null
                            },
                            orderBy: {
                               entry_time: 'desc'
                            }
                         })
                         
                         if(latestAttendance){
                            console.log("🌳 [PARK ATTENDANCE] Updating exit time for record ID:", latestAttendance.Id);
                            await db.parks_attendance.update({
                               where: { Id: latestAttendance.Id },
                               data: {
                                  exit_time: eventData.event.params.events[0].happenTime
                               }
                            })
                            console.log("✅ [PARK ATTENDANCE] Exit time updated successfully");
                         } else {
                            console.log("⚠️ [PARK ATTENDANCE] No open attendance record found for person_Id:", person_Id);
                         }
                      }
                   }
                }
             }
          }

         return {
            success: true,
            message: "Event processed successfully",
            data: eventData
         };

      } catch (error: any) {
         console.error("💥 [EventHandlerService] Error processing event:", error.message || error);
         throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, "Failed to process event");
      }
   }
}
export default EventHandlerService;
