import type { Request, Response } from "express";

export async function handleVoiceTurn(_req: Request, res: Response) {
  return res.status(501).json({ success: false, message: "Voice chat service not configured" });
}
