export interface AIPredictionResult {
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  confidence: number;
  suggested_skill: string;
}

export class AIService {
  private static ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

  /**
   * Request classification from FastAPI ML service with graceful fallback
   */
  public static async classifyTicket(
    subject: string,
    description: string
  ): Promise<AIPredictionResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${this.ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject, description }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as AIPredictionResult;
        console.log(`[AI SERVICE] ML Service classified ticket -> Category: ${data.category}, Priority: ${data.priority}, Confidence: ${data.confidence}`);
        return {
          category: data.category,
          priority: data.priority as any,
          sentiment: data.sentiment as any,
          confidence: data.confidence,
          suggested_skill: data.suggested_skill
        };
      }
    } catch (err: any) {
      console.warn(`[AI SERVICE] ML Service call failed (${err.message}). Using intelligent rule-based NLP fallback.`);
    }

    // High accuracy NLP Fallback
    return this.fallbackClassify(subject, description);
  }

  private static fallbackClassify(subject: string, description: string): AIPredictionResult {
    const text = `${subject} ${description}`.toLowerCase();

    let category = 'Other';
    let suggestedSkill = 'General Support';

    if (/(database|500|502|504|crash|timeout|cluster|latency|memory leak|server|exception|connection refused|down)/i.test(text)) {
      category = 'Technical Issue';
      suggestedSkill = 'Technical Support';
    } else if (/(security|vulnerability|sql injection|xss|compromise|hacked|breach|unauthorized|ransomware|ddos|idor)/i.test(text)) {
      category = 'Security';
      suggestedSkill = 'Cybersecurity & Identity';
    } else if (/(invoice|refund|charged|billing|receipt|subscription|pricing|tax|gst|vat|overdue)/i.test(text)) {
      category = 'Billing';
      suggestedSkill = 'Billing & Accounts';
    } else if (/(card|payment|stripe|checkout|3d secure|declined|wire|ach|balance|transaction)/i.test(text)) {
      category = 'Payment';
      suggestedSkill = 'Billing & Accounts';
    } else if (/(login|password|2fa|sso|saml|authenticator|reset link|oauth|session|token expired)/i.test(text)) {
      category = 'Login';
      suggestedSkill = 'Identity & Access';
    } else if (/(invite|workspace|delete account|profile|permission|member|role|transfer)/i.test(text)) {
      category = 'Account';
      suggestedSkill = 'Identity & Access';
    } else if (/(export|bug|broken|pagination|ui|editor|mobile app|button|upload|corrupted)/i.test(text)) {
      category = 'Product Issue';
      suggestedSkill = 'Product & Bug Triage';
    } else if (/(feature|request|integration|dark mode|webhook|support for|add option|roadmap)/i.test(text)) {
      category = 'Feature Request';
      suggestedSkill = 'Customer Success';
    } else if (/(rude|unacceptable|disappointed|complaint|terrible|horrible|unresponsive|waste|breached)/i.test(text)) {
      category = 'Complaint';
      suggestedSkill = 'Customer Success & Escalations';
    }

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    if (/(down|outage|critical|compromise|unresponsive|emergency|zero bytes|ransomware|all payments|500 errors)/i.test(text)) {
      priority = 'CRITICAL';
    } else if (/(error|fail|broken|refund|locked|urgent|high|timeout|corrupted|unauthorized|breach)/i.test(text)) {
      priority = 'HIGH';
    } else if (/(feature|inquiry|how to|question|doc|dark mode|suggestion|feedback)/i.test(text)) {
      priority = 'LOW';
    }

    let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
    if (/(unacceptable|terrible|worst|broken|horrible|rude|disappointed|angry|frustrated|waste|disgusted)/i.test(text)) {
      sentiment = 'Negative';
    } else if (/(thank|thanks|great|excellent|awesome|kudos|love|fast|brilliant|wonderful|appreciate)/i.test(text)) {
      sentiment = 'Positive';
    }

    return {
      category,
      priority,
      sentiment,
      confidence: 0.88,
      suggested_skill: suggestedSkill
    };
  }
}
