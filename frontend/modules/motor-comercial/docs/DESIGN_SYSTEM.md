# Design System — Motor Comercial

**Sprint 2.7** — Design System Oficial

---

## Objetivo

Definir o Design System oficial do CDS Sistemas, estabelecendo identidade visual, tokens e padrões que serão seguidos em todos os módulos do sistema.

---

## Princípios

- **Consistência**: Todos os componentes seguem os mesmos padrões
- **Reutilização**: Nenhum código visual duplicado
- **Tokens**: Nenhum valor visual "hardcoded"
- **Acessibilidade**: Componentes acessíveis por padrão
- **Responsividade**: Funciona em Desktop, Notebook e Tablet

---

## Tokens

### Spacing

Escala de espaçamentos:

```javascript
spacing: {
  xs: '4px',      // Espaçamento muito pequeno
  sm: '8px',      // Espaçamento pequeno
  md: '16px',     // Espaçamento médio (base)
  lg: '24px',     // Espaçamento grande
  xl: '32px',     // Espaçamento muito grande
  xxl: '48px',    // Espaçamento extra grande
  xxxl: '64px'    // Espaçamento enorme
}
```

**Uso**: Margins, paddings, gaps entre elementos

### Typography

Fontes e tamanhos:

```javascript
typography: {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  },
  fontSize: {
    xs: '12px',      // Texto muito pequeno
    sm: '14px',      // Texto pequeno
    base: '16px',    // Texto base
    lg: '18px',      // Texto grande
    xl: '20px',      // Texto muito grande
    '2xl': '24px',   // Título pequeno
    '3xl': '30px',   // Título médio
    '4xl': '36px',   // Título grande
    '5xl': '48px',   // Título muito grande
    '6xl': '60px'    // Título enorme
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em'
  }
}
```

**Uso**: Títulos, textos, labels, botões

### Colors

Paleta de cores:

```javascript
colors: {
  // Primary (Azul corporativo)
  primary: {
    50: '#e8f0fe',
    100: '#d2e3fc',
    200: '#aecbfa',
    300: '#8ab4f8',
    400: '#669df6',
    500: '#4285f4',    // Cor principal
    600: '#3367d6',
    700: '#2962ff',
    800: '#1a73e8',
    900: '#174ea6'
  },

  // Secondary (Roxo)
  secondary: {
    50: '#f3e8ff',
    100: '#e9d5ff',
    200: '#d8b4fe',
    300: '#c084fc',
    400: '#a855f7',
    500: '#9333ea',    // Cor secundária
    600: '#7e22ce',
    700: '#6b21a8',
    800: '#581c87',
    900: '#4c1d95'
  },

  // Success (Verde)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',    // Sucesso
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  // Warning (Amarelo/Laranja)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',    // Aviso
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  // Error (Vermelho)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',    // Erro
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Neutral (Cinza)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
  },

  // Status
  status: {
    active: '#22c55e',
    inactive: '#6b7280',
    pending: '#f59e0b',
    blocked: '#ef4444',
    draft: '#6366f1',
    completed: '#10b981',
    cancelled: '#ef4444'
  }
}
```

**Uso**: Cores de texto, backgrounds, bordas, estados

### Radius

Bordas arredondadas:

```javascript
radius: {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px'
}
```

**Uso**: Cards, botões, inputs, modais

### Shadow

Sombras para elevação:

```javascript
shadow: {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
}
```

**Uso**: Cards, modais, dropdowns, tooltips

### Breakpoints

Pontos de quebra responsivos:

```javascript
breakpoints: {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
```

**Uso**: Media queries, layouts responsivos

### ZIndex

Camadas de profundidade:

```javascript
zindex: {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080
}
```

**Uso**: Modais, dropdowns, tooltips, notificações

### Animations

Durações e easings:

```javascript
animations: {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}
```

**Uso**: Transições, animações

---

## Componentes

### Button

Botões com variantes:

- **primary**: Ação principal
- **secondary**: Ação secundária
- **danger**: Ação destrutiva
- **success**: Ação de sucesso
- **ghost**: Ação sutil

