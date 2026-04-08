import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { Location } from "@/types/grievance";
import { useToast } from "@/hooks/use-toast";

interface LocationPickerProps {
    value: Location | null;
    onChange: (location: Location) => void;
    language: "en" | "hi";
}

const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Puducherry",
    "Chandigarh",
];

export function LocationPicker({
    value,
    onChange,
    language,
}: LocationPickerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showManual, setShowManual] = useState(!value);
    const [manualCity, setManualCity] = useState(value?.city || "");
    const [manualState, setManualState] = useState(value?.state || "");
    const [manualLandmark, setManualLandmark] = useState(value?.landmark || "");
    const { toast } = useToast();

    const labels = {
        en: {
            useLocation: "📍 Use Current Location",
            detecting: "Detecting location...",
            city: "City",
            state: "State",
            landmark: "Landmark (Optional)",
            cityPlaceholder: "Enter city name",
            statePlaceholder: "Select state",
            landmarkPlaceholder: "Near any landmark?",
            detected: "Location detected",
            enterManually: "Enter manually instead",
            locationError: "Could not detect location. Please enter manually.",
        },
        hi: {
            useLocation: "📍 वर्तमान स्थान का उपयोग करें",
            detecting: "स्थान का पता लगा रहे हैं...",
            city: "शहर",
            state: "राज्य",
            landmark: "लैंडमार्क (वैकल्पिक)",
            cityPlaceholder: "शहर का नाम दर्ज करें",
            statePlaceholder: "राज्य चुनें",
            landmarkPlaceholder: "कोई लैंडमार्क?",
            detected: "स्थान मिल गया",
            enterManually: "मैन्युअल रूप से दर्ज करें",
            locationError:
                "स्थान का पता नहीं चल सका। कृपया मैन्युअल रूप से दर्ज करें।",
        },
    };

    const t = labels[language];

    const detectLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            toast({
                title: "Error",
                description: "Geolocation is not supported",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const position = await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 20000,
                    });
                }
            );

            const { latitude, longitude } = position.coords;
            console.log("Detected coordinates:", latitude, longitude);

            // Use reverse geocoding to get city and state
            const detectedLocation = await reverseGeocode(latitude, longitude);

            onChange({
                ...detectedLocation,
                latitude,
                longitude,
            });

            setShowManual(false);
            toast({
                title: t.detected,
                description: `${detectedLocation.city}, ${detectedLocation.state}`,
            });
        } catch (error) {
            console.error("Location detection error:", error);
            toast({
                title: language === "en" ? "Location Error" : "स्थान त्रुटि",
                description:
                    error instanceof Error ? error.message : t.locationError,
                variant: "destructive",
            });
            setShowManual(true);
        } finally {
            setIsLoading(false);
        }
    }, [onChange, toast, language, t]);

    const handleManualUpdate = useCallback(() => {
        if (manualCity && manualState) {
            onChange({
                city: manualCity,
                state: manualState,
                landmark: manualLandmark || undefined,
            });
        }
    }, [manualCity, manualState, manualLandmark, onChange]);

    return (
        <div className="space-y-4">
            <Button
                type="button"
                variant="outline"
                onClick={detectLocation}
                disabled={isLoading}
                className="w-full sm:w-auto"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.detecting}
                    </>
                ) : (
                    <>
                        <MapPin className="mr-2 h-4 w-4" />
                        {t.useLocation}
                    </>
                )}
            </Button>

            {value && !showManual && (
                <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                        <p className="font-medium">
                            {value.city}, {value.state}
                        </p>
                        {value.landmark && (
                            <p className="text-sm text-muted-foreground">
                                {value.landmark}
                            </p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setShowManual(true)}
                    >
                        {t.enterManually}
                    </Button>
                </div>
            )}

            {showManual && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="city">{t.city} *</Label>
                        <Input
                            id="city"
                            value={manualCity}
                            onChange={(e) => {
                                setManualCity(e.target.value);
                                handleManualUpdate();
                            }}
                            onBlur={handleManualUpdate}
                            placeholder={t.cityPlaceholder}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">{t.state} *</Label>
                        <select
                            id="state"
                            value={manualState}
                            onChange={(e) => {
                                setManualState(e.target.value);
                                setTimeout(handleManualUpdate, 0);
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                        >
                            <option value="">{t.statePlaceholder}</option>
                            {INDIAN_STATES.map((state) => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="landmark">{t.landmark}</Label>
                        <Input
                            id="landmark"
                            value={manualLandmark}
                            onChange={(e) => {
                                setManualLandmark(e.target.value);
                                handleManualUpdate();
                            }}
                            onBlur={handleManualUpdate}
                            placeholder={t.landmarkPlaceholder}
                        />
                    </div>
                </div>
            )}

            {/* Static Map Preview */}
            {value?.latitude && value?.longitude && (
                <div className="relative h-48 rounded-lg overflow-hidden border bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent to-secondary">
                        <div className="text-center">
                            <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="font-medium">{value.city}</p>
                            <p className="text-sm text-muted-foreground">
                                {value.latitude.toFixed(4)},{" "}
                                {value.longitude.toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reverse geocoding using OpenStreetMap Nominatim API
async function reverseGeocode(
    lat: number,
    lng: number
): Promise<{ city: string; state: string }> {
    try {
        // Use Nominatim reverse geocoding API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            {
                headers: {
                    "User-Agent": "CitizenConnect/1.0", // Required by Nominatim
                },
            }
        );

        if (!response.ok) {
            throw new Error("Reverse geocoding failed");
        }

        const data = await response.json();

        if (!data.address) {
            throw new Error("No address data found");
        }

        const address = data.address;

        // Extract city/town/village name
        // Nominatim uses different keys: city, town, village, municipality, etc.
        const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.suburb ||
            address.county ||
            "Unknown City";

        // Extract state
        // In India, Nominatim typically uses "state" key
        const state =
            address.state ||
            address.region ||
            address.province ||
            "Unknown State";

        // Normalize state names to match Indian states list
        const normalizedState = normalizeStateName(state);

        // Validate that we got meaningful data
        if (city === "Unknown City" || normalizedState === "Unknown State") {
            throw new Error(
                "Could not determine location details from coordinates"
            );
        }

        return {
            city: city.trim(),
            state: normalizedState,
        };
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        // Re-throw the error so it can be handled by the caller
        throw new Error(
            "Could not determine city and state from coordinates. Please enter manually."
        );
    }
}

// Normalize state names to match the INDIAN_STATES list
function normalizeStateName(state: string): string {
    const stateMap: Record<string, string> = {
        "Andhra Pradesh": "Andhra Pradesh",
        "Arunachal Pradesh": "Arunachal Pradesh",
        Assam: "Assam",
        Bihar: "Bihar",
        Chhattisgarh: "Chhattisgarh",
        Goa: "Goa",
        Gujarat: "Gujarat",
        Haryana: "Haryana",
        "Himachal Pradesh": "Himachal Pradesh",
        Jharkhand: "Jharkhand",
        Karnataka: "Karnataka",
        Kerala: "Kerala",
        "Madhya Pradesh": "Madhya Pradesh",
        Maharashtra: "Maharashtra",
        Manipur: "Manipur",
        Meghalaya: "Meghalaya",
        Mizoram: "Mizoram",
        Nagaland: "Nagaland",
        Odisha: "Odisha",
        Punjab: "Punjab",
        Rajasthan: "Rajasthan",
        Sikkim: "Sikkim",
        "Tamil Nadu": "Tamil Nadu",
        Telangana: "Telangana",
        Tripura: "Tripura",
        "Uttar Pradesh": "Uttar Pradesh",
        Uttarakhand: "Uttarakhand",
        "West Bengal": "West Bengal",
        Delhi: "Delhi",
        "Jammu and Kashmir": "Jammu and Kashmir",
        Ladakh: "Ladakh",
        Puducherry: "Puducherry",
        Chandigarh: "Chandigarh",
        // Handle common variations
        "National Capital Territory of Delhi": "Delhi",
        "NCT of Delhi": "Delhi",
        Uttaranchal: "Uttarakhand",
        Orissa: "Odisha",
    };

    // Try exact match first
    if (stateMap[state]) {
        return stateMap[state];
    }

    // Try case-insensitive match
    const lowerState = state.toLowerCase();
    for (const [key, value] of Object.entries(stateMap)) {
        if (key.toLowerCase() === lowerState) {
            return value;
        }
    }

    // If no match found, return the original state name
    return state;
}
