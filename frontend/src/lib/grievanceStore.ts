import { Grievance, GrievanceFilters, Status } from "@/types/grievance";
import * as api from "./api";

export async function getAllGrievances(): Promise<Grievance[]> {
    return await api.fetchGrievances();
}

export async function getGrievanceById(
    id: string
): Promise<Grievance | undefined> {
    try {
        return await api.fetchGrievanceById(id);
    } catch (error) {
        console.error("Failed to fetch grievance:", error);
        return undefined;
    }
}

export async function addGrievance(
    grievance: Omit<Grievance, "id" | "createdAt" | "updatedAt">
): Promise<Grievance> {
    return await api.createGrievance(grievance);
}

export async function updateGrievance(
    id: string,
    updates: Partial<Grievance> & { category?: string }
): Promise<Grievance | undefined> {
    if (updates.status || updates.assignedDepartment || updates.notes || updates.category) {
        return await api.updateGrievanceStatus(
            id,
            updates.status,
            updates.notes,
            updates.assignedDepartment,
            updates.category
        );
    }
    // For other updates, you might want to add a general update endpoint
    throw new Error("Only status/notes/department/category updates are currently supported via API");
}

export async function updateGrievanceStatus(
    id: string,
    status: Status,
    notes?: string,
    assignedDepartment?: string,
    category?: string
): Promise<Grievance | undefined> {
    return updateGrievance(id, { status, notes, assignedDepartment, category });
}

export async function filterGrievances(
    filters: GrievanceFilters
): Promise<Grievance[]> {
    let grievances = await getAllGrievances();

    if (filters.category) {
        grievances = grievances.filter(
            (g) => g.analysis.category === filters.category
        );
    }
    if (filters.priority) {
        grievances = grievances.filter(
            (g) => g.analysis.priority === filters.priority
        );
    }
    if (filters.status) {
        grievances = grievances.filter((g) => g.status === filters.status);
    }
    if (filters.city) {
        grievances = grievances.filter((g) =>
            g.location.city.toLowerCase().includes(filters.city!.toLowerCase())
        );
    }
    if (filters.state) {
        grievances = grievances.filter((g) =>
            g.location.state
                .toLowerCase()
                .includes(filters.state!.toLowerCase())
        );
    }

    return grievances;
}

export async function getAnalytics() {
    const grievances = await getAllGrievances();

    const total = grievances.length;
    const highPriority = grievances.filter(
        (g) => g.analysis.priority === "high"
    ).length;
    const pending = grievances.filter((g) => g.status === "pending").length;
    const inProgress = grievances.filter(
        (g) => g.status === "in_progress"
    ).length;
    const resolved = grievances.filter((g) => g.status === "resolved").length;

    // Category breakdown
    const byCategory: Record<string, number> = {};
    grievances.forEach((g) => {
        byCategory[g.analysis.category] =
            (byCategory[g.analysis.category] || 0) + 1;
    });

    // Priority breakdown
    const byPriority = {
        high: grievances.filter((g) => g.analysis.priority === "high").length,
        medium: grievances.filter((g) => g.analysis.priority === "medium")
            .length,
        low: grievances.filter((g) => g.analysis.priority === "low").length,
    };

    // City breakdown
    const byCity: Record<string, number> = {};
    grievances.forEach((g) => {
        byCity[g.location.city] = (byCity[g.location.city] || 0) + 1;
    });

    // Most affected locations
    const topCities = Object.entries(byCity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

    return {
        total,
        highPriority,
        pending,
        inProgress,
        resolved,
        byCategory,
        byPriority,
        byCity,
        topCities,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
}

// Admin authentication (demo)
const DEMO_ADMIN = { email: "admin@grievance.gov.in", password: "admin123" };

export function authenticateAdmin(email: string, password: string): boolean {
    return email === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
}

export function isAdminLoggedIn(): boolean {
    return localStorage.getItem("admin_logged_in") === "true";
}

export function loginAdmin(): void {
    localStorage.setItem("admin_logged_in", "true");
}

export function logoutAdmin(): void {
    localStorage.removeItem("admin_logged_in");
}
