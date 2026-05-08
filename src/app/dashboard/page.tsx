"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { IssueMap } from "@/components/map/IssueMap";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Image as ImageIcon, 
  MapIcon, 
  Sparkles 
} from "lucide-react";
import type { WardLeaderboard, Report } from "@/types";

export default function DashboardPage() {
  const [leaderboard, setLeaderboard] = useState<WardLeaderboard[]>([]);
  const [gallery, setGallery] = useState<Report[]>([]);
  const [heatmapData, setHeatmapData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0, avgSla: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [lbRes, galRes, hmRes, statsRes] = await Promise.all([
          fetch("/api/dashboard/leaderboard").then(r => r.json()),
          fetch("/api/dashboard/gallery").then(r => r.json()),
          fetch("/api/dashboard/heatmap").then(r => r.json()),
          fetch("/api/reports?pageSize=1000").then(r => r.json()),
        ]);
        setLeaderboard(lbRes.data || []);
        setGallery(galRes.data || []);
        setHeatmapData(hmRes.data || []);
        const allReports = statsRes.data || [];
        const resolved = allReports.filter((r: Report) => r.status === "resolved");
        const slaValues = resolved.filter((r: Report) => r.sla_hours).map((r: Report) => r.sla_hours!);
        setStats({
          total: statsRes.total || allReports.length,
          resolved: resolved.length,
          active: allReports.length - resolved.length,
          avgSla: slaValues.length > 0 ? Math.round(slaValues.reduce((a: number, b: number) => a + b, 0) / slaValues.length) : 0,
        });
      } catch (err) { console.error("Dashboard fetch error:", err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Public Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time civic accountability metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
          {[
            { label: "Total Reports", value: stats.total, icon: BarChart3, color: "text-primary" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Active Issues", value: stats.active, icon: AlertTriangle, color: "text-amber-500" },
            { label: "Avg Resolution", value: `${stats.avgSla}h`, icon: Clock, color: "text-blue-500" },
          ].map((stat) => (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Predictive AI Forecast Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group shadow-xl shadow-primary/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg">Predictive Infrastructure Forecast (Next 30 Days)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { ward: "Ward 7 (Indiranagar)", risk: "73%", issue: "Flood Probability", color: "text-red-500", detail: "Clogged drainage on MG Road" },
                { ward: "Ward 12 (Koramangala)", risk: "58%", issue: "Road Degradation", color: "text-amber-500", detail: "Heavy traffic causing sinkhole risk" },
                { ward: "Ward 25 (HSR Layout)", risk: "12%", issue: "Streetlight Failure", color: "text-green-500", detail: "Grid stability looks optimal" },
              ].map((item) => (
                <div key={item.ward} className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{item.ward}</p>
                    <span className={cn("text-xl font-black tabular-nums", item.color)}>{item.risk}</span>
                  </div>
                  <p className="font-bold text-sm">{item.issue}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
                  <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", item.color.replace('text', 'bg'))} style={{ width: item.risk }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="leaderboard" className="rounded-lg gap-1.5"><Trophy className="w-3.5 h-3.5" />Leaderboard</TabsTrigger>
            <TabsTrigger value="heatmap" className="rounded-lg gap-1.5"><MapIcon className="w-3.5 h-3.5" />Heatmap</TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-lg gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Gallery</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-3">
            {leaderboard.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground"><Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No ward data yet</p></CardContent></Card>
            ) : leaderboard.map((ward, i) => (
              <Card key={ward.ward} className="hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white", i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-700" : "bg-muted text-muted-foreground")}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{ward.ward}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{ward.total_reports} reports</span>
                      <span className="text-emerald-500">{ward.resolution_rate}% resolved</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{ward.avg_sla_hours ?? "—"}h</p>
                    <p className="text-[10px] text-muted-foreground">Avg SLA</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap">
            <Card className="overflow-hidden"><CardContent className="p-0 h-[500px]">
              <IssueMap reports={heatmapData as Report[]} className="h-full rounded-none" />
            </CardContent></Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-4">
            {gallery.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground"><ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No resolved issues with proof yet</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gallery.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-2">
                        <div className="relative h-40">
                          <img src={item.image_url} alt="Before" className="w-full h-full object-cover" />
                          <Badge className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px]">Before</Badge>
                        </div>
                        <div className="relative h-40">
                          <img src={item.proof_url!} alt="After" className="w-full h-full object-cover" />
                          <Badge className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px]">After</Badge>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className={cn("text-[10px] h-4", CATEGORY_CONFIG[item.category]?.color)}>{CATEGORY_CONFIG[item.category]?.label}</Badge>
                          {item.sla_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Resolved in {item.sla_hours}h</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
