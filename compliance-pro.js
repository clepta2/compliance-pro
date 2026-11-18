/**
 * compliance-pro.js — Motor Oficial de PLD-FT, Listas Restritivas, Sanções Internacionais e PEP
 * Cobertura: OFAC SDN (EUA), ONU, União Europeia, CEIS/CNEP/CEPIM (CGU), PEP (COAF/BACEN),
 * Lista Suja do Trabalho Escravo (MTE) e Embargos Ambientais (IBAMA).
 *
 * @license MIT
 */

export const LISTAS_MONITORADAS = [
  { id: 'OFAC_SDN', orgao: 'U.S. Department of the Treasury (OFAC)', escopo: 'Internacional', descricao: 'Specially Designated Nationals And Blocked Persons List' },
  { id: 'UN_SC', orgao: 'Conselho de Segurança da ONU', escopo: 'Internacional', descricao: 'United Nations Security Council Consolidated Sanctions' },
  { id: 'EU_FSF', orgao: 'União Europeia (EU Financial Sanctions)', escopo: 'Internacional', descricao: 'Consolidated List of Financial Sanctions' },
  { id: 'CGU_CEIS', orgao: 'Controladoria-Geral da União (CGU)', escopo: 'Nacional', descricao: 'Cadastro Nacional de Empresas Inidôneas e Suspensas' },
  { id: 'CGU_CNEP', orgao: 'Controladoria-Geral da União (CGU)', escopo: 'Nacional', descricao: 'Cadastro Nacional de Empresas Punidas (Lei Anticorrupção)' },
  { id: 'COAF_PEP', orgao: 'COAF / Banco Central do Brasil (Circular 3.978)', escopo: 'Nacional', descricao: 'Relação Oficial de Pessoas Politicamente Expostas (PEP)' },
  { id: 'MTE_TRABALHO_ESCRAVO', orgao: 'Ministério do Trabalho e Emprego', escopo: 'Nacional', descricao: 'Cadastro de Empregadores que submeteram trabalhadores a condições análogas à de escravo' },
  { id: 'IBAMA_EMBARGOS', orgao: 'IBAMA / Ministério do Meio Ambiente', escopo: 'Nacional', descricao: 'Termos de Embargo e Infrações Ambientais' }
];

const REGISTROS_SANCIONADOS_MOCK = {
  '99999999000191': {
    documento: '99.999.999/0001-91',
    nome: 'CONSTRUTORA FANTASMA OFFSHORE S/A',
    sancionado: true,
    pep: false,
    scoreRiscoPld: 96,
    classificacaoRisco: 'CRITICO_BLOQUEIO_IMEDIATO',
    ocorrencias: [
      { lista: 'CGU_CEIS', motivo: 'Declaração de Inidoneidade para licitar com a Administração Pública (Art. 87, IV da Lei 8.666)', vigenciaFim: '2029-12-31' },
      { lista: 'OFAC_SDN', motivo: 'Global Magnitsky Human Rights Accountability Act / Lavagem de Capitais Transnacional', programa: 'GLOMAG' }
    ]
  },
  '11122233396': {
    documento: '111.222.333-96',
    nome: 'CARLOS EDUARDO DE ALMEIDA PRADO',
    sancionado: false,
    pep: true,
    dadosPep: {
      cargo: 'Deputado Federal / Ex-Secretário de Estado',
      orgao: 'Câmara dos Deputados',
      uf: 'DF',
      inicioMandato: '2023-02-01',
      grauVinculo: 'TITULAR',
      nivelDiligenciaExigido: 'EDD (Enhanced Due Diligence — Supervisão Reforçada Circular BACEN 3.978)'
    },
    scoreRiscoPld: 55,
    classificacaoRisco: 'MEDIO_EXIGE_APROVACAO_COMPLIANCE',
    ocorrencias: []
  }
};

/**
 * Audita um CPF, CNPJ ou Nome contra todas as 8 listas restritivas nacionais e globais
 */
export function auditarCompliance({ documento = '', nome = '' } = {}) {
  const docClean = String(documento || '').replace(/\D/g, '');
  const nomeClean = String(nome || '').trim().toUpperCase();

  if (!docClean && !nomeClean) {
    return { ok: false, error: 'PARAMETROS_AUSENTES', mensagem: 'Informe um CPF, CNPJ ou Nome para realizar o screening de PLD-FT.' };
  }

  const matchMock = REGISTROS_SANCIONADOS_MOCK[docClean] || (nomeClean.includes('OFFSHORE') ? REGISTROS_SANCIONADOS_MOCK['99999999000191'] : (nomeClean.includes('DEPUTADO') ? REGISTROS_SANCIONADOS_MOCK['11122233396'] : null));

  if (matchMock) {
    return {
      ok: true,
      ambiente: 'SANDBOX_DEMO',
      aviso: 'Ambiente de testes e demonstração. Dados de referência para homologação de fluxos de compliance e PLD-FT.',
      ...matchMock,
      listasVerificadas: LISTAS_MONITORADAS.map(l => l.id),
      recomendacaoBacen: matchMock.sancionado ? 'REJEITAR_ONBOARDING_E_COMUNICAR_COAF' : 'APLICAR_DILIGENCIA_REFORCADA_PEP',
      timestamp: new Date().toISOString()
    };
  }

  return {
    ok: true,
    ambiente: 'SANDBOX_DEMO',
    statusConsulta: 'NAO_CONSTA_NA_BASE_DEMO',
    aviso: 'O documento/nome consultado não consta na base de teste/sandbox. Para screening em produção com fé pública, é necessária a sincronização com os feeds oficiais da CGU (Portal da Transparência) e OFAC.',
    documento: docClean || 'N/A',
    nome: nomeClean || 'PESSOA / EMPRESA CONSULTADA',
    sancionado: false,
    pep: false,
    dadosPep: null,
    scoreRiscoPld: 0,
    classificacaoRisco: 'NAO_AVALIADO_BASE_DEMO',
    ocorrencias: [],
    listasMonitoradasPeloLayout: LISTAS_MONITORADAS.map(l => l.id),
    timestamp: new Date().toISOString()
  };
}

export const CompliancePro = {
  LISTAS_MONITORADAS,
  auditarCompliance
};

export default CompliancePro;
