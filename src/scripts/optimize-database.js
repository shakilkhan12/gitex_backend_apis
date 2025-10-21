/**
 * Database Optimization Script
 * 
 * This script creates optimized indexes for dashboard queries
 * to improve performance and reduce query execution time.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createOptimizedIndexes() {
  console.log('🚀 Starting database optimization...')

  try {
    // Indexes for sentiment analysis tables
    console.log('📊 Creating indexes for sentiment analysis...')
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_sentiment_check_in_date 
      ON parks_sentiment_analysis (check_in_date);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_offices_sentiment_check_in_date 
      ON offices_sentiment_analysis (check_in_date);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_sentiment_person_id 
      ON parks_sentiment_analysis (person_Id);
    `

    // Indexes for attendance tables
    console.log('👥 Creating indexes for attendance...')
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_attendance_entry_time 
      ON parks_attendance (entry_time);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_offices_attendance_entry_time 
      ON offices_attendance (entry_time);
    `

    // Indexes for detection tables
    console.log('🔍 Creating indexes for detection tables...')
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_smoking_occurrence_date 
      ON parks_smoking_detection (occurrence_date);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_intrusion_occurrence_date 
      ON parks_intrusion_detection (occurrence_date);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_litter_detection_date 
      ON parks_litter_detection (detection_date);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_litter_created_at 
      ON parks_litter_detection (createdAt);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_behavior_detection_date 
      ON parks_behaviour_alerts (detection_date);
    `

    // Indexes for footfall analysis
    console.log('🚶 Creating indexes for footfall analysis...')
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_footfall_time_gender 
      ON parks_footfall_analysis (time, gender);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_offices_footfall_time_gender 
      ON offices_footfall_analysis (time, gender);
    `

    // Indexes for landscaping
    console.log('🌱 Creating indexes for landscaping...')
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_landscaping_created_at 
      ON landscaping (createdAt);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_landscaping_assigned_to 
      ON landscaping (assinged_to);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_landscaping_plant_type 
      ON landscaping (plant_type);
    `

    // Composite indexes for complex queries
    console.log('🔗 Creating composite indexes...')
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_sentiment_date_sentiment 
      ON parks_sentiment_analysis (check_in_date, check_in_sentiment);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_offices_sentiment_date_sentiment 
      ON offices_sentiment_analysis (check_in_date, check_in_sentiment);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_footfall_time_type_gender 
      ON parks_footfall_analysis (time, gender);
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_landscaping_created_type 
      ON landscaping (createdAt, plant_type);
    `

    // Partial indexes for better performance
    console.log('⚡ Creating partial indexes...')
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_landscaping_assigned_not_null 
      ON landscaping (assinged_to) WHERE assinged_to IS NOT NULL;
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_sentiment_happy 
      ON parks_sentiment_analysis (check_in_date) 
      WHERE check_in_sentiment = 'happy';
    `
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_parks_sentiment_angry 
      ON parks_sentiment_analysis (check_in_date) 
      WHERE check_in_sentiment = 'angry';
    `

    console.log('✅ Database optimization completed successfully!')
    
    // Show index statistics
    console.log('\n📈 Index Statistics:')
    const indexStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `
    
    console.table(indexStats)

  } catch (error) {
    console.error('❌ Database optimization failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run optimization if called directly
if (require.main === module) {
  createOptimizedIndexes()
    .then(() => {
      console.log('🎉 Database optimization script completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Database optimization failed:', error)
      process.exit(1)
    })
}

module.exports = { createOptimizedIndexes }
