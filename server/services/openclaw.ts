import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

interface GatewayProbe {
  label: "local" | "vps";
  endpoint: string;
  host: string;
  port: number;
  reachable: boolean;
  latencyMs: number | null;
  httpReachable: boolean;
  details: string;
}

interface WorkspaceProbe {
  path: string;
  requiredFiles: string[];
  presentFiles: string[];
  missingFiles: string[];
  ready: boolean;
}

interface RuntimeProbe {
  openAiConfigured: boolean;
  anthropicConfigured: boolean;
  elevenLabsConfigured: boolean;
  gatewayTokenConfigured: boolean;
  recommendedAudioStack: "openai-realtime" | "elevenlabs-convai";
  operatorVoiceEnabled: boolean;
  operatorToolsEnabled: boolean;
  realtimeModel: string;
}

export interface OpenClawStatusSnapshot {
  generatedAt: string;
  localGateway: GatewayProbe;
  vpsGateway: GatewayProbe;
  workspace: WorkspaceProbe;
  runtime: RuntimeProbe;
}

export interface OpenClawConfigSnapshot {
  localGatewayUrl: string;
  vpsGatewayHost: string;
  vpsGatewayPort: number;
  vpsGatewayWsUrl: string;
  sshTunnelCommand: string;
  localGatewayUiUrl: string;
  vpsGatewayUiUrlLocalTunnel: string;
  workspacePath: string;
  stateDir: string;
}

const REQUIRED_WORKSPACE_FILES = ["CLAUDE.md", "SOUL.md", "TOOLS.md", "AGENTS.md", "IDENTITY.md", "USER.md"];

function resolveWorkspacePath() {
  return process.env.OPENCLAW_WORKSPACE_DIR || path.resolve(process.cwd(), "..", "OpenClaw-VPS-Setup", "workspace");
}

function parseGatewayUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname;
    const port = parsed.port ? Number(parsed.port) : parsed.protocol === "https:" ? 443 : 80;
    return { host, port, endpoint: parsed.origin };
  } catch {
    return { host: "127.0.0.1", port: 18789, endpoint: "http://127.0.0.1:18789" };
  }
}

function checkTcp(host: string, port: number, timeoutMs = 1200): Promise<{ reachable: boolean; latencyMs: number | null; details: string }> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (reachable: boolean, details: string) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        reachable,
        latencyMs: reachable ? Date.now() - startedAt : null,
        details,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true, "TCP connection succeeded"));
    socket.once("timeout", () => finish(false, `Timeout after ${timeoutMs}ms`));
    socket.once("error", (err: Error) => finish(false, err.message));
    socket.connect(port, host);
  });
}

async function checkHttp(baseUrl: string): Promise<boolean> {
  const targets = [`${baseUrl}/api/health`, baseUrl];
  for (const target of targets) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(target, { method: "GET", signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status === 401 || res.status === 403) return true;
    } catch {
      // no-op
    }
  }
  return false;
}

async function probeWorkspace(workspacePath: string): Promise<WorkspaceProbe> {
  const presentFiles: string[] = [];
  const missingFiles: string[] = [];

  await Promise.all(
    REQUIRED_WORKSPACE_FILES.map(async (fileName) => {
      const filePath = path.join(workspacePath, fileName);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          presentFiles.push(fileName);
        } else {
          missingFiles.push(fileName);
        }
      } catch {
        missingFiles.push(fileName);
      }
    })
  );

  return {
    path: workspacePath,
    requiredFiles: REQUIRED_WORKSPACE_FILES,
    presentFiles: presentFiles.sort(),
    missingFiles: missingFiles.sort(),
    ready: missingFiles.length === 0,
  };
}

export function getOpenClawConfigSnapshot(): OpenClawConfigSnapshot {
  const localGatewayUrl = process.env.OPENCLAW_LOCAL_GATEWAY_URL || "http://127.0.0.1:18789";
  const vpsGatewayHost = process.env.OPENCLAW_VPS_HOST || "143.198.74.96";
  const vpsGatewayPort = Number(process.env.OPENCLAW_VPS_PORT || "18789");
  const vpsToken = process.env.OPENCLAW_VPS_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || "SET_TOKEN";

  return {
    localGatewayUrl,
    vpsGatewayHost,
    vpsGatewayPort,
    vpsGatewayWsUrl: `ws://${vpsGatewayHost}:${vpsGatewayPort}`,
    sshTunnelCommand: `ssh -N -L ${vpsGatewayPort}:127.0.0.1:${vpsGatewayPort} root@${vpsGatewayHost}`,
    localGatewayUiUrl: `${localGatewayUrl}/`,
    vpsGatewayUiUrlLocalTunnel: `http://127.0.0.1:${vpsGatewayPort}/#token=${vpsToken}`,
    workspacePath: resolveWorkspacePath(),
    stateDir: process.env.OPENCLAW_STATE_DIR || path.join(os.homedir(), ".openclaw"),
  };
}

export async function getOpenClawStatusSnapshot(): Promise<OpenClawStatusSnapshot> {
  const config = getOpenClawConfigSnapshot();

  const localParsed = parseGatewayUrl(config.localGatewayUrl);
  const vpsHost = config.vpsGatewayHost;
  const vpsPort = config.vpsGatewayPort;

  const [localTcp, localHttpReachable, vpsTcp, workspace] = await Promise.all([
    checkTcp(localParsed.host, localParsed.port),
    checkHttp(config.localGatewayUrl),
    checkTcp(vpsHost, vpsPort),
    probeWorkspace(config.workspacePath),
  ]);

  const runtime: RuntimeProbe = {
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
    anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    elevenLabsConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
    gatewayTokenConfigured: Boolean(process.env.OPENCLAW_VPS_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN),
    recommendedAudioStack: process.env.OPENAI_API_KEY ? "openai-realtime" : "elevenlabs-convai",
    operatorVoiceEnabled: process.env.OPERATOR_VOICE_ENABLED !== "false",
    operatorToolsEnabled: process.env.OPERATOR_TOOLS_ENABLED !== "false",
    realtimeModel: process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview",
  };

  return {
    generatedAt: new Date().toISOString(),
    localGateway: {
      label: "local",
      endpoint: config.localGatewayUrl,
      host: localParsed.host,
      port: localParsed.port,
      reachable: localTcp.reachable,
      latencyMs: localTcp.latencyMs,
      httpReachable: localHttpReachable,
      details: localTcp.details,
    },
    vpsGateway: {
      label: "vps",
      endpoint: `${vpsHost}:${vpsPort}`,
      host: vpsHost,
      port: vpsPort,
      reachable: vpsTcp.reachable,
      latencyMs: vpsTcp.latencyMs,
      httpReachable: false,
      details: vpsTcp.details,
    },
    workspace,
    runtime,
  };
}
