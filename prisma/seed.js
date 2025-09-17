const { PrismaClient } = require('../src/prisma/generated/prisma');

const prisma = new PrismaClient();
require('dotenv').config()

async function main() {


  await prisma.access_secret.create({
    data: {
      value: 'TWpBeU5TOHdPUzh3T1E9PQ=='
    }
  });

  const roles = await Promise.all([
    prisma.users_roles.create({ data: { role_name: 'Super Admin' } }),
    prisma.users_roles.create({ data: { role_name: 'Park Manager' } }),
    prisma.users_roles.create({ data: { role_name: 'Office Manager' } }),
    prisma.users_roles.create({ data: { role_name: 'Security Officer' } }),
    prisma.users_roles.create({ data: { role_name: 'Maintenance Staff' } }),
    prisma.users_roles.create({ data: { role_name: 'Viewer' } }),
    prisma.users_roles.create({ data: { role_name: 'Operations Manager' } })
  ]);

  const rolesList = roles;

  for (const role of rolesList) {
    await prisma.users_permissions.create({
      data: {
        role_Id: role.Id,
        dashboard_view: true,
        role_permission_view: role.role_name === 'Super Admin',
        role_permission_add: role.role_name === 'Super Admin',
        role_permission_update: role.role_name === 'Super Admin',
        offices_view: ['Super Admin', 'Office Manager', 'Operations Manager'].includes(role.role_name),
        offices_add: ['Super Admin', 'Office Manager'].includes(role.role_name),
        offices_update: ['Super Admin', 'Office Manager'].includes(role.role_name),
        parks_view: ['Super Admin', 'Park Manager', 'Operations Manager'].includes(role.role_name),
        parks_add: ['Super Admin', 'Park Manager'].includes(role.role_name),
        parks_update: ['Super Admin', 'Park Manager'].includes(role.role_name),
        system_report_view: ['Super Admin', 'Operations Manager'].includes(role.role_name),
        alerts_view: true,
        office_attendance_view: ['Super Admin', 'Office Manager', 'Operations Manager'].includes(role.role_name),
        office_attendance_add: ['Super Admin', 'Office Manager'].includes(role.role_name),
        office_attendance_update: ['Super Admin', 'Office Manager'].includes(role.role_name),
        office_footfall_view: ['Super Admin', 'Office Manager', 'Operations Manager'].includes(role.role_name),
        office_footfall_add: ['Super Admin', 'Office Manager'].includes(role.role_name),
        office_footfall_update: ['Super Admin', 'Office Manager'].includes(role.role_name),
        office_sentimental_view: ['Super Admin', 'Office Manager', 'Operations Manager'].includes(role.role_name),
        office_sentimental_add: ['Super Admin', 'Office Manager'].includes(role.role_name),
        office_sentimental_update: ['Super Admin', 'Office Manager'].includes(role.role_name),
        park_attendance_view: ['Super Admin', 'Park Manager', 'Operations Manager'].includes(role.role_name),
        park_attendance_add: ['Super Admin', 'Park Manager'].includes(role.role_name),
        park_attendance_update: ['Super Admin', 'Park Manager'].includes(role.role_name),
        park_footfall_view: ['Super Admin', 'Park Manager', 'Operations Manager'].includes(role.role_name),
        park_footfall_add: ['Super Admin', 'Park Manager'].includes(role.role_name),
        park_footfall_update: ['Super Admin', 'Park Manager'].includes(role.role_name),
        park_sentimental_view: ['Super Admin', 'Park Manager', 'Operations Manager'].includes(role.role_name),
        park_sentimental_add: ['Super Admin', 'Park Manager'].includes(role.role_name),
        park_sentimental_update: ['Super Admin', 'Park Manager'].includes(role.role_name),
        park_irrigation_view: ['Super Admin', 'Park Manager', 'Maintenance Staff'].includes(role.role_name),
        park_irrigation_add: ['Super Admin', 'Park Manager', 'Maintenance Staff'].includes(role.role_name),
        park_irrigation_update: ['Super Admin', 'Park Manager', 'Maintenance Staff'].includes(role.role_name),
        park_landscaping_view: ['Super Admin', 'Park Manager', 'Maintenance Staff'].includes(role.role_name),
        park_landscaping_add: ['Super Admin', 'Park Manager', 'Maintenance Staff'].includes(role.role_name),
        park_landscaping_update: ['Super Admin', 'Park Manager', 'Maintenance Staff'].includes(role.role_name),
        park_litter_detection_view: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        park_litter_detection_add: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        park_litter_detection_update: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        park_intrusion_detection_view: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        park_intrusion_detection_add: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        park_intrusion_detection_update: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        park_smoking_detection_view: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        park_smoking_detection_add: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        park_smoking_detection_update: ['Super Admin', 'Park Manager', 'Security Officer'].includes(role.role_name),
        my_account_view: true,
        settings_view: ['Super Admin'].includes(role.role_name)
      }
    });
  }

 4. Seed users
👤 Seeding users...');
  const users = await Promise.all([
    prisma.users.create({
      data: {
        emp_Id: 'EMP001',
        gender: 'Male',
        emp__eng_name: 'Ahmed Al-Rashid',
        emp__arabic_name: 'أحمد الراشد',
        country_code: '+971',
        phone: '501234567',
        email: 'ahmed.rashid@company.ae',
        dep_eng_name: 'Information Technology',
        dep_arabic_name: 'تقنية المعلومات',
        desig_eng_name: 'System Administrator',
        desig_arabic_name: 'مدير النظام',
        unit_eng_name: 'IT Operations',
        unit_arabic_name: 'عمليات تقنية المعلومات',
        committe_eng_name: 'Technical Committee',
        committe_arabic_name: 'اللجنة التقنية',
        ai_engine_access: true,
        role_Id: roles[0].Id
      }
    }),
    prisma.users.create({
      data: {
        emp_Id: 'EMP002',
        gender: 'Female',
        emp__eng_name: 'Fatima Al-Zahra',
        emp__arabic_name: 'فاطمة الزهراء',
        country_code: '+971',
        phone: '502345678',
        email: 'fatima.zahra@company.ae',
        dep_eng_name: 'Parks Management',
        dep_arabic_name: 'إدارة الحدائق',
        desig_eng_name: 'Park Manager',
        desig_arabic_name: 'مدير الحديقة',
        unit_eng_name: 'Green Spaces',
        unit_arabic_name: 'المساحات الخضراء',
        committe_eng_name: 'Environmental Committee',
        committe_arabic_name: 'اللجنة البيئية',
        ai_engine_access: true,
        role_Id: roles[1].Id
      }
    }),
    prisma.users.create({
      data: {
        emp_Id: 'EMP003',
        gender: 'Male',
        emp__eng_name: 'Omar Al-Mansouri',
        emp__arabic_name: 'عمر المنصوري',
        country_code: '+971',
        phone: '503456789',
        email: 'omar.mansouri@company.ae',
        dep_eng_name: 'Office Administration',
        dep_arabic_name: 'الإدارة المكتبية',
        desig_eng_name: 'Office Manager',
        desig_arabic_name: 'مدير المكتب',
        unit_eng_name: 'Administrative Services',
        unit_arabic_name: 'الخدمات الإدارية',
        committe_eng_name: 'Administrative Committee',
        committe_arabic_name: 'اللجنة الإدارية',
        ai_engine_access: false,
        role_Id: roles[2].Id
      }
    }),
    prisma.users.create({
      data: {
        emp_Id: 'EMP004',
        gender: 'Male',
        emp__eng_name: 'Hassan Al-Qasimi',
        emp__arabic_name: 'حسن القاسمي',
        country_code: '+971',
        phone: '504567890',
        email: 'hassan.qasimi@company.ae',
        dep_eng_name: 'Security Department',
        dep_arabic_name: 'قسم الأمن',
        desig_eng_name: 'Security Officer',
        desig_arabic_name: 'ضابط أمن',
        unit_eng_name: 'Security Operations',
        unit_arabic_name: 'عمليات الأمن',
        committe_eng_name: 'Security Committee',
        committe_arabic_name: 'اللجنة الأمنية',
        ai_engine_access: false,
        role_Id: roles[3].Id
      }
    }),
    prisma.users.create({
      data: {
        emp_Id: 'EMP005',
        gender: 'Female',
        emp__eng_name: 'Mariam Al-Shamsi',
        emp__arabic_name: 'مريم الشامسي',
        country_code: '+971',
        phone: '505678901',
        email: 'mariam.shamsi@company.ae',
        dep_eng_name: 'Maintenance',
        dep_arabic_name: 'الصيانة',
        desig_eng_name: 'Maintenance Supervisor',
        desig_arabic_name: 'مشرف صيانة',
        unit_eng_name: 'Facility Maintenance',
        unit_arabic_name: 'صيانة المرافق',
        committe_eng_name: 'Maintenance Committee',
        committe_arabic_name: 'لجنة الصيانة',
        ai_engine_access: false,
        role_Id: roles[4].Id
      }
    }),
    prisma.users.create({
      data: {
        emp_Id: 'EMP006',
        gender: 'Male',
        emp__eng_name: 'Khalid Al-Neyadi',
        emp__arabic_name: 'خالد النيادي',
        country_code: '+971',
        phone: '506789012',
        email: 'khalid.neyadi@company.ae',
        dep_eng_name: 'Operations',
        dep_arabic_name: 'العمليات',
        desig_eng_name: 'Operations Manager',
        desig_arabic_name: 'مدير العمليات',
        unit_eng_name: 'Field Operations',
        unit_arabic_name: 'العمليات الميدانية',
        committe_eng_name: 'Operations Committee',
        committe_arabic_name: 'لجنة العمليات',
        ai_engine_access: true,
        role_Id: roles[6].Id
      }
    }),
    prisma.users.create({
      data: {
        emp_Id: 'EMP007',
        gender: 'Female',
        emp__eng_name: 'Aisha Al-Matrooshi',
        emp__arabic_name: 'عائشة المطروشي',
        country_code: '+971',
        phone: '507890123',
        email: 'aisha.matrooshi@company.ae',
        dep_eng_name: 'Human Resources',
        dep_arabic_name: 'الموارد البشرية',
        desig_eng_name: 'HR Specialist',
        desig_arabic_name: 'أخصائي موارد بشرية',
        unit_eng_name: 'Employee Services',
        unit_arabic_name: 'خدمات الموظفين',
        committe_eng_name: 'HR Committee',
        committe_arabic_name: 'لجنة الموارد البشرية',
        ai_engine_access: false,
        role_Id: roles[5].Id
      }
    })
  ]);

 Get created users
  const usersList = users;

 5. Seed parks
🏞️ Seeding parks...');
  const parks = await prisma.parks.createMany({
    data: [
      {
        park_Id: 'PARK001',
        park_english_name: 'Al Salam Central Park',
        park_arabic_name: 'حديقة السلام المركزية',
        image: 'https://images.freepik.com/free-photo/beautiful-park-with-green-grass-trees_181624-16041.jpg',
        latitude: 25.2048,
        longitude: 55.2708
      },
      {
        park_Id: 'PARK002',
        park_english_name: 'Zabeel Park',
        park_arabic_name: 'حديقة الزعبيل',
        image: 'https://images.freepik.com/free-photo/green-park-with-trees-grass_181624-32951.jpg',
        latitude: 25.2285,
        longitude: 55.3094
      },
      {
        park_Id: 'PARK003',
        park_english_name: 'Jumeirah Beach Park',
        park_arabic_name: 'حديقة شاطئ الجميرا',
        image: 'https://images.freepik.com/free-photo/tropical-beach-with-palm-trees_181624-46234.jpg',
        latitude: 25.2285,
        longitude: 55.2394
      },
      {
        park_Id: 'PARK004',
        park_english_name: 'Creek Park',
        park_arabic_name: 'حديقة الخور',
        image: 'https://images.freepik.com/free-photo/beautiful-landscape-with-lake-mountains_181624-25847.jpg',
        latitude: 25.2454,
        longitude: 55.3261
      },
      {
        park_Id: 'PARK005',
        park_english_name: 'Al Mamzar Beach Park',
        park_arabic_name: 'حديقة شاطئ الممزر',
        image: 'https://images.freepik.com/free-photo/beautiful-beach-with-clear-blue-water_181624-45821.jpg',
        latitude: 25.2944,
        longitude: 55.3364
      },
      {
        park_Id: 'PARK006',
        park_english_name: 'Mushrif Park',
        park_arabic_name: 'حديقة مشرف',
        image: 'https://images.freepik.com/free-photo/forest-landscape-with-trees_181624-51472.jpg',
        latitude: 25.1579,
        longitude: 55.4214
      },
      {
        park_Id: 'PARK007',
        park_english_name: 'Al Khawaneej Park',
        park_arabic_name: 'حديقة الخوانيج',
        image: 'https://images.freepik.com/free-photo/green-field-with-trees-blue-sky_181624-18294.jpg',
        latitude: 25.2686,
        longitude: 55.4347
      }
    ]
  });

 Get created parks
  const parksList = await prisma.parks.findMany();

 6. Seed offices
🏢 Seeding offices...');
  const offices = await prisma.offices.createMany({
    data: [
      {
        office_Id: 'OFF001',
        office_english_name: 'Dubai Municipality Head Office',
        office_arabic_name: 'مكتب بلدية دبي الرئيسي',
        image: 'https://images.freepik.com/free-photo/modern-office-building-with-glass-facade_181624-31547.jpg',
        latitude: 25.2697,
        longitude: 55.3095,
        location: 'Downtown Dubai, Sheikh Zayed Road, Near Dubai Mall',
        status: 'Active'
      },
      {
        office_Id: 'OFF002',
        office_english_name: 'Deira Branch Office',
        office_arabic_name: 'مكتب فرع ديرة',
        image: 'https://images.freepik.com/free-photo/corporate-building-exterior_181624-42851.jpg',
        latitude: 25.2709,
        longitude: 55.3095,
        location: 'Deira, Al Rigga Street, Near Deira City Centre',
        status: 'Active'
      },
      {
        office_Id: 'OFF003',
        office_english_name: 'Bur Dubai Office',
        office_arabic_name: 'مكتب بر دبي',
        image: 'https://images.freepik.com/free-photo/modern-business-building_181624-29841.jpg',
        latitude: 25.2582,
        longitude: 55.2962,
        location: 'Bur Dubai, Al Fahidi Historical District',
        status: 'Active'
      },
      {
        office_Id: 'OFF004',
        office_english_name: 'Jumeirah Office',
        office_arabic_name: 'مكتب الجميرا',
        image: 'https://images.freepik.com/free-photo/office-building-with-modern-architecture_181624-35742.jpg',
        latitude: 25.2285,
        longitude: 55.2394,
        location: 'Jumeirah, Beach Road, Near Jumeirah Beach',
        status: 'Active'
      },
      {
        office_Id: 'OFF005',
        office_english_name: 'Al Karama Service Center',
        office_arabic_name: 'مركز خدمات الكرامة',
        image: 'https://images.freepik.com/free-photo/government-building-facade_181624-28541.jpg',
        latitude: 25.2369,
        longitude: 55.3011,
        location: 'Al Karama, Al Karama Street, Near Karama Centre',
        status: 'Active'
      },
      {
        office_Id: 'OFF006',
        office_english_name: 'Al Garhoud Office',
        office_arabic_name: 'مكتب الغرهود',
        image: 'https://images.freepik.com/free-photo/contemporary-office-building_181624-39574.jpg',
        latitude: 25.2522,
        longitude: 55.3448,
        location: 'Al Garhoud, Airport Road, Near Dubai International Airport',
        status: 'Active'
      }
    ]
  });

 Get created offices
  const officesList = await prisma.offices.findMany();

 7. Seed park_cameras
📹 Seeding park_cameras...');
  for (let i = 0; i < parksList.length; i++) {
    const park = parksList[i];
    await prisma.park_cameras.create({
      data: {
        park_Id: park.Id,
        camera_Id: `CAM_PARK_${park.park_Id}_001`,
        camera_english_name: `${park.park_english_name} - Main Entrance`,
        camera_arabic_name: `${park.park_arabic_name} - المدخل الرئيسي`,
        latitude: (parseFloat(park.latitude) + 0.001).toFixed(6),
        longitude: (parseFloat(park.longitude) + 0.001).toFixed(6),
        ip_address: `192.168.1.${10 + i}`,
        last_active_date: new Date(),
        last_active_time: new Date(),
        status: 'Active'
      }
    });
  }

 8. Seed offices_cameras
📹 Seeding offices_cameras...');
  for (let i = 0; i < officesList.length; i++) {
    const office = officesList[i];
    await prisma.offices_cameras.create({
      data: {
        office_Id: office.Id,
        camera_Id: `CAM_OFF_${office.office_Id}_001`,
        camera_english_name: `${office.office_english_name} - Reception`,
        camera_arabic_name: `${office.office_arabic_name} - الاستقبال`,
        latitude: (parseFloat(office.latitude) + 0.001).toFixed(6),
        longitude: (parseFloat(office.longitude) + 0.001).toFixed(6),
        ip_address: `192.168.2.${10 + i}`,
        last_active_date: new Date(),
        last_active_time: new Date(),
        status: 'Active'
      }
    });
  }

 Get cameras for further seeding
  const parkCameras = await prisma.park_cameras.findMany();
  const officeCameras = await prisma.offices_cameras.findMany();

 9. Seed park_zones
🌳 Seeding park_zones...');
  for (let i = 0; i < parksList.length; i++) {
    const park = parksList[i];
    await prisma.park_zones.create({
      data: {
        park_Id: park.Id,
        zone_Id: `ZONE_${park.park_Id}_001`,
        zone_english_name: `${park.park_english_name} - Irrigation Zone A`,
        zone_arabic_name: `${park.park_arabic_name} - منطقة الري أ`,
        latitude: (parseFloat(park.latitude) + 0.002).toFixed(6),
        longitude: (parseFloat(park.longitude) + 0.002).toFixed(6),
        device_ip: `192.168.3.${10 + i}`,
        web_api: `http://irrigation-api.local/zones/${i + 1}`,
        status: 'Active'
      }
    });
  }

 Get zones
  const parkZones = await prisma.park_zones.findMany();

 10. Seed park_streams
📺 Seeding park_streams...');
  for (let i = 0; i < parksList.length; i++) {
    const park = parksList[i];
    await prisma.park_streams.create({
      data: {
        park_Id: park.Id,
        stream_url: `rtmp://streams.company.ae/live/park_${park.park_Id}`,
        stream_api_key: `pk_live_${Math.random().toString(36).substring(7)}`,
        stream_path: `/live/park_${park.park_Id}`,
        password: 'stream_password_123'
      }
    });
  }

 11. Seed office_streams
📺 Seeding office_streams...');
  for (let i = 0; i < officesList.length; i++) {
    const office = officesList[i];
    await prisma.office_streams.create({
      data: {
        office_Id: office.Id,
        stream_url: `rtmp://streams.company.ae/live/office_${office.office_Id}`,
        stream_api_key: `ok_live_${Math.random().toString(36).substring(7)}`,
        stream_path: `/live/office_${office.office_Id}`,
        password: 'stream_password_456'
      }
    });
  }

 12. Seed live_stream_favourites
⭐ Seeding live_stream_favourites...');
  for (let i = 0; i < 6; i++) {
    await prisma.live_stream_favourites.create({
      data: {
        emp_Id: usersList[i % usersList.length].Id,
        park_camera_Id: i < 3 ? parkCameras[i % parkCameras.length].Id : null,
        office_camera_Id: i >= 3 ? officeCameras[i % officeCameras.length].Id : null
      }
    });
  }

 13. Seed parks_attendance
📝 Seeding parks_attendance...');
  for (let i = 0; i < 7; i++) {
    const entryTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    const exitTime = new Date(entryTime.getTime() + Math.random() * 8 * 60 * 60 * 1000);
    
    await prisma.parks_attendance.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        person_Id: usersList[i % usersList.length].Id,
        entry_time: entryTime,
        exit_time: Math.random() > 0.3 ? exitTime : null
      }
    });
  }

 14. Seed offices_attendance
