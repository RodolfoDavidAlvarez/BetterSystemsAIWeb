import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../../hooks/use-toast';
import { usePersistedState } from '../../hooks/usePersistedState';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  User,
  X,
  MoreHorizontal,
  Globe,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Users,
  UserCheck,
  Store,
  Ban,
  Sparkles,
} from 'lucide-react';
import { getApiBaseUrl } from '../../lib/queryClient';
import { cn } from '../../lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface Client {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  contactName: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  status: string;
  source: string | null;
  label: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  notes: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  deal?: {
    id: number;
    name: string;
    stage: string;
    value: string;
  } | null;
}

interface EmailLog {
  id: number;
  from: string;
  to: string[];
  subject: string;
  category: string;
  status: string;
  sentAt: string | null;
}

// Clean, professional color palette with proper contrast
const labelConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: typeof User; label: string }> = {
  client: {
    color: 'text-emerald-900 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    icon: UserCheck,
    label: 'Client'
  },
  contact: {
    color: 'text-slate-700 dark:text-slate-200',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-600',
    icon: User,
    label: 'Contact'
  },
  vendor: {
    color: 'text-blue-900 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    icon: Store,
    label: 'Vendor'
  },
  spam: {
    color: 'text-orange-900 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    icon: Ban,
    label: 'Spam'
  },
  hidden: {
    color: 'text-zinc-700 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
    borderColor: 'border-zinc-300 dark:border-zinc-600',
    icon: EyeOff,
    label: 'Hidden'
  },
};

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  lead: { color: 'text-slate-700 dark:text-slate-200', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  prospect: { color: 'text-blue-900 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/40' },
  active: { color: 'text-emerald-900 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' },
  inactive: { color: 'text-amber-900 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-900/40' },
  churned: { color: 'text-rose-900 dark:text-rose-300', bgColor: 'bg-rose-100 dark:bg-rose-900/40' },
};

