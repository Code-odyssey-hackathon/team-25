"use client";

// =============================================================================
// JanaVaani — Issue Card Component
// Compact card for report lists with status, priority, upvotes
// =============================================================================

import { formatDistanceToNow } from "date-fns";
import {
  MapPin,
  ThumbsUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import type { Report } from "@/types";

interface IssueCardProps {
  report: Report;
  onClick?: () => void;
  compact?: boolean;
}

export function IssueCard({ report, onClick, compact = false }: IssueCardProps) {
  const categoryConfig =
    CATEGORY_CONFIG[report.category] || CATEGORY_CONFIG.other;
  const statusConfig =
    STATUS_CONFIG[report.status] || STATUS_CONFIG.submitted;

  const timeAgo = formatDistanceToNow(new Date(report.created_at), {
    addSuffix: true,
  });

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
        "hover:-translate-y-0.5",
        "overflow-hidden"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-0", compact ? "" : "")}>
        <div className="flex gap-3 p-3">
          {/* Image Thumbnail */}
          {!compact && report.image_url && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={report.image_url}
                alt={report.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Priority Badge overlay */}
              <div className="absolute top-1 left-1">
                <div
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white",
                    report.priority_score >= 7
                      ? "bg-red-500"
                      : report.priority_score >= 4
                      ? "bg-amber-500"
                      : "bg-green-500"
                  )}
                >
                  {report.priority_score}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Top Row: Category + Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 items-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 font-medium",
                    categoryConfig.color
                  )}
                >
                  {categoryConfig.emoji} {categoryConfig.label}
                </Badge>
                {report.master_ticket_id ? (
                  <Badge className="text-[9px] h-4 bg-blue-500/10 text-blue-500 border-blue-500/20 px-1">DUPLICATE</Badge>
                ) : report.upvote_count > 5 ? (
                  <Badge className="text-[9px] h-4 bg-purple-500/10 text-purple-500 border-purple-500/20 px-1">MASTER</Badge>
                ) : null}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5 gap-1 font-medium",
                  statusConfig.color
                )}
              >
                <span
                  className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotColor)}
                />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold leading-tight truncate pr-2">
              {report.title}
            </h3>

            {/* Meta Row */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {report.address && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[120px]">{report.address}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </div>

            {/* Bottom Row: Upvotes + Arrow */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ThumbsUp className="w-3 h-3" />
                {report.upvote_count}
                <span className="text-[10px]">upvotes</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
