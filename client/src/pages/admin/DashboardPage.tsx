import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  FolderOpen,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  Clock
} from 'lucide-react';
import { getApiBaseUrl } from '../../lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  clients: {
    total: number;
    byStatus: Record<string, number>;
  };
  projects: {
    total: number;
    byStatus: Record<string, number>;
  };
  billing?: {
    totalRevenue: number;
    outstandingInvoices: number;
    paidInvoices: number;
  };
}

interface Activity {
  id: number;
  entityType: string;
  entityId: number;
  entityName: string | null;
  action: string;
  details: any;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardStats();
    fetchActivities();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const [clientsRes, projectsRes, billingRes] = await Promise.all([
        fetch(`${baseUrl}/admin/clients/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/admin/projects/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/admin/billing/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const clientsData = await clientsRes.json();
      const projectsData = await projectsRes.json();
      const billingData = await billingRes.json();

      setStats({
        clients: clientsData.stats || { total: 0, byStatus: {} },
        projects: projectsData.stats || { total: 0, byStatus: {} },
        billing: billingData.success ? {
          totalRevenue: billingData.dashboard?.summary?.totalRevenue || 0,
          outstandingInvoices: billingData.dashboard?.summary?.outstandingInvoices || 0,
          paidInvoices: billingData.dashboard?.summary?.paidInvoices || 0,
        } : undefined
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/activity?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleSyncStripe = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/billing/sync/all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sync Complete',
          description: 'Stripe data synchronized successfully',
        });
        // Refresh stats and activities
        fetchDashboardStats();
        fetchActivities();
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing Stripe:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync Stripe data',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case 'client':
        return <Users className="h-4 w-4" />;
      case 'project':
        return <FolderOpen className="h-4 w-4" />;
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'updated':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'deleted':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'status_changed':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Control Center</h1>
          <p className="text-muted-foreground">
            Overview of your business operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/clients/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
          <Button variant="outline" onClick={handleSyncStripe} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Stripe'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.billing?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.clients.byStatus?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.clients.total || 0} total clients
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
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.billing?.outstandingInvoices || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.entityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {activity.entityName || `${activity.entityType} #${activity.entityId}`}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {activity.action.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{activity.userName || 'System'}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
