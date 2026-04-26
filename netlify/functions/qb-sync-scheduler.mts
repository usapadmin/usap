**
 * USAP ERP — QB Sync Scheduler
 * Runs every 15 minutes to enqueue a full pull from QuickBooks
 * (QBWC will pick these up on its next poll)
 */

import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const SYNC_ENTITIES = [
  // List objects first (no dependencies)
  { entity_type: "accounts",          qb_action: "AccountQuery",           priority: 10 },
  { entity_type: "terms",             qb_action: "TermsQuery",             priority: 11 },
  { entity_type: "sales_tax_codes",   qb_action: "SalesTaxCodeQuery",      priority: 12 },
  { entity_type: "employees",         qb_action: "EmployeeQuery",          priority: 13 },
  // Master records
  { entity_type: "customers",         qb_action: "CustomerQuery",          priority: 20 },
  { entity_type: "vendors",           qb_action: "VendorQuery",            priority: 21 },
  { entity_type: "items",             qb_action: "ItemQuery",              priority: 22 },
  // Transactions (depend on master records)
  { entity_type: "sales_orders",      qb_action: "SalesOrderQuery",        priority: 30 },
  { entity_type: "invoices",          qb_action: "InvoiceQuery",           priority: 31 },
  { entity_type: "payments_received", qb_action: "ReceivePaymentQuery",    priority: 32 },
  { entity_type: "purchase_orders",   qb_action: "PurchaseOrderQuery",     priority: 33 },
  { entity_type: "bills",             qb_action: "BillQuery",              priority: 34 },
  { entity_type: "estimates",         qb_action: "EstimateQuery",          priority: 35 },
];

export default async (req: Request) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Skip if a full sync is already queued/in-progress
  const { count } = await supabase
    .from("qbwc_queue")
    .select("id", { count: "exact", head: true })
    .eq("direction", "from_qb")
    .in("status", ["pending", "in_progress"]);

  if ((count || 0) > 0) {
    console.log("Sync already queued, skipping.");
    return;
  }

  // Enqueue all entity pulls from QB
  const rows = SYNC_ENTITIES.map((e) => ({
    entity_type: e.entity_type,
    qb_action:   e.qb_action,
    direction:   "from_qb",
    priority:    e.priority,
    status:      "pending",
  }));

  const { error } = await supabase.from("qbwc_queue").insert(rows);
  if (error) {
    console.error("Failed to enqueue sync:", error.message);
  } else {
    console.log(`Enqueued ${rows.length} QB sync jobs at`, new Date().toISOString());
    await supabase.from("qbwc_config")
      .update({ value: new Date().toISOString() })
      .eq("key", "last_sync_from_qb");
  }
};

export const config: Config = {
  schedule: "*/15 * * * *",   // Every 15 minutes
};