📝 Seeding offices_attendance...');
  for (let i = 0; i < 7; i++) {
    const entryTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    const exitTime = new Date(entryTime.getTime() + Math.random() * 8 * 60 * 60 * 1000);
    
    await prisma.offices_attendance.create({
      data: {
        office_Id: officesList[i % officesList.length].Id,
        person_Id: usersList[i % usersList.length].Id,
        entry_time: entryTime,
        exit_time: Math.random() > 0.3 ? exitTime : null
      }
    });
  }

 15. Seed parks_sentiment_analysis
😊 Seeding parks_sentiment_analysis...');
  const sentiments = ['happy', 'neutral', 'sad', 'angry', 'surprised'];
  for (let i = 0; i < 6; i++) {
    await prisma.parks_sentiment_analysis.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        person_Id: `PERSON_${Math.random().toString(36).substring(7)}`,
        detection_Id: `DET_PARK_${Date.now()}_${i}`,
        person_name: `Visitor ${i + 1}`,
        person_image: `https://images.freepik.com/free-photo/portrait-person-${i % 2 === 0 ? 'man' : 'woman'}_181624-${20000 + i}.jpg`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        check_in_image: `https://images.freepik.com/free-photo/person-entering-park_181624-${30000 + i}.jpg`,
        sentiment_of: i % 2 === 0 ? 'visitor' : 'employee',
        check_in_date: new Date(),
        check_in_time: new Date(),
        check_in_sentiment: sentiments[i % sentiments.length],
        entry_camera_Id: parkCameras[i % parkCameras.length].Id,
        check_out_date: Math.random() > 0.5 ? new Date() : null,
        check_out_time: Math.random() > 0.5 ? new Date() : null,
        check_out_capture: Math.random() > 0.5 ? `https://images.freepik.com/free-photo/person-exiting-park_181624-${35000 + i}.jpg` : null,
        check_out_sentiment: Math.random() > 0.5 ? sentiments[(i + 1) % sentiments.length] : null,
        exit_camera_Id: Math.random() > 0.5 ? parkCameras[i % parkCameras.length].Id : null
      }
    });
  }

 16. Seed offices_sentiment_analysis
