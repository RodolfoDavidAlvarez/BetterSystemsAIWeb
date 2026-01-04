import { Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function CampaignsPage() {
  useScrollToTop();

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  Email Campaigns
                </h1>
                <p className="text-muted-foreground mt-0.5 text-sm lg:text-base">
                  Create and manage outreach campaigns
                </p>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            disabled
            className="
              bg-gradient-to-r from-violet-500 to-purple-600
              shadow-lg shadow-violet-500/20
            "
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 mb-4">
            <Send className="h-8 w-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Email campaign management is being built. You'll be able to create, schedule, and track outreach campaigns here.
          </p>
        </div>
      </div>
    </div>
  );
}
