export async function getOpenClawConfigSnapshot() {
  return { connected: false, config: null };
}

export async function getOpenClawStatusSnapshot() {
  return { connected: false, status: "unavailable" };
}
