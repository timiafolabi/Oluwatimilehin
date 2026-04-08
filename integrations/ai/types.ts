import type { NormalizedEmail, TriageResult } from "@/types/email";
import type { AgentAction } from "@/types/actions";

export interface AIProvider {
  triageEmail(email: NormalizedEmail): Promise<TriageResult>;
  draftReply(email: NormalizedEmail, instruction: string): Promise<string>;
  interpretCommand(input: string, contextEmailId?: string): Promise<AgentAction>;
}
