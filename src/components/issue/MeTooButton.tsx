"use client";

// =============================================================================
// JanaVaani — "Me Too" Upvote Button (FR2)
// Prevents duplicate upvotes, shows count with animation
// =============================================================================

import { useState, useCallback } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MeTooButtonProps {
  reportId: string;
  initialCount: number;
  initialHasUpvoted?: boolean;
  onUpvoteChange?: (newCount: number) => void;
}

export function MeTooButton({
  reportId,
  initialCount,
  initialHasUpvoted = false,
  onUpvoteChange,
}: MeTooButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const handleToggle = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to upvote issues.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (hasUpvoted) {
        // Remove upvote
        const { error } = await supabase
          .from("upvotes")
          .delete()
          .eq("report_id", reportId)
          .eq("user_id", user.id);

        if (error) throw error;

        setCount((c) => Math.max(0, c - 1));
        setHasUpvoted(false);
        onUpvoteChange?.(count - 1);
      } else {
        // Add upvote
        const { error } = await supabase.from("upvotes").insert({
          report_id: reportId,
          user_id: user.id,
        });

        if (error) {
          if (error.code === "23505") {
            // Unique constraint violation — already upvoted
            setHasUpvoted(true);
            return;
          }
          throw error;
        }

        setCount((c) => c + 1);
        setHasUpvoted(true);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
        onUpvoteChange?.(count + 1);
        toast.success("Your voice has been counted! 🗳️");
      }
    } catch (err) {
      console.error("Upvote error:", err);
      toast.error("Failed to register your vote. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    isLoading,
    hasUpvoted,
    supabase,
    reportId,
    count,
    onUpvoteChange,
  ]);

  return (
    <Button
      variant={hasUpvoted ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "gap-2 rounded-xl transition-all duration-300 relative overflow-hidden",
        hasUpvoted
          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          : "hover:border-primary/50 hover:text-primary",
        isAnimating && "scale-110"
      )}
    >
      <ThumbsUp
        className={cn(
          "w-4 h-4 transition-transform duration-300",
          hasUpvoted && "fill-current",
          isAnimating && "animate-bounce"
        )}
      />
      <span className="font-semibold">{count}</span>
      <span className="text-xs opacity-80">Me Too</span>

      {/* Burst animation on upvote */}
      {isAnimating && (
        <span className="absolute inset-0 bg-primary/20 rounded-xl animate-ping" />
      )}
    </Button>
  );
}
