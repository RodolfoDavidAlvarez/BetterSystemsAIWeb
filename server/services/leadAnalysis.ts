import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LeadAnalysis {
  summary: string;
  contactInfo: {
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
  qualification: {
    score: "hot" | "warm" | "cold" | "not_qualified";
    reasoning: string;
    estimatedRevenue: string | null;
    timeline: string | null;
  };
  painPoints: string[];
  interestedServices: string[];
  recommendedFollowUp: string;
  sentiment: "positive" | "neutral" | "negative";
}

const BUSINESS_CONTEXT = `
Better Systems AI is a Business Transformation Consultancy that builds technology solutions.

SERVICES & PRICING:
1. Templated Platforms (subscription): $3,000-$5,000/month
   - Fleet Management System: Vehicle tracking, repair requests, service records
   - CRM Proposal System: Pipeline, quoting, invoicing, payment collection

2. Custom Builds: $5,000 to six figures
   - Custom software automating repetitive work
   - AI assistants for websites/phones
   - Full workflow automation

3. Enterprise Transformation: $20,000-$100,000+
   - Full departmental overhaul
   - Admin operations, marketing, sales transformation

IDEAL CUSTOMER:
- Revenue: $10K-$100K+/month
- Running on duct tape (spreadsheets, disconnected tools)
- Teams wasting hours on repetitive work
- Losing leads due to slow follow-up
- Data scattered across multiple apps

QUALIFICATION CRITERIA:
- HOT: Has budget, urgent need, decision maker, clear timeline
- WARM: Shows interest, some pain points, may need nurturing
- COLD: Just browsing, no clear need, unclear budget
- NOT_QUALIFIED: Wrong fit, no budget, outside our services
`;

export async function analyzeVoiceAgentLead(transcript: string): Promise<LeadAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("[Lead Analysis] OpenAI API key not configured");
    return getDefaultAnalysis(transcript);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert sales analyst for Better Systems AI. Analyze voice agent conversations and extract actionable insights.

${BUSINESS_CONTEXT}

Respond with valid JSON only, no markdown. Use this exact structure:
{
  "summary": "2-3 sentence executive summary of the conversation",
  "contactInfo": {
    "name": "extracted name or null",
    "email": "extracted email or null",
    "phone": "extracted phone or null",
    "company": "extracted company name or null"
  },
  "qualification": {
    "score": "hot|warm|cold|not_qualified",
    "reasoning": "Why this score was given",
    "estimatedRevenue": "Potential deal size if mentioned or inferable, or null",
    "timeline": "When they want to start if mentioned, or null"
  },
  "painPoints": ["list", "of", "pain", "points"],
  "interestedServices": ["which", "services", "they", "mentioned"],
  "recommendedFollowUp": "Specific next action Rodo should take",
  "sentiment": "positive|neutral|negative"
}`
        },
        {
          role: "user",
          content: `Analyze this voice agent conversation transcript:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return getDefaultAnalysis(transcript);
    }

    // Parse JSON response
    const analysis = JSON.parse(content) as LeadAnalysis;
    return analysis;

  } catch (error: any) {
    console.error("[Lead Analysis] Error:", error.message);
    return getDefaultAnalysis(transcript);
  }
}

function getDefaultAnalysis(transcript: string): LeadAnalysis {
  // Basic extraction without AI
  const emailMatch = transcript.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = transcript.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

  return {
    summary: "Conversation with website visitor. AI analysis unavailable - review transcript manually.",
    contactInfo: {
      name: null,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      company: null,
    },
    qualification: {
      score: "warm",
      reasoning: "Unable to analyze - defaulting to warm for manual review",
      estimatedRevenue: null,
      timeline: null,
    },
    painPoints: [],
    interestedServices: [],
    recommendedFollowUp: "Review transcript and reach out if contact info was provided",
    sentiment: "neutral",
  };
}

