import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Utensils, Users, CheckCircle, XCircle, Clock, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Row {
  restaurantId: number;
  restaurantName: string;
  slug: string;
  active: boolean;
  userId: number;
  username: string;
  fullName: string | null;
  plan: string | null;
  trialEndsAt: string | null;
}

function planBadge(plan: string | null, trialEndsAt: string | null) {
  if (plan === "active")
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>;
  if (plan === "expired")
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Expired</span>;

  // trial
  const daysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
    : null;
  if (daysLeft !== null && daysLeft <= 0)
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Trial expired</span>;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
      Trial · {daysLeft !== null ? `${daysLeft}d left` : "?"}
    </span>
  );
}

export default function SuperAdmin() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "trial" | "active" | "expired">("all");

  const { data: rows = [], isLoading, isError } = useQuery<Row[]>({
    queryKey: ["/api/superadmin/dashboard"],
    retry: false,
  });

  const planMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: number; plan: string }) => {
      const res = await fetch(`/api/superadmin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/dashboard"] });
      toast({ title: "Plan updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "active") return r.plan === "active";
    if (filter === "expired") return r.plan === "expired" || (r.plan === "trial" && r.trialEndsAt && new Date(r.trialEndsAt) < new Date());
    return r.plan === "trial";
  });

  const counts = {
    all: rows.length,
    active: rows.filter((r) => r.plan === "active").length,
    trial: rows.filter((r) => r.plan === "trial" && (!r.trialEndsAt || new Date(r.trialEndsAt) > new Date())).length,
    expired: rows.filter((r) => r.plan === "expired" || (r.plan === "trial" && r.trialEndsAt && new Date(r.trialEndsAt) < new Date())).length,
  };

  if (isError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="font-bold text-foreground">Access denied</p>
          <p className="text-sm text-muted-foreground mt-1">You must be logged in as the super-admin.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Utensils className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-black text-foreground text-lg leading-none">Super Admin</h1>
            <p className="text-xs text-muted-foreground mt-0.5">HAJDE HA Platform</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: counts.all, icon: Users, color: "text-foreground" },
            { label: "Active", value: counts.active, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
            { label: "On trial", value: counts.trial, icon: Clock, color: "text-orange-600 dark:text-orange-400" },
            { label: "Expired", value: counts.expired, icon: XCircle, color: "text-red-600 dark:text-red-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-5">
              <Icon className={`h-5 w-5 mb-2 ${color}`} />
              <div className="text-2xl font-black text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "trial", "expired"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-white dark:bg-stone-900 text-muted-foreground border border-stone-200 dark:border-stone-700 hover:border-primary hover:text-foreground"}`}
            >
              {f} <span className="opacity-60 text-xs">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading accounts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No accounts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurant</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trial ends</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                  {filtered.map((row) => (
                    <tr key={row.restaurantId} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{row.restaurantName}</span>
                          <a
                            href={`/restaurant/${row.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">/{row.slug}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{row.fullName || row.username}</div>
                        <div className="text-xs text-muted-foreground">@{row.username}</div>
                      </td>
                      <td className="px-5 py-4">
                        {planBadge(row.plan, row.trialEndsAt)}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {row.trialEndsAt
                          ? new Date(row.trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {row.plan !== "active" && (
                            <button
                              onClick={() => planMutation.mutate({ userId: row.userId, plan: "active" })}
                              disabled={planMutation.isPending}
                              className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              Activate
                            </button>
                          )}
                          {row.plan !== "trial" && (
                            <button
                              onClick={() => planMutation.mutate({ userId: row.userId, plan: "trial" })}
                              disabled={planMutation.isPending}
                              className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                              Trial
                            </button>
                          )}
                          {row.plan !== "expired" && (
                            <button
                              onClick={() => planMutation.mutate({ userId: row.userId, plan: "expired" })}
                              disabled={planMutation.isPending}
                              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              Expire
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
