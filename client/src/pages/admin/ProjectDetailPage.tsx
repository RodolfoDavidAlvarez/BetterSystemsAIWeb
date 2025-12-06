import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useToast } from '../../hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import {
  ArrowLeft,
  Plus,
  Send,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  MessageSquare,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { getApiBaseUrl } from '../../lib/queryClient';

interface ProjectUpdate {
  id: number;
  title: string;
  content: string;
  updateType: string;
  isInternal: boolean;
  sentToClient: boolean;
  sentAt: string | null;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  progress: number;
  budgetType: string | null;
  budgetAmount: string | null;
  hourlyRate: string | null;
  totalBilled: string | null;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  notes: string | null;
  client: {
    name: string;
    email: string;
    phone: string | null;
  };
}

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  updateType: z.string().default('progress'),
  isInternal: z.boolean().default(false),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

const statusColors: Record<string, string> = {
  pending: 'bg-gray-500',
  proposal: 'bg-blue-500',
  active: 'bg-green-500',
  'on-hold': 'bg-yellow-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-red-500'
};

const updateTypeColors: Record<string, string> = {
  progress: 'bg-blue-500',
  milestone: 'bg-green-500',
  blocker: 'bg-red-500',
  deliverable: 'bg-yellow-500',
  general: 'bg-gray-500'
};

export default function ProjectDetailPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const params = useParams();
  const projectId = params.id;
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingUpdate, setSendingUpdate] = useState<number | null>(null);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      title: '',
      content: '',
      updateType: 'progress',
      isInternal: false,
    },
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setProject(data.project);
        setUpdates(data.updates || []);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({ title: 'Error', description: 'Failed to load project', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitUpdate = async (values: UpdateFormValues) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/projects/${projectId}/updates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Update created successfully' });
        form.reset();
        setIsDialogOpen(false);
        fetchProject();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create update', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const sendUpdateToClient = async (updateId: number) => {
    setSendingUpdate(updateId);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/updates/${updateId}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Update sent to client!' });
        fetchProject();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send update', variant: 'destructive' });
    } finally {
      setSendingUpdate(null);
    }
  };

  const deleteUpdate = async (updateId: number) => {
    if (!confirm('Are you sure you want to delete this update?')) return;

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/updates/${updateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Update deleted' });
        fetchProject();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete update', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-10">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/projects')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <Badge className={`${statusColors[project.status]} text-white`}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {project.type} • {project.client.name}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate(`/admin/projects/${projectId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Updates */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Updates</CardTitle>
                  <CardDescription>Communication and status updates</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create Project Update</DialogTitle>
                      <DialogDescription>
                        Add a new update for this project. You can send it to the client later.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitUpdate)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Update title..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe the update..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="updateType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="progress">Progress</SelectItem>
                                    <SelectItem value="milestone">Milestone</SelectItem>
                                    <SelectItem value="blocker">Blocker</SelectItem>
                                    <SelectItem value="deliverable">Deliverable</SelectItem>
                                    <SelectItem value="general">General</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="isInternal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Visibility</FormLabel>
                                <Select
                                  onValueChange={(v) => field.onChange(v === 'true')}
                                  defaultValue={field.value ? 'true' : 'false'}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="false">Client Visible</SelectItem>
                                    <SelectItem value="true">Internal Only</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Create Update'
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {updates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No updates yet</p>
                    <p className="text-sm">Add your first project update</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updates.map((update) => (
                      <div key={update.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={`${updateTypeColors[update.updateType]} text-white`}>
                              {update.updateType}
                            </Badge>
                            {update.isInternal && (
                              <Badge variant="outline">Internal</Badge>
                            )}
                            {update.sentToClient && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Sent
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!update.sentToClient && !update.isInternal && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendUpdateToClient(update.id)}
                                disabled={sendingUpdate === update.id}
                              >
                                {sendingUpdate === update.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-1" />
                                    Send
                                  </>
                                )}
                              </Button>
                            )}
                            {!update.sentToClient && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteUpdate(update.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <h4 className="font-semibold mt-2">{update.title}</h4>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {update.content}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(update.createdAt)}
                          </span>
                          {update.sentAt && (
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />
                              Sent {formatDateTime(update.sentAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="font-medium">{project.client.name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {project.client.email}
                </div>
                {project.client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {project.client.phone}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{project.type}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <Badge variant="outline">{project.priority}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Budget
                  </span>
                  <span className="font-medium">{formatCurrency(project.budgetAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </span>
                  <span className="font-medium">{formatDate(project.startDate)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </span>
                  <span className="font-medium">{formatDate(project.dueDate)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {project.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {project.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
