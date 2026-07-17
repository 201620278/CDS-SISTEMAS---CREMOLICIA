# CDS Mobile RC2.1 — Relatório de Fluxos

**Versão:** 2.1.0-rc2.1  
**Build:** 20260716rc21  
**Diretriz:** evolução por fluxos de negócio; Mobile = Cliente Oficial; motores únicos da Plataforma CDS.

## Arquivos criados

| Arquivo | Função |
|---------|--------|
| `js/native.js` | Câmera, barcode, share, WhatsApp, Maps, mídia local |
| `FLOW_PARITY_MATRIX.md` | Matriz de paridade por fluxo |
| `RC2_1_FLOW_REPORT.md` | Este relatório |

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `js/pages/pdv.js` | Share DANFE/XML, cancelar NFC-e |
| `js/pages/comercial.js` | Fluxo consignação → prestação → baixa → encerrar/reabrir |
| `js/pages/produtos.js` | Foto, EAN, fiscal, share, estoque |
| `js/pages/clientes.js` | Foto, WhatsApp, Maps, históricos |
| `js/pages/fornecedores.js` | Produtos, contato, Maps, share |
| `js/pages/configuracoes.js` | Sync + diagnóstico |
| `js/icons.js` | Ícones share/money/camera/map |
| `js/version.js` | 2.1.0-rc2.1 |
| `css/mobile.css` | Mídia, scan, action bar |
| `index.html` / `manifest.webmanifest` | RC2.1 |

## Motores reutilizados

- Motor PDV / Caixa / Vendas  
- Motor Fiscal  
- Motor Comercial  
- Motor Estoque (`ajusteEstoqueService`)  
- Motor Financeiro  
- Terminais / MultiCaixa  

## APIs reutilizadas (principais)

`/api/caixa/*` · `/api/vendas/*` · `/api/fiscal/*` · `/api/comercial/consignacoes/*` · `/api/produtos/*` · `/api/produtos/:id/ajustar-estoque` · `/api/financeiro/*` · `/api/clientes/*` · `/api/fornecedores/*` · `/api/terminais/*`

## Fluxos

| # | Fluxo | Status |
|---|-------|--------|
| 1 | Venda completa | ✔ |
| 2 | Comercial completo | ✔ |
| 3 | Cadastro produto | ⚠ foto local |
| 4 | Cliente | ⚠ foto local |
| 5 | Fornecedor | ⚠ vínculo produtos |
| 6 | Financeiro | ✔ |
| 7 | Estoque | ⚠ transferência |
| 8 | Configurações | ⚠ edição avançada |

## Cobertura

- **Fluxos concluídos:** 3  
- **Fluxos parciais:** 5  
- **Fluxos pendentes:** 0  
- **Paridade operacional estimada:** ~72–76%  

Ver detalhe em `FLOW_PARITY_MATRIX.md`.

## Qualidade

- Sem novas regras de negócio no Mobile  
- Sem motores novos  
- Capacidades nativas apenas na camada de UI/dispositivo  
- Foto de cliente/produto: armazenamento local até existir API oficial de mídia  

## Critério de aceite

Operador consegue executar integralmente no celular os fluxos ✔ (Venda, Comercial, Financeiro). Demais fluxos ⚠ cobrem a operação diária com ressalvas documentadas, sem depender do Desktop para as etapas marcadas ✔.
