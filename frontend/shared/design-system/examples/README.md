# Exemplos — CDS Design System

## Instalação (módulos CDS)

```javascript
const DS = require('frontend/shared/design-system');

// Injeta tokens e estilos (chamado automaticamente no bootstrap do Motor Comercial)
DS.injectDesignSystemStyles();
```

## Botão primário

```javascript
const { CDSPrimaryButton } = require('frontend/shared/design-system').buttons;

document.body.appendChild(
  CDSPrimaryButton.create({
    text: 'Preparar Entrega',
    onClick: () => navigate('/consignacoes/nova')
  })
);
```

## Página operacional completa

```javascript
const { CDSPage, CDSPageHeader, CDSSidebar, CDSFooter } = require('frontend/shared/design-system').layouts;

const page = CDSPage.create({
  header: CDSPageHeader.create({
    title: 'Central de Clientes',
    subtitle: 'Gerencie perfis e atendimentos',
    onBack: () => navigate('/')
  }),
  sidebar: CDSSidebar.create({
    items: [
      { label: 'Central de Trabalho', icon: '📊', onClick: () => navigate('/') },
      { label: 'Clientes', icon: '👥', active: true, onClick: () => {} }
    ]
  }),
  content: myContentElement,
  footer: CDSFooter.create({
    left: 'Motor Comercial',
    right: 'CDS Sistemas'
  })
});
```

## Toast de sucesso

```javascript
const { CDSToast } = require('frontend/shared/design-system').feedback;
CDSToast.show('Consignação criada com sucesso.', 'success');
```

## Motor Comercial (compatibilidade)

Os imports legados continuam funcionando — apontam para o Design System:

```javascript
const Button = require('../components/base/Button'); // → CDS Design System
```
