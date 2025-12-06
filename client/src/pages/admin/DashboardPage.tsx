import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import {
  LogOut,
  Users,
  FolderOpen,
  Bell,
  TrendingUp,
  Home,
  Plus,
  ArrowRight
} from 'lucide-react';
import { getApiBaseUrl } from '../../lib/queryClient';

interface DashboardStats {
  clients: {
    total: number;
    byStatus: Record<string, number>;
  };
  projects: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export default function DashboardPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userData, setUserData] = useState<{
    id: number;
    username: string;
    name: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    // Load user data from localStorage
    const userDataStr = localStorage.getItem('user');

    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUserData(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Fetch dashboard stats
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const [clientsRes, projectsRes] = await Promise.all([
        fetch(`${baseUrl}/admin/clients/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/admin/projects/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const clientsData = await clientsRes.json();
      const projectsData = await projectsRes.json();

      setStats({
        clients: clientsData.stats || { total: 0, byStatus: {} },
        projects: projectsData.stats || { total: 0, byStatus: {} }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {userData?.name || 'Admin'}!
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Back to Site
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.clients.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.clients.byStatus?.active || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.projects.byStatus?.active || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.projects.total || 0} total projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proposals</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.projects.byStatus?.proposal || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.clients.byStatus?.lead || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.clients.byStatus?.prospect || 0} prospects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/clients')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Management
              </CardTitle>
              <CardDescription>
                View and manage all your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {stats?.clients.total || 0} clients in your CRM
                </p>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/projects')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Project Tracking
              </CardTitle>
              <CardDescription>
                Track all your active projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {stats?.projects.byStatus?.active || 0} active projects
                </p>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/clients/new')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Client
              </CardTitle>
              <CardDescription>
                Create a new client record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Start a new client relationship
                </p>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Overview</CardTitle>
            <CardDescription>Current project pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { status: 'pending', label: 'Pending', color: 'bg-gray-500' },
                { status: 'proposal', label: 'Proposal', color: 'bg-blue-500' },
                { status: 'active', label: 'Active', color: 'bg-green-500' },
                { status: 'on-hold', label: 'On Hold', color: 'bg-yellow-500' },
                { status: 'completed', label: 'Completed', color: 'bg-purple-500' },
                { status: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
              ].map(({ status, label, color }) => (
                <div key={status} className="text-center">
                  <div className={`${color} text-white rounded-lg p-3 mb-2`}>
                    <div className="text-2xl font-bold">
                      {stats?.projects.byStatus?.[status] || 0}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
