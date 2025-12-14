// Stub file for Resend email sync functionality
// TODO: Implement actual Resend sync functionality

export async function syncAllEmails(limit: number = 100) {
  return {
    success: false,
    unsupported: true,
    error: "Email sync not yet implemented",
    synced: 0,
    limit,
  };
}

export async function syncSentEmails(limit: number = 100) {
  return {
    success: false,
    unsupported: true,
    error: "Email sync not yet implemented",
    synced: 0,
    limit,
  };
}

export async function syncReceivedEmails(limit: number = 100) {
  return {
    success: false,
    unsupported: true,
    error: "Email sync not yet implemented",
    synced: 0,
    limit,
  };
}
