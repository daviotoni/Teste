
export interface User {
  id: number;
  name: string;
  login: string;
  hashedPassword?: string;
  salt?: string;
  role: 'admin' | 'user';
}

export interface Emissor {
  id: number;
  name: string;
}

export interface Process {
  id: number;
  num: string;
  tipo: 'administrativo' | 'judicial';
  int: string;
  setorOrigem: string;
  dest: string;
  obj: string;
  acao: string;
  ent: string;
  prazo?: string;
  saida?: string;
  stat: 'pendente' | 'em-analise' | 'aguardando-documentacao' | 'em-diligencia' | 'finalizado' | 'arquivado';
  emissorId?: string;
  docId?: number;
}

export interface CalendarEvent {
  id: number | string;
  data: string;
  hora: string;
  desc: string;
  cat: 'g' | 'a' | 'r' | 'p' | 'u' | 'e' | 'o';
  readonly?: boolean;
}

export interface Document {
  id: number;
  nomePrincipal: string;
  criadoEm: string;
  idVersaoAtual: number | null;
}

export interface DocumentVersion {
  id: number;
  idDocumento: number;
  versao: number;
  nomeArquivo: string;
  data: string; // base64
  adicionadoEm: string;
}

export interface DocumentModel {
  id: number;
  name: string;
  data: string; // base64
}

export interface Law {
  id: number;
  tipo: 'Lei Federal' | 'Lei Estadual' | 'Lei Municipal' | 'Decreto' | 'Portaria' | 'Outro';
  numero: string;
  ano: string;
  ementa: string;
  link?: string;
  arquivo?: { name: string; data: string }; // base64
}

export interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'danger' | 'info';
}

export type Theme = 'light' | 'dark' | 'system';

export type TabKey = 'dashboard' | 'proc' | 'cal' | 'docs' | 'leis' | 'cfg';

export interface ProcessFilter {
  text?: string;
  status?: Process['stat'];
  prazo?: 'alerta' | 'vencido';
  month?: number;
}

export interface Notification {
  id: string; // e.g., 'proc-123-due-5' or 'cal-456'
  type: 'prazo' | 'evento' | 'alerta';
  title: string;
  subtitle: string;
  date: string; // ISO string for sorting
  navInfo: {
    tab: TabKey;
    filter?: ProcessFilter;
    date?: string; // For calendar navigation
  };
}
