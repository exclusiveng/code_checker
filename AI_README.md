# 🤖 AI Features - Quick Start Guide

## ✅ Phase 1: AI-Powered Code Review (COMPLETE)

All Genkit API issues have been fixed! The system is ready for testing.

---

## 🚀 Quick Start (5 Minutes)

### 1. Get Your Gemini API Key

Visit: https://makersuite.google.com/app/apikey

### 2. Add to `.env`

```env
GOOGLE_GENAI_API_KEY=your_api_key_here
ENABLE_AI_ANALYSIS=true
AI_MODEL=gemini-1.5-pro
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2048
```

### 3. Run Migration

```bash
npm run build
npm run migrate
```

### 4. Test AI (Optional)

```bash
npx ts-node src/test-ai.ts
```

### 5. Start Server

```bash
npm run dev
```

---

## 📡 API Endpoints

### Analyze Submission
```bash
POST /api/ai/analyze/:submissionId
Authorization: Bearer YOUR_TOKEN
```

### Get Analysis Results
```bash
GET /api/ai/analysis/:submissionId
Authorization: Bearer YOUR_TOKEN
```

### Generate Summary
```bash
POST /api/ai/summary/:submissionId
Authorization: Bearer YOUR_TOKEN
```

### Suggest Fix
```bash
POST /api/ai/suggest-fix
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "issue": {
    "message": "SQL injection vulnerability",
    "severity": "critical",
    "file": "src/db.ts",
    "codeSnippet": "SELECT * FROM users WHERE id = ${id}"
  },
  "language": "TypeScript"
}
```

### Check Status
```bash
GET /api/ai/status
Authorization: Bearer YOUR_TOKEN
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `AI_ENV_SETUP.md` | Detailed environment setup |
| `GENKIT_PHASE1_COMPLETE.md` | Phase 1 completion summary |
| `.agent/workflows/genkit-implementation.md` | Full implementation plan |
| `src/test-ai.ts` | Test script for AI features |
| `src/ai/` | All AI-related code |

---

## 🎯 What's Working

✅ AI code analysis with Gemini 1.5 Pro  
✅ Natural language issue explanations  
✅ Fix suggestions with code examples  
✅ Submission summaries for reviewers  
✅ Quality assessment (excellent/good/fair/poor)  
✅ Confidence scoring  
✅ Database storage for AI results  
✅ Full TypeScript support  
✅ Error handling and fallbacks  

---

## 📊 Features by Phase

### Phase 1 (COMPLETE) ✅
- AI-powered code review
- Issue detection and explanations
- Fix suggestions
- Submission summaries

### Phase 2 (Planned)
- Smart ruleset generation from prompts
- Rule templates library
- Learning from past submissions

### Phase 3 (Planned)
- Enhanced notifications
- Trend analysis
- Performance insights

### Phase 4 (Planned)
- Natural language search
- Codebase Q&A
- Submission comparison

### Phase 5 (Planned)
- Auto-documentation
- Onboarding guides
- Compliance reports

---

## 💡 Usage Example

```typescript
import { aiAnalysisService } from './ai/services/ai-analysis.service';

// Analyze a submission
const analysis = await aiAnalysisService.analyzeSubmission(submissionId);

console.log(analysis.summary);
console.log(`Quality: ${analysis.overallQuality}`);
console.log(`Issues found: ${analysis.insights.issues.length}`);

// Get fix suggestion
const fix = await aiAnalysisService.suggestFix({
  issue: {
    message: 'Potential memory leak',
    severity: 'high',
    file: 'src/app.ts',
  },
  language: 'TypeScript',
});

console.log(fix.fixDescription);
console.log(fix.codeExample);
```

---

## 🐛 Troubleshooting

### "API key not found"
→ Add `GOOGLE_GENAI_API_KEY` to `.env`

### "Rate limit exceeded"
→ Reduce `AI_MAX_REQUESTS_PER_MIN` in `.env`

### "Build fails"
→ Run `npm install` and `npm run build`

### "Migration fails"
→ Check database connection in `DATABASE_URL`

---

## 💰 Costs

**Typical usage**: $1-5 per 100 submissions

See `AI_ENV_SETUP.md` for detailed cost breakdown.

---

## 📞 Need Help?

1. Check `AI_ENV_SETUP.md` for detailed setup
2. Review `GENKIT_PHASE1_COMPLETE.md` for testing guide
3. Run `npx ts-node src/test-ai.ts` to verify setup

---

**Status**: ✅ Ready for Testing  
**Last Updated**: 2025-11-25  
**Version**: Phase 1 Complete
