export interface ParkType {
  Id: number;
  park_Id: string;
  park_english_name: string;
  park_arabic_name: string;
  image: string;
  latitude: number;
  longitude: number;
  location?: string;
  status?: string;
}

export interface SmokingDetectionType {
  park_Id: string;
  location: string;
  camera_Id: string;
  occurrence_date: Date;
  occurrence_time: Date;
  snap_shot: string;
  detection_Id?: string;
  detection_date?: Date;
  detection_time?: Date;
  description?: string;
  is_employee?: boolean;
  current_status?: string;
  posted_to_intranet_date?: Date;
  posted_to_intranet_time?: Date;
}

export interface IntrusionDetectionType {
  park_Id: number;
  location: string;
  camera_Id: number;
  occurrence_date: Date;
  occurrence_time: Date;
  snap_shot: string;
  posted_to_intranet_date?: Date;
  posted_to_intranet_time?: Date;
  detection_Id?: string;
  detection_date?: Date;
  detection_time?: Date;
  description?: string;
  is_employee?: boolean;
  current_status?: string;
}

export interface LitterDetectionType {
  park_Id: string;
  case_Id: string;
  location: string;
  occurrence_date: Date;
  occurrence_time: Date;
  snap_shot: string;
  status: string;
  detection_Id?: string;
  detection_date?: Date;
  detection_time?: Date;
  camera_Id?: string;
  description?: string;
  current_status?: string;
  after_image?: string;
}

export interface LandscapingType {
  case_Id?: string;
  image?: string;
  name?: string;
  park_Id?: number;
  plant_type?: string;
  status?: string;
  suggestion?: string;
}

export interface BehaviorAlertType {
  park_Id: number;
  person_Id: string;
  camera_Id: number;
  detected_behaviour: string;
  snap_shot: string;
  detection_Id?: string;
  detection_code?: string;
  detection_date?: Date;
  detection_time?: Date;
  description?: string;
  is_employee?: boolean;
}

export interface OfficeSentimentAnalysisType {
  office_Id: string;
  person_Id?: string; // This should be the emp_Id from the users table (optional)
  detection_Id: string;
  sentiment_of?: "employee" | "visitor"; // Will be determined automatically based on user lookup
  check_in_date: Date;
  check_in_time: Date;
  check_in_sentiment: string;
  entry_camera_Id: string;
  check_out_date?: Date;
  check_out_time?: Date;
  check_out_capture?: string;
  exit_camera_Id?: string;
  person_name?: string; // Will be set automatically: user.emp__eng_name or "Visitor"
  person_image?: string; // Will be set from request if provided
  gender?: string;
  check_in_image?: string;
  check_out_sentiment?: string;
}

export interface OfficeFootfallAnalysisType {
  office_Id: number;
  detection_Id: string;
  person_Id?: number | null; // Optional for guest entries
  gender?: string;
  is_child?: boolean;
  detected_camera_Id: string;
  detected_camera_name?: string;
  time?: Date;
}

export interface ParkFootfallAnalysisType {
  park_Id: number;
  detection_Id: string;
  person_Id?: number | null; // Optional for guest entries
  gender?: string;
  is_child?: boolean;
  detected_camera_Id: string;
  detected_camera_name?: string;
  time?: Date;
  image?: string;
  abc2?: string;
  abc3?: string;
}

export interface ParkSentimentAnalysisType {
  park_Id: string;
  person_Id?: string; // This should be the emp_Id from the users table (optional)
  detection_Id: string;
  sentiment_of?: "employee" | "visitor"; // Will be determined automatically based on user lookup
  check_in_date: Date;
  check_in_time: Date;
  check_in_sentiment: string;
  entry_camera_Id: string;
  check_out_date?: Date;
  check_out_time?: Date;
  check_out_capture?: string;
  exit_camera_Id?: string;
  person_name?: string; // Will be set automatically: user.emp__eng_name or "Visitor"
  person_image?: string; // Will be set from request if provided
  gender?: string;
  check_in_image?: string;
  check_out_sentiment?: string;
}

export interface OfficeAttendanceType {
  office_Id: number;
  person_Id: number;
  entry_time?: Date;
  exit_time?: Date;
}

export interface ParkAttendanceType {
  park_Id: number;
  person_Id: number;
  entry_time?: Date;
  exit_time?: Date;
}

export interface SettingTypes {
  stream_url?: string;
  stream_api_key?: string;
  stream_path?: string;
  password?: string;
}

