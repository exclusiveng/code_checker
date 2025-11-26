# AI Features - Environment Variables Setup

## Required Environment Variables

Add these variables to your `.env` file to enable AI features:

```env
# ============================================
# AI CONFIGURATION
# ============================================

# Google Gemini API Key (REQUIRED for AI features)
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here

# Genkit Environment
GENKIT_ENV=prod
GENKIT_LOG_LEVEL=info

# ============================================
# AI FEATURE FLAGS
# ============================================

# Enable/Disable AI Features (set to 'true' to enable)
ENABLE_AI_ANALYSIS=true
ENABLE_AI_RULESET_GENERATION=false
ENABLE_AI_SEARCH=false
ENABLE_AI_DOCS=false

# ============================================
# AI MODEL CONFIGURATION
# ============================================

# AI Model to use
AI_MODEL=gemini-1.5-pro

# Temperature (0.0-1.0): Lower = more focused, Higher = more creative
AI_TEMPERATURE=0.7

# Maximum tokens per response
AI_MAX_TOKENS=2048

# ============================================
# AI COST CONTROL
# ============================================

# Rate limiting
AI_MAX_REQUESTS_PER_MIN=60
AI_MAX_TOKENS_PER_REQUEST=8000
```

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## Feature Flags Explanation

### ENABLE_AI_ANALYSIS
- **Purpose**: AI-powered code review and analysis
- **What it does**: Analyzes code submissions, identifies issues, suggests fixes
- **Recommended**: `true` for production use

### ENABLE_AI_RULESET_GENERATION
- **Purpose**: AI-generated rulesets from natural language
- **What it does**: Converts project requirements into validation rules
- **Recommended**: `false` initially, enable after Phase 2 implementation

### ENABLE_AI_SEARCH
- **Purpose**: Natural language search across submissions
- **What it does**: Allows users to ask questions about their codebase
- **Recommended**: `false` initially, enable after Phase 4 implementation

### ENABLE_AI_DOCS
- **Purpose**: Auto-generate documentation
- **What it does**: Creates project docs, onboarding guides, compliance reports
- **Recommended**: `false` initially, enable after Phase 5 implementation

## Cost Estimates (Gemini 1.5 Pro)

Based on Google's pricing:
- **Input**: ~$0.00025 per 1K characters
- **Output**: ~$0.0005 per 1K characters

### Example Costs:
- **Small submission** (5 files, ~10KB): ~$0.005 per analysis
- **Medium submission** (20 files, ~50KB): ~$0.025 per analysis
- **Large submission** (50 files, ~100KB): ~$0.050 per analysis

### Monthly Estimates:
- **100 submissions/month**: ~$1-5
- **500 submissions/month**: ~$5-25
- **1000 submissions/month**: ~$10-50

## Rate Limiting

The `AI_MAX_REQUESTS_PER_MIN` setting helps control costs:
- **Default**: 60 requests/minute
- **Recommended for production**: 30-60 requests/minute
- **For testing**: 10-20 requests/minute

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` to version control**
2. **Rotate API keys regularly** (every 90 days recommended)
3. **Use different keys for dev/staging/production**
4. **Monitor API usage** in Google Cloud Console
5. **Set up billing alerts** to avoid unexpected costs

## Troubleshooting

### "API key not found" error
- Ensure `GOOGLE_GENAI_API_KEY` is set in `.env`
- Check that the key is valid and not expired
- Verify the key has Gemini API access enabled

### "Rate limit exceeded" error
- Reduce `AI_MAX_REQUESTS_PER_MIN`
- Implement request queuing in your application
- Consider upgrading your Google Cloud quota

### High costs
- Review `AI_MAX_TOKENS` setting (reduce if too high)
- Implement caching for similar code patterns
- Use `AI_MAX_TOKENS_PER_REQUEST` to limit large requests
- Consider batching analysis requests

## Next Steps

1. ✅ Add environment variables to `.env`
2. ✅ Run database migration: `npm run migrate`
3. ✅ Build the project: `npm run build`
4. ✅ Start the server: `npm run dev`
5. ✅ Test AI analysis endpoint: `POST /api/ai/analyze/:submissionId`

---

**Last Updated**: 2025-11-25
**Phase**: 1 - Foundation & AI Code Review
