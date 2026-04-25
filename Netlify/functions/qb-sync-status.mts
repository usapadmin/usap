/**
 * USAP ERP — QB Sync Status API
 * Returns current sync state, queue depth, and recent logs
 */

import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export default async (req: Request, context: Context) => {
  const supabase = createClient(
    Netlify.env.get("SUPABASE_URL")!,
    Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [queueStats, recentLogs, config, sessions] = await Promise.all([
    // Queue breakdown by status
    supabase.from("qbwc_queue")
      .select("status, direction, entity_type")
      .order("created_at", { ascending: false }),

    // Last 20 sync log entries
    supabase.from("qbwc_sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),

    // Config values
    supabase.from("qbwc_config").select("key,value"),

    // Active sessions
    supabase.from("qbwc_sessions")
      .select("ticket, status, progress, created_at, qb_company_file")
      .eq("status", "active")
      .limit(5),
  ]);

  const queue = queueStats.data || [];
  const summary = {
    pending:     queue.filter((q) => q.status === "pending").length,
    in_progress: queue.filter((q) => q.status === "in_progress").length,
    done:        queue.filter((q) => q.status === "done").length,
    error:       queue.filter((q) => q.status === "error").length,
    to_qb:       queue.filter((q) => q.direction === "to_qb").length,
    from_qb:     queue.filter((q) => q.direction === "from_qb").length,
  };

  const cfgMap = Object.fromEntries(
    (config.data || []).map((r: any) => [r.key, r.value])
  );

  return new Response(JSON.stringify({
    ok: true,
    queue_summary: summary,
    config: {
      app_url:         cfgMap.app_url,
      last_full_sync:  cfgMap.last_full_sync,
      last_sync_from_qb: cfgMap.last_sync_from_qb,
      last_sync_to_qb:   cfgMap.last_sync_to_qb,
      sync_interval_min: cfgMap.sync_interval_min,
    },
    active_sessions: sessions.data || [],
    recent_logs:     recentLogs.data || [],
  }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/qb-sync-status",
};