interface ParkCombine {
  Id: number;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingTypes {
  stream_url?: string;
  stream_api_key?: string;
  stream_path?: string;
  password?: string;
}

export interface OfficeType extends ParkCombine {
  office_Id: string;
  office_english_name?: string;
  office_arabic_name?: string;
  image?: string;
  location?: string;
  status?: string;
}
export interface OfficeCamera extends ParkCombine {
  office_Id: number;
  camera_Id: string;
  camera_english_name?: string;
  camera_arabic_name?: string;
  ip_address?: string;
  last_active_date?: Date;
  last_active_time?: string;
  status?: boolean | string;
}

export interface ParkZone extends ParkCombine {
  park_Id: number;
  zone_english_name: string;
  zone_arabic_name: string;
  zone_Id: string;
  device_ip: string;
  web_api: string;
  status: string;
  latitude: string;
  longitude: string;
}

export interface IrrigationSection {
  zone_Id: number;
  working_time: string;
}

export interface LandscapingSection {
  area_name: string;
  working_time: string;
}

export interface ParkCamera extends ParkCombine, SettingTypes {
  park_Id: number;
  camera_Id: string;
  camera_english_name: string;
  camera_arabic_name: string;
  ip_address: string;
  last_active_date: Date;
  last_active_time: string;
  status: boolean | string;
  is_ptz_camera?: boolean;
  irrigation_sections?: IrrigationSection[];
  landscaping_sections?: LandscapingSection[];
  attendance?: boolean | undefined;
  footfall?: boolean | undefined;
  behaviour?: boolean | undefined;
  behaviour_alerts?: boolean | undefined;
  irrigation?: boolean | undefined;
  landscapping?: boolean | undefined;
  litter_detection?: boolean | undefined;
  intrusion?: boolean | undefined;
  smooking_detection?: boolean | undefined;
}

export interface SettingInputTypes extends SettingTypes {
  park_Id: number;
}
export interface OfficeSettingInputTypes extends SettingTypes {
  office_Id: number;
}

export interface UserType {
  Id?: number;
  user_Id?: string;
  emp_Id?: string;
  emp_code?: string;
  image?: string;
  gender?: string;
  emp__eng_name?: string;
  emp__arabic_name?: string;
  location?: string;
  country_code?: string;
  phone?: string;
  telephone?: string;
  email?: string;
  office_extension?: string;
  nationality?: string;
  joining_date?: Date;
  date_of_birth?: Date;
  dep_eng_name?: string;
  dep_arabic_name?: string;
  desig_eng_name?: string;
  desig_arabic_name?: string;
  unit_eng_name?: string;
  unit_arabic_name?: string;
  committe_eng_name?: string;
  committe_arabic_name?: string;
  is_attendance_user?: boolean;
  is_ai_login_user?: boolean;
  ai_engine_access?: boolean;
  last_login?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  role_Id?: number;
}

export interface UserType {
  Id?: number;
  user_Id?: string;
  emp_Id?: string;
  emp_code?: string;
  image?: string;
  gender?: string;
  emp__eng_name?: string;
  emp__arabic_name?: string;
  location?: string;
  country_code?: string;
  phone?: string;
  telephone?: string;
  email?: string;
  office_extension?: string;
  nationality?: string;
  joining_date?: Date;
  date_of_birth?: Date;
  dep_eng_name?: string;
  dep_arabic_name?: string;
  desig_eng_name?: string;
  desig_arabic_name?: string;
  unit_eng_name?: string;
  unit_arabic_name?: string;
  committe_eng_name?: string;
  committe_arabic_name?: string;
  is_attendance_user?: boolean;
  is_ai_login_user?: boolean;
  ai_engine_access?: boolean;
  last_login?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  role_Id?: number;
}

export interface TermsPrivacyType {
  id?: number; // optional because not required on create
  terms: string;
  privacyPolicy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IntranetPostingHistoryType {
  title: string;
  intranet_id: string;
  comments: string;
}

export interface LitterDetectionCompleteType {
  id: number;
  comments: string;
  userId: number;
}

export interface AddUserType {
  unique_id: string;
  user_Id: string;
  emp_Id: string;
  emp_code: string;
  image?: string;
  gender: string;
  emp__eng_name: string;
  location: string;
  telephone: string;
  email: string;
  office_extension?: string;
  nationality: string;
  joining_date: Date;
  date_of_birth: Date;
  dep_eng_name: string;
  desig_eng_name: string;
  unit_arabic_name?: string;
  is_attendance_user?: boolean;
  is_ai_login_user?: boolean;
  ai_engine_access?: boolean;
}

export interface QMSTriggerType {
  // No input parameters needed for trigger
}

export interface QMSTriggerResponseType {
  visit_id: number;
  visitor_id: number | null;
  gender: string | null;
  age_group: string | null;
}

export interface QMSUpdateType {
  visit_id: number;
  ticket_number: string;
  service_english_name: string;
  service_arabic_name: string;
  agent_english_name: string;
  agent_arabic_name: string;
  ticket_date: string;
  issue_time: string;
  processing_start_time: string;
  processing_end_time: string;
  waiting_time: string;
  total_processing_time: string;
  exit_date: string;
  exit_time: string;
}

export interface QMSHistoryType {
  visit_id?: number;
  visitor_id?: number;
  gender?: string;
  age_group?: string;
  ticket_number?: string;
  service_english_name?: string;
  service_arabic_name?: string;
  agent_english_name?: string;
  agent_arabic_name?: string;
  ticket_date?: string;
  issue_time?: string;
  processing_start_time?: string;
  processing_end_time?: string;
  waiting_time?: string;
  total_processing_time?: string;
  entry_image?: string;
  entry_camera?: string;
  entry_mode?: string;
  entry_date?: string;
  entry_time?: string;
  exit_image?: string;
  exit_camera?: string;
  exit_mode?: string;
  exit_date?: string;
  exit_time?: string;
  status?: string;
}
