const axios = require('axios');

const openRouterClient = axios.create({
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://tracking-system-o5rf.onrender.com',
    'X-Title': 'Smart ATS Hiring Suite',
  },
});

// Only models confirmed to return content (not reasoning-only)
// Ordered by capability + availability
const FREE_MODELS = [
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-v4-flash:free',
  'qwen/qwen3-coder:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chatWithModel = async (messages, model) => {
  const response = await openRouterClient.post('/chat/completions', {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 2000,
  });
  const message = response.data.choices[0].message;
  // Reasoning-only models (nvidia etc.) have null content — skip them
  if (message.content === null || message.content === undefined) {
    throw Object.assign(new Error('reasoning-only model'), { isReasoningOnly: true });
  }
  return message.content;
};

const chat = async (messages) => {
  for (let i = 0; i < FREE_MODELS.length; i++) {
    const model = FREE_MODELS[i];
    try {
      console.log(`[AI] Trying model: ${model}`);
      const result = await chatWithModel(messages, model);
      if (!result || result.trim().length < 5) {
        console.warn(`[AI] Model ${model} returned empty response, trying next`);
        continue;
      }
      console.log(`[AI] Success with model: ${model}`);
      return result;
    } catch (err) {
      if (err.isReasoningOnly) {
        console.warn(`[AI] Model ${model} is reasoning-only, skipping`);
        continue;
      }
      const status = err.response?.status;
      const retryAfter = err.response?.data?.error?.metadata?.retry_after_seconds;
      console.warn(`[AI] Model ${model} failed with status ${status}`);
      if (status === 429) {
        const waitMs = retryAfter ? Math.ceil(retryAfter) * 1000 : 4000;
        console.log(`[AI] Waiting ${waitMs}ms before next model...`);
        await sleep(waitMs);
        continue;
      }
      if (status === 404 || status === 503 || status === 502) {
        continue;
      }
      throw err;
    }
  }
  throw new Error('All AI models are currently rate-limited. Please wait a moment and try again.');
};

const extractJSON = (text) => {
  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const objMatch = stripped.match(/\{[\s\S]*\}/);
  if (objMatch) return JSON.parse(objMatch[0]);
  throw new Error('No valid JSON found in AI response');
};

const extractJSONArray = (text) => {
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const arrMatch = stripped.match(/\[[\s\S]*\]/);
  if (arrMatch) return JSON.parse(arrMatch[0]);
  return [];
};

const sanitizeParsed = (data) => {
  const clean = {};
  clean.name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : '';
  clean.email = typeof data.email === 'string' && data.email.includes('@') ? data.email.trim().toLowerCase() : '';
  clean.phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  clean.location = typeof data.location === 'string' ? data.location.trim() : '';
  clean.summary = typeof data.summary === 'string' ? data.summary.trim() : '';
  clean.totalExperienceYears = typeof data.totalExperienceYears === 'number' && data.totalExperienceYears >= 0
    ? Math.round(data.totalExperienceYears) : 0;
  clean.skills = Array.isArray(data.skills)
    ? data.skills.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())
    : [];
  clean.experience = Array.isArray(data.experience)
    ? data.experience.filter((e) => e && typeof e === 'object').map((e) => ({
        company: String(e.company || '').trim(),
        title: String(e.title || '').trim(),
        duration: String(e.duration || '').trim(),
        description: String(e.description || '').trim(),
      }))
    : [];
  clean.education = Array.isArray(data.education)
    ? data.education.filter((e) => e && typeof e === 'object').map((e) => ({
        institution: String(e.institution || '').trim(),
        degree: String(e.degree || '').trim(),
        field: String(e.field || '').trim(),
        year: String(e.year || '').trim(),
      }))
    : [];
  // Auto-calculate experience years from experience array if AI returned 0
  if (clean.totalExperienceYears === 0 && clean.experience.length > 0) {
    const years = clean.experience.reduce((sum, exp) => {
      const match = exp.duration.match(/(\d+)\s*(?:year|yr)/i);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
    clean.totalExperienceYears = years;
  }
  return clean;
};

const parseResume = async (resumeText) => {
  // Trim resume text to avoid token overflow (keep first 6000 chars)
  const trimmed = resumeText.slice(0, 6000);
  const prompt = `You are a precise resume parser. Read the resume below carefully and extract ALL available information.
Return ONLY a valid JSON object — no explanation, no markdown, no extra text.

JSON structure (fill every field you can find, use empty string or empty array if not found):
{
  "name": "full name of the candidate",
  "email": "email address",
  "phone": "phone number",
  "location": "city, country or address",
  "summary": "professional summary or objective (2-4 sentences)",
  "totalExperienceYears": <number of total years of work experience>,
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "company": "company name",
      "title": "job title",
      "duration": "e.g. Jan 2020 - Dec 2022",
      "description": "key responsibilities and achievements"
    }
  ],
  "education": [
    {
      "institution": "university or school name",
      "degree": "e.g. Bachelor of Science",
      "field": "e.g. Computer Science",
      "year": "graduation year"
    }
  ]
}

RESUME:
${trimmed}`;

  const result = await chat([{ role: 'user', content: prompt }]);
  const raw = extractJSON(result);
  return sanitizeParsed(raw);
};

const scoreCandidate = async (resumeText, jobDescription, jobSkills) => {
  const prompt = `You are an expert ATS recruiter. Score this candidate for the job and return ONLY valid JSON:
{
  "overallScore": 0,
  "skillsMatch": 0,
  "experienceMatch": 0,
  "educationMatch": 0,
  "overallFit": 0,
  "recommendation": "",
  "keyStrengths": [],
  "gaps": [],
  "keywords": [],
  "explanation": ""
}

All scores are 0-100. recommendation must be one of: "Strong Hire", "Hire", "Maybe", "No Hire".

Job Description: ${jobDescription}
Required Skills: ${jobSkills.join(', ')}

Candidate Resume:
${resumeText}`;

  const result = await chat([{ role: 'user', content: prompt }]);
  return extractJSON(result);
};

const extractKeywords = async (text) => {
  const prompt = `Extract the top 10 most relevant technical and professional keywords from this text. Return ONLY a JSON array of strings: ["keyword1", "keyword2", ...]

Text: ${text}`;

  const result = await chat([{ role: 'user', content: prompt }]);
  return extractJSONArray(result);
};

const explainCandidate = async (resumeText, jobDescription, jobSkills, currentScore) => {
  const prompt = `You are an expert AI recruiter providing transparent, explainable hiring recommendations. Analyze this candidate and return ONLY valid JSON:
{
  "summary": "",
  "whyHire": [],
  "concerns": [],
  "skillsPresent": [],
  "skillsMissing": [],
  "experienceInsights": "",
  "cultureFitIndicators": [],
  "improvementSuggestions": [],
  "confidenceLevel": "",
  "finalVerdict": ""
}

confidenceLevel must be one of: "High", "Medium", "Low".
finalVerdict must be one of: "Strong Hire", "Hire", "Maybe", "No Hire".
whyHire, concerns, skillsPresent, skillsMissing, cultureFitIndicators, improvementSuggestions are arrays of strings.

Current AI Score: ${currentScore}/100
Job Description: ${jobDescription}
Required Skills: ${jobSkills.join(', ')}

Candidate Resume:
${resumeText}`;

  const result = await chat([{ role: 'user', content: prompt }]);
  return extractJSON(result);
};

module.exports = { parseResume, scoreCandidate, extractKeywords, explainCandidate };
