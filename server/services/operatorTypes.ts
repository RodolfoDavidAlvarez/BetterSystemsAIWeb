export type OperatorActionEvent = {
  id: string;
  type?: string;
  payload?: any;
};

export type OperatorTranscriptLine = {
  role: "user" | "assistant" | "system";
  text: string;
  at?: string;
};
