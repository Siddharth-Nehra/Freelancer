const User = require('../models/User');
const Job = require('../models/Job');

// Comprehensive System Prompt grounding the AI strictly in FreelancerHub's actual features
const FREELANCERHUB_SYSTEM_PROMPT = `You are FreelancerHub AI, the official intelligent assistant for FreelancerHub.
Your mission is to guide clients and freelancers, answer questions about the platform, help write compelling job postings and proposals, improve freelancer profiles, and offer practical freelancing advice.

### PLATFORM KNOWLEDGE BASE (STRICT FACTS — NEVER INVENT NON-EXISTENT FEATURES):
1. **Core Concept**:
   FreelancerHub connects clients with skilled independent freelancers. Clients post jobs or browse talent; freelancers browse jobs, submit proposals, or receive direct contact requests.

2. **User Roles**:
   - **Freelancers**: Create professional profiles, showcase skills and portfolio, search open jobs, submit proposals/bids, receive contact requests, collaborate through active Connections, and manage work milestones.
   - **Clients**: Post project requirements with budgets, browse freelancer talent directory, review incoming proposals, accept/reject applicants, send direct Contact Requests, and manage active Connections.

3. **Platform Navigation & Sections**:
   - **Home** (\`#home\`): Hero section, live platform statistics, recent activity feed, and the AI Assistant.
   - **Find Talent / Browse** (\`#browse\`): Search freelancers by name, title, or skills; filter by hourly rate and availability ("Available", "Limited", "Busy"); view profiles; send direct Contact Requests.
   - **Find Jobs** (\`#jobs\`): Browse all open job listings with budgets, client names, and required skills; submit job proposals/applications.
   - **Freelancer Dashboard** (\`#freelancer-dashboard\`):
     * Profile Management: Title, Hourly Rate ($/hr), Skills list, Bio, Portfolio link, Availability status, Years of Experience.
     * Proposal & Application Tracker: View applied jobs and their live statuses ("pending", "accepted", "rejected").
     * Active Connections / Projects: View ongoing client contracts with client contact information (email and phone), project title, budget, timeline, and Emergency Quit option.
   - **Client Dashboard** (\`#client-dashboard\`):
     * Post a Job: Form with Job Title, Description, Budget ($), and Required Skills.
     * Posted Jobs Management: View all posted jobs and applicants.
     * Proposal Review: Accept or reject incoming freelancer proposals. Accepting creates a Connection!
     * Contact Requests: View sent and received contact requests.
     * Active Connections / Projects: View ongoing projects with freelancer contact details (email and phone).
   - **Sign In / Register** (\`#login\`, \`#register\`): Simple email & password authentication for both client and freelancer accounts.

4. **Connections & Collaboration**:
   - Created automatically when a Client accepts a freelancer's Job Application OR when a Freelancer accepts a Client's Contact Request.
   - Exchanges direct verified contact details: Client name, email, phone number <-> Freelancer name, email, phone number.
   - Includes project scope, agreed budget, timeline, and an **Emergency Quit** safety mechanism (allows either party to quit early by providing a valid reason and link to existing work/files).

5. **Fees & Escrow Safety**:
   - FreelancerHub features 100% milestone tracking security and a 0% platform commission promotion for newly registered accounts.

### YOUR CAPABILITIES:
- **Natural Language Conversations**: Understand user intent, ask clarifying questions, and maintain context across follow-up queries.
- **Freelance Guidance**: Give expert advice on setting hourly rates, structuring portfolio bios, highlighting top skills, and winning high-value projects.
- **Proposal Writing**: Draft or refine tailored, persuasive job proposals and cover letters that address client requirements directly.
- **Job Description Writing**: Help clients craft clear, well-scoped job descriptions with realistic budgets and specific skill requirements.
- **Platform Navigation**: Give clear step-by-step instructions on where to click and what to do on FreelancerHub.
- **Troubleshooting**: Explain application statuses, profile updating steps, and how Connections work.

### TONE & FORMATTING RULES:
- Be friendly, encouraging, professional, and concise.
- Use clean Markdown with bullet points and bold highlights for readability.
- Keep answers focused. When relevant, offer 1 or 2 logical follow-up questions or actions.
- NEVER claim that FreelancerHub has features it does not have (e.g. built-in video calling, automated code testing, cryptocurrency payments). Collaborators communicate directly via the contact info in their Connection.`;

