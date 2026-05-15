import { HttpException } from '@/utils/HttpException.utils'
import { STATUS } from '@/typescript'
import db from '@/prisma/client'
import axios from 'axios'

class SentimentUpdateService {
  private static readonly API_CONFIG = {
    emotionDetectionUrl: process.env.EMOTION_DETECTION_URL || 'http://127.0.0.1:8001/api/emotion-detection',
    localHostUrl: process.env.LOCAL_HOST_API || 'http://83.111.75.163:5000'
  }

  /**
   * Analyze sentiment from image URL
   */
  private static async analyzeSentimentFromImage(imageUrl: string): Promise<string | null> {
    try {
      const fullImageUrl = `${this.API_CONFIG.localHostUrl}${imageUrl}`
      
      const emotionResponse = await axios.post(
        this.API_CONFIG.emotionDetectionUrl,
        {
          image_url: fullImageUrl
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (emotionResponse.data?.success && emotionResponse.data?.dominant_face) {
        const detectedSentiment = emotionResponse.data.dominant_face.primary_emotion
        return detectedSentiment
      } else {
        return 'neutral'
      }
    } catch (error: any) {
      console.error(`[SentimentUpdateService] Error analyzing sentiment for image ${imageUrl}:`, error.message)
      return null
    }
  }

  /**
   * Update sentiment analysis for parks
   */
  public static async updateParksSentimentAnalysis(): Promise<{
    success: boolean
    message: string
    results: {
      totalRecords: number
      processedRecords: number
      updatedCheckIn: number
      updatedCheckOut: number
      errors: number
      details: Array<{
        id: number
        checkInUpdated: boolean
        checkOutUpdated: boolean
        checkInSentiment?: string
        checkOutSentiment?: string
        errors?: string[]
      }>
    }
  }> {
    try {
      // Date range: October 10, 2025 to November 25, 2025
      const startDate = new Date('2025-10-10T00:00:00.000Z')
      const endDate = new Date('2025-11-25T23:59:59.999Z')

      console.log(`[SentimentUpdateService] Searching parks records with updatedAt between ${startDate.toISOString()} and ${endDate.toISOString()}`)

      const records = await db.parks_sentiment_analysis.findMany({
        where: {
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          Id: true,
          check_in_image: true,
          check_out_capture: true,
          check_in_sentiment: true,
          check_out_sentiment: true,
          updatedAt: true
        }
      })

      console.log(`[SentimentUpdateService] Found ${records.length} parks records matching criteria`)

      const results = {
        totalRecords: records.length,
        processedRecords: 0,
        updatedCheckIn: 0,
        updatedCheckOut: 0,
        errors: 0,
        details: [] as Array<{
          id: number
          checkInUpdated: boolean
          checkOutUpdated: boolean
          checkInSentiment?: string
          checkOutSentiment?: string
          errors?: string[]
        }>
      }

      // Process each record
      for (const record of records) {
        const detail: {
          id: number
          checkInUpdated: boolean
          checkOutUpdated: boolean
          checkInSentiment?: string
          checkOutSentiment?: string
          errors?: string[]
        } = {
          id: record.Id,
          checkInUpdated: false,
          checkOutUpdated: false,
          errors: []
        }

        try {
          // Process check_in_image if it exists and starts with '/uploads'
          if (record.check_in_image && record.check_in_image.startsWith('/uploads')) {
            const sentiment = await this.analyzeSentimentFromImage(record.check_in_image)
            
            if (sentiment) {
              await db.parks_sentiment_analysis.update({
                where: { Id: record.Id },
                data: {
                  check_in_sentiment: sentiment,
                  updatedAt: new Date()
                }
              })
              detail.checkInUpdated = true
              detail.checkInSentiment = sentiment
              results.updatedCheckIn++
            } else {
              detail.errors?.push(`Failed to analyze check_in_image sentiment`)
            }
          }

          // Process check_out_capture if it exists and starts with '/uploads'
          if (record.check_out_capture && record.check_out_capture.startsWith('/uploads')) {
            const sentiment = await this.analyzeSentimentFromImage(record.check_out_capture)
            
            if (sentiment) {
              await db.parks_sentiment_analysis.update({
                where: { Id: record.Id },
                data: {
                  check_out_sentiment: sentiment,
                  updatedAt: new Date()
                }
              })
              detail.checkOutUpdated = true
              detail.checkOutSentiment = sentiment
              results.updatedCheckOut++
            } else {
              detail.errors?.push(`Failed to analyze check_out_capture sentiment`)
            }
          }

          results.processedRecords++
        } catch (error: any) {
          console.error(`[SentimentUpdateService] Error processing parks record ${record.Id}:`, error.message)
          detail.errors?.push(error.message)
          results.errors++
        }

        results.details.push(detail)
      }

      return {
        success: true,
        message: `Processed ${results.processedRecords} parks sentiment analysis records. Updated ${results.updatedCheckIn} check-in sentiments and ${results.updatedCheckOut} check-out sentiments.`,
        results
      }
    } catch (error: any) {
      console.error('[SentimentUpdateService] Error updating parks sentiment analysis:', error)
      throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to update parks sentiment analysis')
    }
  }

  /**
   * Update sentiment analysis for offices
   */
  public static async updateOfficesSentimentAnalysis(): Promise<{
    success: boolean
    message: string
    results: {
      totalRecords: number
      processedRecords: number
      updatedCheckIn: number
      updatedCheckOut: number
      errors: number
      details: Array<{
        id: number
        checkInUpdated: boolean
        checkOutUpdated: boolean
        checkInSentiment?: string
        checkOutSentiment?: string
        errors?: string[]
      }>
    }
  }> {
    try {
      // Date range: October 10, 2025 to November 25, 2025
      const startDate = new Date('2025-10-10T00:00:00.000Z')
      const endDate = new Date('2025-11-25T23:59:59.999Z')

      console.log(`[SentimentUpdateService] Searching offices records with updatedAt between ${startDate.toISOString()} and ${endDate.toISOString()}`)

      const records = await db.offices_sentiment_analysis.findMany({
        where: {
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          Id: true,
          check_in_image: true,
          check_out_capture: true,
          check_in_sentiment: true,
          check_out_sentiment: true,
          updatedAt: true
        }
      })

      console.log(`[SentimentUpdateService] Found ${records.length} offices records matching criteria`)
      
      const results = {
        totalRecords: records.length,
        processedRecords: 0,
        updatedCheckIn: 0,
        updatedCheckOut: 0,
        errors: 0,
        details: [] as Array<{
          id: number
          checkInUpdated: boolean
          checkOutUpdated: boolean
          checkInSentiment?: string
          checkOutSentiment?: string
          errors?: string[]
        }>
      }

      // Process each record
      for (const record of records) {
        const detail: {
          id: number
          checkInUpdated: boolean
          checkOutUpdated: boolean
          checkInSentiment?: string
          checkOutSentiment?: string
          errors?: string[]
        } = {
          id: record.Id,
          checkInUpdated: false,
          checkOutUpdated: false,
          errors: []
        }

        try {
          // Process check_in_image if it exists and starts with '/uploads'
          if (record.check_in_image && record.check_in_image.startsWith('/uploads')) {
            const sentiment = await this.analyzeSentimentFromImage(record.check_in_image)
            
            if (sentiment) {
              await db.offices_sentiment_analysis.update({
                where: { Id: record.Id },
                data: {
                  check_in_sentiment: sentiment,
                  updatedAt: new Date()
                }
              })
              detail.checkInUpdated = true
              detail.checkInSentiment = sentiment
              results.updatedCheckIn++
            } else {
              detail.errors?.push(`Failed to analyze check_in_image sentiment`)
            }
          }

          // Process check_out_capture if it exists and starts with '/uploads'
          if (record.check_out_capture && record.check_out_capture.startsWith('/uploads')) {
            const sentiment = await this.analyzeSentimentFromImage(record.check_out_capture)
            
            if (sentiment) {
              await db.offices_sentiment_analysis.update({
                where: { Id: record.Id },
                data: {
                  check_out_sentiment: sentiment,
                  updatedAt: new Date()
                }
              })
              detail.checkOutUpdated = true
              detail.checkOutSentiment = sentiment
              results.updatedCheckOut++
            } else {
              detail.errors?.push(`Failed to analyze check_out_capture sentiment`)
            }
          }

          results.processedRecords++
        } catch (error: any) {
          console.error(`[SentimentUpdateService] Error processing offices record ${record.Id}:`, error.message)
          detail.errors?.push(error.message)
          results.errors++
        }

        results.details.push(detail)
      }

      return {
        success: true,
        message: `Processed ${results.processedRecords} offices sentiment analysis records. Updated ${results.updatedCheckIn} check-in sentiments and ${results.updatedCheckOut} check-out sentiments.`,
        results
      }
    } catch (error: any) {
      console.error('[SentimentUpdateService] Error updating offices sentiment analysis:', error)
      throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to update offices sentiment analysis')
    }
  }

  /**
   * Update sentiment analysis for both parks and offices
   */
  public static async updateAllSentimentAnalysis(): Promise<{
    success: boolean
    message: string
    parks: {
      success: boolean
      message: string
      results: any
    }
    offices: {
      success: boolean
      message: string
      results: any
    }
  }> {
    try {
      const parksResult = await this.updateParksSentimentAnalysis()
      const officesResult = await this.updateOfficesSentimentAnalysis()

      return {
        success: true,
        message: 'Sentiment analysis update completed for both parks and offices',
        parks: parksResult,
        offices: officesResult
      }
    } catch (error: any) {
      console.error('[SentimentUpdateService] Error updating all sentiment analysis:', error)
      throw new HttpException(STATUS.INTERNAL_SERVER_ERROR, 'Failed to update all sentiment analysis')
    }
  }
}

export default SentimentUpdateService

