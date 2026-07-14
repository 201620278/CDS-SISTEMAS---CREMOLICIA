# Storybook — Motor Comercial

**Sprint 2.7** — Estrutura do Storybook

---

## Objetivo

Preparar a estrutura do Storybook para documentação e desenvolvimento visual de componentes.

---

## Estrutura

```
.storybook/
├── main.js              # Configuração principal
├── preview.js           # Preview global
└── README.md            # Documentação
```

---

## Uso

### Instalação

```bash
npm install --save-dev @storybook/html-webpack5 @storybook/addon-essentials
```

### Executar Storybook

```bash
npm run storybook
```

### Criar Stories

Criar arquivo `*.stories.js` ao lado do componente:

```javascript
import Button from './Button';

export default {
  title: 'Base/Button',
  component: Button,
  tags: ['autodocs'],
};

export const Primary = {
  args: {
    text: 'Salvar',
    variant: 'primary'
  }
};

export const Secondary = {
  args: {
    text: 'Cancelar',
    variant: 'secondary'
  }
};
```

---

## Próximos Passos

- [ ] Instalar dependências do Storybook
- [ ] Criar stories para componentes base
- [ ] Criar stories para componentes de formulário
- [ ] Criar stories para componentes de dados
- [ ] Criar stories para layouts
- [ ] Criar stories para componentes de navegação
- [ ] Configurar addons adicionais

---

## Nota

Esta estrutura foi preparada na Sprint 2.7. A implementação completa dos stories será feita em Sprints futuras.
