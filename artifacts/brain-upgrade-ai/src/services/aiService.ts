import { BrainStats, Mission } from '../context/AppContext';

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

async function callAI(systemPrompt: string, userPrompt: string, responseFormat?: 'json_object') {
  if (!API_KEY) {
    throw new Error("Missing VITE_OPENROUTER_API_KEY");
  }

  const payload: any = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  if (responseFormat) {
    payload.response_format = { type: responseFormat };
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "Brain Upgrade AI"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`AI API Error: ${err.error?.message || 'Unknown error'}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export const aiService = {
  getCoachAdvice: async (stats: BrainStats): Promise<string> => {
    const prompt = `User Stats: Speed:${stats.speed}, Memory:${stats.memory}, Logic:${stats.logic}, Focus:${stats.focus}, MathIQ:${stats.mathIQ} (Scale 0-100). Give strict, very short, cyberpunk-AI themed coaching advice. Max 2 sentences.`;
    return callAI("You are an elite, strict, cybernetic brain coach. Be concise and intense.", prompt);
  },

  generateMissions: async (stats: BrainStats): Promise<Mission[]> => {
    const prompt = `Generate 3 personalized daily brain training missions based on these stats: ${JSON.stringify(stats)}. 
    Return ONLY a JSON array of objects with keys: id (string), title (string), description (string), xpReward (number), category ('Logic'|'Speed'|'Memory'|'Reaction'), target (number). No markdown blocks.`;
    
    try {
      const response = await callAI(
        "You output pure JSON arrays.", 
        prompt,
        "json_object" // Using json_object format (Note: openrouter expects `{ "missions": [...] }` if json_object is used)
      );
      // Fallback robust parsing
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '');
      const parsed = JSON.parse(jsonStr);
      const arr = Array.isArray(parsed) ? parsed : (parsed.missions || []);
      
      return arr.map((m: any) => ({ ...m, completed: false, progress: 0, id: Math.random().toString(36).substring(7) }));
    } catch (e) {
      console.error(e);
      // Fallback missions
      return [
        { id: '1', title: 'Speed Demon', description: 'Complete 2 Speed challenges', xpReward: 50, completed: false, category: 'Speed', progress: 0, target: 2 },
        { id: '2', title: 'Pattern Master', description: 'Complete 1 Logic challenge', xpReward: 40, completed: false, category: 'Logic', progress: 0, target: 1 },
        { id: '3', title: 'Neural Net', description: 'Play 3 games total', xpReward: 100, completed: false, category: 'General', progress: 0, target: 3 },
      ];
    }
  },

  getDecisionScenario: async (): Promise<{ scenario: string, options: string[] }> => {
    const prompt = `Generate a short real-life decision-making scenario (business, social, or survival). Max 3 sentences. Provide exactly 4 choices labeled A, B, C, D. Output strictly JSON with keys "scenario" and "options" (array of strings).`;
    const response = await callAI("You are a scenario simulator.", prompt, "json_object");
    const jsonStr = response.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(jsonStr);
  },

  evaluateDecision: async (scenario: string, choice: string): Promise<{ feedback: string, score: number }> => {
    const prompt = `Scenario: ${scenario}\nUser chose: ${choice}\nEvaluate this choice out of 100 points. Provide 1 sentence of strict AI feedback. Output JSON with keys "feedback" (string) and "score" (number).`;
    const response = await callAI("You evaluate human decisions.", prompt, "json_object");
    const jsonStr = response.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(jsonStr);
  }
};
