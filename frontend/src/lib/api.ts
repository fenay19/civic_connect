import { Grievance, GrievanceFilters } from "@/types/grievance";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

export async function fetchGrievances(): Promise<Grievance[]> {
    const response = await fetch(`${API_BASE_URL}/complaints`);
    if (!response.ok) {
        throw new Error("Failed to fetch grievances");
    }
    return response.json();
}

export async function fetchGrievanceById(id: string): Promise<Grievance> {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch grievance");
    }
    return response.json();
}

export async function createGrievance(
    grievance: Omit<Grievance, "id" | "createdAt" | "updatedAt">
): Promise<Grievance> {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(grievance),
    });
    if (!response.ok) {
        throw new Error("Failed to create grievance");
    }
    return response.json();
}

export async function updateGrievanceStatus(
    id: string,
    status?: string,
    notes?: string,
    assignedDepartment?: string,
    category?: string
): Promise<Grievance> {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes, assignedDepartment, category }),
    });
    if (!response.ok) {
        throw new Error("Failed to update grievance");
    }
    return response.json();
}

export async function registerUser(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to register");
    return result;
}

export async function loginUser(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to login");
    return result;
}

// ===================== Telegram APIs =====================

export async function checkTelegramStatus(userId: string | number): Promise<{ linked: boolean; username: string | null }> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/telegram-status`);
    if (!response.ok) {
        throw new Error("Failed to check Telegram status");
    }
    return response.json();
}

export async function linkTelegram(userId: string | number, telegramChatId: string, telegramUsername?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/link-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, telegramChatId, telegramUsername }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to link Telegram");
    return result;
}

export async function updateUserLocation(userId: string | number, latitude: number, longitude: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to update location");
    return result;
}

// ===================== Pre-registration Telegram Token =====================

export async function generateTelegramToken(): Promise<{ token: string }> {
    const response = await fetch(`${API_BASE_URL}/users/telegram-token`, {
        method: "POST",
    });
    if (!response.ok) throw new Error("Failed to generate token");
    return response.json();
}

export interface TelegramTokenStatus {
    linked: boolean;
    chatId?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
}

export async function checkTelegramToken(token: string): Promise<TelegramTokenStatus> {
    const response = await fetch(`${API_BASE_URL}/users/telegram-token/${token}`);
    if (!response.ok) throw new Error("Failed to check token");
    return response.json();
}

// ===================== Admin Poll APIs =====================

export interface PollVote {
    userName: string;
    telegramUsername: string | null;
    vote: "yes" | "no";
    votedAt: string;
}

export interface PollDetail {
    id: number;
    question: string;
    yesCount: number;
    noCount: number;
    totalVotes: number;
    createdAt: string;
    votes: PollVote[];
}

export interface PollResults {
    polls: PollDetail[];
    totalYes: number;
    totalNo: number;
    totalPolled: number;
}

export async function triggerCommunityPoll(complaintId: string): Promise<{ success: boolean; message: string; nearbyUsersCount: number }> {
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/poll`, {
        method: "POST",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to trigger poll");
    return result;
}

export async function fetchPollResults(complaintId: string): Promise<PollResults> {
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/poll`);
    if (!response.ok) throw new Error("Failed to fetch poll results");
    return response.json();
}
