import { useState, useEffect } from "react";
import { getApiBaseUrl } from "../../lib/queryClient";
import {
  Mail,
  Phone,
  Users,
  FileText,
  MessageSquare,
  DollarSign,
  UserPlus,
  Settings,
  Activity,
  RefreshCw,
} from "lucide-react";

interface ActivityItem {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  details: any;
  userId: number | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  entityName: string | null;
}

interface ActivityTimelineProps {
  limit?: number;
  compact?: boolean;
  entityType?: string;
  entityId?: number;
}

const getActivityIcon = (entityType: string, action: string) => {
  if (action.includes("email")) return <Mail className="h-3.5 w-3.5" />;
  if (action.includes("call")) return <Phone className="h-3.5 w-3.5" />;
  if (action.includes("meeting")) return <Users className="h-3.5 w-3.5" />;
  if (action.includes("payment") || action.includes("invoice")) return <DollarSign className="h-3.5 w-3.5" />;
  if (action.includes("note")) return <MessageSquare className="h-3.5 w-3.5" />;

  switch (entityType) {
    case "client":
      return <UserPlus className="h-3.5 w-3.5" />;
    case "project":
      return <FileText className="h-3.5 w-3.5" />;
    case "update":
      return <Settings className="h-3.5 w-3.5" />;
    default:
      return <Activity className="h-3.5 w-3.5" />;
  }
};

const getActivityColor = (entityType: string, action: string) => {
  if (action.includes("email")) return "text-blue-400 bg-blue-500/10 ring-blue-500/20";
  if (action.includes("payment") || action.includes("invoice")) return "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20";
  if (action.includes("meeting") || action.includes("call")) return "text-purple-400 bg-purple-500/10 ring-purple-500/20";
  if (action.includes("created")) return "text-sky-400 bg-sky-500/10 ring-sky-500/20";
  if (action.includes("updated") || action.includes("changed")) return "text-amber-400 bg-amber-500/10 ring-amber-500/20";
  if (action.includes("deleted")) return "text-red-400 bg-red-500/10 ring-red-500/20";

  switch (entityType) {
    case "client":
      return "text-indigo-400 bg-indigo-500/10 ring-indigo-500/20";
    case "project":
      return "text-cyan-400 bg-cyan-500/10 ring-cyan-500/20";
    default:
      return "text-slate-400 bg-slate-500/10 ring-slate-500/20";
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatActionText = (action: string, entityType: string, entityName: string | null) => {
  const name = entityName || entityType;
  const actionFormatted = action.replace(/_/g, " ");
  return `${actionFormatted} ${name}`;
};

export default function ActivityTimeline({ limit = 10, compact = false, entityType, entityId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const params = new URLSearchParams({ limit: String(limit + 10) });
      if (entityType) params.set("entityType", entityType);
      if (entityId) params.set("entityId", String(entityId));

      const response = await fetch(`${baseUrl}/admin/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActivities(data.activities || []);
        }
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities
    .filter((a) => {
      if (filter === "all") return true;
      if (filter === "emails") return a.action.includes("email");
      if (filter === "meetings") return a.action.includes("meeting") || a.action.includes("call");
      if (filter === "payments") return a.action.includes("payment") || a.action.includes("invoice");
      if (filter === "notes") return a.action.includes("note");
      return true;
    })
    .slice(0, limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-10 w-10 mx-auto mb-3 text-slate-600" />
        <p className="text-sm text-slate-500">No activity yet</p>
        <p className="text-xs text-slate-600 mt-1">Activity will appear here as you use the CRM</p>
      </div>
    );
  }

  const filterButtons = [
    { key: "all", label: "All" },
    { key: "emails", label: "Emails" },
    { key: "meetings", label: "Meetings" },
    { key: "payments", label: "Payments" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div>
      {/* Filter Pills */}
      {!compact && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1 text-xs rounded-full transition-all whitespace-nowrap ${
                filter === btn.key
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-slate-700 via-slate-800 to-transparent" />

        <div className="space-y-1">
          {filteredActivities.map((activity) => {
            const colorClass = getActivityColor(activity.entityType, activity.action);
            return (
              <div
                key={activity.id}
                className="relative flex items-start gap-3 pl-0 py-2 group"
              >
                {/* Icon dot */}
                <div
                  className={`relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-full ring-1 shrink-0 ${colorClass}`}
                >
                  {getActivityIcon(activity.entityType, activity.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-slate-200 leading-tight">
                    <span className="capitalize font-medium">
                      {formatActionText(activity.action, activity.entityType, activity.entityName)}
                    </span>
                  </p>
                  {activity.details && typeof activity.details === "object" && activity.details.message && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{activity.details.message}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[11px] text-slate-600"
                      title={new Date(activity.createdAt).toLocaleString()}
                    >
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                    {activity.userName && (
                      <span className="text-[11px] text-slate-600">
                        by {activity.userName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
