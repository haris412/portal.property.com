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
  isFeaturedAgent?: boolean;
  isActive?: boolean;
  isEmailVerified?: boolean;
  inviteStatus?: string;
  inviteToken?: string;
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
  isFeaturedAgent?: boolean;
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
  isFeaturedAgent?: boolean;
}

/** Body for PATCH `/api/agents/deactivate`. */
export interface DeactivateAgentDTO {
  _id: string;
  agencyId: string;
}

/** Body for PATCH `/api/agents/set-password`. */
export interface SetAgentPasswordDTO {
  _id: string;
  agencyId: string;
  password: string;
}
