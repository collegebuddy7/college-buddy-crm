export type LeadStatus = "NEW" | "LEAD" | "INTERESTED" | "ENROLLED" | "NOT_INTERESTED";
export type InterestLevel = "HIGH" | "MID" | "LOW";
export type CallDirection = "INCOMING" | "OUTGOING";

export interface Agent {
  id: string;
  name: string;
  mobile: string;
}

export interface CallHistory {
  id: string;
  accountId: string;
  agentId: string;
  direction: CallDirection;
  notes?: string | null;
  calledAt: string;
  agent?: { name: string };
}

export interface StatusHistory {
  id: string;
  accountId: string;
  agentId: string;
  oldStatus: LeadStatus;
  newStatus: LeadStatus;
  changedAt: string;
  agent?: { name: string };
}

export interface Account {
  id: string;
  sr: number;
  name: string;
  college: string;
  number: string;
  session: string;
  status: LeadStatus;
  interest: InterestLevel;
  followUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
  callHistories?: CallHistory[];
  statusChanges?: StatusHistory[];
}
