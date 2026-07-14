const fs = require('fs');
const path = require('path');

const root = __dirname;
const rfcDir = path.join(root, 'rfc');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.md') ? [full] : [];
  });
}

const files = walk(rfcDir);
const required = [
  '## Status',
  '## Autor',
  '## Objetivo',
  '## Motivação',
  '## Problema',
  '## Proposta',
  '## Alternativas',
  '## Impacto',
  '## Riscos',
  '## Dependências',
  '## Plano de Implementação',
  '## Critérios de Aprovação',
  '## Skills Relacionadas'
];

const errors = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const name = path.basename(file);
  const match = name.match(/RFC-(\d+)/i);
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
  console.error('Validação RFC falhou:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validação RFC concluída com sucesso: ${files.length} RFC(s) analisado(s).`);
