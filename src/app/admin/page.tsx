"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { IssueCard } from "@/components/issue/IssueCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Shield, Users, Loader2, Send } from "lucide-react";
import type { Report, Profile } from "@/types";

export default function AdminPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const { reports, isLoading, refetch } = useReports({ status: "submitted", sortBy: "priority_score", sortOrder: "desc" });
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [assignDialog, setAssignDialog] = useState<Report | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("role", "worker");
      setWorkers(data || []);
    };
    fetchWorkers();
  }, [supabase]);

  if (profile?.role !== "admin") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
          <Shield className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Admin Access Required</p>
          <p className="text-xs">You need admin privileges to access this panel.</p>
        </div>
      </AppShell>
    );
  }

  const handleAssign = async () => {
    if (!assignDialog || !selectedWorker) return;
    setIsAssigning(true);
    try {
      const { error } = await supabase.from("assignments").insert({
        report_id: assignDialog.id,
        worker_id: selectedWorker,
        assigned_by: profile.id,
      });
      if (error) throw error;
      toast.success("Task assigned to worker!");
      setAssignDialog(null);
      setSelectedWorker("");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" />Admin Triage</h1>
            <p className="text-sm text-muted-foreground">{reports.length} unassigned reports awaiting triage</p>
          </div>
          <Card><CardContent className="px-4 py-2 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{workers.length} workers</span></CardContent></Card>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Shield className="w-10 h-10 mb-2 opacity-30" />
            <p>All reports have been triaged! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {reports.map(r => (
              <div key={r.id} className="flex gap-3 items-start">
                <div className="flex-1"><IssueCard report={r} /></div>
                <Button size="sm" className="mt-3 gap-1.5 rounded-xl" onClick={() => setAssignDialog(r)}>
                  <Send className="w-3.5 h-3.5" />Assign
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => { setAssignDialog(null); setSelectedWorker(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign to Worker</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Assign &quot;{assignDialog?.title}&quot; to a field worker.</p>
            <Select value={selectedWorker} onValueChange={(v) => setSelectedWorker(v ?? "")}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a worker" /></SelectTrigger>
              <SelectContent>
                {workers.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.full_name} {w.ward ? `(${w.ward})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleAssign} disabled={!selectedWorker || isAssigning} className="w-full gap-2 rounded-xl">
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isAssigning ? "Assigning..." : "Assign Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
