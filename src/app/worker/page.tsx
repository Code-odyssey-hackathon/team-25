"use client";

import { useState, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TaskCard } from "@/components/worker/TaskCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ClipboardList, Upload, Loader2, CheckCircle2 } from "lucide-react";
import type { ReportStatus } from "@/types";

export default function WorkerPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const { reports, isLoading, refetch } = useReports({ status: undefined, sortBy: "priority_score", sortOrder: "desc" });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [proofDialogId, setProofDialogId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Filter reports assigned to current worker
  const myTasks = reports.filter(r => r.assigned_to === user?.id);
  const activeTasks = myTasks.filter(r => r.status !== "resolved" && r.status !== "rejected");
  const completedTasks = myTasks.filter(r => r.status === "resolved");

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    setUpdatingId(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`Status updated to "${newStatus}"`);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProofSubmit = async () => {
    if (!proofDialogId || !proofFile || !user) return;
    setIsUploading(true);
    try {
      const ext = proofFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/proof_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("reports").upload(path, proofFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("reports").getPublicUrl(path);

      const res = await fetch(`/api/reports/${proofDialogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", proof_url: urlData.publicUrl }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success("Task marked as resolved with proof! ✅");
      setProofDialogId(null);
      setProofFile(null);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload proof");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-sm text-muted-foreground">{profile?.full_name || "Worker"} • {activeTasks.length} active tasks</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : myTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No tasks assigned</p>
            <p className="text-xs">Tasks will appear here once an admin assigns work to you</p>
          </div>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="active" className="rounded-lg gap-1.5">Active ({activeTasks.length})</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Done ({completedTasks.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-3 stagger-children">
              {activeTasks.map(r => (
                <TaskCard key={r.id} report={r} onStatusChange={handleStatusChange} onUploadProof={setProofDialogId} isUpdating={updatingId === r.id} />
              ))}
            </TabsContent>
            <TabsContent value="completed" className="space-y-3 stagger-children">
              {completedTasks.map(r => (
                <TaskCard key={r.id} report={r} onStatusChange={handleStatusChange} onUploadProof={setProofDialogId} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Proof Upload Dialog */}
      <Dialog open={!!proofDialogId} onOpenChange={() => { setProofDialogId(null); setProofFile(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Upload Proof of Completion</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Take a photo showing the resolved issue to verify completion.</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e => setProofFile(e.target.files?.[0] || null)} className="hidden" />
            {proofFile ? (
              <div className="rounded-xl overflow-hidden border">
                <img src={URL.createObjectURL(proofFile)} alt="Proof" className="w-full h-48 object-cover" />
              </div>
            ) : (
              <Button variant="outline" className="w-full h-32 rounded-xl border-dashed gap-2 flex-col" onClick={() => fileRef.current?.click()}>
                <Upload className="w-6 h-6" /><span>Take or upload photo</span>
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleProofSubmit} disabled={!proofFile || isUploading} className="w-full gap-2 rounded-xl">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isUploading ? "Uploading..." : "Submit & Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
