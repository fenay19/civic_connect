import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllGrievances } from '@/lib/grievanceStore';
import { checkTelegramStatus } from '@/lib/api';
import { Grievance } from '@/types/grievance';
import { Shield, Plus, ArrowLeft, Clock, CheckCircle, LogOut, ExternalLink } from 'lucide-react';
import { CategoryBadge, PriorityBadge, SentimentBadge } from '@/components/StatusBadges';

const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'CitizenConnectBot';

const UserDashboard = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);

  const userId = localStorage.getItem('user_id');

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

  useEffect(() => {
    if (!userId) return;
    checkTelegramStatus(userId)
      .then((status) => setTelegramLinked(status.linked))
      .catch(() => setTelegramLinked(false));
  }, [userId]);

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

  const openTelegramLink = () => {
    const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${userId}`;
    window.open(deepLink, '_blank');
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
            {/* Telegram status badge */}
            {telegramLinked !== null && (
              telegramLinked ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-700 dark:text-green-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Connected
                </div>
              ) : null
            )}

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
        {/* Telegram connect banner */}
        {telegramLinked === false && (
          <div className="mb-6 p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(0,136,204,0.08) 0%, rgba(0,102,170,0.05) 100%)', borderColor: 'rgba(0,136,204,0.2)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #0088cc, #0066aa)' }}
              >
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Connect Telegram for notifications</p>
                <p className="text-xs text-muted-foreground">Get real-time updates and file complaints via bot</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={openTelegramLink}
              className="text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #0088cc, #0066aa)' }}
            >
              Connect
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        )}

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
