const fs = require('fs');
const path = require('path');

const root = __dirname;
const playbooksDir = path.join(root, 'playbooks');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.md') ? [full] : [];
  });
}

const files = walk(playbooksDir).filter(file => path.basename(file) !== 'README.md' && path.basename(file) !== 'TEMPLATE.md' && path.basename(file) !== 'INDEX.md' && path.basename(file) !== 'PLAYBOOK_GOVERNANCE.md' && path.basename(file) !== 'PLAYBOOK_QUALITY.md' && path.basename(file) !== 'PLAYBOOKS.md');
const required = [
  '## Objetivo',
  '## Quando utilizar',
  '## Pré-requisitos',
  '## Entradas',
  '## Saídas Esperadas',
  '## Passo a Passo',
  '## Checklist',
  '## Critérios de Aceite',
  '## Testes Obrigatórios',
  '## Documentação',
  '## ADRs Relacionados',
  '## Skills Relacionadas',
  '## RFCs Relacionadas',
  '## Anti-padrões',
  '## Observações',
  '## Roadmap Futuro',
  '## Metadados'
];

const errors = [];
const seen = new Set();
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const name = path.basename(file);
  if (seen.has(name)) {
    errors.push(`${name} -> duplicidade`);
  }
  seen.add(name);

  const match = name.match(/PLAYBOOK-(\d+)/i);
  if (!match) {
    errors.push(`${name} -> nome inválido`);
    continue;
  }

  for (const section of required) {
    if (!content.includes(section)) {
      errors.push(`${name} -> faltando ${section}`);
    }
  }

  if (!content.includes('Versão:') || !content.includes('Autor:') || !content.includes('Data:') || !content.includes('Status:')) {
    errors.push(`${name} -> metadados incompletos`);
  }

  if (!content.includes('Skills relacionadas:') || !content.includes('ADRs relacionadas:') || !content.includes('RFCs relacionadas:')) {
    errors.push(`${name} -> metadados de referência incompletos`);
  }
}

if (errors.length) {
  console.error('Validação de playbooks falhou:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validação de playbooks concluída com sucesso: ${files.length} playbook(s) analisado(s).`);
