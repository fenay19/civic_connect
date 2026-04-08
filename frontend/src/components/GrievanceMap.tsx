import { Grievance } from "@/types/grievance";
import { MapPin } from "lucide-react";
import { PriorityBadge, StatusBadge } from "./StatusBadges";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORIES } from "@/types/grievance";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for default marker icons in React/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface GrievanceMapProps {
    grievances: Grievance[];
}

// Component to fit map bounds to show all markers
function FitBounds({
    locations,
}: {
    locations: Array<{ latitude: number; longitude: number }>;
}) {
    const map = useMap();

    useEffect(() => {
        if (locations.length > 0) {
            const validLocations = locations.filter(
                (l) => l.latitude !== 0 && l.longitude !== 0
            );
            if (validLocations.length > 0) {
                const bounds = L.latLngBounds(
                    validLocations.map((l) => [l.latitude, l.longitude])
                );
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [locations, map]);

    return null;
}

// Create custom icon based on priority
function createPriorityIcon(
    priority: "high" | "medium" | "low",
    count: number
) {
    const colors = {
        high: "#dc2626", // red-600
        medium: "#f59e0b", // amber-500
        low: "#10b981", // emerald-500
    };

    const svgIcon = `
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24c0-8.837-7.163-16-16-16z" fill="${
                colors[priority]
            }" stroke="white" stroke-width="2"/>
            ${
                count > 1
                    ? `<circle cx="24" cy="8" r="8" fill="white" stroke="${colors[priority]}" stroke-width="1.5"/>
            <text x="24" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="${colors[priority]}">${count}</text>`
                    : ""
            }
        </svg>
    `;

    return L.divIcon({
        html: svgIcon,
        className: "custom-marker",
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
    });
}

export function GrievanceMap({ grievances }: GrievanceMapProps) {
    const [selectedLocation, setSelectedLocation] = useState<{
        city: string;
        state: string;
        grievances: Grievance[];
    } | null>(null);

    // Group grievances by approximate location
    const locationGroups = grievances.reduce((acc, g) => {
        const key = `${g.location.city}-${g.location.state}`;
        if (!acc[key]) {
            acc[key] = {
                city: g.location.city,
                state: g.location.state,
                latitude: g.location.latitude || 0,
                longitude: g.location.longitude || 0,
                grievances: [],
            };
        }
        acc[key].grievances.push(g);
        return acc;
    }, {} as Record<string, { city: string; state: string; latitude: number; longitude: number; grievances: Grievance[] }>);

    const locations = Object.values(locationGroups);

    const getPriority = (
        grievances: Grievance[]
    ): "high" | "medium" | "low" => {
        if (grievances.some((g) => g.analysis.priority === "high"))
            return "high";
        if (grievances.some((g) => g.analysis.priority === "medium"))
            return "medium";
        return "low";
    };

    // Default center to India if no locations
    const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center
    const defaultZoom = 5;

    if (locations.length === 0) {
        return (
            <div className="relative h-[500px] rounded-lg border bg-gradient-to-br from-accent/30 to-secondary/30 overflow-hidden flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No grievances to display on map</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[500px] md:h-[650px] lg:h-[750px] rounded-lg border overflow-hidden">
            {/* Map title */}
            <div className="absolute top-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
                <h3 className="font-semibold text-lg">Grievance Locations</h3>
                <p className="text-sm text-muted-foreground">
                    Click on a marker to view details
                </p>
            </div>

            {/* Legend */}
            <div className="absolute top-4 right-4 z-[1000] bg-card/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
                <p className="text-xs font-medium mb-2">Priority</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-high" />
                        <span className="text-xs">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-medium" />
                        <span className="text-xs">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-low" />
                        <span className="text-xs">Low</span>
                    </div>
                </div>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds locations={locations} />
                {locations.map((location, index) => {
                    if (location.latitude === 0 || location.longitude === 0) {
                        return null;
                    }
                    const priority = getPriority(location.grievances);
                    const icon = createPriorityIcon(
                        priority,
                        location.grievances.length
                    );

                    return (
                        <Marker
                            key={index}
                            position={[location.latitude, location.longitude]}
                            icon={icon}
                            eventHandlers={{
                                click: () => {
                                    setSelectedLocation({
                                        city: location.city,
                                        state: location.state,
                                        grievances: location.grievances,
                                    });
                                },
                            }}
                        >
                            <Popup>
                                <div className="text-left">
                                    <div className="font-semibold text-sm mb-1">
                                        {location.city}, {location.state}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {location.grievances.length}{" "}
                                        {location.grievances.length === 1
                                            ? "grievance"
                                            : "grievances"}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedLocation({
                                                city: location.city,
                                                state: location.state,
                                                grievances: location.grievances,
                                            });
                                        }}
                                        className="text-xs text-primary mt-2 hover:underline"
                                    >
                                        Click to view details →
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Dialog for showing grievance details */}
            {selectedLocation && (
                <Dialog
                    open={!!selectedLocation}
                    onOpenChange={(open) => !open && setSelectedLocation(null)}
                >
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                {selectedLocation.city},{" "}
                                {selectedLocation.state}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
                            {selectedLocation.grievances.map((g) => (
                                <div
                                    key={g.id}
                                    className="p-3 border rounded-lg space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm">
                                            {g.id}
                                        </span>
                                        <div className="flex gap-2">
                                            <PriorityBadge
                                                priority={g.analysis.priority}
                                            />
                                            <StatusBadge status={g.status} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {g.text}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {CATEGORIES[g.analysis.category].label}{" "}
                                        • {g.assignedDepartment}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
