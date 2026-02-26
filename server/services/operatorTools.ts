export async function createOperatorActionEvent(payload: any) {
  return { id: Date.now().toString(), ...payload };
}

export async function executeOperatorTool() {
  return { success: false, message: "Operator tools not configured" };
}
