import axios from "axios";

const BASE = process.env.NOTIF_MS_BASE_URL || "http://localhost:4010/api";
const API_KEY = process.env.NOTIF_MS_API_KEY || "";

export interface EmailInput {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  metadata?: Record<string, any>;
}

export async function sendEmail(input: EmailInput & { app?: string }) {
  const payload = {
    app: input.app || process.env.APP_NAME || "turnos",
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    cc: input.cc,
    bcc: input.bcc,
    replyTo: input.replyTo,
    metadata: input.metadata,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const url = `${BASE}/notifications/email`;
  const resp = await axios.post(url, payload, { headers, timeout: 15000 });
  return resp.data; // { status, jobId, ... }
}
