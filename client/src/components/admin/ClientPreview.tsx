import { useEffect, useState } from "react";
import { Edit, ExternalLink, Mail, Phone, MapPin, Save, X, Trash2, AlertCircle, Building2, Tag, Globe } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useLocation } from "wouter";
import { getApiBaseUrl } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface ClientPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  onClientUpdated?: () => void;
  onClientDeleted?: () => void;
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

export default function ClientPreview({ open, onOpenChange, clientId, onClientUpdated, onClientDeleted }: ClientPreviewProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (open && clientId) {
      fetchClientData();
    }
  }, [open, clientId]);

  const fetchClientData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setClient(data.client);
        setEditedClient(data.client);
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedClient(client);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedClient) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients/${clientId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedClient),
      });

      const data = await response.json();
      if (data.success) {
        setClient(data.client);
        setEditedClient(data.client);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Client updated successfully",
        });
        onClientUpdated?.();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Client deleted successfully",
        });
        onOpenChange(false);
        onClientDeleted?.();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: keyof Client, value: any) => {
    if (editedClient) {
      setEditedClient({ ...editedClient, [field]: value });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "lead":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "prospect":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "inactive":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "churned":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "proposal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const displayClient = isEditing ? editedClient : client;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">{isEditing ? "Edit Contact" : "Contact Details"}</SheetTitle>
              {!isEditing && client && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {client && (
              <SheetDescription className="text-sm text-muted-foreground">
                {isEditing
                  ? "Update contact information below"
                  : `Contact ID: ${client.id} • Created: ${new Date(client.createdAt).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} • Updated: ${new Date(client.updatedAt).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
              </SheetDescription>
            )}
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : displayClient ? (
            <div className="space-y-6 pt-6">
              {/* Header with name and status */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-bold">{client.name}</h2>
                    {client.contactName && <p className="text-sm text-muted-foreground">Contact: {client.contactName}</p>}
                  </div>
                  <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                </div>
                {client.industry && <p className="text-sm text-muted-foreground">{client.industry}</p>}
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
                            {project.progress !== undefined && <span className="text-xs text-muted-foreground">{project.progress}%</span>}
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
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Timestamps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(client.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(client.updatedAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

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
            <div className="flex items-center justify-center py-8 text-muted-foreground">Client not found</div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
