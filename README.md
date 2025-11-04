# WriteRight - AI Writing Assistant for Telex.im

A Grammarly-like AI assistant that helps improve writing quality by checking grammar, enhancing style, and providing personalized feedback.

## 🚀 Features

- **Grammar & Spelling Correction** - Fixes common writing errors
- **Style Enhancement** - Improves clarity and flow
- **Context-Aware Processing** - Adapts to casual, professional, academic, or creative contexts
- **Personalized Feedback** - Learns from user preferences and common mistakes
- **Real-time Processing** - Instant writing improvements

## 🛠️ Technical Stack

- **Framework**: Mastra AI Agent Framework
- **AI Provider**: Google Gemini
- **Backend**: Node.js + Express
- **Memory**: SQLite with Mastra Memory
- **Deployment**: Vercel

## 📋 Usage

### Telex.im Integration
1. Import the workflow JSON into Telex.im
2. Mention `@WriteRight` in any channel
3. Get instant writing improvements

### Examples:
@WriteRight Check this: "I are going to the store yesterday"
@WriteRight Make this professional: "hey can u send me the file"
@WriteRight Improve readability: "this long sentence could be better if it was shorter"

text

### Direct API Usage
```bash
curl -X POST https://your-app.vercel.app/a2a/agent/writingAssistant \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your text to improve",
    "context": "professional",
    "userId": "optional-user-id"
  }'
```

🔧 Setup & Development
bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Vercel
vercel --prod
🌐 Endpoints
POST /a2a/agent/writingAssistant - Main Telex.im A2A endpoint

GET /health - Health check

📁 Project Structure
text
writing-ai-agent/
├── server.js          # Main Express server
├── package.json       # Dependencies
├── vercel.json        # Deployment config
└── README.md          # This file
🎯 How It Works
User Input: Text sent via Telex.im or API

AI Processing: Google Gemini analyzes and improves writing

Memory Integration: User preferences stored for personalized feedback

Response: Formatted markdown with corrections and explanations

🔗 Links
Live Demo: https://writing-ai-agent-ylpr.vercel.app/a2a/agent/writingAssistant

Telex.im: https://telex.im

Mastra: https://mastra.ai
