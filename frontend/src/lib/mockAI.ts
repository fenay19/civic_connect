import { Category, Priority, Sentiment, AIAnalysis, DEPARTMENTS } from '@/types/grievance';

// Keywords for category detection
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  roads: ['road', 'pothole', 'highway', 'street', 'bridge', 'footpath', 'sidewalk', 'traffic', 'सड़क', 'गड्ढा'],
  sanitation: ['garbage', 'waste', 'trash', 'clean', 'drain', 'sewage', 'dirty', 'smell', 'कचरा', 'सफाई', 'नाला'],
  electricity: ['power', 'electricity', 'light', 'transformer', 'wire', 'blackout', 'voltage', 'बिजली', 'बत्ती'],
  healthcare: ['hospital', 'doctor', 'medicine', 'health', 'clinic', 'ambulance', 'treatment', 'अस्पताल', 'डॉक्टर', 'दवा'],
  water_supply: ['water', 'tap', 'pipe', 'supply', 'drinking', 'tank', 'पानी', 'नल', 'जल'],
  education: ['school', 'college', 'teacher', 'education', 'student', 'library', 'स्कूल', 'शिक्षा', 'शिक्षक'],
  public_transport: ['bus', 'train', 'metro', 'transport', 'station', 'ticket', 'बस', 'ट्रेन', 'मेट्रो'],
  corruption: ['bribe', 'corrupt', 'money', 'illegal', 'fraud', 'scam', 'रिश्वत', 'भ्रष्टाचार', 'धोखा'],
  other: [],
};

// Urgency keywords for priority
const URGENCY_HIGH = ['urgent', 'emergency', 'critical', 'dangerous', 'life', 'death', 'immediate', 'serious', 'जरूरी', 'आपातकालीन', 'खतरनाक'];
const URGENCY_MEDIUM = ['need', 'problem', 'issue', 'concern', 'request', 'समस्या', 'चिंता'];

// Negative sentiment keywords
const NEGATIVE_KEYWORDS = ['angry', 'frustrated', 'disgusted', 'terrible', 'horrible', 'worst', 'pathetic', 'useless', 'corrupt', 'गुस्सा', 'बुरा', 'खराब'];

function detectCategory(text: string): Category {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let detectedCategory: Category = 'other';

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category as Category;
    }
  }

  return detectedCategory;
}

function detectPriority(text: string): Priority {
  const lowerText = text.toLowerCase();
  
  if (URGENCY_HIGH.some(word => lowerText.includes(word))) {
    return 'high';
  }
  if (URGENCY_MEDIUM.some(word => lowerText.includes(word))) {
    return 'medium';
  }
  
  // Longer complaints tend to indicate more serious issues
  if (text.length > 300) return 'medium';
  
  return 'low';
}

function detectSentiment(text: string): Sentiment {
  const lowerText = text.toLowerCase();
  
  if (NEGATIVE_KEYWORDS.some(word => lowerText.includes(word))) {
    return 'negative';
  }
  
  // Most grievances are inherently negative
  if (text.includes('!') || text.includes('?')) {
    return 'negative';
  }
  
  return 'neutral';
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const allKeywords = Object.values(CATEGORY_KEYWORDS).flat();
  const found = words.filter(word => 
    allKeywords.includes(word) || 
    URGENCY_HIGH.includes(word) || 
    URGENCY_MEDIUM.includes(word)
  );
  return [...new Set(found)].slice(0, 5);
}

function calculateConfidence(text: string, category: Category): number {
  const keywords = CATEGORY_KEYWORDS[category];
  const lowerText = text.toLowerCase();
  const matches = keywords.filter(k => lowerText.includes(k)).length;
  
  // Base confidence
  let confidence = 0.6;
  
  // Add confidence based on keyword matches
  confidence += Math.min(matches * 0.1, 0.3);
  
  // Add confidence for longer texts (more context)
  if (text.length > 100) confidence += 0.05;
  if (text.length > 200) confidence += 0.05;
  
  return Math.min(confidence, 0.98);
}

// Simulate AI processing delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function analyzeGrievance(text: string): Promise<AIAnalysis> {
  // Simulate AI processing time (1.5-3 seconds)
  await delay(1500 + Math.random() * 1500);
  
  const category = detectCategory(text);
  const priority = detectPriority(text);
  const sentiment = detectSentiment(text);
  const confidence = calculateConfidence(text, category);
  const keywords = extractKeywords(text);
  const suggestedDepartment = DEPARTMENTS[category];

  return {
    category,
    priority,
    sentiment,
    confidence,
    keywords,
    suggestedDepartment,
  };
}
