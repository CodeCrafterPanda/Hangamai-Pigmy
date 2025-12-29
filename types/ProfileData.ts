/**
 * Type definitions for Profile screen data
 */

export interface AgentProfile {
  id: string;
  name: string;
  agentId: string;
  role: string;
  avatarUrl?: string;
  isOnline: boolean;
  branch: string;
  branchCode: string;
  lastSyncTime: string;
  appVersion: string;
  buildNumber: string;
}