😊 Seeding offices_sentiment_analysis...');
  for (let i = 0; i < 6; i++) {
    await prisma.offices_sentiment_analysis.create({
      data: {
        office_Id: officesList[i % officesList.length].Id,
        person_Id: `PERSON_OFF_${Math.random().toString(36).substring(7)}`,
        detection_Id: `DET_OFF_${Date.now()}_${i}`,
        person_name: `Employee ${i + 1}`,
        person_image: `https://images.freepik.com/free-photo/business-person-portrait_181624-${40000 + i}.jpg`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        check_in_image: `https://images.freepik.com/free-photo/person-entering-office_181624-${50000 + i}.jpg`,
        sentiment_of: 'employee',
        check_in_date: new Date(),
        check_in_time: new Date(),
        check_in_sentiment: sentiments[i % sentiments.length],
        entry_camera_Id: officeCameras[i % officeCameras.length].Id,
        check_out_date: Math.random() > 0.5 ? new Date() : null,
        check_out_time: Math.random() > 0.5 ? new Date() : null,
        check_out_capture: Math.random() > 0.5 ? `https://images.freepik.com/free-photo/person-exiting-office_181624-${55000 + i}.jpg` : null,
        check_out_sentiment: Math.random() > 0.5 ? sentiments[(i + 1) % sentiments.length] : null,
        exit_camera_Id: Math.random() > 0.5 ? officeCameras[i % officeCameras.length].Id : null
      }
    });
  }

 17. Seed parks_behaviour_alerts
