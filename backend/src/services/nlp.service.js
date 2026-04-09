import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

// ================= CONFIG =================
const NLP_SERVICE_URL =
    process.env.NLP_SERVICE_URL ||
    "https://dewanshu-chirkhe-grievance-api.hf.space";

let groqInstance = null;
function getGroq() {
    if (!groqInstance) {
        if (!process.env.GROQ_API_KEY) {
            console.warn("⚠️  GROQ_API_KEY is not set.");
        }
        groqInstance = new Groq({
            apiKey: process.env.GROQ_API_KEY || "dummy",
        });
    }
    return groqInstance;
}

const CATEGORY_MAP = {
    healthcare: "Health Department",
    roads: "Public Works Department",
    education: "Education Department",
    public_transport: "Transport Authority",
    sanitation: "Municipal Corporation",
    water_supply: "Water Supply Board",
    corruption: "Anti-Corruption Bureau",
    electricity: "Electricity Board",
};

// ================= ML SERVICE =================
async function callMLService(text) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(`${NLP_SERVICE_URL}/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(
                `NLP service error: ${response.status} ${response.statusText}`,
            );
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("NLP service timeout");
        }
        throw new Error(`Failed to reach NLP service: ${error.message}`);
    } finally {
        clearTimeout(timeoutId);
    }
}

// ================= GROQ VALIDATION =================
async function validateWithGroq(text, prediction) {
    const prompt = `
You are an expert government grievance classifier.

STRICT RULES (MUST FOLLOW):

PRIORITY RULES:
- "high" → emergency, safety risk, public danger, unavailable services
- "medium" → serious inconvenience, damage, recurring issue
- "low" → minor inconvenience, cosmetic issue

If text contains words like:
"emergency", "critical", "unsafe", "not working", "unavailable", "danger"
→ PRIORITY MUST BE "high"

If text contains:
"frustrating", "damage", "poor condition"
→ PRIORITY MUST BE at least "medium"

DEPARTMENT RULE:
You MUST map category to correct department:

healthcare → Health Department  
roads → Public Works Department  
education → Education Department  
public_transport → Transport Authority  
sanitation → Municipal Corporation  
water_supply → Water Supply Board  
corruption → Anti-Corruption Bureau  
electricity → Electricity Board  

DO NOT invent departments.

Allowed categories:
healthcare, roads, education, public_transport, sanitation, water_supply, corruption, electricity

Allowed priorities:
low, medium, high

Allowed sentiments:
positive, neutral, negative

---

Given:
Text: "${text}"

ML Prediction:
Category: ${prediction.category}
Priority: ${prediction.priority}
Sentiment: ${prediction.sentiment}
Department: ${prediction.suggestedDepartment}

---

Task:
1. Check if ML prediction follows ALL rules
2. If not, correct it STRICTLY based on rules

Return ONLY JSON:
{
  "category": "...",
  "priority": "...",
  "sentiment": "...",
  "suggestedDepartment": "..."
}
`;

    try {
        const response = await getGroq().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;

        const parsed = JSON.parse(content);

        // 🔒 Safety fallback mapping
        if (!parsed.suggestedDepartment) {
            parsed.suggestedDepartment =
                CATEGORY_MAP[parsed.category] || "General Administration";
        }

        return parsed;
    } catch (err) {
        console.error("⚠️ Groq validation failed:", err.message);
        return prediction; // fallback to ML result
    }
}

// ================= MAIN FUNCTION =================
export async function analyzeGrievance(text) {
    if (!text || typeof text !== "string") {
        throw new Error("Invalid grievance text");
    }

    console.log("\n==============================");
    console.log("📩 INPUT TEXT:");
    console.log(text);

    console.log("\n🧠 Sending text to NLP service...");

    const result = await callMLService(text);

    // Basic validation
    if (
        !result.category ||
        !result.priority ||
        !result.sentiment ||
        !result.suggestedDepartment
    ) {
        throw new Error("Incomplete response from NLP service");
    }

    const baseResponse = {
        category: result.category,
        priority: result.priority,
        sentiment: result.sentiment,
        confidence: result.confidence ?? 0.0,
        keywords: result.keywords ?? [],
        suggestedDepartment: result.suggestedDepartment,
    };

    // 🔥 PRINT ML RESPONSE
    console.log("\n🧠 ML MODEL OUTPUT:");
    console.log(JSON.stringify(baseResponse, null, 2));

    let finalResponse = baseResponse;

    // Only validate when needed
    if (baseResponse.confidence < 0.85) {
        console.log("\n⚠️ Low confidence → validating with Groq...");

        const corrected = await validateWithGroq(text, baseResponse);

        // 🔥 PRINT GROQ RESPONSE
        console.log("\n🤖 GROQ OUTPUT:");
        console.log(JSON.stringify(corrected, null, 2));

        finalResponse = {
            ...baseResponse,
            ...corrected,
            correctedByLLM: true,
        };
    }

    // Ensure department always matches category
    finalResponse.suggestedDepartment =
        CATEGORY_MAP[finalResponse.category] || "General Administration";

    // 🔥 PRINT FINAL RESPONSE
    console.log("\n✅ FINAL OUTPUT:");
    console.log(JSON.stringify(finalResponse, null, 2));

    console.log("==============================\n");

    return finalResponse;
}
