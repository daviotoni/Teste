// Tipos das respostas da API institucional (UUIDs, modelo normalizado).
export interface MeResponse {
  id: string;
  displayName: string;
  email: string | null;
  roles: { code: string; name: string; organizationalUnitId: string | null }[];
  units: { id: string; code: string; officialName: string; officialAcronym: string | null }[];
  permissions: string[];
}

export interface ProcessSummary {
  id: string;
  number: string | null;
  subject: string;
  status: string;
  priority: string;
  responsibleUnitId: string;
  originUnitId: string;
  updatedAt: string;
  version: number;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  processId: string | null;
  assignedUnitId: string | null;
  assignedUserId: string | null;
  version: number;
}

export interface DeadlineSummary {
  id: string;
  dueAt: string;
  status: string;
  processId: string | null;
  taskId: string | null;
  overdue: boolean;
}

export interface SignatureItem {
  documentId: string;
  title: string;
  versionId: string;
  versionNumber: number;
  signatureId: string;
  signatureStatus: string;
}

export interface MovementItem {
  id: string;
  processId: string;
  newStatus: string;
  fromUnitId: string | null;
  toUnitId: string | null;
  justification: string | null;
  occurredAt: string;
}

export interface UnitInbox {
  receivedProcesses: ProcessSummary[];
  undistributedProcesses: ProcessSummary[];
  assignedToMe: ProcessSummary[];
  inAnalysis: ProcessSummary[];
  pendingTasks: TaskSummary[];
  deadlines: DeadlineSummary[];
  documentsAwaitingSignature: SignatureItem[];
  lastMovements: MovementItem[];
  allowedActions: {
    createProcess: boolean;
    assignProcess: boolean;
    forwardProcess: boolean;
    createDocument: boolean;
  };
}

export interface OrganizationalUnit {
  id: string;
  code: string;
  officialName: string;
  officialAcronym: string | null;
}
