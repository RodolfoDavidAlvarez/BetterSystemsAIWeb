import { useEffect, useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import {
  Bug,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Filter,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BugReport {
  id: string;
  user_name: string;
  user_email: string;
  title: string;
  description: string;
  screenshot_url?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  application_source: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export default function TicketsPage() {
  useScrollToTop();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<BugReport[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<BugReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Supabase configuration - using Fleet Management System's database
  const SUPABASE_URL = 'https://kxcixjiafdohbpwijfmd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzc3NTAsImV4cCI6MjA3OTcxMzc1MH0.KWXHkYzRWBgbBbKreSGLLVAkfg_LsaaO0_cNI8GzdQs';

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, selectedFilter, selectedStatus]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      // Fetch from Supabase directly
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/bug_reports?select=*&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tickets',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Filter by application
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => t.application_source === selectedFilter);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    setFilteredTickets(filtered);
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/bug_reports?id=eq.${ticketId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            status: newStatus,
            ...(newStatus === 'resolved' || newStatus === 'closed' ? { resolved_at: new Date().toISOString() } : {})
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast({
        title: 'Success',
        description: 'Ticket status updated successfully'
      });

      // Refresh tickets
      await fetchTickets();

      // Update selected ticket if it's the one being updated
      if (selectedTicket?.id === ticketId) {
        const updatedTickets = await response.json();
        setSelectedTicket(updatedTickets[0]);
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesUpdate = async () => {
    if (!selectedTicket) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/bug_reports?id=eq.${selectedTicket.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            admin_notes: adminNotes
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      const updatedTickets = await response.json();

      toast({
        title: 'Success',
        description: 'Notes saved successfully'
      });

      setSelectedTicket(updatedTickets[0]);
      await fetchTickets();
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'resolved':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'closed':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getAppBadgeColor = (app: string) => {
    switch (app) {
      case 'fleet-management':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'crm-proposal':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getAppLabel = (app: string) => {
    switch (app) {
      case 'fleet-management':
        return 'Fleet Management';
      case 'crm-proposal':
        return 'CRM & Proposals';
      default:
        return app;
    }
  };

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    fleetManagement: tickets.filter(t => t.application_source === 'fleet-management').length,
    crmProposal: tickets.filter(t => t.application_source === 'crm-proposal').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bug Report Tickets</h1>
          <p className="text-muted-foreground">
            Manage bug reports from all client applications
          </p>
        </div>
        <Button onClick={fetchTickets} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Mgmt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fleetManagement}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CRM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.crmProposal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Application:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === 'fleet-management' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('fleet-management')}
            >
              Fleet Management
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === 'crm-proposal' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('crm-proposal')}
            >
              CRM
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('pending')}
            >
              Pending
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('in_progress')}
            >
              In Progress
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'resolved' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('resolved')}
            >
              Resolved
            </Button>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="cursor-pointer hover:shadow-lg transition-all border-2"
            onClick={() => {
              setSelectedTicket(ticket);
              setAdminNotes(ticket.admin_notes || '');
            }}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge className={getAppBadgeColor(ticket.application_source)}>
                  {getAppLabel(ticket.application_source)}
                </Badge>
                <Badge className={getStatusColor(ticket.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </Badge>
              </div>
              <CardTitle className="text-base line-clamp-2">{ticket.title}</CardTitle>
              <CardDescription className="line-clamp-2">{ticket.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{ticket.user_name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">No tickets found</p>
            <p className="text-muted-foreground">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setSelectedTicket(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-background shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getAppBadgeColor(selectedTicket.application_source)}>
                      {getAppLabel(selectedTicket.application_source)}
                    </Badge>
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(selectedTicket.status)}
                        {selectedTicket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{selectedTicket.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {/* Reporter Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Reported By</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{selectedTicket.user_name}</p>
                  <a href={`mailto:${selectedTicket.user_email}`} className="text-sm text-primary hover:underline">
                    {selectedTicket.user_email}
                  </a>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                </CardContent>
              </Card>

              {/* Screenshot */}
              {selectedTicket.screenshot_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Screenshot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={selectedTicket.screenshot_url}
                      alt="Bug screenshot"
                      className="w-full rounded-lg border"
                    />
                    <a
                      href={selectedTicket.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Status Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={selectedTicket.status === 'pending' ? 'default' : 'outline'}
                      onClick={() => handleStatusUpdate(selectedTicket.id, 'pending')}
                      disabled={isSaving}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedTicket.status === 'in_progress' ? 'default' : 'outline'}
                      onClick={() => handleStatusUpdate(selectedTicket.id, 'in_progress')}
                      disabled={isSaving}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedTicket.status === 'resolved' ? 'default' : 'outline'}
                      onClick={() => handleStatusUpdate(selectedTicket.id, 'resolved')}
                      disabled={isSaving}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Resolved
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedTicket.status === 'closed' ? 'default' : 'outline'}
                      onClick={() => handleStatusUpdate(selectedTicket.id, 'closed')}
                      disabled={isSaving}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Closed
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Admin Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
                    placeholder="Add internal notes about this ticket..."
                  />
                  <Button onClick={handleNotesUpdate} disabled={isSaving} className="w-full">
                    {isSaving ? 'Saving...' : 'Save Notes'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
