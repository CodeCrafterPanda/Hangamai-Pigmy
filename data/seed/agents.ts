import { AgentStatus } from '@/types';
import { DEMO_AGENT_ID, DEMO_AGENT_THREE_ID, DEMO_AGENT_TWO_ID, DEMO_BRANCH_ID } from './ids';
import type { SeedAgent } from './types';

/**
 * DEMO_AGENT_ID is the logged-in agent. The other two own the customers that are delegated
 * to the logged-in agent, so the delegated (secondary) flow has real data behind it.
 */
export const seedAgents: SeedAgent[] = [
  {
    id: DEMO_AGENT_ID,
    branchId: DEMO_BRANCH_ID,
    name: 'Demo Agent',
    agentCode: 'AGT-001',
    phone: '9876543200',
    status: AgentStatus.ACTIVE,
  },
  {
    id: DEMO_AGENT_TWO_ID,
    branchId: DEMO_BRANCH_ID,
    name: 'Agent Two',
    agentCode: 'AGT-002',
    phone: '9876543201',
    status: AgentStatus.ACTIVE,
  },
  {
    id: DEMO_AGENT_THREE_ID,
    branchId: DEMO_BRANCH_ID,
    name: 'Agent Three',
    agentCode: 'AGT-003',
    phone: '9876543202',
    status: AgentStatus.ACTIVE,
  },
];
