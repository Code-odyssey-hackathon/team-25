"use client";

// =============================================================================
// JanaVaani — AI Suggestion Card
// Displays Gemini classification results with animations
// =============================================================================

import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { AiClassification, IssueCategory } from "@/types";

interface AiSuggestionCardProps {
  result: AiClassification | null;
  isLoading: boolean;
}

export function AiSuggestionCard({ result, isLoading }: AiSuggestionCardProps) {
  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5 animate-pulse">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-medium text-primary">
              AI is analyzing your image...
            </span>
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const categoryConfig =
    CATEGORY_CONFIG[result.category as IssueCategory] ||
    CATEGORY_CONFIG.other;
  const confidencePercent = Math.round(result.confidence * 100);
  const severityColor =
    result.severity >= 7
      ? "text-red-500"
      : result.severity >= 4
      ? "text-amber-500"
      : "text-green-500";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-slide-up overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Classification</p>
              <p className="text-[10px] text-muted-foreground">
                Gemini 1.5 Flash
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs", categoryConfig.color)}>
            {categoryConfig.emoji} {categoryConfig.label}
          </Badge>
        </div>

        {/* Suggested Title */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Suggested Title
          </p>
          <p className="text-sm font-medium">{result.suggested_title}</p>
        </div>

        {/* Summary */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {result.summary}
        </p>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Confidence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Confidence</span>
              <span className="text-xs font-semibold">{confidencePercent}%</span>
            </div>
            <Progress value={confidencePercent} className="h-1.5" />
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Severity</span>
              <div className="flex items-center gap-1">
                {result.severity >= 7 ? (
                  <AlertTriangle className={cn("w-3 h-3", severityColor)} />
                ) : (
                  <CheckCircle2 className={cn("w-3 h-3", severityColor)} />
                )}
                <span className={cn("text-xs font-bold", severityColor)}>
                  {result.severity}/10
                </span>
              </div>
            </div>
            <Progress
              value={result.severity * 10}
              className={cn(
                "h-1.5",
                result.severity >= 7
                  ? "[&>div]:bg-red-500"
                  : result.severity >= 4
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-green-500"
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
