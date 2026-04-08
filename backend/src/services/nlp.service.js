import dotenv from "dotenv";

dotenv.config();

// NLP Service Configuration
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || "https://dewanshu-chirkhe-grievance-api.hf.space";

/**
 * Call the Python NLP service to analyze grievance text
 */
async function callMLService(text) {
    // Abort request if NLP service hangs
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
                `NLP service error: ${response.status} ${response.statusText}`
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

/**
 * Analyze grievance text using ONLY the ML model
 */
export async function analyzeGrievance(text) {
    if (!text || typeof text !== "string") {
        throw new Error("Invalid grievance text");
    }

    console.log("🧠 Sending text to NLP service for analysis");

    const result = await callMLService(text);

    // Basic sanity validation
    if (
        !result.category ||
        !result.priority ||
        !result.sentiment ||
        !result.suggestedDepartment
    ) {
        throw new Error("Incomplete response from NLP service");
    }

    return {
        category: result.category,
        priority: result.priority,
        sentiment: result.sentiment,
        confidence: result.confidence ?? 0.0,
        keywords: result.keywords ?? [],
        suggestedDepartment: result.suggestedDepartment,
    };
}
