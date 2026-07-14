const fs = require('fs');
const path = require('path');

const root = __dirname;
const adrDir = path.join(root, 'adr');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.md') ? [full] : [];
  });
}

const files = walk(adrDir);
const required = [
  '## Status',
  '## Data',
  '## Autor',
  '## Contexto',
  '## Problema',
  '## Alternativas',
  '## Decisão',
  '## Justificativa',
  '## Consequências Positivas',
  '## Consequências Negativas',
  '## Impactos',
  '## Dependências',
  '## Skills Relacionadas',
  '## RFC Relacionada',
  '## Data da Aprovação',
  '## Última Revisão'
];

const errors = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const name = path.basename(file);
  const match = name.match(/ADR-(\d+)/i);
  if (!match) {
    if (name !== 'README.md') {
      errors.push(`${name} -> numeração inválida`);
    }
    continue;
  }
  for (const section of required) {
    if (!content.includes(section)) {
      errors.push(`${name} -> faltando ${section}`);
    }
  }
}

if (errors.length) {
  console.error('Validação ADR falhou:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validação ADR concluída com sucesso: ${files.length} ADR(s) analisado(s).`);
