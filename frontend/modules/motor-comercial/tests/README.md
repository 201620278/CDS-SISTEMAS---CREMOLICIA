# Tests — Motor Comercial

**Sprint 2.7** — Estrutura de Testes

---

## Objetivo

Preparar a estrutura de testes para garantir qualidade do código frontend.

---

## Estrutura

```
tests/
├── setup.js              # Configuração global
├── components/           # Testes de componentes
│   └── Button.test.js
├── hooks/                # Testes de hooks
│   └── useLoading.test.js
├── form/                 # Testes de formulário
│   └── Validation.test.js
└── README.md             # Documentação
```

---

## Uso

### Instalação

```bash
npm install --save-dev jest @testing-library/dom
```

### Executar Testes

```bash
npm test
```

### Criar Testes

Seguir padrão `*.test.js`:

```javascript
const Component = require('../../components/base/Component');

describe('Component', () => {
  test('does something', () => {
    const result = Component.create();
    expect(result).toBeDefined();
  });
});
```

---

## Próximos Passos

- [ ] Instalar dependências de teste
- [ ] Criar testes para todos os componentes base
- [ ] Criar testes para todos os componentes de formulário
- [ ] Criar testes para todos os componentes de dados
- [ ] Criar testes para todos os hooks
- [ ] Criar testes para contexts
- [ ] Criar testes para API client
- [ ] Configurar coverage

---

## Nota

Esta estrutura foi preparada na Sprint 2.7. A implementação completa dos testes será feita em Sprints futuras.
