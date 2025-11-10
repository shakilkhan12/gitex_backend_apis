import SentimentUpdateService from '../services/sentiment-update.service'

async function runSentimentUpdate() {
  try {
    const args = process.argv.slice(2)
    const type = args[0] || 'all' // Default to 'all' if no argument provided

    console.log(`🔄 Starting sentiment update for: ${type}`)
    console.log('='.repeat(50))

    let result

    switch (type.toLowerCase()) {
      case 'parks':
        result = await SentimentUpdateService.updateParksSentimentAnalysis()
        break
      case 'offices':
        result = await SentimentUpdateService.updateOfficesSentimentAnalysis()
        break
      case 'all':
        result = await SentimentUpdateService.updateAllSentimentAnalysis()
        break
      default:
        console.error(`❌ Invalid type: ${type}. Use 'parks', 'offices', or 'all'`)
        process.exit(1)
    }

    console.log('✅ Result:', JSON.stringify(result, null, 2))
    console.log('='.repeat(50))
    console.log('✅ Sentiment update completed successfully!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
runSentimentUpdate()

