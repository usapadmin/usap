/**
 * USAP ERP — QuickBooks Web Connector (QBWC) SOAP Endpoint
 * Implements the full QBWC 2.x interface:
 *   authenticate, sendRequestXML, receiveResponseXML,
 *   getLastError, closeConnection, serverVersion, clientVersion
 */

import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { buildQbXmlRequest } from "./qbxml-builder.mjs";
import { parseQbXmlResponse } from "./qbxml-parser.mjs";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  Netlify.env.get("SUPABASE_URL")!,
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─── SOAP Envelope wrapper ──────────────────────────────────────────────────
function soapEnvelope(body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>${body}</soap:Body>
</soap:Envelope>`;
}

// ─── Extract text from a simple XML tag ────────────────────────────────────
function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

// ─── QBWC Method Handlers ──────────────────────────────────────────────────

async function handleServerVersion(): Promise<string> {
  return soapEnvelope(`
    <serverVersionResponse xmlns="http://developer.intuit.com/">
      <serverVersionResult>2.0</serverVersionResult>
    </serverVersionResponse>`);
}

async function handleClientVersion(xml: string): Promise<string> {
  return soapEnvelope(`
    <clientVersionResponse xmlns="http://developer.intuit.com/">
      <clientVersionResult></clientVersionResult>
    </clientVersionResponse>`);
}

async function handleAuthenticate(xml: string): Promise<string> {
  const username = extractTag(xml, "strUserName");
  const password = extractTag(xml, "strPassword");

  const { data: cfg } = await supabase
    .from("qbwc_config")
    .select("key,value")
    .in("key", ["qbwc_username", "qbwc_password"]);

  const cfgMap = Object.fromEntries((cfg || []).map((r: any) => [r.key, r.value]));

  if (username !== cfgMap.qbwc_username || password !== cfgMap.qbwc_password) {
    return soapEnvelope(`
      <authenticateResponse xmlns="http://developer.intuit.com/">
        <authenticateResult>
          <string>nvu</string>
          <string></string>
        </authenticateResult>
      </authenticateResponse>`);
  }

  const ticket = uuidv4();
  await supabase.from("qbwc_sessions").insert({
    ticket,
    username,
    status: "active",
  });

  // Check if there's anything to sync
  const { count } = await supabase
    .from("qbwc_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const hasWork = (count || 0) > 0;

  return soapEnvelope(`
    <authenticateResponse xmlns="http://developer.intuit.com/">
      <authenticateResult>
        <string>${ticket}</string>
        <string>${hasWork ? "" : "none"}</string>
      </authenticateResult>
    </authenticateResponse>`);
}

async function handleSendRequestXML(xml: string): Promise<string> {
  const ticket = extractTag(xml, "ticket");
  const hcpResponse = extractTag(xml, "hcpResponse");
  const companyFileName = extractTag(xml, "strCompanyFileName");
  const qbXMLCountry = extractTag(xml, "qbXMLCountry");
  const qbXMLMajorVers = extractTag(xml, "qbXMLMajorVers");
  const qbXMLMinorVers = extractTag(xml, "qbXMLMinorVers");

  // Update session metadata on first call
  await supabase.from("qbwc_sessions")
    .update({
      qb_company_file: companyFileName,
      qb_country: qbXMLCountry,
      qb_major_version: qbXMLMajorVers,
      qb_minor_version: qbXMLMinorVers,
    })
    .eq("ticket", ticket);

  // Get next pending item from queue
  const { data: jobs } = await supabase
    .from("qbwc_queue")
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1);

  if (!jobs || jobs.length === 0) {
    // Nothing left — send empty string to signal done
    return soapEnvelope(`
      <sendRequestXMLResponse xmlns="http://developer.intuit.com/">
        <sendRequestXMLResult></sendRequestXMLResult>
      </sendRequestXMLResponse>`);
  }

  const job = jobs[0];

  // Mark as in_progress
  await supabase.from("qbwc_queue").update({
    status: "in_progress",
    session_ticket: ticket,
    attempts: job.attempts + 1,
  }).eq("id", job.id);

  // Build the qbXML for this job
  let requestXml = "";
  try {
    requestXml = await buildQbXmlRequest(job, supabase);
  } catch (err: any) {
    await supabase.from("qbwc_queue").update({
      status: "error",
      last_error: err.message,
    }).eq("id", job.id);

    // Log it
    await supabase.from("qbwc_sync_logs").insert({
      session_ticket: ticket,
      queue_id: job.id,
      entity_type: job.entity_type,
      entity_id: job.entity_id,
      qb_action: job.qb_action,
      direction: job.direction,
      status: "error",
      error_message: err.message,
    });

    // Try next item recursively by returning empty (QBWC will call again)
    return soapEnvelope(`
      <sendRequestXMLResponse xmlns="http://developer.intuit.com/">
        <sendRequestXMLResult></sendRequestXMLResult>
      </sendRequestXMLResponse>`);
  }

  // Log the outgoing request
  await supabase.from("qbwc_sync_logs").insert({
    session_ticket: ticket,
    queue_id: job.id,
    entity_type: job.entity_type,
    entity_id: job.entity_id,
    qb_action: job.qb_action,
    direction: job.direction,
    request_xml: requestXml,
    status: "success",
  });

  return soapEnvelope(`
    <sendRequestXMLResponse xmlns="http://developer.intuit.com/">
      <sendRequestXMLResult>${escapeXml(requestXml)}</sendRequestXMLResult>
    </sendRequestXMLResponse>`);
}

async function handleReceiveResponseXML(xml: string): Promise<string> {
  const ticket = extractTag(xml, "ticket");
  const responseRaw = extractTag(xml, "response");
  const hresult = extractTag(xml, "hresult");
  const message = extractTag(xml, "message");

  // Find the in-progress job for this session
  const { data: jobs } = await supabase
    .from("qbwc_queue")
    .select("*")
    .eq("session_ticket", ticket)
    .eq("status", "in_progress")
    .limit(1);

  const job = jobs?.[0];

  if (hresult && hresult !== "0x00000000") {
    if (job) {
      await supabase.from("qbwc_queue").update({
        status: "error",
        last_error: `HRESULT: ${hresult} — ${message}`,
      }).eq("id", job.id);

      await supabase.from("qbwc_sync_logs").insert({
        session_ticket: ticket,
        queue_id: job.id,
        entity_type: job.entity_type,
        entity_id: job.entity_id,
        qb_action: job.qb_action,
        direction: job.direction,
        response_xml: responseRaw,
        status: "error",
        error_code: hresult,
        error_message: message,
      });
    }
    return soapEnvelope(`
      <receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
        <receiveResponseXMLResult>-1</receiveResponseXMLResult>
      </receiveResponseXMLResponse>`);
  }

  // Parse the QB response and update local records
  let percentage = 100;
  if (job && responseRaw) {
    try {
      const startMs = Date.now();
      await parseQbXmlResponse(job, responseRaw, supabase);
      const duration = Date.now() - startMs;

      await supabase.from("qbwc_queue").update({
        status: "done",
        processed_at: new Date().toISOString(),
      }).eq("id", job.id);

      await supabase.from("qbwc_sync_logs").update({
        response_xml: responseRaw,
        status: "success",
        duration_ms: duration,
      }).eq("queue_id", job.id);

    } catch (err: any) {
      await supabase.from("qbwc_queue").update({
        status: "error",
        last_error: err.message,
      }).eq("id", job.id);
    }
  }

  // Calculate how much of the queue is done
  const { count: total } = await supabase
    .from("qbwc_queue")
    .select("id", { count: "exact", head: true })
    .neq("status", "pending");

  const { count: remaining } = await supabase
    .from("qbwc_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if ((total || 0) + (remaining || 0) > 0) {
    percentage = Math.round(
      ((total || 0) / ((total || 0) + (remaining || 0))) * 100
    );
  }

  // Return percentage 0-100 (100 = done, QBWC stops)
  return soapEnvelope(`
    <receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
      <receiveResponseXMLResult>${percentage}</receiveResponseXMLResult>
    </receiveResponseXMLResponse>`);
}

async function handleGetLastError(xml: string): Promise<string> {
  const ticket = extractTag(xml, "ticket");

  const { data: session } = await supabase
    .from("qbwc_sessions")
    .select("error_message")
    .eq("ticket", ticket)
    .single();

  return soapEnvelope(`
    <getLastErrorResponse xmlns="http://developer.intuit.com/">
      <getLastErrorResult>${session?.error_message || ""}</getLastErrorResult>
    </getLastErrorResponse>`);
}

async function handleCloseConnection(xml: string): Promise<string> {
  const ticket = extractTag(xml, "ticket");

  await supabase.from("qbwc_sessions").update({
    status: "completed",
  }).eq("ticket", ticket);

  // Update last sync timestamps
  await supabase.from("qbwc_config").update({ value: new Date().toISOString() })
    .eq("key", "last_full_sync");

  return soapEnvelope(`
    <closeConnectionResponse xmlns="http://developer.intuit.com/">
      <closeConnectionResult>OK</closeConnectionResult>
    </closeConnectionResponse>`);
}

// ─── XML escape helper ──────────────────────────────────────────────────────
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Route by SOAP action ───────────────────────────────────────────────────
async function routeSoapAction(action: string, body: string): Promise<string> {
  if (action.includes("serverVersion"))      return handleServerVersion();
  if (action.includes("clientVersion"))      return handleClientVersion(body);
  if (action.includes("authenticate"))       return handleAuthenticate(body);
  if (action.includes("sendRequestXML"))     return handleSendRequestXML(body);
  if (action.includes("receiveResponseXML")) return handleReceiveResponseXML(body);
  if (action.includes("getLastError"))       return handleGetLastError(body);
  if (action.includes("closeConnection"))    return handleCloseConnection(body);

  return soapEnvelope(`<fault><faultstring>Unknown action: ${action}</faultstring></fault>`);
}

// ─── Main handler ───────────────────────────────────────────────────────────
export default async (req: Request, context: Context) => {
  if (req.method === "GET") {
    // Health check / WSDL hint
    return new Response(JSON.stringify({ status: "USAP QBWC endpoint active" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.text();
  const soapAction = req.headers.get("SOAPAction") || "";

  // Extract action from SOAPAction header or body
  let action = soapAction.replace(/"/g, "").trim();
  if (!action) {
    // Fall back to detecting from XML body
    const m = body.match(/<(\w+)\s+xmlns="http:\/\/developer\.intuit\.com\//);
    if (m) action = m[1];
  }

  try {
    const response = await routeSoapAction(action, body);
    return new Response(response, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("QBWC error:", err);
    return new Response(
      soapEnvelope(`<soap:Fault><faultstring>${err.message}</faultstring></soap:Fault>`),
      { status: 500, headers: { "Content-Type": "text/xml; charset=utf-8" } }
    );
  }
};

export const config: Config = {
  path: "/api/qbwc",
};
