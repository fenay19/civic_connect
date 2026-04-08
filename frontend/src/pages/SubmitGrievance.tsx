import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LocationPicker } from "@/components/LocationPicker";
import { Location, Grievance, CATEGORIES } from "@/types/grievance";
import { analyzeGrievance } from "@/lib/mockAI";
import { addGrievance } from "@/lib/grievanceStore";
import { useToast } from "@/hooks/use-toast";
import {
    Shield,
    Brain,
    Loader2,
    CheckCircle,
    ArrowLeft,
    Sparkles,
    Upload,
    X,
    Image as ImageIcon,
} from "lucide-react";
import {
    PriorityBadge,
    CategoryBadge,
    SentimentBadge,
} from "@/components/StatusBadges";

const SubmitGrievance = () => {
    const [language, setLanguage] = useState<"en" | "hi">("en");
    const [grievanceText, setGrievanceText] = useState("");
    const [location, setLocation] = useState<Location | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [submittedGrievance, setSubmittedGrievance] =
        useState<Grievance | null>(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    const labels = {
        en: {
            title: "Submit Your Grievance",
            subtitle:
                "Describe your issue and our AI will analyze and route it to the appropriate department",
            language: "हिंदी में लिखें",
            grievanceLabel: "Describe your grievance in detail",
            grievancePlaceholder:
                "Please describe your issue in detail. Include relevant information such as dates, locations, and any actions already taken...",
            locationLabel: "Your Location",
            locationRequired:
                "Location is required to route your grievance to the correct local authority",
            imageLabel: "Upload Image (Optional)",
            imageDescription:
                "Upload a photo related to your grievance (Max 5MB, JPG/PNG)",
            imageRemove: "Remove Image",
            imageSizeError: "Image size must be less than 5MB",
            imageTypeError: "Please upload a JPG or PNG image",
            submit: "Submit Grievance",
            analyzing: "Analyzing grievance with AI...",
            successTitle: "Grievance Submitted Successfully!",
            successMessage:
                "Your grievance has been analyzed and routed to the appropriate department.",
            trackingId: "Tracking ID",
            category: "Category",
            priority: "Priority",
            sentiment: "Sentiment",
            department: "Assigned Department",
            submitAnother: "Submit Another Grievance",
            goHome: "Return to Home",
            characters: "characters",
            // minChars: 'Minimum 30 characters required',
        },
        hi: {
            title: "अपनी शिकायत दर्ज करें",
            subtitle:
                "अपनी समस्या का वर्णन करें और हमारा AI इसका विश्लेषण करके उचित विभाग को भेजेगा",
            language: "Write in English",
            grievanceLabel: "अपनी शिकायत का विस्तार से वर्णन करें",
            grievancePlaceholder:
                "कृपया अपनी समस्या का विस्तार से वर्णन करें। तारीखें, स्थान और पहले से की गई कार्रवाई जैसी प्रासंगिक जानकारी शामिल करें...",
            locationLabel: "आपका स्थान",
            locationRequired:
                "आपकी शिकायत को सही स्थानीय प्राधिकरण को भेजने के लिए स्थान आवश्यक है",
            imageLabel: "छवि अपलोड करें (वैकल्पिक)",
            imageDescription:
                "अपनी शिकायत से संबंधित फोटो अपलोड करें (अधिकतम 5MB, JPG/PNG)",
            imageRemove: "छवि हटाएं",
            imageSizeError: "छवि का आकार 5MB से कम होना चाहिए",
            imageTypeError: "कृपया JPG या PNG छवि अपलोड करें",
            submit: "शिकायत दर्ज करें",
            analyzing: "AI द्वारा शिकायत का विश्लेषण...",
            successTitle: "शिकायत सफलतापूर्वक दर्ज!",
            successMessage:
                "आपकी शिकायत का विश्लेषण करके उचित विभाग को भेज दिया गया है।",
            trackingId: "ट्रैकिंग आईडी",
            category: "श्रेणी",
            priority: "प्राथमिकता",
            sentiment: "भावना",
            department: "निर्धारित विभाग",
            submitAnother: "एक और शिकायत दर्ज करें",
            goHome: "होम पर वापस जाएं",
            characters: "अक्षर",
            // minChars: 'न्यूनतम 30 अक्षर आवश्यक',
        },
    };

    const t = labels[language];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
            toast({
                title:
                    language === "en"
                        ? "Invalid File Type"
                        : "अमान्य फ़ाइल प्रकार",
                description: t.imageTypeError,
                variant: "destructive",
            });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title:
                    language === "en" ? "File Too Large" : "फ़ाइल बहुत बड़ी है",
                description: t.imageSizeError,
                variant: "destructive",
            });
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setImage(base64String);
            setImageFile(file);
        };
        reader.onerror = () => {
            toast({
                title: language === "en" ? "Error" : "त्रुटि",
                description:
                    language === "en"
                        ? "Failed to read image"
                        : "छवि पढ़ने में विफल",
                variant: "destructive",
            });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImageFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // if (grievanceText.length < 30) {
        //   toast({
        //     title: language === 'en' ? 'Text too short' : 'टेक्स्ट बहुत छोटा है',
        //     description: t.minChars,
        //     variant: 'destructive',
        //   });
        //   return;
        // }

        if (!location || !location.city || !location.state) {
            toast({
                title: language === "en" ? "Location required" : "स्थान आवश्यक",
                description: t.locationRequired,
                variant: "destructive",
            });
            return;
        }

        setIsAnalyzing(true);

        try {
            const analysis = await analyzeGrievance(grievanceText);

            const newGrievance = await addGrievance({
                text: grievanceText,
                language,
                location,
                analysis,
                status: "pending",
                assignedDepartment: analysis.suggestedDepartment,
                image: image || undefined,
                userId: localStorage.getItem('user_id') || undefined,
            } as any);

            setSubmittedGrievance(newGrievance);

            toast({
                title: t.successTitle,
                description: `${t.trackingId}: ${newGrievance.id}`,
            });
        } catch (error) {
            toast({
                title: language === "en" ? "Error" : "त्रुटि",
                description:
                    language === "en"
                        ? "Failed to submit grievance. Please try again."
                        : "शिकायत दर्ज करने में विफल। कृपया पुनः प्रयास करें।",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetForm = () => {
        setGrievanceText("");
        setLocation(null);
        setImage(null);
        setImageFile(null);
        setSubmittedGrievance(null);
    };

    // Success State
    if (submittedGrievance) {
        return (
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="border-b bg-card sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4 flex items-center gap-3">
                        <Link to="/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg gradient-govt flex items-center justify-center">
                                <Shield className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight">
                                    Grievance Portal
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Government of India
                                </p>
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-12">
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 rounded-full bg-status-resolved/20 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-10 w-10 text-status-resolved" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {t.successTitle}
                                </h2>
                                <p className="text-muted-foreground">
                                    {t.successMessage}
                                </p>
                            </div>

                            <div className="bg-accent/50 rounded-lg p-6 mb-6">
                                <div className="text-center mb-4">
                                    <span className="text-sm text-muted-foreground">
                                        {t.trackingId}
                                    </span>
                                    <p className="text-2xl font-mono font-bold text-primary">
                                        {submittedGrievance.id}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">
                                            {t.category}
                                        </span>
                                        <div className="mt-1">
                                            <CategoryBadge
                                                category={
                                                    submittedGrievance.analysis
                                                        .category
                                                }
                                                language={language}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            {t.priority}
                                        </span>
                                        <div className="mt-1">
                                            <PriorityBadge
                                                priority={
                                                    submittedGrievance.analysis
                                                        .priority
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            {t.sentiment}
                                        </span>
                                        <div className="mt-1">
                                            <SentimentBadge
                                                sentiment={
                                                    submittedGrievance.analysis
                                                        .sentiment
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            {t.department}
                                        </span>
                                        <p className="font-medium mt-1">
                                            {
                                                submittedGrievance.assignedDepartment
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button onClick={resetForm} className="flex-1">
                                    {t.submitAnother}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate("/dashboard")}
                                    className="flex-1"
                                >
                                    {language === "en" ? "View Dashboard" : "डैशबोर्ड देखें"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="mr-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="w-10 h-10 rounded-lg gradient-govt flex items-center justify-center">
                            <Shield className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">
                                Grievance Portal
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Government of India
                            </p>
                        </div>
                    </Link>

                    {/* Language Toggle */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm">EN</span>
                        <Switch
                            checked={language === "hi"}
                            onCheckedChange={(checked) =>
                                setLanguage(checked ? "hi" : "en")
                            }
                        />
                        <span className="text-sm">हिं</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="h-6 w-6 text-primary" />
                                {t.title}
                            </CardTitle>
                            <CardDescription>{t.subtitle}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Grievance Text */}
                                <div className="space-y-2">
                                    <Label htmlFor="grievance">
                                        {t.grievanceLabel} *
                                    </Label>
                                    <Textarea
                                        id="grievance"
                                        value={grievanceText}
                                        onChange={(e) =>
                                            setGrievanceText(e.target.value)
                                        }
                                        placeholder={t.grievancePlaceholder}
                                        rows={8}
                                        className="resize-none"
                                        required
                                    />
                                    {/* <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={grievanceText.length < 50 ? 'text-destructive' : ''}>
                      {t.minChars}
                    </span>
                    <span>{grievanceText.length} {t.characters}</span>
                  </div> */}
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label>{t.locationLabel} *</Label>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {t.locationRequired}
                                    </p>
                                    <LocationPicker
                                        value={location}
                                        onChange={setLocation}
                                        language={language}
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <Label>{t.imageLabel}</Label>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {t.imageDescription}
                                    </p>
                                    {!image ? (
                                        <div className="border-2 border-dashed border-border rounded-lg p-6">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <label
                                                htmlFor="image-upload"
                                                className="flex flex-col items-center justify-center cursor-pointer"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                                                    <Upload className="h-6 w-6 text-primary" />
                                                </div>
                                                <p className="text-sm font-medium mb-1">
                                                    {language === "en"
                                                        ? "Click to upload"
                                                        : "अपलोड करने के लिए क्लिक करें"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {language === "en"
                                                        ? "JPG or PNG, max 5MB"
                                                        : "JPG या PNG, अधिकतम 5MB"}
                                                </p>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="relative border rounded-lg overflow-hidden">
                                            <img
                                                src={image}
                                                alt="Grievance"
                                                className="w-full h-64 object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={handleRemoveImage}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                {t.imageRemove}
                                            </Button>
                                            {imageFile && (
                                                <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs">
                                                    {(
                                                        imageFile.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{" "}
                                                    MB
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full"
                                    disabled={isAnalyzing || !location}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            {t.analyzing}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-5 w-5" />
                                            {t.submit}
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default SubmitGrievance;
