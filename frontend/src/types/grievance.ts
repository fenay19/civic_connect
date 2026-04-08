export type Priority = "low" | "medium" | "high";
export type Sentiment = "negative" | "neutral" | "positive";
export type Status = "pending" | "in_progress" | "resolved";

export type Category =
    | "roads"
    | "sanitation"
    | "electricity"
    | "healthcare"
    | "water_supply"
    | "education"
    | "public_transport"
    | "corruption"
    | "other";

export const CATEGORIES: Record<Category, { label: string; labelHi: string }> =
    {
        roads: {
            label: "Roads & Infrastructure",
            labelHi: "सड़कें और बुनियादी ढांचा",
        },
        sanitation: { label: "Sanitation & Cleanliness", labelHi: "स्वच्छता" },
        electricity: { label: "Electricity", labelHi: "बिजली" },
        healthcare: { label: "Healthcare", labelHi: "स्वास्थ्य सेवा" },
        water_supply: { label: "Water Supply", labelHi: "जल आपूर्ति" },
        education: { label: "Education", labelHi: "शिक्षा" },
        public_transport: {
            label: "Public Transport",
            labelHi: "सार्वजनिक परिवहन",
        },
        corruption: { label: "Corruption & Misconduct", labelHi: "भ्रष्टाचार" },
        other: { label: "Other", labelHi: "अन्य" },
    };

export const DEPARTMENTS: Record<Category, string> = {
    roads: "Public Works Department",
    sanitation: "Municipal Corporation",
    electricity: "Electricity Board",
    healthcare: "Health Department",
    water_supply: "Water Supply Board",
    education: "Education Department",
    public_transport: "Transport Department",
    corruption: "Anti-Corruption Bureau",
    other: "General Administration",
};

export interface Location {
    city: string;
    state: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
}

export interface AIAnalysis {
    category: Category;
    priority: Priority;
    sentiment: Sentiment;
    confidence: number;
    keywords: string[];
    suggestedDepartment: string;
}

export interface Grievance {
    id: string;
    text: string;
    language: "en" | "hi";
    location: Location;
    analysis: AIAnalysis;
    status: Status;
    assignedDepartment: string;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    image?: string; // Base64 encoded image
}

export interface GrievanceFilters {
    category?: Category;
    priority?: Priority;
    status?: Status;
    city?: string;
    state?: string;
}
