import { useEffect, useState } from 'react';
import { Edit, ExternalLink, Mail, Phone, MapPin, Save, X, Trash2, AlertCircle, Building2, Tag, Globe } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useLocation } from 'wouter';
import { getApiBaseUrl } from '../../lib/queryClient';
import { useToast } from '../../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

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
  source: string | null;
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
      setIsEditing(false);
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
        setEditedClient(data.client);
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client data',
        variant: 'destructive'
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
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedClient)
      });

      const data = await response.json();
      if (data.success) {
        setClient(data.client);
        setEditedClient(data.client);
        setIsEditing(false);
        toast({
          title: 'Success',
          description: 'Client updated successfully'
        });
        onClientUpdated?.();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update client',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Client deleted successfully'
        });
        onOpenChange(false);
        onClientDeleted?.();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete client',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client',
        variant: 'destructive'
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
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'lead':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'prospect':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
      case 'churned':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
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

  const displayClient = isEditing ? editedClient : client;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">
                {isEditing ? 'Edit Contact' : 'Contact Details'}
              </SheetTitle>
              {!isEditing && client && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {client && (
              <SheetDescription className="text-sm text-muted-foreground">
                {isEditing ? 'Update contact information below' : `Added on ${new Date(client.createdAt).toLocaleDateString()}`}
              </SheetDescription>
            )}
          </SheetHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading contact...</p>
            </div>
          ) : displayClient ? (
            <div className="space-y-6 pb-6">
              {/* Header with name and status */}
              {!isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold tracking-tight">{displayClient.name}</h2>
                      {displayClient.contactName && (
                        <p className="text-base text-muted-foreground mt-1">
                          Contact: {displayClient.contactName}
                        </p>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(displayClient.status)} border text-sm px-3 py-1`}>
                      {displayClient.status}
                    </Badge>
                  </div>
                  {displayClient.industry && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm">{displayClient.industry}</span>
                    </div>
                  )}
                  {displayClient.source && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span className="text-sm">Source: {displayClient.source}</span>
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1 space-y-2">
                        <Label htmlFor="name">Company/Name *</Label>
                        <Input
                          id="name"
                          value={editedClient?.name || ''}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder="Company or person name"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 space-y-2">
                        <Label htmlFor="contactName">Contact Person</Label>
                        <Input
                          id="contactName"
                          value={editedClient?.contactName || ''}
                          onChange={(e) => updateField('contactName', e.target.value)}
                          placeholder="Primary contact"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1 space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={editedClient?.status || 'lead'}
                          onValueChange={(value) => updateField('status', value)}
                        >
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="churned">Churned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 sm:col-span-1 space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={editedClient?.industry || ''}
                          onChange={(e) => updateField('industry', e.target.value)}
                          placeholder="e.g., Solar Energy"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Input
                        id="source"
                        value={editedClient?.source || ''}
                        onChange={(e) => updateField('source', e.target.value)}
                        placeholder="How did you find this contact?"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedClient?.email || ''}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={editedClient?.phone || ''}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={editedClient?.website || ''}
                          onChange={(e) => updateField('website', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {displayClient.email && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
                            <a href={`mailto:${displayClient.email}`} className="text-sm text-primary hover:underline break-all font-medium">
                              {displayClient.email}
                            </a>
                          </div>
                        </div>
                      )}
                      {displayClient.phone && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Phone</p>
                            <a href={`tel:${displayClient.phone}`} className="text-sm text-primary hover:underline font-medium">
                              {displayClient.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {displayClient.website && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Website</p>
                            <a href={displayClient.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate font-medium">
                              {displayClient.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Address (only show if editing or has data) */}
              {(isEditing || displayClient.address || displayClient.city) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            value={editedClient?.address || ''}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="123 Main St"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={editedClient?.city || ''}
                              onChange={(e) => updateField('city', e.target.value)}
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={editedClient?.state || ''}
                              onChange={(e) => updateField('state', e.target.value)}
                              placeholder="State"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">Zip Code</Label>
                            <Input
                              id="zipCode"
                              value={editedClient?.zipCode || ''}
                              onChange={(e) => updateField('zipCode', e.target.value)}
                              placeholder="12345"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={editedClient?.country || 'USA'}
                              onChange={(e) => updateField('country', e.target.value)}
                              placeholder="USA"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm">
                          {displayClient.address && <div>{displayClient.address}</div>}
                          <div>
                            {displayClient.city && `${displayClient.city}`}
                            {displayClient.state && `, ${displayClient.state}`}
                            {displayClient.zipCode && ` ${displayClient.zipCode}`}
                          </div>
                          {displayClient.country && displayClient.country !== 'USA' && (
                            <div className="text-muted-foreground">{displayClient.country}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Projects */}
              {!isEditing && projects.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Associated Projects ({projects.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors border border-transparent hover:border-border"
                        onClick={() => {
                          navigate(`/admin/projects/${project.id}`);
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{project.name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className={`text-xs ${getProjectStatusColor(project.status)}`}>
                              {project.status}
                            </Badge>
                            {project.progress !== undefined && (
                              <span className="text-xs text-muted-foreground">{project.progress}% complete</span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editedClient?.notes || ''}
                      onChange={(e) => updateField('notes', e.target.value)}
                      placeholder="Add notes about this contact..."
                      rows={6}
                      className="resize-none"
                    />
                  ) : displayClient.notes ? (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayClient.notes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {!isEditing && displayClient.tags && displayClient.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {displayClient.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-2">
                {isEditing ? (
                  <>
                    <Button
                      className="flex-1"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Contact not found</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{client?.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
