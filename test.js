import { CompliancePro } from './compliance-pro.js';
import worker from './worker.js';

console.log('🧪 Iniciando Bateria de Testes do Compliance & PLD-FT Pro...');

let pass = 0;
function assert(cond, msg) {
  if (!cond) throw new Error('FALHA: ' + msg);
  pass++;
  console.log('  ✅ ' + msg);
}

assert(CompliancePro.LISTAS_MONITORADAS.length === 8, 'Monitora as 8 listas restritivas nacionais e internacionais');

const limpo = CompliancePro.auditarCompliance({ documento: '00000000000191' });
assert(limpo.ok === true && limpo.sancionado === false && limpo.pep === false, 'Aprova entidade regular sem restrições');

const pep = CompliancePro.auditarCompliance({ documento: '11122233396' });
assert(pep.pep === true && pep.recomendacaoBacen === 'APLICAR_DILIGENCIA_REFORCADA_PEP', 'Identifica PEP e exige diligência reforçada Circular BACEN 3.978');

const sanc = CompliancePro.auditarCompliance({ documento: '99999999000191' });
assert(sanc.sancionado === true && sanc.ocorrencias.length === 2, 'Detecta empresa sancionada na OFAC e no CEIS/CGU');

const resHttp = await worker.fetch(new Request('https://api.test/api/compliance/11122233396'));
assert(resHttp.status === 200, 'Worker responde HTTP 200 na rota /api/compliance/:doc');
assert(resHttp.headers.get('X-Ponte-Version') === '3.0.0', 'Worker emite cabeçalho X-Ponte-Version');

console.log(`\n🎉 Todos os ${pass} testes do Compliance Pro passaram com 100% de sucesso!`);
