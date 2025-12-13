import { useEffect, useState } from "react";
import { Edit, FileText, MessageSquare, DollarSign } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useLocation } from "wouter";
import { getApiBaseUrl } from "../../lib/queryClient";

interface ProjectPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

interface Project {
  id: number;
  clientId: number;
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
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
}

interface ProjectUpdate {
  id: number;
  title: string;
  content: string;
  updateType: string;
  isInternal: boolean;
  createdAt: string;
}

interface Document {
  id: number;
  title: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export default function ProjectPreview({ open, onOpenChange, projectId }: ProjectPreviewProps) {
  const [_, navigate] = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && projectId) {
      fetchProjectData();
    }
  }, [open, projectId]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      // Fetch project data
      const projectResponse = await fetch(`${baseUrl}/admin/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projectData = await projectResponse.json();
      if (projectData.success) {
        setProject(projectData.project);
        setUpdates(projectData.updates || []);
      }

      // Fetch documents
      try {
        const docsResponse = await fetch(`${baseUrl}/api/admin/documents/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const docsData = await docsResponse.json();
        if (docsData.success) {
          setDocuments(docsData.data || []);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "proposal":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "pending":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "completed":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "on-hold":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Project Details</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : project ? (
          <div className="space-y-6 pt-6">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{project.name}</h2>
              {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                <Badge className={getPriorityColor(project.priority)}>{project.priority} priority</Badge>
                <Badge variant="secondary">{project.type}</Badge>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="flex w-full flex-wrap gap-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="updates">Updated and Announcements ({updates.length})</TabsTrigger>
                <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Progress */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{project.progress}% Complete</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Budget */}
                {(project.budgetAmount || project.hourlyRate || project.totalBilled) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Budget</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {project.budgetType && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">{project.budgetType}</span>
                        </div>
                      )}
                      {project.budgetAmount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-medium">{formatCurrency(project.budgetAmount)}</span>
                        </div>
                      )}
                      {project.hourlyRate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hourly Rate:</span>
                          <span className="font-medium">{formatCurrency(project.hourlyRate)}/hr</span>
                        </div>
                      )}
                      {project.totalBilled && (
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Total Billed:</span>
                          <span className="font-medium">{formatCurrency(project.totalBilled)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                {(project.startDate || project.dueDate || project.endDate) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {project.startDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Started:</span>
                          <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {project.dueDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Due:</span>
                          <span className="font-medium">{new Date(project.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {project.endDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Completed:</span>
                          <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {project.notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="updates" className="space-y-4">
                <div className="space-y-3">
                  {updates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No updates or announcements yet</p>
                    </div>
                  ) : (
                    updates.map((update) => (
                      <Card key={update.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm mb-1">{update.title}</div>
                              <p className="text-xs text-muted-foreground mb-2">{update.content}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {update.updateType}
                                </Badge>
                                {update.isInternal && (
                                  <Badge variant="secondary" className="text-xs">
                                    Internal
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{new Date(update.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No documents uploaded yet</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-semibold">{doc.title}</div>
                                <p className="text-xs text-muted-foreground">
                                  {doc.fileType} • {(doc.fileSize / 1024).toFixed(0)} KB
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.budgetAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-semibold">{formatCurrency(project.budgetAmount)}</span>
                      </div>
                    )}
                    {project.totalBilled && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Billed:</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(project.totalBilled)}</span>
                      </div>
                    )}
                    {project.budgetAmount && project.totalBilled && (
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="font-semibold">{formatCurrency(parseFloat(project.budgetAmount) - parseFloat(project.totalBilled))}</span>
                      </div>
                    )}
                    {!project.budgetAmount && !project.totalBilled && (
                      <p className="text-sm text-muted-foreground text-center py-4">No billing information available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  navigate(`/admin/projects/${projectId}/edit`);
                  onOpenChange(false);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigate(`/admin/projects/${projectId}`);
                  onOpenChange(false);
                }}
              >
                View Full
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">Project not found</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