🚨 Seeding parks_behaviour_alerts...');
  const behaviours = ['Running in restricted area', 'Climbing trees', 'Littering', 'Loud music', 'Pet without leash', 'Vandalism'];
  for (let i = 0; i < 6; i++) {
    await prisma.parks_behaviour_alerts.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        person_Id: `PERSON_ALERT_${Math.random().toString(36).substring(7)}`,
        camera_Id: parkCameras[i % parkCameras.length].Id,
        detection_Id: `BEHAV_${Date.now()}_${i}`,
        detection_code: `BC${String(i + 1).padStart(3, '0')}`,
        detection_date: new Date(),
        detection_time: new Date(),
        description: `Alert for ${behaviours[i % behaviours.length]} detected in ${parksList[i % parksList.length].park_english_name}`,
        detected_behaviour: behaviours[i % behaviours.length],
        is_employee: Math.random() > 0.7,
        snap_shot: `https://images.freepik.com/free-photo/security-alert-${i % 3 + 1}_181624-${60000 + i}.jpg`
      }
    });
  }

 18. Seed parks_intrusion_detection
🚫 Seeding parks_intrusion_detection...');
  for (let i = 0; i < 6; i++) {
    await prisma.parks_intrusion_detection.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        location: `Zone ${i + 1} - ${parksList[i % parksList.length].park_english_name}`,
        camera_Id: parkCameras[i % parkCameras.length].Id,
        occurrence_date: new Date(),
        occurrence_time: new Date(),
        snap_shot: `https://images.freepik.com/free-photo/intrusion-detection-${i % 3 + 1}_181624-${70000 + i}.jpg`,
        detection_Id: `INTRU_${Date.now()}_${i}`,
        detection_date: new Date(),
        detection_time: new Date(),
        description: `Unauthorized access detected in restricted area of ${parksList[i % parksList.length].park_english_name}`,
        is_employee: Math.random() > 0.8,
        current_status: i % 3 === 0 ? 'resolved' : i % 3 === 1 ? 'investigating' : 'pending',
        posted_to_intranet_date: Math.random() > 0.5 ? new Date() : null,
        posted_to_intranet_time: Math.random() > 0.5 ? new Date() : null
      }
    });
  }

 19. Seed parks_smoking_detection