Tamanhos: sm, md, lg

Estados: loading, disabled

### Card

Cards com header, body e footer:

- Borda arredondada
- Sombra suave
- Header opcional
- Footer opcional

### Badge

Badges de status:

- **success**: Verde
- **warning**: Amarelo
- **error**: Vermelho
- **info**: Azul

Tamanhos: sm, md, lg

### Alert

Alertas de informação:

- **info**: Informação
- **success**: Sucesso
- **warning**: Aviso
- **error**: Erro

Dismissível opcional

### Input

Inputs de texto:

- Label opcional
- Required mark
- Error state
- Disabled state
- Read-only state

### Table

Tabelas com:

- Ordenação
- Paginação
- Seleção de linhas
- Hover states
- Header fixo

---

## Identidade Visual

### Cores Corporativas

- **Primary**: #4285f4 (Azul Google)
- **Secondary**: #9333ea (Roxo)
- **Success**: #22c55e (Verde)
- **Warning**: #f59e0b (Amarelo)
- **Error**: #ef4444 (Vermelho)

### Tipografia

- **Fonte Principal**: Inter
- **Fonte Mono**: JetBrains Mono
- **Tamanho Base**: 16px
- **Line Height**: 1.5

### Espaçamentos

- **Base**: 16px (md)
- **Pequeno**: 8px (sm)
- **Grande**: 24px (lg)

### Bordas

- **Pequena**: 4px (sm)
- **Média**: 8px (md)
- **Grande**: 12px (lg)

---

## Estados Visuais

### Loading

Indicadores de carregamento:

- Spinner animado
- Skeleton screens
- Progress bars

### Success

Estados de sucesso:

- Cores verdes
- Ícones de check
- Mensagens positivas

### Warning

Estados de aviso:

- Cores amarelas
- Ícones de alerta
- Mensagens cautelosas

### Error

Estados de erro:

- Cores vermelhas
- Ícones de erro
- Mensagens de erro

### Disabled

Estados desabilitados:

- Opacidade reduzida
- Cursor not-allowed
- Cores neutras

### Empty

Estados vazios:

- Ícones ilustrativos
- Mensagens explicativas
- Ações sugeridas

---

## Responsividade

### Desktop

- 1024px e acima
- Layout completo
- Todas as funcionalidades

### Notebook

- 768px a 1023px
- Layout adaptado
- Funcionalidades principais

### Tablet

- 640px a 767px
- Layout simplificado
- Funcionalidades essenciais

---

## Acessibilidade

### ARIA

- Labels em inputs
- Roles em componentes
- Estados anunciados

### Focus

- Indicadores de focus visíveis
- Navegação por teclado
- Orde lógica de tab

### Contraste

- Ratio de contraste mínimo 4.5:1
- Cores acessíveis
- Texto legível

---

## Padrões

### Uso de Tokens

**✅ CORRETO:**
```javascript
padding: theme.spacing.md;
color: theme.colors.primary[600];
border-radius: theme.radius.lg;
```

**❌ INCORRETO:**
```javascript
padding: '16px';
color: '#4285f4';
border-radius: '12px';
```

### Nomes de Classes

Padrão: `cds-{component}--{variant}-{state}`

```javascript
.cds-button
.cds-button--primary
.cds-button--disabled
.cds-button--loading
```

### Organização de CSS

1. Layout (display, flex, grid)
2. Espaçamento (margin, padding)
3. Tamanho (width, height)
4. Tipografia (font-size, font-weight)
5. Cores (color, background-color)
6. Bordas (border, border-radius)
7. Sombras (box-shadow)
8. Transições (transition)

---

## Critérios de Aceitação

✅ Tokens centralizados  
✅ Nenhum valor hardcoded  
✅ Componentes consistentes  
✅ Identidade visual definida  
✅ Estados visuais suportados  
✅ Responsividade preparada  
✅ Acessibilidade preparada  
✅ Documentação completa  

---

## Conclusão

O Design System criado nesta Sprint passa a ser o padrão oficial para todos os módulos do CDS Sistemas. Qualquer novo componente deve seguir estritamente estes padrões.
