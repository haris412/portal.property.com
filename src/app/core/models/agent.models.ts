/** Agent user row from GET `/api/agents`. */
export interface AgentListItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  displayName?: string;
  profileImageUrl?: string;
  location?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  inviteStatus?: string;
  role?: { name: string };
  createdAt?: string;
}

export interface AgentsListResult {
  agents: AgentListItem[];
  total?: number;
}

export interface CreateAgentDTO {
  agencyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  location?: string;
  profileImageUrl?: string;
}

/** Body for PUT `/api/agents/updateAgent`. */
export interface UpdateAgentDTO {
  _id: string;
  agencyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  displayName?: string;
  profileImageUrl?: string;
  location?: string;
}

/** Body for PATCH `/api/agents/deactivate`. */
export interface DeactivateAgentDTO {
  _id: string;
  agencyId: string;
}
