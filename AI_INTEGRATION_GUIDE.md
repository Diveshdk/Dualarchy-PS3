# 🤖 AI Integration Guide - Gemini API Implementation

## Overview

This guide explains how the Google Gemini API is integrated throughout the Banquet Management System for intelligent analytics, recommendations, and report generation.

---

## Setup Instructions

### 1. Get Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a new API key for your project
4. Copy the key

### 2. Add to Environment Variables

In your project's environment variables (`.env.local` or Vercel dashboard):

```bash
GOOGLE_GENAI_API_KEY=AIzaSyDluVlGSb3HnN99VBMmSipgKLGqZzYw9RQ
```

**⚠️ Security Note:** Never commit API keys to version control. Use environment variables only.

### 3. Dependencies

The project includes:
```
@google/generative-ai: ^0.21.0
```

Already installed in `package.json`. No additional setup needed.

---

## Implementation Architecture

### File Structure

```
lib/
├── ai.ts                    # Core AI functions
├── report-generator.ts      # PDF/HTML report generation
└── server-actions.ts        # Server-side data functions

app/dashboard/
├── event-analysis/
│   └── page.tsx            # Event analysis UI
├── branches/
│   └── page.tsx            # Branch comparison UI
├── branch-priority/
│   └── page.tsx            # Priority management UI
├── supplies/
│   └── page.tsx            # Supply management UI
└── features-guide/
    └── page.tsx            # Feature documentation

components/dashboard/
├── notifications.tsx        # Alert system
├── quick-reference.tsx      # Help panel
└── top-bar.tsx             # Header with notifications
```

---

## Core AI Functions

### 1. Event Analysis (`lib/ai.ts`)

```typescript
async function generateEventAnalysis(eventData: {
  clientName: string
  eventType: string
  guestCount: number
  eventDate: string
  totalAmount: number
  advancePaid: number
  notes?: string
})
```

**What it does:**
- Analyzes event success metrics
- Calculates revenue insights
- Provides guest experience recommendations
- Suggests logistics optimizations

**Response Format:**
```json
{
  "metrics": ["metric1", "metric2", "metric3"],
  "revenue": "analysis text",
  "recommendations": "recommendations text",
  "logistics": "logistics tips"
}
```

**Example Usage:**
```typescript
const analysis = await generateEventAnalysis({
  clientName: "John Doe",
  eventType: "Wedding",
  guestCount: 200,
  eventDate: "2024-03-15",
  totalAmount: 500000,
  advancePaid: 250000,
  notes: "Successful event"
})
```

---

### 2. Branch Comparison (`lib/ai.ts`)

```typescript
async function generateBranchComparison(branchStats: Array<{
  name: string
  totalBookings: number
  totalRevenue: number
  conversionRate: number
  avgGuestCount: number
  avgBookingValue: number
}>)
```

**What it does:**
- Compares performance across branches
- Identifies top and underperforming branches
- Provides improvement recommendations
- Suggests staffing needs
- Recommends scaling strategies

**Response Format:**
```json
{
  "topPerformer": "branch name",
  "topPerformerInsights": "insights text",
  "underperformer": "branch name",
  "improvementTips": ["tip1", "tip2", "tip3"],
  "scalingRecommendations": "recommendations",
  "staffingNeeds": "staffing analysis"
}
```

---

### 3. Supply Recommendations (`lib/ai.ts`)

```typescript
async function generateSupplyRecommendations(supplyData: Array<{
  itemName: string
  available: number
  threshold: number
  usage: number
  branchName: string
}>)
```

**What it does:**
- Identifies critical items
- Detects overstock situations
- Recommends reorder timing
- Suggests cost savings
- Provides budget allocation

**Response Format:**
```json
{
  "criticalItems": ["item1", "item2"],
  "overstockItems": ["item1", "item2"],
  "reorderTiming": "timing recommendations",
  "costSavings": "savings analysis",
  "urgentActions": ["action1", "action2"],
  "budgetAllocation": "budget analysis"
}
```

---

### 4. Booking Recommendations (`lib/ai.ts`)

```typescript
async function generateBookingRecommendation(
  availableBranches: Array<{
    branchName: string
    capacity: number
    available: boolean
    distance?: number
    priceLevel?: 'budget' | 'mid' | 'premium'
  }>,
  userPreference: {
    guestCount: number
    budget?: number
    preferredType?: string
  }
)
```

**What it does:**
- Matches customers with best branch
- Considers capacity, price, distance
- Provides backup recommendations
- Compares prices
- Highlights unique features

**Response Format:**
```json
{
  "primaryRecommendation": "branch name",
  "recommendationReason": "reason text",
  "backupOptions": ["branch1", "branch2"],
  "priceComparison": "comparison text",
  "uniqueFeatures": "features text"
}
```

---

## API Rate Limits & Pricing

### Rate Limits
- Free tier: 60 requests per minute
- Paid tier: 1500 requests per minute

### Pricing (as of March 2026)
- **Input:** $0.075 per million tokens
- **Output:** $0.3 per million tokens
- **Free tier:** 15 million tokens/month

