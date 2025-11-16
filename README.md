# Eye-Tracking Heatmap with AI Insights

A web application that tracks eye gaze patterns and generates AI-powered UX insights using Google's Gemini API.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies (backend)
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Set Up Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
GOOGLE_AI_API_KEY=your_api_key_here
PORT=3001
```

**Note:** Users can also provide their own API key through the UI. The `.env` file is optional.

### 3. Start the Application

```bash
# Start both backend and frontend
npm run dev

# Or start them separately:
npm run server    # Backend on http://localhost:3001
npm run client    # Frontend on http://localhost:5173
```

## 🔐 Security

**Important:** The API key is now stored securely on the backend server, not in the React frontend. This prevents API keys from being exposed in the browser.

- API keys are sent to the backend proxy server
- The backend makes the actual API calls to Google AI
- Users can provide their own API key through the UI (stored in localStorage for convenience)
- For production, set `GOOGLE_AI_API_KEY` in `.env` on your server

## 📁 Project Structure

```
.
├── server.js              # Express backend (API proxy)
├── package.json           # Root dependencies
├── .env                   # Environment variables (create this)
├── client/                # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   └── components/
│   │       ├── WebGazer.jsx      # Eye-tracking calibration
│   │       ├── GazeHeatmap.jsx  # Heatmap visualization
│   │       ├── AIInsights.jsx   # AI analysis component
│   │       └── WebsiteUI.jsx   # Website embedding
│   └── package.json
└── README.md
```

## 🎯 Features

- **Eye-Tracking Calibration**: 16-point calibration system
- **Real-time Heatmap**: Visual representation of gaze patterns
- **AI-Powered Insights**: Google Gemini AI analyzes heatmap data
- **Website Embedding**: Test any website with eye-tracking
- **Secure API Handling**: Backend proxy keeps API keys safe

## 🛠️ Development

### Backend API Endpoints

- `POST /api/analyze` - Analyze heatmap data with AI
- `GET /health` - Health check

### Environment Variables

- `GOOGLE_AI_API_KEY` - Your Google AI API key (optional)
- `PORT` - Backend server port (default: 3001)

## 📝 Notes

- The backend proxy handles CORS and API key security
- Users can provide their own API key through the UI
- The application falls back to local analysis if AI is unavailable

