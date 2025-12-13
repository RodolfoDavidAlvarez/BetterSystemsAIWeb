import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  Users,
  FolderOpen,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  Clock,
  Briefcase,
  Target,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Timer
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

// Desert Moon Lighting CRM - Real Project Data
interface DevelopmentItem {
  requestor: string;
  feature: string;
  description: string;
  hours: number;
  cost: number;
  status: 'done' | 'in-progress';
}

interface InvoiceItem {
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending';
}

const desertMoonInvoices: InvoiceItem[] = [
  { date: 'Jun 4, 2025', description: 'Deposit (50%)', amount: 1787.50, status: 'paid' },
  { date: 'Jun 24, 2025', description: 'Invoice QDANPTMD-0001', amount: 2047.25, status: 'paid' },
  { date: 'Nov 11, 2025', description: 'Advancement Invoice', amount: 2000, status: 'pending' },
];

const developmentWork: DevelopmentItem[] = [
  { requestor: 'Vince', feature: 'Multi-Company Logic & Domain Setup', description: 'Desert Moon Lighting vs. Desert Mist Arizona with dynamic content & domains.', hours: 6.0, cost: 390, status: 'done' },
  { requestor: 'Mike', feature: 'Multi-Rep Permissions & Roles', description: 'Admins see all; users limited to their own proposals/records.', hours: 2.0, cost: 130, status: 'done' },
  { requestor: 'Micah', feature: 'Deal Management / Install-Close Workflow', description: 'Timeline, install date picker, completion schedule.', hours: 7.0, cost: 455, status: 'done' },
  { requestor: 'Micah', feature: 'Archive System', description: 'Proposals/contracts move to admin Archive for review before deletion.', hours: 3.5, cost: 227.50, status: 'done' },
  { requestor: 'Mike', feature: 'Branding - White Background', description: 'Unified PDF style, consistent headers/footers for both companies.', hours: 0.5, cost: 32.50, status: 'done' },
  { requestor: 'Vince', feature: 'Remote Signature Link', description: 'Email secure client-sign links; status auto-updates on completion.', hours: 10.0, cost: 650, status: 'done' },
  { requestor: 'Vince', feature: 'Proposal Builder - Inline Price Editing', description: 'Real-time price editing inside builder with safeguards.', hours: 0.5, cost: 32.50, status: 'done' },
  { requestor: 'Vince', feature: 'Auto Address Fill (ZIP, City, State)', description: 'Auto-populate city/state from ZIP entry with validation.', hours: 0.5, cost: 32.50, status: 'done' },
  { requestor: 'Vince', feature: 'Drawing Tools Enhancements', description: 'Clear, Undo/Redo, adjustable line thickness slider.', hours: 0.5, cost: 32.50, status: 'done' },
  { requestor: 'Vince', feature: 'QuickBooks Integration & Payment Collection', description: 'Deposits/final payments reconciliation, webhook mapping & testing.', hours: 8.0, cost: 520, status: 'in-progress' },
  { requestor: '—', feature: 'Technical Support, Implementation & Meetings', description: 'Post-launch support, coordination, and technical working sessions.', hours: 3.0, cost: 195, status: 'done' },
];

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

  // Calculate summary metrics from real data
  const totalPaid = desertMoonInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = desertMoonInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const totalHours = developmentWork.reduce((sum, item) => sum + item.hours, 0);
  const totalDevCost = developmentWork.reduce((sum, item) => sum + item.cost, 0);
  const currentBalance = 5750 + totalDevCost - totalPaid; // Contract + dev work - payments
  const completedFeatures = developmentWork.filter(item => item.status === 'done').length;
  const inProgressFeatures = developmentWork.filter(item => item.status === 'in-progress').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Control Center</h1>
          <p className="text-muted-foreground">
            Desert Moon Lighting CRM - Development & Financial Dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/clients')}>
            <Users className="mr-2 h-4 w-4" />
            View Clients
          </Button>
          <Button onClick={() => navigate('/admin/deals')}>
            <Briefcase className="mr-2 h-4 w-4" />
            View Deals
          </Button>
          <Button variant="outline" onClick={handleSyncStripe} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Stripe'}
          </Button>
        </div>
      </div>

      {/* Key Metrics - Desert Moon Lighting Project */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid to Date</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              Received payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Development Hours</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours.toFixed(1)} hrs
            </div>
            <p className="text-xs text-muted-foreground">
              Oct 7 - Nov 11, 2025
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Features Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedFeatures}
            </div>
            <p className="text-xs text-muted-foreground">
              {inProgressFeatures} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.clients.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.clients.byStatus?.active || 0} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices & Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices & Payments</CardTitle>
          <CardDescription>
            Desert Moon Lighting CRM - Payment history and pending invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {desertMoonInvoices.map((invoice, idx) => (
                <TableRow key={idx}>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell className="font-medium">{invoice.description}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>
                    {invoice.status === 'paid' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">PAID</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 text-amber-800">PENDING</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Development Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Development Progress Breakdown</CardTitle>
          <CardDescription>
            Oct 7 - Nov 11, 2025 • {totalHours.toFixed(1)} hours • {formatCurrency(totalDevCost)} total cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested By</TableHead>
                <TableHead>Feature / Task</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {developmentWork.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.requestor}</TableCell>
                  <TableCell className="font-semibold">{item.feature}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md">{item.description}</TableCell>
                  <TableCell className="text-right font-mono">{item.hours.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(item.cost)}</TableCell>
                  <TableCell>
                    {item.status === 'done' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Done
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
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
