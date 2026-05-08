"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CameraUploader } from "@/components/report/CameraUploader";
import { AiSuggestionCard } from "@/components/report/AiSuggestionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2, MapPin, Send, Sparkles, Navigation } from "lucide-react";
import type { AiClassification, IssueCategory } from "@/types";

export default function ReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const { location, isLocating, error: geoError, getImageLocation, getDeviceLocation } = useGeolocation();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("other");
  const [aiResult, setAiResult] = useState<AiClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelected = async (file: File) => {
    setImageFile(file);
    // Extract GPS from image
    await getImageLocation(file);
    // Run AI classification
    setIsClassifying(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ai/classify", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.data) {
        setAiResult(json.data);
        setTitle(json.data.suggested_title || "");
        setCategory(json.data.category || "other");
        toast.success("AI analysis complete! Review the suggestions below.");
      } else {
        toast.error("AI couldn't classify the image. Please fill in details manually.");
      }
    } catch {
      toast.error("AI classification failed. Please fill in details manually.");
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to submit a report."); return; }
    if (!imageFile) { toast.error("Please capture or upload a photo."); return; }
    if (!title.trim()) { toast.error("Please provide a title."); return; }
    if (!location) { toast.error("Location is required. Please enable GPS."); return; }

    setIsSubmitting(true);
    try {
      // Upload image to Supabase Storage
      const ext = imageFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("reports").upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("reports").getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // Create report
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrl,
          category,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || null,
          ai_confidence: aiResult?.confidence || null,
          ai_severity: aiResult?.severity || null,
          ai_summary: aiResult?.summary || null,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success("Report submitted successfully! 🎉");
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit report";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Report an Issue</h1>
          <p className="text-sm text-muted-foreground mt-1">Capture a photo and let AI help classify it</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Camera */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Photo Evidence</Label>
            <CameraUploader onImageSelected={handleImageSelected} disabled={isSubmitting} />
          </div>

          {/* AI Classification */}
          <AiSuggestionCard result={aiResult} isLoading={isClassifying} />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
            <Input id="title" placeholder="e.g., Large pothole near bus stop" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" disabled={isSubmitting} />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)} disabled={isSubmitting}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.emoji} {val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc" className="text-sm font-semibold">Description (Optional)</Label>
            <Textarea id="desc" placeholder="Add any extra details..." value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[80px]" disabled={isSubmitting} />
          </div>

          {/* Location */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Location</p>
                    {location ? (
                      <p className="text-xs text-muted-foreground">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
                    ) : geoError ? (
                      <p className="text-xs text-destructive">{geoError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not detected yet</p>
                    )}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={getDeviceLocation} disabled={isLocating}>
                  {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                  {isLocating ? "Locating..." : "Detect"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" className="w-full h-12 rounded-xl text-base gap-2 shadow-lg shadow-primary/20" disabled={isSubmitting || isClassifying || !imageFile}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
