import { useState, useEffect } from 'react';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getApiBaseUrl } from '../../lib/queryClient';

interface OutstandingTask {
  id?: number;
  task: string;
  status: 'NOT DONE' | 'DONE' | 'IN PROGRESS';
  priority: 'Fix' | 'Quick win' | 'Revenue';
  clientName: string;
}

export default function DashboardPage() {
  useScrollToTop();
  const { toast } = useToast();
  const [activeClient, setActiveClient] = useState<string>('Desert Moon Lighting');
  const [tasksByClient, setTasksByClient] = useState<Record<string, OutstandingTask[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Fix':
        return <Badge variant="destructive">Fix</Badge>;
      case 'Quick win':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Quick win</Badge>;
      case 'Revenue':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Revenue</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'IN PROGRESS':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'NOT DONE':
        return <XCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Fetch tasks from API
  useEffect(() => {
    fetchClientTasks();
  }, []);

  const fetchClientTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/client-tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setTasksByClient(data.tasksByClient || {});
        
        // Initialize with default tasks if database is empty
        if (Object.keys(data.tasksByClient || {}).length === 0) {
          await initializeDefaultTasks();
        }
      }
    } catch (error) {
      console.error('Error fetching client tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultTasks = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const defaultTasks = [
        { clientName: 'Desert Moon Lighting', task: 'SMS Notification for E-signature', priority: 'Quick win', status: 'NOT DONE' },
        { clientName: 'Desert Moon Lighting', task: 'Finalize payment collection system', priority: 'Revenue', status: 'NOT DONE' },
      ];

      for (const task of defaultTasks) {
        await fetch(`${baseUrl}/admin/client-tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        });
      }

      // Reload tasks
      await fetchClientTasks();
    } catch (error) {
      console.error('Error initializing default tasks:', error);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: 'NOT DONE' | 'DONE' | 'IN PROGRESS') => {
    try {
      setUpdatingTaskId(taskId);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/client-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Task status updated',
        });
        // Refresh tasks
        await fetchClientTasks();
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const clients = Object.keys(tasksByClient).length > 0 ? Object.keys(tasksByClient) : ['Desert Moon Lighting', 'Agave Fleet'];
  const currentTasks = tasksByClient[activeClient] || [];

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* To-Do Section - Client Work */}
        <Card>
          <CardHeader>
            <CardTitle>To-Do</CardTitle>
            <CardDescription>
              Outstanding work that needs to be completed for each client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeClient} onValueChange={setActiveClient}>
              <TabsList className="mb-4">
                {clients.map((client) => (
                  <TabsTrigger key={client} value={client}>
                    {client}
                  </TabsTrigger>
                ))}
              </TabsList>

              {clients.map((client) => (
                <TabsContent key={client} value={client}>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Loading tasks...</p>
                    </div>
                  ) : currentTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No outstanding tasks for {client}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentTasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.task}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(task.status)}
                                <span className={task.status === 'NOT DONE' ? 'text-amber-600 font-medium' : ''}>
                                  {task.status}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                            <TableCell className="text-right">
                              <Select
                                value={task.status}
                                onValueChange={(value) => task.id && updateTaskStatus(task.id, value as 'NOT DONE' | 'DONE' | 'IN PROGRESS')}
                                disabled={updatingTaskId === task.id}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NOT DONE">NOT DONE</SelectItem>
                                  <SelectItem value="IN PROGRESS">IN PROGRESS</SelectItem>
                                  <SelectItem value="DONE">DONE</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