🚭 Seeding parks_smoking_detection...');
  for (let i = 0; i < 6; i++) {
    await prisma.parks_smoking_detection.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        location: `Area ${String.fromCharCode(65 + i)} - ${parksList[i % parksList.length].park_english_name}`,
        camera_Id: parkCameras[i % parkCameras.length].Id,
        occurrence_date: new Date(),
        occurrence_time: new Date(),
        snap_shot: `https://images.freepik.com/free-photo/smoking-detection-${i % 3 + 1}_181624-${80000 + i}.jpg`,
        detection_Id: `SMOKE_${Date.now()}_${i}`,
        detection_date: new Date(),
        detection_time: new Date(),
        description: `Smoking activity detected in non-smoking area of ${parksList[i % parksList.length].park_english_name}`,
        is_employee: Math.random() > 0.9,
        current_status: i % 3 === 0 ? 'resolved' : i % 3 === 1 ? 'investigating' : 'pending',
        posted_to_intranet_date: Math.random() > 0.5 ? new Date() : null,
        posted_to_intranet_time: Math.random() > 0.5 ? new Date() : null
      }
    });
  }

 20. Seed parks_landscaping
🌱 Seeding parks_landscaping...');
  const landscapingTypes = ['Tree Pruning', 'Grass Maintenance', 'Flower Bed Care', 'Irrigation Repair', 'Pest Control', 'Fertilization'];
  for (let i = 0; i < 6; i++) {
    await prisma.parks_landscaping.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        case_Id: `LAND_${Date.now()}_${i}`,
        location: `Section ${i + 1} - ${parksList[i % parksList.length].park_english_name}`,
        snap_shot: `https://images.freepik.com/free-photo/landscaping-work-${i % 4 + 1}_181624-${90000 + i}.jpg`,
        type: landscapingTypes[i % landscapingTypes.length],
        status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in_progress' : 'pending',
        detection_Id: `LAND_DET_${Date.now()}_${i}`,
        detection_date: new Date(),
        detection_time: new Date(),
        description: `${landscapingTypes[i % landscapingTypes.length]} required in ${parksList[i % parksList.length].park_english_name}`,
        current_status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in_progress' : 'pending',
        camera_Id: parkCameras[i % parkCameras.length].Id,
        after_image: i % 3 === 0 ? `https://images.freepik.com/free-photo/completed-landscaping-${i % 3 + 1}_181624-${91000 + i}.jpg` : null
      }
    });
  }

 21. Seed parks_litter_detection
