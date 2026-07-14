const fs = require('fs');
const path = require('path');

const root = path.join(__dirname);
const templatePath = path.join(root, 'TEMPLATE.md');
const indexPath = path.join(root, 'INDEX.md');
const readmePath = path.join(root, 'README.md');

const template = fs.readFileSync(templatePath, 'utf8');
const skillDir = path.join(root, 'skills');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.md') ? [full] : [];
  });
}

const files = walk(skillDir).filter(file => file !== path.join(skillDir, 'README.md'));
const missing = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const requiredSections = [
    '## Objetivo',
    '## Quando utilizar',
    '## Pré-requisitos',
    '## Estrutura',
    '## Fluxo',
    '## Componentes',
    '## API',
    '## Eventos',
    '## Integrações',
    '## Performance',
    '## Segurança',
    '## Testes',
    '## Critérios de Aceite',
    '## Anti-padrões',
    '## Roadmap',
    '## Metadados'
  ];

  const missingSections = requiredSections.filter(section => !content.includes(section));
  if (missingSections.length) {
    missing.push(`${path.relative(root, file)} -> ${missingSections.join(', ')}`);
  }

  if (!content.includes('Versão:') || !content.includes('Autor:') || !content.includes('Data:')) {
    missing.push(`${path.relative(root, file)} -> metadados incompletos`);
  }
}

const index = fs.readFileSync(indexPath, 'utf8');
const readme = fs.readFileSync(readmePath, 'utf8');

if (!index.includes('## Arquitetura') || !index.includes('## Motores')) {
  missing.push('INDEX.md incompleto');
}

if (!readme.includes('O que é uma Skill') || !readme.includes('Como criar')) {
  missing.push('README.md incompleto');
}

if (missing.length) {
  console.error('Validação falhou:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Validação concluída com sucesso: ${files.length} skill(s) analisada(s).`);
