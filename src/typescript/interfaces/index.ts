interface ParkCombine {
  Id: number;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string;
}
export interface ParkType extends ParkCombine {
  park_Id: string;
  park_english_name: string;
  park_arabic_name: string;
  image?: string;
  location?: string;
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

export interface SettingTypes {
  stream_url?: string;
  stream_api_key?: string;
  stream_path?: string;
  password?:string;
}
export interface SettingInputTypes extends SettingTypes {
     park_Id: number;
}
export interface OfficeSettingInputTypes extends SettingTypes {
     office_Id: number;
}
export interface ParkCamera extends ParkCombine, SettingTypes{
  park_Id: number;
  camera_Id: string;
  camera_english_name: string;
  camera_arabic_name: string;
  ip_address: string;
  last_active_date: Date,
  last_active_time: string;
  status: string;
  attendance?: boolean|undefined;
  footfall?: boolean | undefined;
  behaviour?:boolean | undefined;
  behaviour_alerts?: boolean | undefined;
  irrigation?:boolean | undefined;
  landscapping?:boolean | undefined;
  litter_detection?:boolean | undefined;
  intrusion?:boolean | undefined;
  smooking_detection?:boolean | undefined;
}
export interface OfficeType extends ParkCombine {
  office_Id: string;
  office_english_name?:string;
  office_arabic_name?:string;
  image?:string;
  location?:string;
  status?:string;
}
export interface OfficeCamera extends ParkCombine {
  office_Id: number;
  camera_Id: string;
  camera_english_name?: string;
  camera_arabic_name?: string;
  ip_address?: string;
  last_active_date?: Date,
  last_active_time?: string;
  status?:string;

}

export interface SmokingDetectionType {
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
  park_Id: number;
  case_Id: string;
  location: string;
  occurrence_date: Date;
  occurrence_time: Date;
  snap_shot: string;
  status: string;
}

export interface LandscapingType {
  park_Id: number;
  case_Id: string;
  location: string;
  snap_shot: string;
  type: string;
  status: string;
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
  office_Id: number;
  person_Id: string;
  sentiment_of: 'employee' | 'visitor';
  check_in_date: Date;
  check_in_time: Date;
  check_in_sentiment: string;
  entry_camera_Id: number;
  check_out_date?: Date;
  check_out_time?: Date;
  check_out_capture?: string;
  exit_camera_Id?: number;
  detection_Id?: string;
  person_name?: string;
  person_image?: string;
  gender?: string;
  check_in_image?: string;
  check_out_sentiment?: string;
}

export interface ParkSentimentAnalysisType {
  park_Id: number;
  person_Id: string;
  sentiment_of: 'employee' | 'visitor';
  check_in_date: Date;
  check_in_time: Date;
  check_in_sentiment: string;
  entry_camera_Id: number;
  check_out_date?: Date;
  check_out_time?: Date;
  check_out_capture?: string;
  exit_camera_Id?: number;
  detection_Id?: string;
  person_name?: string;
  person_image?: string;
  gender?: string;
  check_in_image?: string;
  check_out_sentiment?: string;
}

export interface OfficeAttendanceType {
  office_Id: number;
  person_Id: number; // Changed from string to number to match users.Id
  entry_time?: Date;
  exit_time?: Date;
}

export interface ParkAttendanceType {
  park_Id: number;
  person_Id: number; // Changed from string to number to match users.Id
  entry_time?: Date;
  exit_time?: Date;
}
export interface TermsPrivacyType {
  id?: number; // optional because not required on create
  terms: string;
  privacyPolicy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