export function formatLeadEmailHtml(analysis: LeadAnalysis, transcript: string, conversationId: string, duration: number): string {
  const scoreColors: Record<string, string> = {
    hot: "#dc2626",
    warm: "#f59e0b",
    cold: "#3b82f6",
    not_qualified: "#6b7280",
  };

  const scoreEmoji: Record<string, string> = {
    hot: "🔥",
    warm: "⚡",
    cold: "❄️",
    not_qualified: "⏸️",
  };

  const sentimentEmoji: Record<string, string> = {
    positive: "😊",
    neutral: "😐",
    negative: "😟",
  };

  const scoreColor = scoreColors[analysis.qualification.score] || "#6b7280";
  const emoji = scoreEmoji[analysis.qualification.score] || "📞";

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; }
    .container { max-width: 650px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor}dd 100%); color: white; padding: 25px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .score { font-size: 14px; opacity: 0.9; margin-top: 5px; }
    .content { background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 25px; border-radius: 0 0 12px 12px; }
    .summary-box { background: #f8fafc; border-left: 4px solid ${scoreColor}; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { background: #f9fafb; padding: 12px; border-radius: 8px; }
    .info-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .info-value { font-weight: 500; color: #111827; }
    .tag { display: inline-block; background: #e5e7eb; color: #374151; padding: 4px 10px; border-radius: 999px; font-size: 13px; margin: 2px; }
    .tag.service { background: #dbeafe; color: #1d4ed8; }
    .tag.pain { background: #fef3c7; color: #92400e; }
    .follow-up { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; }
    .follow-up-title { font-weight: 600; color: #065f46; margin-bottom: 5px; }
    .transcript { background: #f9fafb; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 13px; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
    .meta { font-size: 12px; color: #9ca3af; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} Voice Agent Lead - ${analysis.qualification.score.toUpperCase()}</h1>
      <div class="score">Sentiment: ${sentimentEmoji[analysis.sentiment]} ${analysis.sentiment} | Duration: ${Math.round(duration / 60)} min</div>
    </div>

    <div class="content">
      <div class="summary-box">
        <strong>Summary:</strong> ${analysis.summary}
      </div>

      <div class="section">
        <div class="section-title">Contact Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Name</div>
            <div class="info-value">${analysis.contactInfo.name || "Not provided"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${analysis.contactInfo.email || "Not provided"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone</div>
            <div class="info-value">${analysis.contactInfo.phone || "Not provided"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Company</div>
            <div class="info-value">${analysis.contactInfo.company || "Not provided"}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Lead Qualification</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Score Reasoning</div>
            <div class="info-value">${analysis.qualification.reasoning}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Est. Deal Size</div>
            <div class="info-value">${analysis.qualification.estimatedRevenue || "Unknown"}</div>
          </div>
        </div>
        ${analysis.qualification.timeline ? `<div class="info-item" style="margin-top: 10px;"><div class="info-label">Timeline</div><div class="info-value">${analysis.qualification.timeline}</div></div>` : ""}
      </div>

      ${analysis.painPoints.length > 0 ? `
      <div class="section">
        <div class="section-title">Pain Points Identified</div>
        ${analysis.painPoints.map(p => `<span class="tag pain">${p}</span>`).join("")}
      </div>
      ` : ""}

      ${analysis.interestedServices.length > 0 ? `
      <div class="section">
        <div class="section-title">Services Interested In</div>
        ${analysis.interestedServices.map(s => `<span class="tag service">${s}</span>`).join("")}
      </div>
      ` : ""}

      <div class="section">
        <div class="follow-up">
          <div class="follow-up-title">Recommended Follow-Up</div>
          ${analysis.recommendedFollowUp}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Full Transcript</div>
        <div class="transcript">${transcript}</div>
      </div>

      <div class="meta">
        Conversation ID: ${conversationId}<br>
        Processed: ${new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" })} (Arizona Time)
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
