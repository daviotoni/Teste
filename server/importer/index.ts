// Importador institucional (fundação) — comando de BACKEND, auditável.
//
// Objetivo: transformar dados do protótipo legado (export JSON do IndexedDB/JSONB)
// no modelo normalizado, preservando o identificador legado, atribuindo
// classificação inicial e produzindo um relatório de erros. NÃO roda no
// navegador e NÃO migra dados reais sem homologação explícita.
//
// Uso:
//   tsx server/importer/index.ts <arquivo-export.json> [--commit]
//
// Por padrão é DRY-RUN: apenas lê, converte e gera um relatório + um plano
// normalizado (não escreve no banco). O modo --commit é bloqueado a menos que
// SIGLA_IMPORT_HOMOLOGATED=true esteja definido, garantindo revisão prévia.
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

interface LegacyExport {
  processos?: Array<Record<string, unknown>>;
  documentos?: Array<Record<string, unknown>>;
  versoes?: Array<Record<string, unknown>>;
  leis?: Array<Record<string, unknown>>;
}

interface ImportError {
  entity: string;
  legacyId: unknown;
  reason: string;
}

interface NormalizedProcess {
  id: string;
  legacy_number: string | null;
  subject: string;
  visibility: 'INTERNAL';
  source_entity: 'processo';
  legacy_payload: Record<string, unknown>;
}

interface ImportReport {
  generatedAtNote: string;
  counts: Record<string, number>;
  errors: ImportError[];
  processes: NormalizedProcess[];
}

function str(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

// Converte um processo legado (IDs numéricos, campos abreviados) para o modelo
// normalizado, preservando o número legado e a carga original para auditoria.
function convertProcess(legacy: Record<string, unknown>, errors: ImportError[]): NormalizedProcess | null {
  const subject = str(legacy.obj) ?? str(legacy.assunto) ?? str(legacy.subject);
  if (!subject) {
    errors.push({ entity: 'processo', legacyId: legacy.id, reason: 'Sem assunto (obj) identificável.' });
    return null;
  }
  return {
    id: randomUUID(),
    legacy_number: str(legacy.num) ?? str(legacy.id),
    subject,
    visibility: 'INTERNAL',
    source_entity: 'processo',
    legacy_payload: legacy,
  };
}

async function run(): Promise<void> {
  const [, , inputPath, ...flags] = process.argv;
  if (!inputPath) {
    console.error('Uso: tsx server/importer/index.ts <arquivo-export.json> [--commit]');
    process.exit(2);
  }
  const commit = flags.includes('--commit');
  const homologated = process.env.SIGLA_IMPORT_HOMOLOGATED === 'true';

  if (commit && !homologated) {
    console.error(
      'Bloqueado: --commit exige homologação. Defina SIGLA_IMPORT_HOMOLOGATED=true somente após ' +
        'revisão aprovada do plano de importação. Nenhum dado real deve ser migrado sem homologação.',
    );
    process.exit(3);
  }

  const raw = await readFile(inputPath, 'utf8');
  const data = JSON.parse(raw) as LegacyExport;

  const errors: ImportError[] = [];
  const processes: NormalizedProcess[] = [];
  for (const p of data.processos ?? []) {
    const converted = convertProcess(p, errors);
    if (converted) processes.push(converted);
  }

  const report: ImportReport = {
    generatedAtNote: 'timestamp preenchido pelo operador na homologação',
    counts: {
      processosLidos: (data.processos ?? []).length,
      processosConvertidos: processes.length,
      documentos: (data.documentos ?? []).length,
      versoes: (data.versoes ?? []).length,
      leis: (data.leis ?? []).length,
      erros: errors.length,
    },
    errors,
    processes,
  };

  const outPath = `${inputPath}.import-plan.json`;
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('== Relatório de importação (DRY-RUN) ==');
  console.table(report.counts);
  if (errors.length > 0) console.log(`${errors.length} erro(s) registrados no plano.`);
  console.log(`Plano normalizado escrito em: ${outPath}`);

  if (commit) {
    // A escrita real no banco é intencionalmente NÃO implementada nesta fundação:
    // exige mapeamento aprovado por entidade, criação de relações e registro de
    // evento de importação em auditoria, executados por um job privilegiado.
    console.log(
      'Homologação detectada, porém a gravação real permanece desabilitada nesta fundação. ' +
        'Implemente a persistência via funções transacionais somente após aprovação do mapeamento.',
    );
  }
}

run().catch((err) => {
  console.error('Falha no importador:', err);
  process.exit(1);
});