// In-memory rate limiting map (IP -> timestamps array)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const cleanIp = ip || 'anonymous';
  const timestamps = rateLimitMap.get(cleanIp) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(cleanIp, recent);

  // Periodic cleanup
  if (rateLimitMap.size > 1000) {
    for (const [key, times] of rateLimitMap.entries()) {
      if (times.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitMap.delete(key);
      }
    }
  }

  return true;
}

/**
 * Searches MongoDB for live relevant platform records (freelancers & jobs) to ground the AI response.
 */
async function searchPlatformData(cleanQuery) {
  let matchingFreelancers = [];
  let matchingJobs = [];

  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return { matchingFreelancers, matchingJobs };
    }

    const isTechOrRole = /dev|react|node|python|web|design|frontend|backend|ui|ux|full.?stack|mobile|writer|data|aws|cloud/i.test(cleanQuery);
    const isTalentSearch = /hire|freelancer|talent|specialist|developer|designer|engineer|candidate|person|who can/i.test(cleanQuery) || isTechOrRole;
    const isJobSearch = /job|work|project|listing|opening|gig|task|apply|looking for work/i.test(cleanQuery);

    if (isTalentSearch) {
      const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
      const regexPatterns = keywords.map(w => ({
        $or: [
          { 'profile.title': { $regex: w, $options: 'i' } },
          { 'profile.skills': { $regex: w, $options: 'i' } },
          { name: { $regex: w, $options: 'i' } }
        ]
      }));

      const filter = {
        type: 'freelancer',
        ...(regexPatterns.length > 0 ? { $or: regexPatterns } : {})
      };

      matchingFreelancers = await User.find(filter)
        .select('name profile.title profile.skills profile.rate profile.availability')
        .limit(3)
        .lean()
        .catch(() => []);
    }

    if (isJobSearch || isTechOrRole) {
      const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
      const regexPatterns = keywords.map(w => ({
        $or: [
          { title: { $regex: w, $options: 'i' } },
          { skills: { $regex: w, $options: 'i' } },
          { description: { $regex: w, $options: 'i' } }
        ]
      }));

      const filter = {
        status: 'open',
        ...(regexPatterns.length > 0 ? { $or: regexPatterns } : {})
      };

      matchingJobs = await Job.find(filter)
        .select('title clientName budget skills description')
        .limit(3)
        .lean()
        .catch(() => []);
    }
  } catch (err) {
    console.warn('AI platform search notice:', err.message);
  }

  return { matchingFreelancers, matchingJobs };
}

/**
 * Call Google Gemini API using native Node.js fetch
 */
