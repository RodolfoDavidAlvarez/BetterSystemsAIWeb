import { useEffect, useState, useMemo } from "react";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  GitBranch,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Shield,
  Wrench,
  Info,
  Clock,
  Calendar,
  Timer,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { getApiBaseUrl } from "../../lib/queryClient";
import { format, isToday, isYesterday, isThisWeek, isThisMonth, differenceInMinutes } from "date-fns";

interface Changelog {
  id: number;
  title: string;
  description: string;
  category: "feature" | "bugfix" | "improvement" | "breaking" | "security" | "other";
  priority: "low" | "medium" | "high";
  status: "draft" | "published" | "archived";
  isPublic: boolean;
  isFromGitHub: boolean;
  githubCommitSha: string | null;
  githubCommitUrl: string | null;
  githubAuthor: string | null;
  githubDate: string | null;
  relatedProjectId: number | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface TimeGroup {
  label: string;
  changelogs: ChangelogWithTime[];
  totalTime: number;
  dateRange: string;
}

interface ChangelogWithTime extends Changelog {
  estimatedMinutes: number;
}

const categoryIcons: Record<string, typeof Sparkles> = {
  feature: Sparkles,
  bugfix: Wrench,
  improvement: TrendingUp,
  breaking: AlertCircle,
  security: Shield,
  other: Info,
};

const categoryColors: Record<string, string> = {
  feature: "bg-blue-500/10 text-blue-700 border-blue-200",
  bugfix: "bg-red-500/10 text-red-700 border-red-200",
  improvement: "bg-green-500/10 text-green-700 border-green-200",
  breaking: "bg-orange-500/10 text-orange-700 border-orange-200",
  security: "bg-purple-500/10 text-purple-700 border-purple-200",
  other: "bg-gray-500/10 text-gray-700 border-gray-200",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

/**
 * Time Estimation Algorithm
 * Calculates realistic time spent based on:
 * 1. Time gap between consecutive commits (capped at 4 hours)
 * 2. Complexity indicators from commit message
 * 3. Category-based multipliers
 */
function estimateTimeForCommit(
  commit: Changelog,
  previousCommit: Changelog | null
): number {
  const commitDate = new Date(commit.githubDate || commit.createdAt);

  // Base time estimation from commit message complexity
  let baseMinutes = 30; // Default 30 minutes

  const descLength = commit.description?.length || 0;

  // Longer descriptions suggest more complex work
  if (descLength > 500) baseMinutes = 90;
  else if (descLength > 200) baseMinutes = 60;
  else if (descLength > 100) baseMinutes = 45;

  // Category-based adjustments
  const categoryMultipliers: Record<string, number> = {
    feature: 1.5,      // Features typically take longer
    bugfix: 1.2,       // Bug fixes need investigation
    improvement: 1.0,  // Standard work
    breaking: 1.8,     // Breaking changes are complex
    security: 1.4,     // Security needs careful review
    other: 0.8,        // Misc tasks are usually quick
  };

  baseMinutes *= categoryMultipliers[commit.category] || 1.0;

  // Priority adjustments
  if (commit.priority === "high") baseMinutes *= 1.3;
  else if (commit.priority === "low") baseMinutes *= 0.7;

  // If we have a previous commit, calculate time gap
  if (previousCommit) {
    const prevDate = new Date(previousCommit.githubDate || previousCommit.createdAt);
    const gapMinutes = Math.abs(differenceInMinutes(commitDate, prevDate));

    // If commits are within 4 hours, use the gap as estimate
    // Otherwise, cap at 4 hours (240 minutes) - assumes break/overnight
    if (gapMinutes > 0 && gapMinutes < 240) {
      // Blend the gap time with base estimate
      baseMinutes = Math.round((gapMinutes * 0.6) + (baseMinutes * 0.4));
    }
  }

  // Check for keywords that indicate quick fixes
  const quickKeywords = ["typo", "minor", "small", "quick", "hotfix", "readme", "comment"];
  const isQuickFix = quickKeywords.some(kw =>
    commit.title.toLowerCase().includes(kw) ||
    commit.description?.toLowerCase().includes(kw)
  );
  if (isQuickFix) baseMinutes = Math.min(baseMinutes, 15);

  // Check for keywords that indicate major work
  const majorKeywords = ["refactor", "redesign", "migrate", "overhaul", "complete", "implement"];
  const isMajorWork = majorKeywords.some(kw =>
    commit.title.toLowerCase().includes(kw) ||
    commit.description?.toLowerCase().includes(kw)
  );
  if (isMajorWork) baseMinutes = Math.max(baseMinutes, 120);

  // Cap at reasonable bounds
  return Math.min(Math.max(Math.round(baseMinutes), 5), 480); // 5 min to 8 hours
}

/**
 * Group changelogs by time period
 */
function groupByTimePeriod(changelogs: ChangelogWithTime[]): TimeGroup[] {
  const groups: Record<string, ChangelogWithTime[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  changelogs.forEach(changelog => {
    const date = new Date(changelog.githubDate || changelog.createdAt);

    if (isToday(date)) {
      groups.today.push(changelog);
    } else if (isYesterday(date)) {
      groups.yesterday.push(changelog);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(changelog);
    } else if (isThisMonth(date)) {
      groups.thisMonth.push(changelog);
    } else {
      groups.older.push(changelog);
    }
  });

  const result: TimeGroup[] = [];

  if (groups.today.length > 0) {
    result.push({
      label: "Today",
      changelogs: groups.today,
      totalTime: groups.today.reduce((sum, c) => sum + c.estimatedMinutes, 0),
      dateRange: format(new Date(), "MMMM d, yyyy"),
    });
  }

  if (groups.yesterday.length > 0) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    result.push({
      label: "Yesterday",
      changelogs: groups.yesterday,
      totalTime: groups.yesterday.reduce((sum, c) => sum + c.estimatedMinutes, 0),
      dateRange: format(yesterday, "MMMM d, yyyy"),
    });
  }

  if (groups.thisWeek.length > 0) {
    result.push({
      label: "This Week",
      changelogs: groups.thisWeek,
      totalTime: groups.thisWeek.reduce((sum, c) => sum + c.estimatedMinutes, 0),
      dateRange: "Earlier this week",
    });
  }

  if (groups.thisMonth.length > 0) {
    result.push({
      label: "This Month",
      changelogs: groups.thisMonth,
      totalTime: groups.thisMonth.reduce((sum, c) => sum + c.estimatedMinutes, 0),
      dateRange: format(new Date(), "MMMM yyyy"),
    });
  }

  if (groups.older.length > 0) {
    result.push({
      label: "Older",
      changelogs: groups.older,
      totalTime: groups.older.reduce((sum, c) => sum + c.estimatedMinutes, 0),
      dateRange: "Previous months",
    });
  }

  return result;
}

/**
 * Format minutes to human readable string
 */
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

export default function ChangelogPage() {
  useScrollToTop();
  const { toast } = useToast();
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedChangelog, setSelectedChangelog] = useState<Changelog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Today", "Yesterday", "This Week"]));

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as Changelog["category"],
    priority: "medium" as Changelog["priority"],
    status: "draft" as Changelog["status"],
    isPublic: true,
    tags: [] as string[],
    notes: "",
  });

  // GitHub sync form state
  const [syncFormData, setSyncFormData] = useState({
    owner: "RodolfoDavidAlvarez",
    repo: "BetterSystems.ai",
    branch: "main",
    since: "",
    token: "",
  });

  useEffect(() => {
    fetchChangelogs();
  }, [categoryFilter, statusFilter]);

  const fetchChangelogs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const response = await fetch(`${baseUrl}/admin/changelogs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setChangelogs(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching changelogs:", error);
      toast({
        title: "Error",
        description: "Failed to load changelogs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process changelogs with time estimates and grouping
  const processedData = useMemo(() => {
    // Sort by date descending
    const sorted = [...changelogs].sort((a, b) => {
      const dateA = new Date(a.githubDate || a.createdAt);
      const dateB = new Date(b.githubDate || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Filter by search
    const filtered = sorted.filter(changelog => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        changelog.title.toLowerCase().includes(searchLower) ||
        changelog.description?.toLowerCase().includes(searchLower) ||
        changelog.githubAuthor?.toLowerCase().includes(searchLower)
      );
    });

    // Add time estimates
    const withTime: ChangelogWithTime[] = filtered.map((changelog, index) => ({
      ...changelog,
      estimatedMinutes: estimateTimeForCommit(
        changelog,
        index < filtered.length - 1 ? filtered[index + 1] : null
      ),
    }));

    // Group by time period
    const groups = groupByTimePeriod(withTime);

    // Calculate totals
    const totalMinutes = withTime.reduce((sum, c) => sum + c.estimatedMinutes, 0);
    const totalCommits = withTime.length;
    const categoryBreakdown = withTime.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + c.estimatedMinutes;
      return acc;
    }, {} as Record<string, number>);

    return {
      groups,
      totalMinutes,
      totalCommits,
      categoryBreakdown,
      changelogs: withTime,
    };
  }, [changelogs, search]);

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedChangelog(null);
    setFormData({
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      status: "draft",
      isPublic: true,
      tags: [],
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (changelog: Changelog) => {
    setIsEditing(true);
    setSelectedChangelog(changelog);
    setFormData({
      title: changelog.title,
      description: changelog.description,
      category: changelog.category,
      priority: changelog.priority,
      status: changelog.status,
      isPublic: changelog.isPublic,
      tags: changelog.tags || [],
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const url = isEditing && selectedChangelog ? `${baseUrl}/admin/changelogs/${selectedChangelog.id}` : `${baseUrl}/admin/changelogs`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: isEditing ? "Changelog updated successfully" : "Changelog created successfully",
        });
        setIsDialogOpen(false);
        fetchChangelogs();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save changelog",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changelog",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this changelog?")) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/changelogs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Changelog deleted successfully" });
        fetchChangelogs();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete changelog",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete changelog",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    if (!syncFormData.owner || !syncFormData.repo) {
      toast({
        title: "Error",
        description: "Owner and repository are required",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/changelogs/sync/github`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(syncFormData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Synced ${data.data.new} new changelogs from GitHub`,
        });
        setIsSyncDialogOpen(false);
        fetchChangelogs();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to sync from GitHub",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync from GitHub",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Development Changelog</h1>
          <p className="text-muted-foreground mt-1">Track commits, features, and time invested</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsSyncDialogOpen(true)} variant="outline">
            <GitBranch className="h-4 w-4 mr-2" />
            Sync GitHub
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time Invested</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(processedData.totalMinutes)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated from {processedData.totalCommits} commits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Features</CardTitle>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(processedData.categoryBreakdown.feature || 0)}
            </div>
            <p className="text-xs text-muted-foreground">New functionality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bug Fixes</CardTitle>
            <Wrench className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatTime(processedData.categoryBreakdown.bugfix || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Issues resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvements</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatTime(processedData.categoryBreakdown.improvement || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Enhancements & refactors</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search commits, authors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="bugfix">Bug Fix</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="breaking">Breaking</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading changelog...</p>
            </div>
          </CardContent>
        </Card>
      ) : processedData.groups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No changelogs yet</h3>
              <p className="text-muted-foreground mb-4">
                Sync from GitHub or create a manual entry to get started.
              </p>
              <Button onClick={() => setIsSyncDialogOpen(true)}>
                <GitBranch className="h-4 w-4 mr-2" />
                Sync from GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {processedData.groups.map((group) => (
            <Card key={group.label}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleGroup(group.label)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedGroups.has(group.label) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{group.label}</CardTitle>
                      <CardDescription>{group.dateRange}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GitBranch className="h-4 w-4" />
                      <span>{group.changelogs.length} commits</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(group.totalTime)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {expandedGroups.has(group.label) && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {group.changelogs.map((changelog) => {
                      const CategoryIcon = categoryIcons[changelog.category] || Info;
                      const commitDate = new Date(changelog.githubDate || changelog.createdAt);

                      return (
                        <div
                          key={changelog.id}
                          className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                        >
                          {/* Category Icon */}
                          <div className={`p-2 rounded-lg ${categoryColors[changelog.category]}`}>
                            <CategoryIcon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm leading-tight mb-1">
                                  {changelog.title}
                                </h4>
                                {changelog.description && changelog.description !== changelog.title && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {changelog.description}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(changelog)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(changelog.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Meta info */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {/* Time estimate */}
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <Timer className="h-3 w-3" />
                                {formatTime(changelog.estimatedMinutes)}
                              </span>

                              {/* Date/time */}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(commitDate, "MMM d, h:mm a")}
                              </span>

                              {/* Author */}
                              {changelog.githubAuthor && (
                                <span>by {changelog.githubAuthor}</span>
                              )}

                              {/* GitHub link */}
                              {changelog.githubCommitUrl && (
                                <a
                                  href={changelog.githubCommitUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GitBranch className="h-3 w-3" />
                                  {changelog.githubCommitSha}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}

                              {/* Priority badge */}
                              {changelog.priority !== "medium" && (
                                <Badge className={`text-xs ${priorityColors[changelog.priority]}`}>
                                  {changelog.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Changelog" : "Create New Changelog"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the changelog details" : "Add a new changelog entry"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Added new dashboard feature"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the change in detail..."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as Changelog["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bugfix">Bug Fix</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="breaking">Breaking</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Changelog["priority"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Changelog["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isPublic">Public (visible to clients)</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GitHub Sync Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync from GitHub</DialogTitle>
            <DialogDescription>
              Import commits from a GitHub repository
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="owner">Repository Owner</Label>
              <Input
                id="owner"
                value={syncFormData.owner}
                onChange={(e) => setSyncFormData({ ...syncFormData, owner: e.target.value })}
                placeholder="RodolfoDavidAlvarez"
              />
            </div>
            <div>
              <Label htmlFor="repo">Repository Name</Label>
              <Input
                id="repo"
                value={syncFormData.repo}
                onChange={(e) => setSyncFormData({ ...syncFormData, repo: e.target.value })}
                placeholder="BetterSystems.ai"
              />
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                value={syncFormData.branch}
                onChange={(e) => setSyncFormData({ ...syncFormData, branch: e.target.value })}
                placeholder="main"
              />
            </div>
            <div>
              <Label htmlFor="since">Since Date (optional)</Label>
              <Input
                id="since"
                type="date"
                value={syncFormData.since}
                onChange={(e) => setSyncFormData({ ...syncFormData, since: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="token">GitHub Token (for private repos)</Label>
              <Input
                id="token"
                type="password"
                value={syncFormData.token}
                onChange={(e) => setSyncFormData({ ...syncFormData, token: e.target.value })}
                placeholder="ghp_xxxx (optional)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for private repositories
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Sync Commits
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}











