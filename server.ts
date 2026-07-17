import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { JSONDatabase } from './src/db';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to prevent crash if key is missing
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      console.warn('GEMINI_API_KEY is not configured. Falling back to intelligent heuristic engine.');
      return null;
    }
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI client:', e);
      return null;
    }
  }
  return aiClient;
}

// Heuristic fallback recommendation
function generateHeuristicRecommendation(gates: any[]) {
  const activeGates = gates.filter(g => g.status === 'active');
  if (activeGates.length === 0) {
    return {
      recommended_gate_id: gates[0]?.gate_id || '',
      reasoning: 'No active gates found. Recommending primary gate as emergency measure.',
      safety_status: 'warning',
      estimated_wait_time_minutes: 30,
      safety_advisory: 'Proceed with caution.'
    };
  }

  // Score gates. Score = (current_count / capacity) * 100 + (current_count < capacity * 0.1 ? 0 : 5)
  // We want the lowest score (lowest crowd percentage and overhead)
  let bestGate = activeGates[0];
  let minScore = Infinity;

  for (const gate of activeGates) {
    const pct = gate.current_count / gate.capacity;
    // Base score is percent crowd
    let score = pct * 100;
    
    // Add extra penalty if nearly full
    if (pct > 0.85) score += 50;
    // Add small penalty for super empty gates to encourage distribution if all are low, but generally empty is best
    if (score < minScore) {
      minScore = score;
      bestGate = gate;
    }
  }

  const density = (bestGate.current_count / bestGate.capacity) * 100;
  let waitTime = Math.round((bestGate.current_count / bestGate.capacity) * 20);
  if (waitTime < 2) waitTime = 2; // min wait time

  let reasoning = `${bestGate.gate_name} has the lowest crowd pressure at ${density.toFixed(0)}% occupancy. `;
  if (density < 30) {
    reasoning += 'Flow is extremely light. High processing capacity ensures immediate clearance.';
  } else if (density < 70) {
    reasoning += 'Flow is steady and moving well. Processing delays are minimal.';
  } else {
    reasoning += 'Gate is moderately crowded but still operating faster than other options.';
  }

  return {
    recommended_gate_id: bestGate.gate_id,
    reasoning,
    safety_status: density > 90 ? 'critical' : density > 75 ? 'warning' : 'nominal',
    estimated_wait_time_minutes: waitTime,
    safety_advisory: density > 85 ? 'Expect minor delay' : 'Clear passage, move at normal pace'
  };
}

// Retry helper for Gemini API requests
async function callGeminiWithRetry(ai: any, params: any, retries = 2, delay = 800) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (e: any) {
      const isTransient = e.status === 503 || e.status === 429 || String(e.message || '').includes('503') || String(e.message || '').includes('UNAVAILABLE') || String(e.message || '').includes('limit');
      if (i === retries || !isTransient) {
        throw e;
      }
      console.warn(`Gemini API call warning (attempt ${i + 1}/${retries + 1} failed). Retrying in ${delay}ms...`, e.message || e);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5; // exponential backoff with slightly higher multiplier
    }
  }
}

// ==========================================
// API ROUTES
// ==========================================

// 1. POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = JSONDatabase.findUser(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    user_id: user.user_id,
    username: user.username,
    role: user.role
  });
});

// 2. GET /api/gates
app.get('/api/gates', (req, res) => {
  res.json(JSONDatabase.getGates());
});

// 3. POST /api/gate
app.post('/api/gate', (req, res) => {
  const { gate_name, capacity, current_count, status } = req.body;
  if (!gate_name || !capacity) {
    return res.status(400).json({ error: 'Gate name and capacity are required' });
  }

  const newGate = JSONDatabase.addGate({
    gate_name,
    capacity: Number(capacity),
    current_count: Number(current_count || 0),
    status: status || 'active'
  });

  res.status(201).json(newGate);
});

// 4. PUT /api/gate/arrival/:id
app.put('/api/gate/arrival/:id', (req, res) => {
  const { id } = req.params;
  const gate = JSONDatabase.handleArrival(id);
  if (!gate) {
    return res.status(404).json({ error: 'Gate not found' });
  }
  res.json(gate);
});

// 5. PUT /api/gate/exit/:id
app.put('/api/gate/exit/:id', (req, res) => {
  const { id } = req.params;
  const gate = JSONDatabase.handleExit(id);
  if (!gate) {
    return res.status(404).json({ error: 'Gate not found' });
  }
  res.json(gate);
});

// 6. GET /api/dashboard
app.get('/api/dashboard', (req, res) => {
  const metrics = JSONDatabase.getDashboardMetrics();
  const gates = JSONDatabase.getGates();
  res.json({
    ...metrics,
    gates
  });
});

// 7. GET /api/recommendation
app.get('/api/recommendation', async (req, res) => {
  const gates = JSONDatabase.getGates();
  const ai = getGeminiClient();

  // If Gemini is not set up, return standard dynamic calculations
  if (!ai) {
    const heuristic = generateHeuristicRecommendation(gates);
    return res.json({
      ...heuristic,
      isAI: false
    });
  }

  try {
    const prompt = `You are the core AI Engine for CrowdFlow AI, an intelligent crowd management system.
Your job is to analyze real-time gate occupancy data and recommend the single best, safest, and least congested gate for visitors.

Here is the current state of the venue gates:
${JSON.stringify(gates, null, 2)}

Instructions:
1. Identify which active gate is the absolute best candidate (prioritizing lowest crowd occupancy percent, available capacity, and active status).
2. Compute a realistic estimated wait time in minutes based on current counts (typically ~1 to 1.5 minutes per 10 active queue visitors, scaling with capacity).
3. Determine a Safety Status ('nominal', 'warning', or 'critical') based on the recommended gate's current crowd density and general venue pressure.
4. Generate a concise, professional, friendly natural language explanation explaining *why* this gate is recommended and advising visitors. Avoid robotic language, and speak to humans.
5. Provide a short 3-6 word "safety advisory" banner message.

Return ONLY a valid JSON object matching this schema:
{
  "recommended_gate_id": "string (the exact gate_id of the recommended gate)",
  "reasoning": "string (warm, friendly human-centric explanation of why this gate is optimal, the traffic context, and processing speed)",
  "safety_status": "string ('nominal' | 'warning' | 'critical')",
  "estimated_wait_time_minutes": number,
  "safety_advisory": "string (short status phrase)"
}`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommended_gate_id: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            safety_status: { type: Type.STRING },
            estimated_wait_time_minutes: { type: Type.NUMBER },
            safety_advisory: { type: Type.STRING }
          },
          required: ['recommended_gate_id', 'reasoning', 'safety_status', 'estimated_wait_time_minutes', 'safety_advisory']
        }
      }
    });

    const resultText = response.text?.trim();
    if (!resultText) {
      throw new Error('Gemini returned an empty response');
    }

    const aiRecommendation = JSON.parse(resultText);
    res.json({
      ...aiRecommendation,
      isAI: true
    });
  } catch (error) {
    console.warn('Gemini Recommendation Fallback Triggered:', error);
    // Graceful fallback to heuristic
    const heuristic = generateHeuristicRecommendation(gates);
    res.json({
      ...heuristic,
      isAI: false,
      error: 'AI is temporarily offline. Serving local heuristic analysis.'
    });
  }
});

// ==========================================
// VITE OR PRODUCTION BUILD MIDDLEWARE
// ==========================================
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CrowdFlow AI Server running at http://localhost:${PORT}`);
  });
}

start();
