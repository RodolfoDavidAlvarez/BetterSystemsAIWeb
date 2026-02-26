import type { Request, Response } from "express";

export async function handlePlaudWebhook(_req: Request, res: Response) {
  return res.status(200).json({ success: true, message: "Plaud webhook received (stub)" });
}

export async function getAllRecordings(_req: Request, res: Response) {
  return res.json({ success: true, data: [] });
}

export async function getRecordingById(_req: Request, res: Response) {
  return res.json({ success: true, data: null });
}

export async function updateRecording(_req: Request, res: Response) {
  return res.json({ success: true });
}

export async function retranscribeRecording(_req: Request, res: Response) {
  return res.json({ success: true, queued: false });
}

export async function deleteRecording(_req: Request, res: Response) {
  return res.json({ success: true });
}
