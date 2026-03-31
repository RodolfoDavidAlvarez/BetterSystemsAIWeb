export type OperatorToolName =
  | "send_email"
  | "search_emails"
  | "search_clients"
  | "get_client_details"
  | "create_client"
  | "search_deals"
  | "update_deal_stage"
  | "log_deal_interaction"
  | "get_billing_summary"
  | "create_invoice"
  | "get_tasks"
  | "create_task"
  | "update_task"
  | "save_memory_note"
  | "get_business_context"
  | "system_health";

export interface OperatorToolDefinition {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface OperatorRealtimeSession {
  sessionId: string;
  model: string;
  voice: string;
  realtimeUrl: string;
  clientSecret: string;
  instructions: string;
  tools: OperatorToolDefinition[];
  createdAt: string;
}

export interface OperatorActionEvent {
  id: string;
  sessionId: string;
  utteranceId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  success: boolean;
  result: unknown;
  error?: string;
  durationMs: number;
  createdAt: string;
}

export interface OperatorTranscriptLine {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
}

export interface OperatorFinalizePayload {
  sessionId: string;
  transcript: OperatorTranscriptLine[];
  actions: OperatorActionEvent[];
  summary: string;
  checkpoint?: boolean;
}

export interface OperatorSessionRecord {
  sessionId: string;
  createdAt: string;
  lastUpdatedAt: string;
  finalizedAt?: string;
  transcript: OperatorTranscriptLine[];
  actions: OperatorActionEvent[];
  summary?: string;
  savedFiles: string[];
}
