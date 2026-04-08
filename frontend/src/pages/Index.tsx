import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Brain, 
  MapPin, 
  Shield, 
  Clock, 
  BarChart3, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      titleHi: 'AI-संचालित विश्लेषण',
      description: 'Automatic categorization, priority detection, and sentiment analysis',
      descriptionHi: 'स्वचालित वर्गीकरण, प्राथमिकता पहचान और भावना विश्लेषण',
    },
    {
      icon: MapPin,
      title: 'Location-Aware',
      titleHi: 'स्थान-जागरूक',
      description: 'Geo-tagged complaints for better local governance',
      descriptionHi: 'बेहतर स्थानीय शासन के लिए जियो-टैग्ड शिकायतें',
    },
    {
      icon: Shield,
      title: 'Transparent Process',
      titleHi: 'पारदर्शी प्रक्रिया',
      description: 'Track your complaint status from submission to resolution',
      descriptionHi: 'सबमिशन से समाधान तक अपनी शिकायत की स्थिति ट्रैक करें',
    },
    {
      icon: Clock,
      title: 'Priority-Based Resolution',
      titleHi: 'प्राथमिकता-आधारित समाधान',
      description: 'Urgent issues are automatically prioritized for faster action',
      descriptionHi: 'तत्काल मुद्दों को तेज़ कार्रवाई के लिए स्वचालित रूप से प्राथमिकता दी जाती है',
    },
  ];

  // const stats = [
  //   { value: '10K+', label: 'Grievances Resolved', labelHi: 'शिकायतें समाधान' },
  //   { value: '95%', label: 'Satisfaction Rate', labelHi: 'संतुष्टि दर' },
  //   { value: '48hrs', label: 'Avg. Response Time', labelHi: 'औसत प्रतिक्रिया समय' },
  //   { value: '28', label: 'States Covered', labelHi: 'राज्य कवर' },
  // ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-govt flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Grievance Portal</h1>
              {/* <p className="text-xs text-muted-foreground">Government of India</p> */}
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Submit Grievance
            </Link>
            <Link to="/admin/login" className="text-sm font-medium hover:text-primary transition-colors">
              Admin Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-govt text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              AI-Driven Grievance Redressal for Faster & Transparent Governance
            </h2>
            <p className="text-xl opacity-90 mb-4">
              तेज़ और पारदर्शी शासन के लिए AI-संचालित शिकायत निवारण
            </p>
            <p className="text-lg opacity-80 mb-8">
              Submit your concerns in English or Hindi. Our AI-powered system ensures 
              faster resolution through intelligent categorization and priority assignment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 py-6"
                asChild
              >
                <Link to="/login">
                  Submit a Grievance
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link to="/admin/login">
                  <Users className="mr-2 h-5 w-5" />
                  Admin Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section
      <section className="py-12 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">How It Works</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered system streamlines the grievance redressal process, 
              ensuring your concerns reach the right department with the right priority.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Simple 3-Step Process</h3>
            <p className="text-muted-foreground">सरल 3-चरणीय प्रक्रिया</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  step: '1', 
                  title: 'Submit Your Grievance',
                  titleHi: 'अपनी शिकायत दर्ज करें',
                  description: 'Describe your issue in English or Hindi with your location',
                },
                { 
                  step: '2', 
                  title: 'AI Analysis',
                  titleHi: 'AI विश्लेषण',
                  description: 'Our AI categorizes, prioritizes, and routes to the right department',
                },
                { 
                  step: '3', 
                  title: 'Track & Resolve',
                  titleHi: 'ट्रैक करें और समाधान पाएं',
                  description: 'Get updates as your grievance moves towards resolution',
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full gradient-govt text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                    <p className="text-sm text-primary mb-2">{item.titleHi}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-25">
        <div className="container mx-auto px-4">
          <Card className="gradient-govt text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to Submit Your Grievance?
                </h3>
                <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                  Your voice matters. Help us improve governance by reporting issues in your area.
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="text-lg px-8"
                  asChild
                >
                  <Link to="/login">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
