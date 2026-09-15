import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
  property_id: string | null;
  recipient_role: string | null;
}

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — TerraTrust AI" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, profile } = useAuth();
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const role = profile?.role || user.user_metadata?.role || "citizen";

    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, read, created_at, property_id, recipient_role")
      .or(`user_id.eq.${user.id},recipient_role.eq.${role}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotificationsList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id, profile?.role]);

  const handleMarkAllRead = async () => {
    if (!user || notificationsList.length === 0) return;
    setMarking(true);
    const unreadIds = notificationsList.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) {
      setMarking(false);
      toast.info("All notifications are already marked as read.");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    setMarking(false);
    if (error) {
      toast.error("Failed to mark notifications read: " + error.message);
    } else {
      toast.success("All notifications marked as read.");
      setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <AppShell
      title="Notifications"
      subtitle="Live stakeholder alerts, surveyor assignments, and official registry updates."
      actions={
        <Button
          variant="outline"
          className="rounded-full"
          onClick={handleMarkAllRead}
          disabled={marking || notificationsList.length === 0}
        >
          <CheckCheck className="h-4 w-4 mr-1.5" />
          {marking ? "Marking…" : "Mark all read"}
        </Button>
      }
    >
      {loading ? (
        <div className="surface-card flex items-center justify-center p-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          Loading notifications…
        </div>
      ) : notificationsList.length === 0 ? (
        <div className="surface-card p-12 text-center rounded-xl border border-dashed border-border">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-medium text-foreground text-sm">No notifications found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You are completely up to date. Property verifications, surveyor updates, and official
            decisions will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="surface-card divide-y divide-border rounded-xl border border-border overflow-hidden">
          {notificationsList.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-5 transition ${!n.read ? "bg-primary/[0.04]" : "hover:bg-muted/30"}`}
            >
              <span
                className={`mt-2 h-2.5 w-2.5 rounded-full shrink-0 ${!n.read ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/40"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm ${!n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}
                  >
                    {n.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground shrink-0">
                    {formatDate(n.created_at)}
                  </p>
                </div>
                {n.message && (
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                )}
                {n.recipient_role && (
                  <span className="inline-block mt-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                    Role: {n.recipient_role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
