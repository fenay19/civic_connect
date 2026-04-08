import { useState, useEffect } from 'react';
import { getAnalytics } from '@/lib/grievanceStore';
import { CATEGORIES } from '@/types/grievance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, AlertTriangle, Clock, CheckCircle, TrendingUp, MapPin } from 'lucide-react';

const CHART_COLORS = [
  'hsl(213, 55%, 35%)',
  'hsl(180, 60%, 45%)',
  'hsl(280, 60%, 55%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(142, 71%, 45%)',
  'hsl(200, 60%, 50%)',
  'hsl(320, 60%, 50%)',
  'hsl(60, 70%, 45%)',
];

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState({
    total: 0,
    highPriority: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    byCategory: {},
    byPriority: { high: 0, medium: 0, low: 0 },
    byCity: {},
    topCities: [],
    resolutionRate: 0,
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };
    loadAnalytics();
  }, []);

  // Prepare category data for pie chart
  const categoryData = Object.entries(analytics.byCategory).map(([key, value]) => ({
    name: CATEGORIES[key as keyof typeof CATEGORIES]?.label || key,
    value,
  }));

  // Prepare priority data for bar chart
  const priorityData = [
    { name: 'High', value: analytics.byPriority.high, fill: 'hsl(0, 72%, 51%)' },
    { name: 'Medium', value: analytics.byPriority.medium, fill: 'hsl(38, 92%, 50%)' },
    { name: 'Low', value: analytics.byPriority.low, fill: 'hsl(142, 71%, 45%)' },
  ];

  // Prepare city data for bar chart
  const cityData = analytics.topCities.map(({ city, count }) => ({
    name: city,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Grievances</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time submissions</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
            <AlertTriangle className="h-5 w-5 text-status-high" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-high">{analytics.highPriority}</div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-5 w-5 text-status-pending" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
            <CheckCircle className="h-5 w-5 text-status-resolved" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-resolved">{analytics.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{analytics.resolved} resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Grievances by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* City-wise Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Top Affected Cities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }} 
                />
                <Bar dataKey="count" fill="hsl(213, 55%, 35%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