async function callGemini(apiKey, messages, contextData = '') {
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Build Gemini contents array from conversation history
  const contents = [];

  for (const m of messages) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    contents.push({
      role,
      parts: [{ text: m.content }]
    });
  }

  // Ensure system instruction has platform knowledge + any live database records
  const systemText = FREELANCERHUB_SYSTEM_PROMPT + (contextData ? `\n\n### CURRENT LIVE PLATFORM DATA IN FREELANCERHUB DATABASE:\n${contextData}` : '');

  const payload = {
    system_instruction: {
      parts: [{ text: systemText }]
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const replyText = candidate?.content?.parts?.[0]?.text;

  if (!replyText) {
    throw new Error('Empty response received from Gemini API');
  }

  return replyText;
}

/**
 * Call OpenAI or OpenAI-compatible API (e.g. Groq, OpenRouter) using native Node.js fetch
 */
async function callOpenAI(apiKey, messages, contextData = '') {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const systemText = FREELANCERHUB_SYSTEM_PROMPT + (contextData ? `\n\n### CURRENT LIVE PLATFORM DATA IN FREELANCERHUB DATABASE:\n${contextData}` : '');

  const openaiMessages = [
    { role: 'system', content: systemText },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const replyText = data.choices?.[0]?.message?.content;

  if (!replyText) {
    throw new Error('Empty response received from OpenAI API');
  }

  return replyText;
}

/**
 * Intelligent contextual fallback engine when no external API key is configured.
 * Generates natural-language contextual responses grounded in actual FreelancerHub features.
 */
function generateContextualFallback(query, history = [], platformData = {}) {
  const q = query.toLowerCase().trim();
  const { matchingFreelancers = [], matchingJobs = [] } = platformData;

  // Multi-turn context check
  const lastUserMsg = history.length > 1 ? history[history.length - 2]?.content?.toLowerCase() : '';

  // 1. Proposal writing assistance
  if (q.includes('proposal') || q.includes('cover letter') || q.includes('bid') || (lastUserMsg.includes('proposal') && (q.includes('improve') || q.includes('example') || q.includes('how')))) {
    return `### How to Write a Winning Proposal on FreelancerHub:

1. **Start with the Client's Problem**: Directly reference the project scope from their job post.
2. **Highlight Matching Skills**: Mention your specific stack (e.g., React, Node.js, Python, Figma) and why you're a fit.
3. **Showcase Past Proof**: Share your portfolio link (ensure it is updated in your **Freelancer Dashboard**).
4. **Offer a Clear Plan & Timeline**: Break the milestone into concrete deliverables.
5. **Call to Action**: Invite them to connect so you can discuss milestones and exchange verified contact details.

*Pro-tip:* Go to **Find Jobs** (\`#jobs\`), find a project that matches your skills, and click **Apply** to submit your proposal!`;
  }

  // 2. Profile improvement advice
  if (q.includes('profile') || q.includes('bio') || q.includes('rate') || q.includes('portfolio') || q.includes('experience')) {
    return `### Maximizing Your FreelancerHub Profile:

To attract top clients and get more direct Contact Requests:
- **Craft a Specific Title**: Instead of generic "Developer", use *"Senior Full-Stack Developer (React & Node.js)"*.
- **Set a Competitive Hourly Rate**: Check market rates for your tech stack in our **Find Talent** directory.
- **Tag Relevant Skills**: Add accurate tags (e.g., *TypeScript, Next.js, MongoDB*) so clients find you via search.
- **Add a Portfolio Link**: Link your GitHub, personal site, or Figma showcase.
- **Update Availability**: Toggle between *Available*, *Limited*, or *Busy* from your **Freelancer Dashboard**.

Head over to your **Freelancer Dashboard** to update your profile now!`;
  }

  // 3. Posting a job (for clients)
  if (q.includes('post a job') || q.includes('post job') || q.includes('how to hire') || q.includes('create job') || q.includes('hire someone')) {
    return `### How to Post a Project on FreelancerHub:

1. **Sign In**: Log into your Client account (or register as a Client at **Sign In / Register**).
2. **Open Client Dashboard**: Go to the **Post a Job** section.
3. **Enter Details**:
   - **Job Title**: Be specific (e.g., *"E-commerce Next.js & Stripe Integration"*).
   - **Project Description**: Outline your deliverables, requirements, and timeline.
   - **Budget ($)**: Enter your estimated project budget.
   - **Required Skills**: Add comma-separated tags (e.g., *React, Tailwind CSS, API*).
4. **Publish**: Click **Post Job**. It will immediately appear under **Find Jobs** for freelancers to apply!`;
  }

  // 4. Inquiries about fees, safety, or escrow
  if (q.includes('fee') || q.includes('cost') || q.includes('commission') || q.includes('escrow') || q.includes('safe') || q.includes('payment')) {
    return `### Platform Fees & Milestone Safety:

- **0% Platform Fees**: Enjoy 0% commission fees on new accounts!
- **Milestone Tracking**: Project requirements and budgets are tracked transparently in your **Connections** dashboard.
- **Emergency Quit Safety**: Both clients and freelancers are protected with an emergency exit feature requiring proof of work and stated reasons.
- **Direct Collaboration**: Once a proposal or contact request is accepted, both parties get direct access to phone numbers and emails for seamless communication.`;
  }

  // 5. Connections & collaboration
  if (q.includes('connection') || q.includes('contact') || q.includes('message') || q.includes('emergency')) {
    return `### Connections & Collaboration on FreelancerHub:

- **How Connections are Created**: When a Client accepts a freelancer's Job Application, OR when a Freelancer accepts a Client's Contact Request, a **Connection** is formed.
- **Direct Contact Info**: Once connected, you can view the other party's verified Name, Email, and Phone number in your Dashboard.
- **Emergency Quit**: If an unexpected roadblock happens, either party can trigger an Emergency Quit with a reason and link to existing work for review.`;
  }

  // 6. Searching talent / matching freelancers
  if (matchingFreelancers.length > 0) {
    const names = matchingFreelancers.map(f => `${f.name} (${f.profile?.title || 'Freelancer'})`).join(', ');
    return `I found **${matchingFreelancers.length} top specialist(s)** matching your request:\n\n${matchingFreelancers.map(f => `* **${f.name}** — ${f.profile?.title || 'Specialist'} ($${f.profile?.rate || 0}/hr, ${f.profile?.availability || 'Available'})`).join('\n')}\n\nClick **View Profile** below or visit **Find Talent** to send them a direct Contact Request!`;
  }

  // 7. Searching jobs / matching projects
  if (matchingJobs.length > 0) {
    return `There are active projects available right now:\n\n${matchingJobs.map(j => `* **${j.title}** (Budget: $${j.budget || 0}) — Client: ${j.clientName}`).join('\n')}\n\nClick **Apply** below or visit **Find Jobs** to submit your proposal!`;
  }

  // 8. General conversational response
  return `Hello! I'm your FreelancerHub AI Assistant. I can help you with:
- **Finding Talent**: Search developers, designers, writers, and specialists.
- **Finding Work**: Discover active job postings matching your skills.
- **Writing Winning Proposals**: Craft tailored bids to stand out to clients.
- **Posting Projects**: Structure scopes, required skills, and budgets.
- **Platform Guidance**: Step-by-step help with dashboards, profiles, and connections.

What would you like to explore today?`;
}

/**
 * Main Controller function for handling assistant inquiries.
 */
async function handleAssistantRequest(req, res) {
  // Rate limiting check
  const clientIp = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'You are sending messages too quickly. Please wait a moment and try again.'
    });
  }

  try {
    const { query, history } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid question or prompt.'
      });
    }

    const cleanQuery = query.trim();
    if (cleanQuery.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Query is too long. Please limit your message to 2,000 characters.'
      });
    }

    // Sanitize and validate multi-turn history (last 10 messages max)
    const sanitizedHistory = [];
    if (Array.isArray(history)) {
      const recentTurns = history.slice(-10);
      for (const turn of recentTurns) {
        if (turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string') {
          sanitizedHistory.push({
            role: turn.role,
            content: turn.content.slice(0, 2000)
          });
        }
      }
    }

    // Add current user query to history
    sanitizedHistory.push({ role: 'user', content: cleanQuery });

    // Query database for live grounding
    const { matchingFreelancers, matchingJobs } = await searchPlatformData(cleanQuery);

    let contextData = '';
    if (matchingFreelancers.length > 0) {
      contextData += `Matching Freelancers: ${JSON.stringify(matchingFreelancers.map(f => ({ id: f._id, name: f.name, title: f.profile?.title, skills: f.profile?.skills, rate: f.profile?.rate, availability: f.profile?.availability })))}\n`;
    }
    if (matchingJobs.length > 0) {
      contextData += `Matching Open Jobs: ${JSON.stringify(matchingJobs.map(j => ({ id: j._id, title: j.title, budget: j.budget, skills: j.skills, client: j.clientName })))}\n`;
    }

    let reply = '';
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();

    // Prefer selected provider or detect available key
    if ((provider === 'openai' || !geminiKey) && openaiKey) {
      try {
        reply = await callOpenAI(openaiKey, sanitizedHistory, contextData);
      } catch (err) {
        console.error('OpenAI call failed, falling back:', err.message);
        if (geminiKey) {
          reply = await callGemini(geminiKey, sanitizedHistory, contextData).catch(() => '');
        }
      }
    } else if (geminiKey) {
      try {
        reply = await callGemini(geminiKey, sanitizedHistory, contextData);
      } catch (err) {
        console.error('Gemini call failed, falling back:', err.message);
        if (openaiKey) {
          reply = await callOpenAI(openaiKey, sanitizedHistory, contextData).catch(() => '');
        }
      }
    }

    // If external AI was not configured or calls failed, use the intelligent grounded fallback
    if (!reply) {
      reply = generateContextualFallback(cleanQuery, sanitizedHistory, { matchingFreelancers, matchingJobs });
    }

    // Return clean JSON response
    return res.json({
      success: true,
      reply,
      freelancers: matchingFreelancers.map(f => ({
        id: f._id,
        name: f.name,
        title: f.profile?.title,
        rate: f.profile?.rate
      })),
      jobs: matchingJobs.map(j => ({
        id: j._id,
        title: j.title,
        budget: j.budget,
        clientName: j.clientName
      }))
    });

  } catch (error) {
    console.error('AI assistant error:', error);
    return res.status(500).json({
      success: false,
      error: 'The AI assistant encountered an issue. Please try asking your question again.'
    });
  }
}

module.exports = {
  handleAssistantRequest,
  generateContextualFallback,
  searchPlatformData,
  checkRateLimit,
  FREELANCERHUB_SYSTEM_PROMPT
};
