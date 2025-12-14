import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Home, Users, CreditCard, Briefcase, LogOut, ChevronRight, GitBranch, Megaphone, Ticket, Mail, FolderKanban, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useToast } from "../../hooks/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
  isActive?: boolean;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Check if changelogs should be visible (stored in localStorage)
  const [showChangelogs, setShowChangelogs] = useState(() => {
    const stored = localStorage.getItem("showChangelogs");
    return stored !== null ? stored === "true" : false; // Hidden by default
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/admin/login");
  };

  // Get user data from localStorage
  const userDataStr = localStorage.getItem("user");
  let userData: { name?: string; email?: string; username?: string } = {};
  if (userDataStr) {
    try {
      userData = JSON.parse(userDataStr);
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  const userName = userData.name || userData.username || "Admin";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const baseNavItems: NavItem[] = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: Home,
    },
    {
      title: "Clients",
      url: "/admin/clients",
      icon: Users,
    },
    {
      title: "Projects",
      url: "/admin/projects",
      icon: FolderKanban,
    },
    {
      title: "Deals",
      url: "/admin/deals",
      icon: Briefcase,
    },
    {
      title: "Tickets",
      url: "/admin/tickets",
      icon: Ticket,
    },
    {
      title: "Billing",
      url: "/admin/billing",
      icon: CreditCard,
    },
    {
      title: "Emails",
      url: "/admin/emails",
      icon: Mail,
    },
    {
      title: "Blog Posts",
      url: "/admin/blog-posts",
      icon: FileText,
    },
    {
      title: "Updates",
      url: "/admin/updates",
      icon: Megaphone,
    },
  ];

  const changelogItem: NavItem = {
    title: "Git Commits",
    url: "/admin/changelogs",
    icon: GitBranch,
  };

  // Conditionally include changelogs based on toggle
  const navItems = showChangelogs ? [...baseNavItems, changelogItem] : baseNavItems;

  // Simple breadcrumb logic
  const getBreadcrumbs = () => {
    const parts = location.split("/").filter(Boolean);
    const breadcrumbs: { label: string; path: string }[] = [];

    let currentPath = "";
    parts.forEach((part) => {
      currentPath += `/${part}`;

      // Skip 'admin' in breadcrumb display
      if (part === "admin") return;

      // Capitalize and format the part
      const label = part
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="bg-background border-r">
        <SidebarHeader className="border-b px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">BS</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">Better Systems</span>
              <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">CRM Control Center</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = location === item.url || location.startsWith(item.url + "/");
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton tooltip={item.title} isActive={isActive} onClick={() => navigate(item.url)} className="w-full">
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userData.email || "Administrator"}</span>
                </div>
              </div>
            </SidebarMenuItem>

            <Separator className="my-1" />

            {/* Git Commits Toggle */}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={showChangelogs ? "Hide Git Commits" : "Show Git Commits"}
                onClick={() => {
                  const newValue = !showChangelogs;
                  setShowChangelogs(newValue);
                  localStorage.setItem("showChangelogs", String(newValue));
                  if (!newValue && location === "/admin/changelogs") {
                    // If we're on changelogs page and hiding it, navigate away
                    navigate("/admin/dashboard");
                  }
                }}
                className="w-full"
              >
                <GitBranch className="h-4 w-4" />
                <span>{showChangelogs ? "Hide" : "Show"} Git Commits</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Separator className="my-1" />

            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Logout"
                onClick={handleLogout}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.length === 0 ? (
              <span className="text-muted-foreground">Dashboard</span>
            ) : (
              breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <button onClick={() => navigate(crumb.path)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {crumb.label}
                  </button>
                </div>
              ))
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
