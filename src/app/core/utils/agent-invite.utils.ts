export function normalizeInviteStatusKey(inviteStatus?: string | null): string {
  return inviteStatus?.trim().replace(/\s+/g, '').toLowerCase() ?? '';
}

export function isAcceptedInviteStatus(inviteStatus?: string | null): boolean {
  return normalizeInviteStatusKey(inviteStatus) === 'accepted';
}

export function isPendingInviteStatus(inviteStatus?: string | null): boolean {
  const key = normalizeInviteStatusKey(inviteStatus);
  return key.length > 0 && key !== 'accepted' && key.includes('pending');
}

export function extractInviteToken(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }

  const record = raw as Record<string, unknown>;
  const directCandidates = [
    record['inviteToken'],
    record['inviteSetupToken'],
    record['setupToken'],
    record['passwordSetupToken'],
    record['token'],
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  const invite = record['invite'];
  if (invite && typeof invite === 'object' && !Array.isArray(invite)) {
    return extractInviteToken(invite);
  }

  return undefined;
}