export default function ClientsPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [labelFilter, setLabelFilter] = usePersistedState('admin:clients:labelFilter', 'all');
  const [showHidden, setShowHidden] = usePersistedState('admin:clients:showHidden', false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientEmails, setClientEmails] = useState<EmailLog[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  const baseUrl = getApiBaseUrl();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      window.history.replaceState({}, '', '/admin/clients');
      setSearch(emailParam);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [labelFilter, showHidden]);

  useEffect(() => {
    if (clients.length > 0 && search && !selectedClient) {
      const matchingClient = clients.find(c =>
        c.email.toLowerCase() === search.toLowerCase() ||
        c.email.toLowerCase().includes(search.toLowerCase())
      );
      if (matchingClient) {
        setSelectedClient(matchingClient);
      }
    }
  }, [clients, search]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientDetails(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '200');
      if (labelFilter !== 'all') params.append('label', labelFilter);
      params.append('hideHidden', showHidden ? 'false' : 'true');

      const response = await fetch(`${baseUrl}/admin/clients?${params}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDetails = async (id: number) => {
    setIsLoadingEmails(true);
    try {
      const response = await fetch(`${baseUrl}/admin/clients/${id}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setClientEmails(data.emails || []);
        setSelectedClient(data.client);
        setEditForm(data.client);
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleUpdateLabel = async (clientId: number, newLabel: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(`${baseUrl}/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ label: newLabel })
      });

      const data = await response.json();
      if (data.success) {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, label: newLabel } : c));
        if (selectedClient?.id === clientId) {
          setSelectedClient({ ...selectedClient, label: newLabel });
        }
        toast({ title: 'Updated', description: `Label changed to ${labelConfig[newLabel]?.label || newLabel}` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update label', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`${baseUrl}/admin/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Saved', description: 'Contact updated successfully' });
        setIsEditing(false);
        fetchClients();
        setSelectedClient(data.client);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update contact', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`${baseUrl}/admin/clients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Deleted', description: 'Contact deleted successfully' });
        if (selectedClient?.id === id) setSelectedClient(null);
        fetchClients();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete contact', variant: 'destructive' });
    }
  };

  const filteredClients = clients.filter(client => {
    const searchMatch = !search ||
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      (client.firstName?.toLowerCase().includes(search.toLowerCase())) ||
      (client.lastName?.toLowerCase().includes(search.toLowerCase())) ||
      (client.contactName?.toLowerCase().includes(search.toLowerCase()));

    // For 'all' filter, show only contacts and clients (exclude vendors)
    let labelMatch;
    if (labelFilter === 'all') {
      const clientLabel = client.label || 'contact';
      labelMatch = clientLabel === 'contact' || clientLabel === 'client';
    } else {
      labelMatch = (client.label || 'contact') === labelFilter;
    }

    return searchMatch && labelMatch;
  });

  const getDisplayName = (client: Client) => {
    if (client.firstName || client.lastName) {
      return `${client.firstName || ''} ${client.lastName || ''}`.trim();
    }
    return client.name || client.contactName || client.email.split('@')[0];
  };

  const getInitials = (client: Client) => {
    const name = getDisplayName(client);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (email: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-violet-500 to-violet-600',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
      'from-cyan-500 to-cyan-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
    ];
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const isNewContact = (createdAt: string) => {
    const created = new Date(createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return created > thirtyDaysAgo;
  };

  const labelCounts = clients.reduce((acc, c) => {
    const label = c.label || 'contact';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const newCount = clients.filter(c => isNewContact(c.createdAt)).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel - Contact List */}
      <div className={cn(
        "flex flex-col border-r border-border/60 transition-all duration-300 ease-in-out",
        selectedClient ? "w-[55%]" : "w-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-5">
            <h1 className="text-xl font-semibold tracking-tight">Contacts</h1>
            <div className="flex items-center gap-2 text-[13px]">
              {newCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                  <Sparkles className="h-3 w-3" />
                  {newCount} new
                </div>
              )}
              <span className="text-muted-foreground">{labelCounts.client || 0} clients</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-muted-foreground">{labelCounts.contact || 0} contacts</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-muted-foreground">{labelCounts.vendor || 0} vendors</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 text-[13px] font-normal",
                showHidden && "bg-muted"
              )}
              onClick={() => setShowHidden(!showHidden)}
            >
              {showHidden ? <Eye className="h-3.5 w-3.5 mr-1.5" /> : <EyeOff className="h-3.5 w-3.5 mr-1.5" />}
              {showHidden ? 'Showing hidden' : 'Hidden'}
              {labelCounts.hidden ? ` (${labelCounts.hidden})` : ''}
            </Button>
            <Button size="sm" className="h-8 text-[13px] font-medium shadow-sm" onClick={() => navigate('/admin/clients/new')}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60 bg-muted/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex items-center">
            {['all', 'client', 'contact', 'vendor'].map((label, idx) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 text-[13px] font-normal rounded-none border-b-2 border-transparent",
                  labelFilter === label
                    ? "border-b-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  idx === 0 && "rounded-l-md",
                  idx === 3 && "rounded-r-md"
                )}
                onClick={() => setLabelFilter(label)}
              >
                {label === 'all' ? 'All Contacts' : labelConfig[label]?.label}
                <span className={cn(
                  "ml-1.5 text-[11px]",
                  labelFilter === label ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  {label === 'all' ? filteredClients.length : labelCounts[label] || 0}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_1.5fr_120px_80px_70px] gap-4 px-5 py-2.5 border-b border-border/40 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
          <div className="w-10"></div>
          <div>Name</div>
          <div>Email</div>
          <div>Label</div>
          <div>Status</div>
          <div></div>
        </div>

        {/* Contact List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/50" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">No contacts found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                const label = client.label || 'contact';
                const LabelIcon = labelConfig[label]?.icon || User;
                const status = client.status || 'lead';
                const isNew = isNewContact(client.createdAt);

                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={cn(
                      "grid grid-cols-[auto_1fr_1.5fr_120px_80px_70px] gap-4 px-5 py-3 cursor-pointer transition-all duration-150 items-center group",
                      isSelected
                        ? "bg-accent/80"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-medium shadow-sm",
                      getAvatarColor(client.email)
                    )}>
                      {getInitials(client)}
                    </div>

                    {/* Name */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[14px] truncate">{getDisplayName(client)}</span>
                        {isNew && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 uppercase tracking-wide border border-amber-300 dark:border-amber-700">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {client.phone && (
                          <div className="text-[12px] text-muted-foreground/70 truncate">{client.phone}</div>
                        )}
                        {client.deal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/deals/${client.deal.id}`);
                            }}
                            className="text-[11px] text-primary hover:text-primary/80 hover:underline truncate"
                          >
                            {client.deal.name}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="text-[13px] text-muted-foreground truncate">
                      {client.email}
                    </div>

                    {/* Label */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={label}
                        onValueChange={(value) => handleUpdateLabel(client.id, value)}
                      >
                        <SelectTrigger className={cn(
                          "h-7 text-[12px] border w-[110px] font-medium",
                          labelConfig[label]?.bgColor,
                          labelConfig[label]?.borderColor,
                          labelConfig[label]?.color
                        )}>
                          <div className="flex items-center gap-1.5">
                            <LabelIcon className="h-3 w-3" />
                            <span>{labelConfig[label]?.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(labelConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-3.5 w-3.5" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={cn(
                        "text-[11px] px-2 py-1 rounded font-medium",
                        statusConfig[status]?.bgColor,
                        statusConfig[status]?.color
                      )}>
                        {status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${client.email}`;
                        }}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}/edit`)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(client.id, getDisplayName(client));
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-border/60 text-[12px] text-muted-foreground/70">
          {filteredClients.length} of {clients.length} contacts
        </div>
      </div>

      {/* Right Panel - Contact Detail */}
      {selectedClient && (
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          {/* Detail Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-background">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[13px] font-normal text-muted-foreground hover:text-foreground"
              onClick={() => { setSelectedClient(null); setIsEditing(false); }}
            >
              <X className="h-4 w-4 mr-1.5" />
              Close
            </Button>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" className="h-8 text-[13px]" onClick={() => { setIsEditing(false); setEditForm(selectedClient); }}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-8 text-[13px] shadow-sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => navigate(`/admin/clients/${selectedClient.id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Full edit page
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(selectedClient.id, getDisplayName(selectedClient))}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {/* Contact Detail Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Contact Header */}
              <div className="flex items-start gap-5 mb-8">
                <div className={cn(
                  "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-2xl font-semibold shadow-lg",
                  getAvatarColor(selectedClient.email)
                )}>
                  {getInitials(selectedClient)}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Input
                        placeholder="First name"
                        value={editForm.firstName || ''}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="h-10"
                      />
                      <Input
                        placeholder="Last name"
                        value={editForm.lastName || ''}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  ) : (
                    <h2 className="text-2xl font-semibold tracking-tight mb-2">{getDisplayName(selectedClient)}</h2>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isNewContact(selectedClient.createdAt) && (
                      <span className="px-2 py-1 text-[11px] font-medium rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        New
                      </span>
                    )}
                    <span className={cn(
                      "px-2 py-1 text-[11px] font-medium rounded-md border",
                      labelConfig[selectedClient.label || 'contact']?.bgColor,
                      labelConfig[selectedClient.label || 'contact']?.borderColor,
                      labelConfig[selectedClient.label || 'contact']?.color
                    )}>
                      {labelConfig[selectedClient.label || 'contact']?.label}
                    </span>
                    <span className={cn(
                      "px-2 py-1 text-[11px] font-medium rounded-md",
                      statusConfig[selectedClient.status]?.bgColor,
                      statusConfig[selectedClient.status]?.color
                    )}>
                      {selectedClient.status}
                    </span>
                    <span className="text-[12px] text-muted-foreground/70">
                      Added {formatDistanceToNow(new Date(selectedClient.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-8">
                <div>
                  <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Email</label>
                  {isEditing ? (
                    <Input
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="h-9 mt-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="h-4 w-4 text-muted-foreground/50" />
                      <a href={`mailto:${selectedClient.email}`} className="text-[14px] text-primary hover:underline">
                        {selectedClient.email}
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Phone</label>
                  {isEditing ? (
                    <Input
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Add phone"
                      className="h-9 mt-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4 text-muted-foreground/50" />
                      <span className="text-[14px]">{selectedClient.phone || '—'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Website</label>
                  {isEditing ? (
                    <Input
                      value={editForm.website || ''}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="Add website"
                      className="h-9 mt-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <Globe className="h-4 w-4 text-muted-foreground/50" />
                      {selectedClient.website ? (
                        <a
                          href={selectedClient.website.startsWith('http') ? selectedClient.website : `https://${selectedClient.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[14px] text-primary hover:underline"
                        >
                          {selectedClient.website}
                        </a>
                      ) : (
                        <span className="text-[14px] text-muted-foreground/50">—</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Industry</label>
                  {isEditing ? (
                    <Input
                      value={editForm.industry || ''}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      placeholder="Add industry"
                      className="h-9 mt-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="h-4 w-4 text-muted-foreground/50" />
                      <span className="text-[14px]">{selectedClient.industry || '—'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Change Label */}
              <div className="mb-8">
                <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium block mb-3">Change Label</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(labelConfig).map(([key, config]) => {
                    const isActive = selectedClient.label === key;
                    return (
                      <Button
                        key={key}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 text-[12px]",
                          !isActive && "border",
                          !isActive && config.bgColor,
                          !isActive && config.borderColor,
                          !isActive && config.color
                        )}
                        onClick={() => handleUpdateLabel(selectedClient.id, key)}
                      >
                        <config.icon className="h-3.5 w-3.5 mr-1.5" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Email History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground/50" />
                    Email History
                  </h3>
                  <span className="text-[12px] text-muted-foreground/70">{clientEmails.length} emails</span>
                </div>
                {isLoadingEmails ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/40" />
                  </div>
                ) : clientEmails.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground/70 border border-dashed rounded-lg">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-[13px]">No email history</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden divide-y divide-border/60">
                    {clientEmails.map((email) => (
                      <div
                        key={email.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate('/admin/emails')}
                      >
                        {email.category === 'inbound' ? (
                          <ArrowDownLeft className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="truncate flex-1 text-[13px] font-medium">{email.subject || '(no subject)'}</span>
                        <span className="text-[12px] text-muted-foreground/60 flex-shrink-0">
                          {email.sentAt ? format(new Date(email.sentAt), 'MMM d, yyyy') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
