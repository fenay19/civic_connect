import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllGrievances } from '@/lib/grievanceStore';
import { Grievance } from '@/types/grievance';
import { Shield, Plus, ArrowLeft, Clock, CheckCircle, LogOut } from 'lucide-react';
import { CategoryBadge, PriorityBadge, SentimentBadge } from '@/components/StatusBadges';

const UserDashboard = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const data = await getAllGrievances();
        // Sort by newest first
        setGrievances(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error('Failed to fetch grievances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrievances();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved': return 'Resolved';
      case 'in_progress': return 'In Progress';
      default: return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="mr-2 hidden md:flex">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-lg gradient-govt flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Grievance Portal</h1>
              <p className="text-xs text-muted-foreground">Citizen Connect</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => {
              localStorage.removeItem('user_id');
              window.location.href = '/';
            }}>
              <LogOut className="h-4 w-4 mr-2 hidden sm:inline-block" />
              <span className="hidden sm:inline-block">Logout</span>
              <LogOut className="h-5 w-5 sm:hidden" />
            </Button>
            <Button asChild>
              <Link to="/submit">
                <Plus className="h-4 w-4 mr-2 hidden sm:inline-block" />
                <span className="hidden sm:inline-block">New</span>
                <span className="inline-block sm:hidden">New</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">My Grievances</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : grievances.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No grievances found</h3>
              <p className="text-muted-foreground mb-6">You haven't submitted any grievances yet.</p>
              <Button asChild>
                <Link to="/submit">Submit Your First Grievance</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grievances.map((grievance) => (
              <Card key={grievance.id} className="flex flex-col">
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-muted-foreground">ID: {grievance.id}</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {getStatusIcon(grievance.status)}
                      <span>{getStatusText(grievance.status)}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{grievance.text}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-4">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Department</span>
                      <p className="text-sm font-medium">{grievance.assignedDepartment}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CategoryBadge category={grievance.analysis.category} language="en" />
                      <PriorityBadge priority={grievance.analysis.priority} />
                      <SentimentBadge sentiment={grievance.analysis.sentiment} />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between items-center pt-4 border-t mt-auto">
                    <span>{new Date(grievance.createdAt).toLocaleDateString()}</span>
                    <span>{grievance.location.city}, {grievance.location.state}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
