'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_GENAI_API_KEY
if (!apiKey) {
  throw new Error('GOOGLE_GENAI_API_KEY environment variable is not set')
}

const genAI = new GoogleGenerativeAI(apiKey)

export async function generateEventAnalysis(eventData: {
  clientName: string
  eventType: string
  guestCount: number
  eventDate: string
  totalAmount: number
  advancePaid: number
  notes?: string
}) {
  const prompt = `Analyze this banquet event and provide insights:
Event Type: ${eventData.eventType}
Client: ${eventData.clientName}
Guest Count: ${eventData.guestCount}
Date: ${eventData.eventDate}
Total Amount: ₹${eventData.totalAmount}
Advance Paid: ₹${eventData.advancePaid}
Notes: ${eventData.notes || 'None'}

Please provide:
1. Event Success Metrics (2-3 points)
2. Revenue Analysis
3. Guest Experience Recommendations
4. Logistics Optimization Tips

Format as JSON with keys: metrics, revenue, recommendations, logistics`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text }
  } catch (error) {
    console.error('Error generating event analysis:', error)
    throw error
  }
}

export async function generateBranchComparison(branchStats: Array<{
  name: string
  totalBookings: number
  totalRevenue: number
  conversionRate: number
  avgGuestCount: number
  avgBookingValue: number
}>) {
  const branchData = branchStats
    .map(
      (b) => `${b.name}: ${b.totalBookings} bookings, ₹${b.totalRevenue} revenue, ${b.conversionRate}% conversion, ${b.avgGuestCount} avg guests`
    )
    .join('\n')

  const prompt = `Compare these banquet branches performance:

${branchData}

Provide analysis in JSON format:
{
  "topPerformer": "branch name",
  "topPerformerInsights": "2-3 insights",
  "underperformer": "branch name",
  "improvementTips": ["tip1", "tip2", "tip3"],
  "scalingRecommendations": "recommendations for growth",
  "staffingNeeds": "staffing recommendations"
}`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text }
  } catch (error) {
    console.error('Error generating branch comparison:', error)
    throw error
  }
}

export async function generateSupplyRecommendations(supplyData: Array<{
  itemName: string
  available: number
  threshold: number
  usage: number
  branchName: string
}>) {
  const suppliesText = supplyData
    .map((s) => `${s.branchName} - ${s.itemName}: ${s.available}/${s.threshold} available (${s.usage} used last month)`)
    .join('\n')

  const prompt = `Analyze supply chain for banquet branches:

${suppliesText}

Provide JSON recommendations:
{
  "criticalItems": ["item1", "item2"],
  "overstockItems": ["item1", "item2"],
  "reorderTiming": "recommendations",
  "costSavings": "potential savings",
  "urgentActions": ["action1", "action2"],
  "budgetAllocation": "budget recommendations"
}`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text }
  } catch (error) {
    console.error('Error generating supply recommendations:', error)
    throw error
  }
}

export async function generateBookingRecommendation(availableBranches: Array<{
  branchName: string
  capacity: number
  available: boolean
  distance?: number
  priceLevel?: 'budget' | 'mid' | 'premium'
}>, userPreference: { guestCount: number; budget?: number; preferredType?: string }) {
  const branchesData = availableBranches
    .map((b) => `${b.branchName}: Capacity ${b.capacity}, Available: ${b.available}, Distance: ${b.distance || 'N/A'}km`)
    .join('\n')

  const prompt = `Recommend the best branch for this booking:
Guest Count: ${userPreference.guestCount}
Budget: ₹${userPreference.budget || 'Not specified'}
Preference: ${userPreference.preferredType || 'Any'}

Available Branches:
${branchesData}

Respond in JSON:
{
  "primaryRecommendation": "branch name",
  "recommendationReason": "2-3 key points",
  "backupOptions": ["branch1", "branch2"],
  "priceComparison": "brief comparison",
  "uniqueFeatures": "what makes it special"
}`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text }
  } catch (error) {
    console.error('Error generating booking recommendation:', error)
    throw error
  }
}