🗑️ Seeding parks_litter_detection...');
  for (let i = 0; i < 6; i++) {
    await prisma.parks_litter_detection.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        case_Id: `LITTER_${Date.now()}_${i}`,
        location: `Area ${String.fromCharCode(65 + i)} - ${parksList[i % parksList.length].park_english_name}`,
        occurrence_date: new Date(),
        occurrence_time: new Date(),
        snap_shot: `https://images.freepik.com/free-photo/litter-detection-${i % 3 + 1}_181624-${92000 + i}.jpg`,
        status: i % 3 === 0 ? 'cleaned' : i % 3 === 1 ? 'cleaning' : 'reported',
        detection_Id: `LITT_DET_${Date.now()}_${i}`,
        detection_date: new Date(),
        detection_time: new Date(),
        description: `Litter accumulation detected in ${parksList[i % parksList.length].park_english_name}`,
        current_status: i % 3 === 0 ? 'cleaned' : i % 3 === 1 ? 'cleaning' : 'reported',
        camera_Id: parkCameras[i % parkCameras.length].Id,
        after_image: i % 3 === 0 ? `https://images.freepik.com/free-photo/clean-area-${i % 3 + 1}_181624-${93000 + i}.jpg` : null
      }
    });
  }

 22. Seed parks_irrigation_job_history
💧 Seeding parks_irrigation_job_history...');
  const jobStatuses = ['completed', 'running', 'scheduled', 'failed', 'cancelled'];
  for (let i = 0; i < 7; i++) {
    const startTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    const completedTime = i % 3 === 0 ? new Date(startTime.getTime() + Math.random() * 4 * 60 * 60 * 1000) : null;
    
    await prisma.parks_irrigation_job_history.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        zone_Id: parkZones[i % parkZones.length].Id,
        job_Id: `IRR_JOB_${Date.now()}_${i}`,
        job_started_at: startTime,
        job_completed_at: completedTime,
        job_status: jobStatuses[i % jobStatuses.length]
      }
    });
  }

 23. Seed parks_footfall_analysis
