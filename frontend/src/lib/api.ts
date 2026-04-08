import { Grievance, GrievanceFilters } from "@/types/grievance";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
