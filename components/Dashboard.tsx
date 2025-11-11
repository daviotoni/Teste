
import React, { useContext, useEffect, useRef, useMemo } from 'react';
import { AppContext } from '../App';
import type { Process, CalendarEvent, ProcessFilter, TabKey } from '../types';
import type { Chart, ChartConfiguration } from 'chart.js';
import { todayUTC, parse, diffDays, fmtBR } from '../utils';

// Declare Chart on the window object to manage the global Chart.js instance from the CDN.
declare global {
  interface Window {
    Chart: typeof Chart;
  }
}

interface DashboardProps {
  onNavigate: (tab: TabKey, options: { filter: ProcessFilter }) => void;
}

const PrazoItem: React.FC<{item: {date: Date, type: string, desc: string}}> = ({ item }) => {
    const day = String(item.date.getUTCDate()).padStart(2, '0');
    const month = item.date.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');

    return (
        <li className="flex items-start gap-3 p-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
            <div className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 rounded-lg font-bold">
                <span className="text-xs uppercase">{month}</span>
                <span className="text-xl leading-none">{day}</span>
            </div>
            <div>
                <span className="text-xs font-bold uppercase text-slate-400">{item.type}</span>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{item.desc}</p>
            </div>
        </li>
    );
}

const AlertaItem: React.FC<{alerta: {type: string, desc: string}}> = ({ alerta }) => (
    <li className="p-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
        <span className={`text-xs font-bold uppercase ${alerta.type === 'Vencido' ? 'text-red-500' : 'text-orange-500'}`}>{alerta.type}</span>
        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{alerta.desc}</p>
    </li>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { data, theme } = useContext(AppContext);
  const { processos = [], calendario = [] } = data;
  const chartsRef = useRef<{ [key: string]: Chart | null }>({});
  const entradaCanvasRef = useRef<HTMLCanvasElement>(null);
  const statusCanvasRef = useRef<HTMLCanvasElement>(null);
  const pareceresCanvasRef = useRef<HTMLCanvasElement>(null);

  const { stats, proximosPrazos, alertas } = useMemo(() => {
    const hoje = todayUTC();
    let pend = 0, anal = 0, fin = 0, alert = 0, venc = 0;
    
    processos.forEach((p: Process) => {
      if (p.stat === 'pendente') pend++;
      if (p.stat === 'em-analise') anal++;
      if (p.stat === 'finalizado') fin++;
      
      if (p.prazo && p.stat !== 'finalizado' && p.stat !== 'arquivado') {
        const prazoDate = parse(p.prazo);
        if (prazoDate) {
          const daysDiff = diffDays(hoje, prazoDate);
          if (daysDiff < 0) venc++;
          else if (daysDiff >= 0 && daysDiff <= 5) alert++;
        }
      }
    });
    
    const futuro15 = new Date(hoje);
    futuro15.setUTCDate(hoje.getUTCDate() + 15);

    const prazosProc = processos
        .filter((p: Process) => {
            if (!p.prazo || p.stat === 'finalizado' || p.stat === 'arquivado') return false;
            const d = parse(p.prazo);
            return d && d >= hoje && d <= futuro15;
        })
        .map((p: Process) => ({ date: parse(p.prazo)!, type: 'Processo', desc: `Prazo Proc: ${p.num}` }));

    const prazosAgenda = calendario
        .filter((c: CalendarEvent) => {
             if (!c.data) return false;
             const d = parse(c.data);
             return d && d >= hoje && d <= futuro15;
        })
        .map((c: CalendarEvent) => ({ date: parse(c.data)!, type: 'Agenda', desc: c.desc }));

    const allPrazos = [...prazosProc, ...prazosAgenda].sort((a,b) => a.date.getTime() - b.date.getTime());

    const allAlertas: { type: string, desc: string }[] = [];
    processos.forEach((p: Process) => {
        if (p.prazo && p.stat !== 'finalizado' && p.stat !== 'arquivado') {
            const prazoDate = parse(p.prazo);
            if(prazoDate && diffDays(hoje, prazoDate) < 0) {
                allAlertas.push({ type: 'Vencido', desc: `Processo ${p.num} está vencido.` });
            }
        }
        const entradaDate = parse(p.ent);
        if (entradaDate && (p.stat === 'em-analise' || p.stat === 'pendente') && diffDays(entradaDate, hoje) > 20) {
            allAlertas.push({ type: 'Inativo', desc: `Processo ${p.num} parado há mais de 20 dias.` });
        }
    });
    
    return { 
        stats: { total: processos.length, pend, anal, fin, alert, venc },
        proximosPrazos: allPrazos,
        alertas: allAlertas
    };
  }, [processos, calendario]);

  useEffect(() => {
    const chartCanvases = {
      entradas: entradaCanvasRef.current,
      status: statusCanvasRef.current,
      pareceres: pareceresCanvasRef.current
    };
    
    Object.values(chartsRef.current).forEach(chart => chart?.destroy());
    chartsRef.current = {};

    if (!processos || !window.Chart) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#f8fafc' : '#1e293b';
    const cardColor = isDark ? '#1e293b' : '#ffffff';

    window.Chart.defaults.color = textColor;
    
    if (chartCanvases.entradas) {
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const dadosAdm = Array(12).fill(0);
      const dadosJud = Array(12).fill(0);
      processos.forEach((p: Process) => {
        if (p.ent) {
          const mes = parse(p.ent)!.getUTCMonth();
          if (p.tipo === 'administrativo') dadosAdm[mes]++; else dadosJud[mes]++;
        }
      });
      chartsRef.current.entradas = new window.Chart(chartCanvases.entradas, {
        type: 'bar',
        data: {
          labels: meses,
          datasets: [
            { label: 'Administrativo', data: dadosAdm, backgroundColor: '#3b82f6' },
            { label: 'Judicial', data: dadosJud, backgroundColor: '#f59e0b' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: gridColor }, border: { display: false } }, x: { grid: { display: false } } } }
      });
    }

    if (chartCanvases.status) {
      const statusMap = {'pendente':'Pendente','em-analise':'Em Análise','aguardando-documentacao':'Aguardando Documentação','em-diligencia':'Em Diligência', 'finalizado':'Finalizado','arquivado':'Arquivado'};
      const statusColorMap = {'pendente': '#ef4444', 'em-analise': '#f59e0b', 'aguardando-documentacao': '#3b82f6', 'em-diligencia': '#8b5cf6', 'finalizado': '#22c55e', 'arquivado': '#64748b'};
      const sCounts: {[key:string]: number} = {};
      processos.forEach((p: Process) => sCounts[p.stat] = (sCounts[p.stat] || 0) + 1);
      chartsRef.current.status = new window.Chart(chartCanvases.status, {
        type: 'doughnut',
        data: {
          labels: Object.values(statusMap),
          datasets: [{ data: Object.keys(statusMap).map(k => sCounts[k] || 0), backgroundColor: Object.values(statusColorMap), borderWidth: 2, borderColor: cardColor }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
    
    if (chartCanvases.pareceres) {
        const pareceresPorMes = Array(12).fill(0);
        processos.forEach((p: Process) => {
            if (p.docId && p.saida) {
                const mes = parse(p.saida)!.getUTCMonth();
                pareceresPorMes[mes]++;
            }
        });
        chartsRef.current.pareceres = new window.Chart(chartCanvases.pareceres, {
            type: 'bar',
            data: {
                labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
                datasets: [{ label: 'Nº de Pareceres', data: pareceresPorMes, backgroundColor: '#26c6da' }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: gridColor } }, x: { grid: { display: false } } } }
        });
    }

    return () => {
      Object.values(chartsRef.current).forEach(chart => chart?.destroy());
    }
  }, [processos, theme]);

  const kpis = [
    { label: 'Total', value: stats.total, filter: {}, color: 'border-blue-500' },
    { label: 'Pendentes', value: stats.pend, filter: { status: 'pendente' }, color: 'border-yellow-400' },
    { label: 'Em Análise', value: stats.anal, filter: { status: 'em-analise' }, color: 'border-orange-500' },
    { label: 'Finalizados', value: stats.fin, filter: { status: 'finalizado' }, color: 'border-green-500' },
    { label: 'Vencendo ≤5d', value: stats.alert, filter: { prazo: 'alerta' }, color: 'border-amber-600' },
    { label: 'Vencidos', value: stats.venc, filter: { prazo: 'vencido' }, color: 'border-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} onClick={() => onNavigate('proc', { filter: kpi.filter as ProcessFilter })} className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 ${kpi.color} cursor-pointer hover:shadow-md transition`}>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{kpi.label}</h4>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h3 className="font-bold text-lg mb-2">Entradas por Mês</h3><div className="h-72"><canvas ref={entradaCanvasRef}></canvas></div></div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h3 className="font-bold text-lg mb-2">Pareceres Emitidos por Mês</h3><div className="h-64"><canvas ref={pareceresCanvasRef}></canvas></div></div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h3 className="font-bold text-lg mb-2">Distribuição por Status</h3><div className="h-64"><canvas ref={statusCanvasRef}></canvas></div></div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h3 className="font-bold text-lg mb-2">Próximos Prazos (15 dias)</h3>
            <ul className="space-y-1 max-h-60 overflow-y-auto">
                {proximosPrazos.length > 0 ? (
                    proximosPrazos.map((item, index) => <PrazoItem key={index} item={item} />)
                ) : (
                    <li className="text-sm text-slate-500 p-2">Nenhum prazo nos próximos 15 dias.</li>
                )}
            </ul>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h3 className="font-bold text-lg mb-2">Alertas Inteligentes</h3>
            <ul className="space-y-1 max-h-48 overflow-y-auto">
                {alertas.length > 0 ? (
                    alertas.map((item, index) => <AlertaItem key={index} alerta={item} />)
                ) : (
                    <li className="text-sm text-slate-500 p-2">Nenhum alerta no momento.</li>
                )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