👥 Seeding parks_footfall_analysis...');
  for (let i = 0; i < 7; i++) {
    await prisma.parks_footfall_analysis.create({
      data: {
        park_Id: parksList[i % parksList.length].Id,
        detection_Id: `FOOTFALL_PARK_${Date.now()}_${i}`,
        person_Id: Math.floor(Math.random() * 1000) + 1,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        is_child: Math.random() > 0.7,
        time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        detected_camera_Id: parkCameras[i % parkCameras.length].camera_Id,
        detected_camera_name: parkCameras[i % parkCameras.length].camera_english_name,
        abc1: `Data_${i}`,
        abc2: `Info_${i}`,
        abc3: `Meta_${i}`
      }
    });
  }

 24. Seed offices_footfall_analysis
👥 Seeding offices_footfall_analysis...');
  for (let i = 0; i < 6; i++) {
    await prisma.offices_footfall_analysis.create({
      data: {
        office_Id: officesList[i % officesList.length].Id,
        detection_Id: `FOOTFALL_OFF_${Date.now()}_${i}`,
        person_Id: usersList[i % usersList.length].Id,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        is_child: false, // Office context - unlikely to have children
        time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        detected_camera_Id: officeCameras[i % officeCameras.length].camera_Id,
        detected_camera_name: officeCameras[i % officeCameras.length].camera_english_name,
        abc1: `Office_Data_${i}`,
        abc2: `Office_Info_${i}`,
        abc3: `Office_Meta_${i}`
      }
    });
  }

 Get created detection records for relationships
  const littDetections = await prisma.parks_litter_detection.findMany();
  const landscapingRecords = await prisma.parks_landscaping.findMany();
  const smokingDetections = await prisma.parks_smoking_detection.findMany();
  const intrusionDetections = await prisma.parks_intrusion_detection.findMany();

 25. Seed ticket_details_table
🎫 Seeding ticket_details_table...');
  const ticketStatuses = ['initiated', 'assigned', 'completed', 'verified', 'failed_verification'];
  
 Create tickets for litter detection
  for (let i = 0; i < 3; i++) {
    await prisma.ticket_details_table.create({
      data: {
        status: ticketStatuses[i % ticketStatuses.length],
        date: new Date(),
        time: new Date(),
        comments: `Ticket for litter cleaning in progress - Case ${i + 1}`,
        image: `https://images.freepik.com/free-photo/cleaning-progress-${i % 3 + 1}_181624-${94000 + i}.jpg`,
        abc1: `Litter_Ticket_${i}`,
        abc2: `Priority_${i % 3 === 0 ? 'High' : 'Medium'}`,
        abc3: `Team_${String.fromCharCode(65 + i)}`,
        abc4: `Shift_${i % 2 === 0 ? 'Morning' : 'Evening'}`,
        litterDetectionId: littDetections[i % littDetections.length].Id
      }
    });
  }
  
 Create tickets for landscaping
  for (let i = 0; i < 3; i++) {
    await prisma.ticket_details_table.create({
      data: {
        status: ticketStatuses[i % ticketStatuses.length],
        date: new Date(),
        time: new Date(),
        comments: `Landscaping maintenance ticket - Job ${i + 1}`,
        image: `https://images.freepik.com/free-photo/landscaping-progress-${i % 3 + 1}_181624-${95000 + i}.jpg`,
        abc1: `Landscape_Ticket_${i}`,
        abc2: `Priority_${i % 3 === 0 ? 'High' : 'Medium'}`,
        abc3: `Team_${String.fromCharCode(68 + i)}`,
        abc4: `Shift_${i % 2 === 0 ? 'Morning' : 'Evening'}`,
        landscapingId: landscapingRecords[i % landscapingRecords.length].Id
      }
    });
  }

 26. Seed intranet_posting_history
📰 Seeding intranet_posting_history...');
  
 Create intranet posts for smoking detection
  for (let i = 0; i < 3; i++) {
    await prisma.intranet_posting_history.create({
      data: {
        smokingDetectionId: smokingDetections[i % smokingDetections.length].Id,
        title: `Smoking Violation Alert - ${parksList[i % parksList.length].park_english_name}`,
        intranet_id: `POST_SMOKE_${Date.now()}_${i}`,
        comments: `Smoking detected in non-smoking area. Immediate action required.`,
        date: new Date(),
        time: new Date(),
        abc1: `Severity_${i % 3 === 0 ? 'High' : 'Medium'}`,
        abc2: `Department_Security`,
        abc3: `Status_Active`
      }
    });
  }
  
 Create intranet posts for intrusion detection
  for (let i = 0; i < 3; i++) {
    await prisma.intranet_posting_history.create({
      data: {
        intrusionDetectionId: intrusionDetections[i % intrusionDetections.length].Id,
        title: `Security Alert - Unauthorized Access in ${parksList[i % parksList.length].park_english_name}`,
        intranet_id: `POST_INTRU_${Date.now()}_${i}`,
        comments: `Intrusion detected in restricted area. Security team dispatched.`,
        date: new Date(),
        time: new Date(),
        abc1: `Severity_High`,
        abc2: `Department_Security`,
        abc3: `Status_${i % 3 === 0 ? 'Resolved' : 'Active'}`
      }
    });
  }

 27. Seed TermsPrivacy
