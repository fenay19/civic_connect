import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, generateTelegramToken, checkTelegramToken, TelegramTokenStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, ArrowLeft, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'CitizenConnectBot';

const UserRegister = () => {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Telegram state
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [telegramData, setTelegramData] = useState<TelegramTokenStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Generate link token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setTokenLoading(true);
        const { token } = await generateTelegramToken();
        setLinkToken(token);
      } catch {
        console.error('Failed to generate link token');
      } finally {
        setTokenLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Poll for Telegram connection when token exists
  useEffect(() => {
    if (!linkToken || telegramData?.linked) return;

    pollingRef.current = setInterval(async () => {
      try {
        const status = await checkTelegramToken(linkToken);
        if (status.linked) {
          setTelegramData(status);
          setIsPolling(false);
          if (pollingRef.current) clearInterval(pollingRef.current);

          // Auto-fill name from Telegram if name field is empty
          if (!name && (status.firstName || status.lastName)) {
            setName(`${status.firstName || ''} ${status.lastName || ''}`.trim());
          }
          // Auto-fill identifier with Telegram username
          if (!identifier && status.username) {
            setIdentifier(`@${status.username}`);
          }

          toast({
            title: '✅ Telegram Connected!',
            description: `Welcome, ${status.firstName || 'User'}! Fill in the rest to complete registration.`,
          });
        }
      } catch {
        // Silently retry
      }
    }, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [linkToken, telegramData?.linked, name, identifier, toast]);

  const openTelegramLink = () => {
    if (!linkToken) return;
    const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=register_${linkToken}`;
    window.open(deepLink, '_blank');
    setIsPolling(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !identifier || !password) {
      setError('Please fill in all fields to register.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        name,
        identifier,
        password,
        telegramChatId: telegramData?.chatId || undefined,
        telegramUsername: telegramData?.username || undefined,
      });
      
      localStorage.setItem('user_id', result.userId);

      toast({
        title: 'Registration Successful',
        description: telegramData?.linked
          ? 'Your account is ready with Telegram connected!'
          : 'Welcome! You can connect Telegram later from the dashboard.',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const telegramConnected = telegramData?.linked === true;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="mr-2">
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
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full gradient-govt flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Citizen Registration</CardTitle>
            <CardDescription>
              Connect your Telegram and create an account to submit and track grievances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ====== Telegram Connect Section ====== */}
            <div className="mb-6">
              {!telegramConnected ? (
                <div className="rounded-lg border-2 border-dashed p-4 space-y-3"
                  style={{ borderColor: 'rgba(0,136,204,0.3)', background: 'rgba(0,136,204,0.04)' }}
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
                      <p className="text-sm font-semibold">Connect with Telegram</p>
                      <p className="text-xs text-muted-foreground">Link your account to file complaints via bot & get notifications</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={openTelegramLink}
                    disabled={tokenLoading || !linkToken}
                    className="w-full text-white font-medium"
                    style={{ background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)' }}
                  >
                    {tokenLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    )}
                    Open Telegram to Connect
                    <ExternalLink className="h-3.5 w-3.5 ml-2" />
                  </Button>

                  {isPolling && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Waiting for Telegram connection...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border p-4 flex items-center gap-3"
                  style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                  >
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Telegram Connected
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {telegramData.firstName} {telegramData.lastName}
                      {telegramData.username && ` (@${telegramData.username})`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ====== Registration Form ====== */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Phone Number</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. email@example.com, +91..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserRegister;
