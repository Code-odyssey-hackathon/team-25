"use client";

import { formatDistanceToNow } from "date-fns";
import { MapPin, Clock, CheckCircle2, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import type { Report, ReportStatus } from "@/types";

interface TaskCardProps {
  report: Report;
  onStatusChange: (id: string, status: ReportStatus) => Promise<void>;
  onUploadProof: (id: string) => void;
  isUpdating?: boolean;
}

export function TaskCard({ report, onStatusChange, onUploadProof, isUpdating }: TaskCardProps) {
  const cat = CATEGORY_CONFIG[report.category] || CATEGORY_CONFIG.other;
  const stat = STATUS_CONFIG[report.status] || STATUS_CONFIG.submitted;
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });
  const next: ReportStatus | null = report.status === "acknowledged" ? "in_progress" : report.status === "in_progress" ? "resolved" : null;
  const nextLabel = next === "in_progress" ? "Start Work" : next === "resolved" ? "Mark Resolved" : null;
  const slaBreached = report.status !== "resolved" && Date.now() - new Date(report.created_at).getTime() > 48 * 3600000;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all">
      <CardContent className="p-0">
        <div className={cn("h-1", report.priority_score >= 7 ? "bg-gradient-to-r from-red-500 to-orange-500" : report.priority_score >= 4 ? "bg-gradient-to-r from-amber-500 to-yellow-500" : "bg-gradient-to-r from-green-500 to-emerald-500")} />
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold leading-tight">{report.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-[10px] h-5", cat.color)}>{cat.emoji} {cat.label}</Badge>
                <Badge variant="outline" className={cn("text-[10px] h-5 gap-1", stat.color)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", stat.dotColor)} />{stat.label}
                </Badge>
              </div>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0", report.priority_score >= 7 ? "bg-red-500" : report.priority_score >= 4 ? "bg-amber-500" : "bg-green-500")}>{report.priority_score}</div>
          </div>
          {report.image_url && <div className="rounded-lg overflow-hidden h-32"><img src={report.image_url} alt={report.title} className="w-full h-full object-cover" /></div>}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {report.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="truncate max-w-[180px]">{report.address}</span></span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>
          </div>
          {report.description && <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>}
          <div className="flex gap-2 pt-1">
            {next && nextLabel && (
              <Button size="sm" className="flex-1 gap-2 rounded-xl" onClick={() => next === "resolved" ? onUploadProof(report.id) : onStatusChange(report.id, next)} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : next === "resolved" ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                {nextLabel}
              </Button>
            )}
            {report.status === "resolved" && <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium"><CheckCircle2 className="w-4 h-4" />Completed</div>}
          </div>
          {slaBreached && <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg"><AlertTriangle className="w-3.5 h-3.5" />SLA breach — exceeds 48-hour target</div>}
        </div>
      </CardContent>
    </Card>
  );
}
