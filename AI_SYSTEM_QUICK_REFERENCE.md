# AI System Quick Reference - Mon Toit Platform

**Version**: 3.2.0
**Last Updated**: 31 Octobre 2025

---

## Quick Start

### 1. Environment Setup
```env
# .env file
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_AI_SERVICES_ENDPOINT=https://your-cognitive.cognitiveservices.azure.com/
AZURE_AI_SERVICES_API_KEY=your-key
```

### 2. Basic Usage

#### Legal Assistant
```typescript
import { legalAssistantService } from './services/ai/legalAssistantService';

const response = await legalAssistantService.askQuestion({
  question: "Dépôt de garantie maximum ?",
  userId: user.id
});
```

#### LLM Orchestrator
```typescript
import { llmOrchestrator } from './services/ai/llmOrchestrator';

const response = await llmOrchestrator.execute({
  messages: [{ role: 'user', content: 'Question' }],
  operation: 'general_query',
  userId: user.id
});
```

#### Enhanced Chatbot
```typescript
import { chatbotService } from './services/chatbotService';

const aiResponse = await chatbotService.getAIResponse(
  userMessage,
  conversationHistory,
  userId
);
```

---

## Model Selection Guide

| Task Type | Recommended Model | Cost/Token | When to Use |
|-----------|------------------|------------|-------------|
| Legal queries | GPT-4 | 0.08 FCFA | High accuracy needed |
| Property descriptions | GPT-3.5 Turbo | 0.03 FCFA | Good balance |
| Simple responses | Specialized | 0.05 FCFA | Fast, low cost |

---

## Cost Estimates

| Operation | Avg Cost | Model Used |
|-----------|----------|------------|
| Legal consultation | 6-10 FCFA | GPT-4 |
| Property description | 2-4 FCFA | GPT-3.5 Turbo |
| Chatbot response | 1.5-3 FCFA | GPT-3.5 Turbo |
| Simple query | 1-2 FCFA | Specialized |

**Target**: < 100 FCFA per user per month

---

## Database Tables

### llm_routing_logs
Tracks model selection decisions.
```sql
SELECT * FROM llm_routing_logs WHERE user_id = 'uuid';
```

### legal_consultation_logs
Stores legal Q&A history.
```sql
SELECT * FROM legal_consultation_logs WHERE user_id = 'uuid' ORDER BY created_at DESC;
```

### legal_articles
10 Ivorian law articles with full-text search.
```sql
SELECT * FROM legal_articles WHERE category = 'depot_garantie';
```

### ai_usage_logs
Comprehensive AI service tracking.
```sql
SELECT service_type, COUNT(*), SUM(cost_fcfa) FROM ai_usage_logs
WHERE user_id = 'uuid' GROUP BY service_type;
```

### ai_cache
Response caching (60-min TTL).
```sql
SELECT * FROM ai_cache WHERE expires_at > now();
```

---

## Common Operations

### Get AI Cost Stats
```sql
SELECT * FROM get_ai_cost_stats(
  'user-uuid'::uuid,
  '2025-10-01'::timestamptz,
  '2025-10-31'::timestamptz
);
```

### Clean Expired Cache
```sql
SELECT clean_expired_ai_cache();
```

### Check Cache Hit Rate
```sql
SELECT
  service_type,
  COUNT(*) as cached,
  SUM(hit_count) as hits,
  AVG(hit_count) as avg_hits
FROM ai_cache
WHERE expires_at > now()
GROUP BY service_type;
```

---

## Scam Detection Triggers

SUTA chatbot detects these 10 scam patterns:
1. Payment before visit
2. Payment outside platform
3. Abnormally low prices
4. Landlord "abroad"
5. Pressure to pay quickly
6. Mobile Money requests
7. Unverifiable properties
8. No visit before payment
9. Excessive advances (>3 months)
10. Unofficial contracts

**Response**: Immediate warning with action steps.

---

## Legal Question Categories

