import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrievanceTable } from '@/components/GrievanceTable';
import { GrievanceMap } from '@/components/GrievanceMap';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { getAllGrievances, isAdminLoggedIn, logoutAdmin } from '@/lib/grievanceStore';
import { Grievance } from '@/types/grievance';
import { 
  Shield, 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  LogOut,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [activeTab, setActiveTab] = useState('grievances');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin/login');
      return;
    }
    loadGrievances();
  }, [navigate]);

  const loadGrievances = async () => {
    try {
      const data = await getAllGrievances();
      console.log('Loaded grievances:', data.length);
      if (data.length > 0) {
        console.log('Sample grievance:', {
          id: data[0].id,
          hasImage: !!data[0].image,
          department: data[0].assignedDepartment,
          imageLength: data[0].image ? data[0].image.length : 0
        });
      }
      setGrievances(data);
    } catch (error) {
      console.error('Failed to load grievances:', error);
      toast({
        title: 'Error',
        description: 'Failed to load grievances. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/');
  };

  const handleRefresh = () => {
    loadGrievances();
    toast({
      title: 'Data Refreshed',
      description: 'Grievance data has been updated.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-govt flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Grievance Management System</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="grievances" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Grievances</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map View</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grievances" className="animate-fade-in">
            <GrievanceTable grievances={grievances} onRefresh={loadGrievances} />
          </TabsContent>

          <TabsContent value="map" className="animate-fade-in">
            <GrievanceMap grievances={grievances} />
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
