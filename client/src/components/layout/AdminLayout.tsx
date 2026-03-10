import { ReactNode } from "react";
import { useLocation } from "wouter";
import { MessageSquare, CreditCard, Target, LogOut, MoreHorizontal } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
}

interface TabItem {
  title: string;
  url: string;
  icon: typeof MessageSquare;
}

const tabs: TabItem[] = [
  {
    title: "Conversations",
    url: "/admin/conversations",
    icon: MessageSquare,
  },
  {
    title: "Outreach",
    url: "/admin/outreach",
    icon: Target,
  },
  {
    title: "Financial",
    url: "/admin/billing",
    icon: CreditCard,
  },
  {
    title: "More",
    url: "/admin/more",
    icon: MoreHorizontal,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

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

  return (
    <div className="admin-ui flex flex-col min-h-screen bg-background">
      {/* Top Bar — minimal */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 border-b bg-background/95 backdrop-blur-sm">
        <span className="text-sm font-bold tracking-tight">Better Systems</span>
        <button
          onClick={handleLogout}
          className="p-2 -mr-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* Main Content — scrollable, with bottom padding for tab bar */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="admin-content-shell mx-auto w-full max-w-[720px]">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar — fixed, mobile-first */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t safe-area-bottom">
        <div className="flex items-center justify-around max-w-[720px] mx-auto">
          {tabs.map((tab) => {
            const isActive = location === tab.url || location.startsWith(tab.url + "/");
            const Icon = tab.icon;

            return (
              <button
                key={tab.url}
                onClick={() => navigate(tab.url)}
                className={`flex flex-col items-center justify-center flex-1 py-3 px-2 transition-colors active:opacity-70 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className={`text-xs mt-1 ${isActive ? "font-semibold" : ""}`}>
                  {tab.title}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