1. **depot_garantie** - Security deposits, refunds
2. **resiliation_bail** - Lease termination, notice
3. **reparations** - Maintenance, repairs
4. **augmentation_loyer** - Rent increases
5. **expulsion** - Eviction procedures

---

## Performance Targets

- **Response Time**: < 2 seconds
- **Cache Hit Rate**: > 30%
- **Cost per User**: < 100 FCFA/month
- **Legal Accuracy**: > 90%
- **Scam Detection**: > 95%

---

## Monitoring Queries

### Daily AI Costs
```sql
SELECT DATE(created_at) as date, SUM(cost_fcfa) as daily_cost
FROM ai_usage_logs
WHERE created_at > now() - interval '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Top Users by AI Usage
```sql
SELECT user_id, COUNT(*) as requests, SUM(cost_fcfa) as total_cost
FROM ai_usage_logs
WHERE created_at > now() - interval '30 days'
GROUP BY user_id
ORDER BY total_cost DESC
LIMIT 10;
```

### Popular Legal Questions
```sql
SELECT question, COUNT(*) as frequency
FROM legal_consultation_logs
WHERE created_at > now() - interval '7 days'
GROUP BY question
ORDER BY frequency DESC
LIMIT 20;
```

---

## Troubleshooting

### "Missing environment variable" Error
**Solution**: Check all Azure credentials in `.env`

### High API Costs
**Solution**:
- Verify cache is working
- Check model selection logic
- Review maxTokens settings

### Slow Responses
**Solution**:
- Check cache hit rate
- Use GPT-3.5 Turbo instead of GPT-4
- Reduce prompt length

### Legal Articles Not Found
**Solution**:
- Run migration to seed articles
- Check full-text indexes
- Verify RLS policies

---

## API Endpoints

All AI services use Supabase edge functions:
- `/functions/v1/azure-speech-tts` - Text-to-speech
- `/functions/v1/azure-translate` - Translation
- `/functions/v1/azure-face-verify` - Facial verification
- `/functions/v1/ai-chatbot` - Chatbot responses
- `/functions/v1/ai-recommendations` - Property recommendations

---

## Best Practices

### 1. Cost Optimization
- Use caching for repeated queries
- Set appropriate maxCostFcfa limits
- Choose right model for task

### 2. Error Handling
```typescript
try {
  const response = await llmOrchestrator.execute({...});
} catch (error) {
  console.error('AI error:', error);
  // Fallback logic
}
```

### 3. Caching Strategy
- Enable cache for legal queries (useCache: true)
- Disable for personalized content (useCache: false)
- Set appropriate TTL (default: 60 minutes)

### 4. Model Selection
```typescript
// Legal - Use GPT-4
requiresExpertise: 'legal'

// General - Let orchestrator decide
requiresExpertise: 'general'

// Budget-aware - Set limit
maxCostFcfa: 5.0
```

---

## Files Reference

### Services
- `src/services/ai/llmOrchestrator.ts` - Core routing
- `src/services/ai/legalAssistantService.ts` - Legal assistant
- `src/services/chatbotService.ts` - Enhanced chatbot
- `src/services/ai/descriptionGeneratorService.ts` - Descriptions
- `src/services/ai/azureAIService.ts` - Azure integration

### Database
- `supabase/migrations/20251031100000_add_multi_llm_ai_system.sql`

### Documentation
- `EPIC13_MULTI_LLM_AI_SYSTEM_COMPLETE.md` - Full details
- `VERSION_3.2_RELEASE_NOTES.md` - Release notes
- `AI_SYSTEM_QUICK_REFERENCE.md` - This file

---

## Support

**Full Documentation**: See `EPIC13_MULTI_LLM_AI_SYSTEM_COMPLETE.md`
**Issues**: Check troubleshooting section above
**Contact**: support@montoit.ci

---

**Version**: 3.2.0
**Status**: Production Ready
**Last Updated**: 31 Octobre 2025