📋 Seeding TermsPrivacy...');
  await prisma.TermsPrivacy.create({
    data: {
      terms: `TERMS OF SERVICE

1. ACCEPTANCE OF TERMS
By accessing and using this Dubai Municipality Parks and Offices Management System, you accept and agree to be bound by the terms and provision of this agreement.

2. USE LICENSE
Permission is granted to temporarily use this system for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.

3. USER ACCOUNT
When you create an account with us, you must provide information that is accurate, complete, and current at all times.

4. PRIVACY POLICY
Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information.

5. PROHIBITED USES
You may not use our system for any unlawful purpose or to solicit others to perform unlawful acts.

6. CONTENT
Our system allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material.

7. TERMINATION
We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever.

8. CHANGES
We reserve the right, at our sole discretion, to modify or replace these Terms at any time.

9. CONTACT INFORMATION
If you have any questions about these Terms, please contact us at support@dubaimunicipality.ae`,
      privacyPolicy: `PRIVACY POLICY

1. INFORMATION WE COLLECT
We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.

2. HOW WE USE YOUR INFORMATION
We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.

3. INFORMATION SHARING
We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

4. DATA SECURITY
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. COOKIES
We use cookies and similar tracking technologies to track activity on our system and hold certain information.

6. THIRD-PARTY SERVICES
Our system may contain links to third-party websites or services that are not owned or controlled by Dubai Municipality.

7. CHILDREN'S PRIVACY
Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

8. CHANGES TO THIS POLICY
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

9. CONTACT US
If you have any questions about this Privacy Policy, please contact us at privacy@dubaimunicipality.ae`
    }
  });

 28. Seed FAQ
❓ Seeding FAQ...');
  const faqs = [
    {
      question: "How do I access the parks and offices management system?",
      answer: "You can access the system through the web portal using your employee credentials. Contact your system administrator if you need access."
    },
    {
      question: "What should I do if I notice suspicious activity in a park?",
      answer: "Report any suspicious activity immediately through the behavior alerts system or contact security personnel directly."
    },
    {
      question: "How can I view live camera feeds from parks and offices?",
      answer: "Navigate to the 'Live Streams' section in the dashboard to view real-time camera feeds from various locations."
    },
    {
      question: "What is the purpose of sentiment analysis in the system?",
      answer: "Sentiment analysis helps us understand visitor and employee satisfaction levels to improve our services and facilities."
    },
    {
      question: "How do I update office or park information?",
      answer: "Use the respective management sections in the dashboard to update office or park details. Ensure you have the necessary permissions."
    },
    {
      question: "What should I do if a camera is not working?",
      answer: "Report camera issues through the system's maintenance section or contact the technical support team immediately."
    },
    {
      question: "How can I track attendance at offices and parks?",
      answer: "The system automatically tracks attendance through camera detection. You can view attendance reports in the respective sections."
    },
    {
      question: "What is the irrigation job history used for?",
      answer: "Irrigation job history tracks automated watering schedules and maintenance activities for park zones to ensure proper plant care."
    },
    {
      question: "How do I manage user roles and permissions?",
      answer: "User roles and permissions can be managed by system administrators through the 'User Management' section."
    },
    {
      question: "What should I do if I detect litter in a park?",
      answer: "Use the litter detection system to report the issue. The system will automatically create a maintenance ticket for cleanup."
    }
  ];

  for (const faq of faqs) {
    await prisma.FAQ.create({
      data: faq
    });
  }

✅ Database seeding completed successfully!');
📊 Summary of seeded data:');
- Access Secret: 1 record');
- Users Roles: 7 records');
- Users Permissions: 7 records');
- Users: 7 records');
- Parks: 7 records');
- Offices: 6 records');
- Park Cameras: 7 records');
- Office Cameras: 6 records');
- Park Zones: 7 records');
- Park Streams: 7 records');
- Office Streams: 6 records');
- Live Stream Favourites: 6 records');
- Parks Attendance: 7 records');
- Offices Attendance: 7 records');
- Parks Sentiment Analysis: 6 records');
- Offices Sentiment Analysis: 6 records');
- Parks Behaviour Alerts: 6 records');
- Parks Intrusion Detection: 6 records');
- Parks Smoking Detection: 6 records');
- Parks Landscaping: 6 records');
- Parks Litter Detection: 6 records');
- Parks Irrigation Job History: 7 records');
- Parks Footfall Analysis: 7 records');
- Offices Footfall Analysis: 6 records');
- Ticket Details: 6 records');
- Intranet Posting History: 6 records');
- Terms & Privacy: 1 record');
- FAQ: 10 records');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });