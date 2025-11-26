"use strict";
/**
 * Test script for AI features
 * Run with: ts-node src/test-ai.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const code_analysis_flow_1 = require("./ai/flows/code-analysis.flow");
dotenv.config();
async function testAIAnalysis() {
    console.log('🧪 Testing AI Code Analysis...\n');
    // Check if API key is configured
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        console.error('❌ ERROR: GOOGLE_GENAI_API_KEY not found in .env file');
        console.log('\n📝 Please add your Gemini API key to .env:');
        console.log('   GOOGLE_GENAI_API_KEY=your_api_key_here\n');
        process.exit(1);
    }
    // Sample code to analyze
    const sampleCode = {
        files: [
            {
                path: 'src/example.ts',
                content: `
import express from 'express';

const app = express();

// Potential security issue: no input validation
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  // SQL injection vulnerability!
  
  res.json({ user: 'data' });
});

// Good practice: proper error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000);
`,
                size: 450,
            },
        ],
        projectContext: {
            name: 'Test Project',
            description: 'Sample Express.js API',
            language: 'TypeScript',
            framework: 'Express',
        },
        focusAreas: ['security', 'performance', 'best practices'],
    };
    try {
        console.log('📤 Sending code to AI for analysis...');
        console.log(`   Files: ${sampleCode.files.length}`);
        console.log(`   Language: ${sampleCode.projectContext.language}`);
        console.log(`   Focus: ${sampleCode.focusAreas.join(', ')}\n`);
        const startTime = Date.now();
        const result = await (0, code_analysis_flow_1.runCodeAnalysis)(sampleCode);
        const duration = Date.now() - startTime;
        console.log('✅ Analysis Complete!\n');
        console.log('📊 Results:');
        console.log(`   Quality: ${result.overallQuality}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   Processing Time: ${duration}ms\n`);
        console.log('📝 Summary:');
        console.log(`   ${result.summary}\n`);
        if (result.issues.length > 0) {
            console.log(`🔍 Issues Found (${result.issues.length}):`);
            result.issues.forEach((issue, idx) => {
                console.log(`\n   ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
                console.log(`      Category: ${issue.category}`);
                console.log(`      ${issue.explanation}`);
                if (issue.suggestedFix) {
                    console.log(`      💡 Fix: ${issue.suggestedFix}`);
                }
            });
            console.log();
        }
        if (result.strengths.length > 0) {
            console.log(`✨ Strengths (${result.strengths.length}):`);
            result.strengths.forEach((strength, idx) => {
                console.log(`   ${idx + 1}. ${strength}`);
            });
            console.log();
        }
        if (result.recommendations.length > 0) {
            console.log(`💡 Recommendations (${result.recommendations.length}):`);
            result.recommendations.forEach((rec, idx) => {
                console.log(`   ${idx + 1}. ${rec}`);
            });
            console.log();
        }
        console.log('🎉 Test completed successfully!');
        console.log('\n📚 Next steps:');
        console.log('   1. Review the analysis results above');
        console.log('   2. Run database migration: npm run migrate');
        console.log('   3. Start the server: npm run dev');
        console.log('   4. Test the API endpoints with real submissions\n');
    }
    catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\n🔍 Troubleshooting:');
        console.error('   1. Verify GOOGLE_GENAI_API_KEY is correct');
        console.error('   2. Check your internet connection');
        console.error('   3. Ensure you have Gemini API access enabled');
        console.error('   4. Review error details above\n');
        process.exit(1);
    }
}
// Run the test
testAIAnalysis().catch(console.error);
