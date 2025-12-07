import { useEffect, useState } from 'react';
import { X, Edit, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { useLocation } from 'wouter';
import { getApiBaseUrl } from '../../lib/queryClient';

interface ClientPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  onEdit?: () => void;
}

interface Client {
  id: number;
  name: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  notes: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  budgetAmount: string | null;
}

export default function ClientPreview({ open, onOpenChange, clientId, onEdit }: ClientPreviewProps) {
  const [_, navigate] = useLocation();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && clientId) {
      fetchClientData();
    }
  }, [open, clientId]);

  const fetchClientData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setClient(data.client);
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'lead':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'prospect':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'churned':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'proposal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Client Details</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : client ? (
          <div className="space-y-6 pt-6">
            {/* Header with name and status */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold">{client.name}</h2>
                  {client.contactName && (
                    <p className="text-sm text-muted-foreground">Contact: {client.contactName}</p>
                  )}
                </div>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
              {client.industry && (
                <p className="text-sm text-muted-foreground">{client.industry}</p>
              )}
            </div>

            <Separator />

            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline break-all">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${client.phone}`} className="text-sm text-primary hover:underline">
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                      {client.website}
                    </a>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      {client.address}
                      {client.city && `, ${client.city}`}
                      {client.state && ` ${client.state}`}
                      {client.zipCode && ` ${client.zipCode}`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Projects */}
            {projects.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Projects ({projects.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        navigate(`/admin/projects/${project.id}`);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`text-xs ${getProjectStatusColor(project.status)}`}>
                            {project.status}
                          </Badge>
                          {project.progress !== undefined && (
                            <span className="text-xs text-muted-foreground">{project.progress}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {client.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  navigate(`/admin/clients/${clientId}/edit`);
                  onOpenChange(false);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Client
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigate(`/admin/clients/${clientId}`);
                  onOpenChange(false);
                }}
              >
                View Full
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Client not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
