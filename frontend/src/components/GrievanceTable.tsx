import { useState, useCallback, useEffect } from "react";
import { Grievance, Status, Category, Priority } from "@/types/grievance";
import {
    StatusBadge,
    PriorityBadge,
    SentimentBadge,
    CategoryBadge,
} from "@/components/StatusBadges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Eye, Filter, X, Image as ImageIcon } from "lucide-react";
import { CATEGORIES } from "@/types/grievance";
import { updateGrievanceStatus } from "@/lib/grievanceStore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface GrievanceTableProps {
    grievances: Grievance[];
    onRefresh: () => void;
}

export function GrievanceTable({ grievances, onRefresh }: GrievanceTableProps) {
    const [selectedGrievance, setSelectedGrievance] =
        useState<Grievance | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterLocation, setFilterLocation] = useState("");
    const { toast } = useToast();

    const filteredGrievances = grievances.filter((g) => {
        if (filterCategory !== "all" && g.analysis.category !== filterCategory)
            return false;
        if (filterPriority !== "all" && g.analysis.priority !== filterPriority)
            return false;
        if (filterStatus !== "all" && g.status !== filterStatus) return false;
        if (filterLocation) {
            const locationStr =
                `${g.location.city} ${g.location.state}`.toLowerCase();
            if (!locationStr.includes(filterLocation.toLowerCase()))
                return false;
        }
        return true;
    });

    const clearFilters = () => {
        setFilterCategory("all");
        setFilterPriority("all");
        setFilterStatus("all");
        setFilterLocation("");
    };

    const hasActiveFilters =
        filterCategory !== "all" ||
        filterPriority !== "all" ||
        filterStatus !== "all" ||
        filterLocation;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.entries(CATEGORIES).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filterPriority}
                    onValueChange={setFilterPriority}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Search city/state..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-[180px]"
                />

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
                Showing {filteredGrievances.length} of {grievances.length}{" "}
                grievances
            </p>

            {/* Table */}
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">ID</TableHead>
                            <TableHead className="w-[200px]">Complaint</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Sentiment</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGrievances.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No grievances found matching the filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredGrievances.map((grievance) => {
                                return (
                                    <TableRow
                                        key={grievance.id}
                                        className="animate-fade-in"
                                    >
                                        <TableCell className="font-mono text-sm">
                                            {grievance.id}
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="truncate text-sm font-medium" title={grievance.text}>
                                                {grievance.text}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <CategoryBadge
                                                category={
                                                    grievance.analysis.category
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <PriorityBadge
                                                priority={
                                                    grievance.analysis.priority
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <SentimentBadge
                                                sentiment={
                                                    grievance.analysis.sentiment
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {grievance.location.city},{" "}
                                                    {grievance.location.state}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {grievance.assignedDepartment}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={grievance.status}
                                            />
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(
                                                new Date(grievance.createdAt),
                                                "MMM d, yyyy"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelectedGrievance(
                                                            grievance
                                                        )
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {/* Global Detail Dialog */}
            <Dialog 
                open={selectedGrievance !== null} 
                onOpenChange={(open) => !open && setSelectedGrievance(null)}
            >
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    {selectedGrievance && (
                        <GrievanceDetail
                            grievance={selectedGrievance}
                            onUpdate={() => {
                                onRefresh();
                                setSelectedGrievance(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface GrievanceDetailProps {
    grievance: Grievance;
    onUpdate: () => void;
}

function GrievanceDetail({ grievance, onUpdate }: GrievanceDetailProps) {
    const [status, setStatus] = useState<Status>(grievance.status);
    const [notes, setNotes] = useState(grievance.notes || "");
    const [department, setDepartment] = useState(grievance.assignedDepartment || "");
    const [category, setCategory] = useState<Category>(grievance.analysis.category);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Keep synced when external props change
    // Useful in case it stays open while data trickles down
    useEffect(() => {
        setStatus(grievance.status);
        setNotes(grievance.notes || "");
        setDepartment(grievance.assignedDepartment || "");
        setCategory(grievance.analysis.category);
    }, [grievance]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateGrievanceStatus(grievance.id, status, notes, department, category);
            toast({
                title: "Grievance Updated",
                description: `Status changed to ${status.replace("_", " ")}`,
            });
            onUpdate();
        } catch (error) {
            console.error("Failed to update grievance:", error);
            toast({
                title: "Error",
                description: "Failed to update grievance. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                    <span className="font-mono">{grievance.id}</span>
                    <PriorityBadge priority={grievance.analysis.priority} />
                    <StatusBadge status={grievance.status} />
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
                {/* Grievance Text */}
                <div className="space-y-2">
                    <Label>Grievance Description</Label>
                    <div className="p-4 bg-muted rounded-lg text-sm">
                        {grievance.text}
                    </div>
                </div>

                {/* Attached Image */}
                {grievance.image && (
                    <div className="space-y-2">
                        <Label>Attached Image</Label>
                        <div className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center p-2">
                            <img src={grievance.image} alt="Attachment" className="max-h-64 object-contain rounded" />
                        </div>
                    </div>
                )}

                {/* AI Analysis */}
                <div className="space-y-2">
                    <Label>AI Analysis</Label>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-accent/50 rounded-lg">
                        <div>
                            <span className="text-xs text-muted-foreground">
                                Category
                            </span>
                            <p className="font-medium">
                                {CATEGORIES[grievance.analysis.category].label}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground">
                                Confidence
                            </span>
                            <p className="font-medium">
                                {Math.round(
                                    grievance.analysis.confidence * 100
                                )}
                                %
                            </p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                                Sentiment
                            </span>

                            <div className="inline-flex">
                                <SentimentBadge
                                    sentiment={grievance.analysis.sentiment}
                                />
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-muted-foreground">
                                Keywords
                            </span>
                            <p className="text-sm">
                                {grievance.analysis.keywords.join(", ") ||
                                    "None detected"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Category & Department Reassignment */}
                <div className="space-y-2">
                    <Label>Assign Category & Department</Label>
                    <Select
                        value={category}
                        onValueChange={(val: Category) => {
                            setCategory(val);
                            const dict: Record<string, string> = {
                                healthcare: "Health Department",
                                roads: "Public Works Department",
                                education: "Education Department",
                                public_transport: "Transport Authority",
                                sanitation: "Municipal Corporation",
                                water_supply: "Water Supply Board",
                                corruption: "Anti-Corruption Bureau",
                                electricity: "Electricity Board"
                            };
                            setDepartment(dict[val] || "General Administration");
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="healthcare">Health Department (Healthcare)</SelectItem>
                            <SelectItem value="roads">Public Works Department (Roads)</SelectItem>
                            <SelectItem value="education">Education Department (Education)</SelectItem>
                            <SelectItem value="public_transport">Transport Authority (Transport)</SelectItem>
                            <SelectItem value="sanitation">Municipal Corporation (Sanitation)</SelectItem>
                            <SelectItem value="water_supply">Water Supply Board (Water)</SelectItem>
                            <SelectItem value="corruption">Anti-Corruption Bureau (Corruption)</SelectItem>
                            <SelectItem value="electricity">Electricity Board (Electricity)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-medium">
                                {grievance.location.city},{" "}
                                {grievance.location.state}
                            </p>
                            {grievance.location.landmark && (
                                <p className="text-sm text-muted-foreground">
                                    Near: {grievance.location.landmark}
                                </p>
                            )}
                        </div>
                    </div>
                </div>


                {/* Status Update */}
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Update Status</Label>
                        <Select
                            value={status}
                            onValueChange={(v) => setStatus(v as Status)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">
                                    In Progress
                                </SelectItem>
                                <SelectItem value="resolved">
                                    Resolved
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this grievance..."
                            rows={3}
                        />
                    </div>

                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                {/* Metadata */}
                <div className="flex gap-4 text-xs text-muted-foreground pt-4 border-t">
                    <span>
                        Created: {grievance.createdAt ? format(new Date(grievance.createdAt), "PPp") : "Unknown"}
                    </span>
                    <span>
                        Updated: {grievance.updatedAt ? format(new Date(grievance.updatedAt), "PPp") : (grievance.createdAt ? format(new Date(grievance.createdAt), "PPp") : "Unknown")}
                    </span>
                </div>
            </div>
        </>
    );
}
