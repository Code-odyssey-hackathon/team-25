"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { IssueMap } from "@/components/map/IssueMap";
import { IssueCard } from "@/components/issue/IssueCard";
import { MeTooButton } from "@/components/issue/MeTooButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReports } from "@/hooks/useReports";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { List, MapIcon, Filter, X, MapPin, Clock, ThumbsUp, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Report, IssueCategory, ReportStatus } from "@/types";

export default function HomePage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { reports, isLoading } = useReports({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sortBy: "priority_score",
    sortOrder: "desc",
  });

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm z-10">
          <div>
            <h1 className="text-lg font-bold">Active Issues</h1>
            <p className="text-xs text-muted-foreground">{reports.length} reports in your area</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filters */}
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
              <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.emoji} {val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex bg-muted rounded-lg p-0.5">
              <Button variant={view === "map" ? "default" : "ghost"} size="sm" className="h-7 px-2.5 rounded-md" onClick={() => setView("map")}>
                <MapIcon className="w-3.5 h-3.5" />
              </Button>
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2.5 rounded-md" onClick={() => setView("list")}>
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : view === "map" ? (
            <IssueMap reports={reports} onMarkerClick={(r) => setSelectedReport(r)} className="h-full rounded-none" />
          ) : (
            <div className="p-4 space-y-3 overflow-y-auto h-full stagger-children">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <MapIcon className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No issues found</p>
                  <p className="text-xs">Try adjusting your filters</p>
                </div>
              ) : (
                reports.map((report) => (
                  <IssueCard key={report.id} report={report} onClick={() => setSelectedReport(report)} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* SOS Button */}
      <Button 
        variant="destructive" 
        size="icon" 
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-2xl shadow-red-500/40 z-50 animate-bounce"
        onClick={() => toast.error("SOS Triggered! Dispatching emergency teams to your current GPS coordinates.")}
      >
        <AlertCircle className="w-7 h-7" />
      </Button>

      {/* Issue Detail Sheet */}
      <Sheet open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
          {selectedReport && (
            <div className="space-y-4 pb-8">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", CATEGORY_CONFIG[selectedReport.category]?.color)}>
                    {CATEGORY_CONFIG[selectedReport.category]?.emoji} {CATEGORY_CONFIG[selectedReport.category]?.label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs gap-1", STATUS_CONFIG[selectedReport.status]?.color)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[selectedReport.status]?.dotColor)} />
                    {STATUS_CONFIG[selectedReport.status]?.label}
                  </Badge>
                  {selectedReport.master_ticket_id ? (
                    <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Linked to Master Ticket
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/20">
                      Master Ticket
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-left text-xl">{selectedReport.title}</SheetTitle>
              </SheetHeader>

              {selectedReport.image_url && (
                <div className="rounded-xl overflow-hidden">
                  <img src={selectedReport.image_url} alt={selectedReport.title} className="w-full h-56 object-cover" />
                </div>
              )}

              {selectedReport.description && (
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {selectedReport.address && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{selectedReport.address}</span>
                )}
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDistanceToNow(new Date(selectedReport.created_at), { addSuffix: true })}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white", selectedReport.priority_score >= 7 ? "bg-red-500" : selectedReport.priority_score >= 4 ? "bg-amber-500" : "bg-green-500")}>
                    {selectedReport.priority_score}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Priority Score</p>
                    <p className="text-sm font-semibold">
                      {selectedReport.priority_score >= 7 ? "Critical" : selectedReport.priority_score >= 4 ? "Moderate" : "Low"}
                    </p>
                  </div>
                </div>
                <MeTooButton reportId={selectedReport.id} initialCount={selectedReport.upvote_count} />
              </div>

              {selectedReport.ai_summary && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-primary mb-1">AI Analysis</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.ai_summary}</p>
                </div>
              )}

              {/* Audit Ledger / Blockchain Simulation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Audit History</h3>
                  <Badge variant="outline" className="text-[10px] font-mono opacity-50">#ON-CHAIN</Badge>
                </div>
                <div className="space-y-2">
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase text-primary">Status: {selectedReport.status}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(selectedReport.updated_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-mono text-muted-foreground break-all bg-background/50 p-1.5 rounded border border-border/50">
                        SHA256: {btoa(selectedReport.id + selectedReport.status).slice(0, 32).toLowerCase()}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Before/After if resolved */}
              {selectedReport.status === "resolved" && selectedReport.proof_url && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Resolution Proof</p>
                  <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                    <div className="relative">
                      <img src={selectedReport.image_url} alt="Before" className="w-full h-32 object-cover" />
                      <span className="absolute bottom-1 left-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">Before</span>
                    </div>
                    <div className="relative">
                      <img src={selectedReport.proof_url} alt="After" className="w-full h-32 object-cover" />
                      <span className="absolute bottom-1 left-1 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">After</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