### Token Estimation
- Average event analysis: ~300-500 tokens
- Branch comparison: ~400-600 tokens
- Supply recommendations: ~300-500 tokens
- Booking recommendation: ~250-400 tokens

---

## Error Handling

### Common Errors & Solutions

**Error: "API key not found"**
```bash
Solution: Check GOOGLE_GENAI_API_KEY in environment variables
```

**Error: "Rate limit exceeded"**
```typescript
// Implement retry logic with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }
}
```

**Error: "Invalid request"**
```
Solution: Check data format and required fields
```

---

## Prompting Best Practices

### Structure for Better Responses

```typescript
const prompt = `Analyze [DATA] and provide insights.

Provide analysis in JSON format:
{
  "field1": "value",
  "field2": ["array", "of", "values"],
  "field3": "value"
}`
```

### Tips

1. **Be Specific:** Clear prompts = better results
2. **Use JSON:** Request structured responses
3. **Provide Context:** Include branch names, dates, amounts
4. **Set Format:** Specify exact output format needed
5. **Validate:** Check JSON parsing in responses

---

## Integration Points

### 1. Event Analysis Page
- **File:** `app/dashboard/event-analysis/page.tsx`
- **Function:** `generateEventAnalysis()`
- **Trigger:** User clicks "Analyze Event"
- **Output:** Metrics, revenue, recommendations

### 2. Branch Comparison
- **File:** `app/dashboard/branches/page.tsx`
- **Function:** `generateBranchComparison()`
- **Trigger:** User clicks "AI Analysis"
- **Output:** Top performer, improvements, scaling

### 3. Branch Priority
- **File:** `app/dashboard/branch-priority/page.tsx`
- **Function:** `generateBookingRecommendation()`
- **Trigger:** User clicks "Get Recommendation"
- **Output:** Best branch, alternatives, pricing

### 4. Supply Management
- **File:** `app/dashboard/supplies/page.tsx`
- **Function:** `generateSupplyRecommendations()`
- **Trigger:** Manual trigger or automatic alerts
- **Output:** Critical items, reorder timing, savings

---

## Monitoring & Analytics

### Track Usage

Monitor API usage in Google AI Studio dashboard:
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Check "Requests" tab
3. View tokens used, costs, response times

### Performance Metrics to Track

- Analysis generation time (target: < 3 seconds)
- API success rate (target: > 99%)
- Token usage per request
- Cost per analysis
- User satisfaction with recommendations

---

## Future Enhancements

### Planned Improvements

1. **Caching:** Cache common analyses
2. **Batch Processing:** Analyze multiple events at once
3. **Custom Models:** Fine-tune Gemini for banquet domain
4. **Real-time Analytics:** Live event monitoring
5. **Predictive Analysis:** Forecast demand and pricing

### Advanced Features

- Historical trend analysis
- Predictive pricing models
- Customer segmentation
- Seasonal pattern detection
- Automated optimization recommendations

---

## Troubleshooting

### Testing the Integration

```typescript
// Test in browser console
const response = await fetch('/api/test-ai', {
  method: 'POST',
  body: JSON.stringify({ test: true })
})
const data = await response.json()
console.log(data)
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Slow responses | Check API rate limits, implement caching |
| Invalid JSON | Validate response parsing, check prompt format |
| Missing data | Ensure all required fields in request |
| API errors | Check credentials, verify network access |

---

## Security Considerations

### API Key Protection

✅ **DO:**
- Store keys in environment variables
- Use server-side calls only
- Rotate keys regularly
- Monitor usage patterns

❌ **DON'T:**
- Commit keys to git
- Expose keys in client-side code
- Share keys in emails
- Use same key for multiple projects

### Data Privacy

- No personal data in AI prompts
- Aggregate sensitive information
- Delete old analyses regularly
- Comply with GDPR/data protection laws

---

## Cost Optimization

### Tips to Reduce Costs

1. **Batch Requests:** Analyze multiple events together
2. **Cache Results:** Reuse analyses for similar events
3. **Simplify Prompts:** Remove unnecessary details
4. **Monitor Usage:** Track costs regularly
5. **Use Free Tier:** For development/testing

### Monthly Budget Example

```
Estimated monthly usage (100 events):
- 100 event analyses × 400 tokens = 40,000 tokens
- 10 branch comparisons × 500 tokens = 5,000 tokens
- 5 supply reports × 400 tokens = 2,000 tokens
- 50 booking recommendations × 300 tokens = 15,000 tokens
Total: ~62,000 tokens ≈ $5-7/month
```

---

## Support & Resources

### Documentation
- [Google Gemini Docs](https://ai.google.dev/)
- [API Reference](https://ai.google.dev/api/rest)
- [Prompt Engineering Guide](https://ai.google.dev/tips)

### Community
- [Google AI Forum](https://developers.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-generative-ai)
- [Discord Community](https://discord.gg/google-ai)

---

## Version History

**v1.0** - Initial Gemini integration
- Event analysis
- Branch comparison
- Supply recommendations
- Booking recommendations

**Future:** v1.1, v1.2 with enhancements

---

**Last Updated:** March 2026  
**Maintained By:** Development Team  
**Next Review:** June 2026
