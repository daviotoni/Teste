
import type { Process, CalendarEvent, Notification } from './types';

// Assume XLSX is available on window from CDN
declare const XLSX: any;


export const statusMap: { [key in Process['stat']]: string } = {
  'pendente': 'Pendente',
  'em-analise': 'Em Análise',
  'aguardando-documentacao': 'Aguardando Documentação',
  'em-diligencia': 'Em Diligência',
  'finalizado': 'Finalizado',
  'arquivado': 'Arquivado'
};

export const statusColorMap: { [key in Process['stat']]: string } = {
  'pendente': 'bg-red-500 text-white',
  'em-analise': 'bg-yellow-500 text-white',
  'aguardando-documentacao': 'bg-blue-500 text-white',
  'em-diligencia': 'bg-purple-500 text-white',
  'finalizado': 'bg-green-500 text-white',
  'arquivado': 'bg-slate-500 text-white'
};

export const SETORES = ['Comissões', 'Controladoria', 'CPL', 'Depto. Financeiro', 'Diretoria Geral', 'Gabinete Vereador', 'Presidência', 'Recursos Humanos', 'Secretaria Geral', 'Outros'].sort();


// Date Utils
export const fmtBR = (d?: string): string => {
  if (!d) return '—';
  // Handles 'YYYY-MM-DD'
  const parts = d.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const date = new Date(d);
  if (!isNaN(date.getTime())) {
     return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }
  return d; // fallback
};

export const parse = (d?: string): Date | null => {
  if (!d) return null;
  const [y, m, dd] = d.split('-').map(Number);
  // Check if parts are valid numbers
  if (isNaN(y) || isNaN(m) || isNaN(dd)) {
    // Try parsing with new Date() as a fallback for full ISO strings
    const date = new Date(d);
    if (!isNaN(date.getTime())) {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    return null;
  }
  return new Date(Date.UTC(y, (m || 1) - 1, (dd || 1)));
};

export const todayUTC = (): Date => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

export const diffDays = (a: Date, b: Date): number => Math.ceil((b.getTime() - a.getTime()) / 86400000);

export const ymd = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// Notification Generator
export const generateNotifications = (processos: Process[], calendario: CalendarEvent[]): Notification[] => {
    const notifications: Notification[] = [];
    const hoje = todayUTC();

    // Process Deadlines
    processos.forEach(p => {
        if (p.prazo && p.stat !== 'finalizado' && p.stat !== 'arquivado') {
            const prazoDate = parse(p.prazo);
            if (!prazoDate) return;

            const daysDiff = diffDays(hoje, prazoDate);
            const alertDays = [0, 1, 3, 5];

            if (alertDays.includes(daysDiff)) {
                notifications.push({
                    id: `proc-${p.id}-due-${daysDiff}`,
                    type: 'prazo',
                    date: p.prazo,
                    title: `Prazo: ${p.num}`,
                    subtitle: daysDiff === 0 ? `Vence hoje!` : `Vence em ${daysDiff} dia(s).`,
                    navInfo: { tab: 'proc', filter: { text: p.num } }
                });
            } else if (daysDiff < 0) {
                 notifications.push({
                    id: `proc-${p.id}-vencido`,
                    type: 'alerta',
                    date: p.prazo,
                    title: `Vencido: ${p.num}`,
                    subtitle: `Prazo expirou há ${Math.abs(daysDiff)} dia(s).`,
                    navInfo: { tab: 'proc', filter: { text: p.num } }
                });
            }
        }
    });

    // Calendar Events
    const futuro7 = new Date(hoje);
    futuro7.setUTCDate(hoje.getUTCDate() + 7);

    calendario.forEach(e => {
        if (e.data && e.cat !== 'p' && !e.readonly) { // Don't notify for 'prazo' type or readonly events
            const eventDate = parse(e.data);
            if (eventDate && eventDate >= hoje && eventDate <= futuro7) {
                 notifications.push({
                    id: `cal-${e.id}`,
                    type: 'evento',
                    date: e.data,
                    title: `Evento: ${e.desc}`,
                    subtitle: `Em ${fmtBR(e.data)}${e.hora ? ` às ${e.hora}` : ''}`,
                    navInfo: { tab: 'cal', date: e.data }
                });
            }
        }
    });
    
    return notifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};


// Export Utils
export const exportCSV = (data: Process[], showToast: (msg: string, type?: any) => void) => {
  if (data.length === 0) {
    showToast('Nenhum dado para exportar.', 'info');
    return;
  }
  const headers = ['Nº Processo', 'Interessado', 'Tipo', 'Status', 'Objeto', 'Ação Tomada', 'Data Entrada', 'Prazo Final', 'Data Saída'];
  const rows = data.map(p =>
    [
      `"${p.num || ''}"`,
      `"${p.int || ''}"`,
      `"${p.tipo || ''}"`,
      `"${statusMap[p.stat] || ''}"`,
      `"${(p.obj || '').replace(/"/g, '""')}"`,
      `"${(p.acao || '').replace(/"/g, '""')}"`,
      `"${p.ent ? fmtBR(p.ent) : ''}"`,
      `"${p.prazo ? fmtBR(p.prazo) : ''}"`,
      `"${p.saida ? fmtBR(p.saida) : ''}"`
    ].join(',')
  );
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "processos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Dados exportados para CSV!');
};

export const exportXLSX = (data: Process[], showToast: (msg: string, type?: any) => void) => {
    if (data.length === 0) {
        showToast('Nenhum dado para exportar.', 'info');
        return;
    }
  showToast('Iniciando exportação para Excel...', 'info');
  try {
    if (typeof XLSX === 'undefined') throw new Error('Biblioteca XLSX não carregada.');
    const dataForSheet = data.map(p => ({
      'Nº Processo': p.num || '',
      'Interessado': p.int || '',
      'Tipo': p.tipo ? (p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)) : '',
      'Status': statusMap[p.stat] || '',
      'Objeto': p.obj || '',
      'Entrada': p.ent ? fmtBR(p.ent) : '',
      'Prazo': p.prazo ? fmtBR(p.prazo) : '',
      'Saída': p.saida ? fmtBR(p.saida) : '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Processos');
    XLSX.writeFile(workbook, 'processos.xlsx');
    showToast('Exportação para Excel concluída!');
  } catch (error: any) {
    console.error("Erro ao exportar para Excel:", error);
    showToast(error.message || 'Erro ao exportar para Excel.', 'danger');
  }
};
