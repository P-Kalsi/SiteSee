const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Use built-in fetch (Node 18+) or fallback to node-fetch
let fetch;
if (typeof globalThis.fetch !== 'undefined') {
  fetch = globalThis.fetch;
} else {
  try {
    fetch = require('node-fetch');
  } catch (e) {
    console.error('Error: fetch is not available. Please use Node.js 18+ or install node-fetch');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy endpoint for Google AI API
app.post('/api/analyze', async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Validate API key format (Google AI keys start with AIza)
    const trimmedKey = apiKey.trim();
    if (!trimmedKey.startsWith('AIza')) {
      console.warn('API key format warning: Google AI keys typically start with "AIza"');
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Try multiple model names in order of preference
    // Use v1 API first (more stable), then fallback to v1beta
    const models = [
      { name: 'gemini-1.5-flash', version: 'v1' },
      { name: 'gemini-1.5-pro', version: 'v1' },
      { name: 'gemini-1.5-flash', version: 'v1beta' },
      { name: 'gemini-1.5-pro', version: 'v1beta' },
      { name: 'gemini-pro', version: 'v1' },
      { name: 'gemini-pro', version: 'v1beta' }
    ];
    let lastError = null;

    for (const model of models) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
        
        console.log(`Attempting to call Google AI API with model: ${model.name} (${model.version})`);
        console.log(`API key (first 10 chars): ${trimmedKey.substring(0, 10)}...`);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a UX expert analyzing eye-tracking heatmap data. Provide concise, actionable insights in JSON format.\n\n${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: { message: errorText } };
          }
          
          console.error(`Google AI API error for ${model.name} (${model.version}):`, errorData);
          
          // Check for API key errors
          if (response.status === 400 || response.status === 401) {
            const errorMsg = errorData.error?.message || errorText || 'Unknown error';
            if (errorMsg.includes('API key') || errorMsg.includes('not valid') || errorMsg.includes('invalid')) {
              lastError = new Error(`Invalid API key: ${errorMsg}. Please check your Google AI API key. Get one from https://aistudio.google.com/apikey`);
              // Don't try other models if API key is invalid
              throw lastError;
            }
          }
          
          lastError = new Error(`Google AI API error: ${response.status} - ${errorData.error?.message || errorText || 'Unknown error'}`);
          
          // If it's a model not found error, try next model
          if (response.status === 404 || (errorData.error?.message && errorData.error.message.includes('not found'))) {
            console.log(`Model ${model.name} (${model.version}) not available, trying next...`);
            continue;
          }
          
          throw lastError;
        }

        const result = await response.json();
        console.log('Google AI API response received');
        
        // Handle different response structures
        let aiContent = '';
        if (result.candidates && result.candidates[0]) {
          if (result.candidates[0].content && result.candidates[0].content.parts) {
            aiContent = result.candidates[0].content.parts[0].text || '';
          } else if (result.candidates[0].text) {
            aiContent = result.candidates[0].text;
          }
        }
        
        if (!aiContent) {
          console.error('No content in response:', result);
          lastError = new Error('No content returned from Google AI');
          continue;
        }
        
        // Success! Return the content
        console.log(`Successfully got AI content from model: ${model.name} (${model.version})`);
        return res.json({ 
          success: true, 
          content: aiContent,
          model: model.name,
          version: model.version
        });
        
      } catch (error) {
        console.error(`Error with model ${model.name} (${model.version}):`, error.message);
        lastError = error;
        // If it's not a model availability issue, throw immediately
        if (!error.message.includes('not found') && !error.message.includes('404')) {
          throw error;
        }
        // Otherwise, continue to next model
      }
    }
    
    // If we get here, all models failed
    throw lastError || new Error('All Google AI models failed');
    
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Proxy Server running on http://localhost:${PORT}`);
  console.log(`📝 Make sure to set your GOOGLE_AI_API_KEY in .env file (optional - users can also provide their own key)`);
});

