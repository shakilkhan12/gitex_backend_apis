// Simple test to verify the event handler service works
const testEventData = {
  timestamp: "2025-09-16T13:46:14.749Z",
  receivedAt: "2025-09-16T13:46:14.750Z",
  logData: {
    method: "OnEventNotify",
    params: {
      sendTime: "2025-09-16T17:46:14+04:00",
      ability: "event_vss",
      events: [
        {
          eventId: "CA514ED8E22B45F0ACC761285601762F",
          srcIndex: "4",
          srcType: "camera",
          srcName: "PARKING-2",
          eventType: 131585, // Intrusion Detection
          status: 1,
          eventLvl: 3,
          happenTime: "2025-09-16T17:46:14+04:00"
        }
      ]
    },
    isHistory: 0
  }
};

console.log('🧪 Test Event Data Structure:');
console.log(JSON.stringify(testEventData, null, 2));

console.log('\n📋 Expected Behavior:');
console.log('1. Event type 131585 should trigger intrusion detection');
console.log('2. Should call HikVision API to get event records using eventId as eventIndexCode');
console.log('3. Should extract eventPicUri from response');
console.log('4. Should call HikVision API to get image data');
console.log('5. Should store intrusion detection record with base64 image');
console.log('\n📝 Note: This event format (without face data) is for intrusion and behavior events only.');
console.log('   Attendance events (131659) still require face data structure.');

console.log('\n🔧 To test:');
console.log('1. Start the backend server');
console.log('2. Send this event data to the event handler endpoint');
console.log('3. Check the logs for HikVision API calls');
console.log('4. Verify behavior alert is created in database');
