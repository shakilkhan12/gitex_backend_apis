import UserService from '../services/user.service';
import db from '../prisma/client';

async function uploadAllUsers() {
   try {
      console.log('🚀 Starting upload of ALL users to HIK Vision...');
      console.log('📋 This will upload all users in the database');
      
      // First, let's check how many users we have
      const totalUsers = await db.users.count();
      console.log(`📊 Total users in database: ${totalUsers}`);
      
      if (totalUsers === 0) {
         console.error(`❌ No users found in database.`);
         return;
      }
      
      // Get all users
      const allUsers = await db.users.findMany({
         orderBy: { Id: 'asc' },
         select: {
            Id: true,
            emp_Id: true,
            emp__eng_name: true,
            unique_id: true
         }
      });
      
      console.log('👥 Sample of users to be uploaded (first 10):');
      allUsers.slice(0, 10).forEach((user, index) => {
         const hasUniqueId = user.unique_id ? '✅ (HAS ID)' : '🆕 (NEW)';
         console.log(`   ${index + 1}: ${user.emp_Id} - ${user.emp__eng_name} ${hasUniqueId}`);
      });
      
      if (totalUsers > 10) {
         console.log(`   ... and ${totalUsers - 10} more users`);
      }
      
      console.log('\n🔄 Starting upload process...');
      
      const result = await UserService.uploadUsersToHikVision(allUsers);
      
      console.log('\n✅ Upload completed!');
      console.log('📋 Result:', JSON.stringify(result, null, 2));
      
      // Show summary statistics
      console.log('\n📊 Upload Summary:');
      console.log(`   Total Users: ${totalUsers}`);
      console.log(`   Successful: ${result.data.success}`);
      console.log(`   Failed: ${result.data.failed}`);
      console.log(`   Success Rate: ${((result.data.success / totalUsers) * 100).toFixed(1)}%`);
      
      if (result.data.errors.length > 0) {
         console.log('\n❌ Errors encountered:');
         result.data.errors.slice(0, 5).forEach((error: any) => {
            console.log(`   ${error.user}: ${error.error}`);
         });
         if (result.data.errors.length > 5) {
            console.log(`   ... and ${result.data.errors.length - 5} more errors`);
         }
      }
      
      // Show some updated user information
      console.log('\n👥 Sample of updated users:');
      const updatedUsers = await db.users.findMany({
         where: { 
            unique_id: { not: null },
            Id: { in: allUsers.slice(0, 10).map(u => u.Id) }
         },
         select: {
            Id: true,
            emp_Id: true,
            emp__eng_name: true,
            unique_id: true
         },
         take: 5
      });
      
      updatedUsers.forEach(user => {
         console.log(`   ${user.emp_Id} - ${user.emp__eng_name} | unique_id: ${user.unique_id}`);
      });
      
   } catch (error: any) {
      console.error('\n❌ Upload failed:', error.message);
      console.error('🔍 Full error details:', error);
   } finally {
      // Close the database connection
      await db.$disconnect();
      console.log('\n🔌 Database connection closed.');
   }
}

// Execute the function
uploadAllUsers();
