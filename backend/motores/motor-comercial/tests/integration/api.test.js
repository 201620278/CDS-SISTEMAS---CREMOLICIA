/**
 * Integration Tests — Motor Comercial API
 *
 * Sprint 2.5: API REST — testes de integração.
 *
 * @module motores/motor-comercial/tests/integration/api.test
 */

const request = require('supertest');
const express = require('express');
const comercialRoutes = require('../../routes/comercial.routes');
const HttpResponse = require('../../http/responses/HttpResponse');

// Mock do container
const mockContainer = {
  perfilComercialRepository: {
    listar: jest.fn(),
    buscarPorId: jest.fn()
  },
  consignacaoRepository: {
    listar: jest.fn(),
    buscarPorId: jest.fn()
  },
  criarPerfilComercialUseCase: {
    executar: jest.fn()
  },
  atualizarPerfilComercialUseCase: {
    executar: jest.fn()
  },
  bloquearPerfilComercialUseCase: {
    executar: jest.fn()
  },
  desbloquearPerfilComercialUseCase: {
    executar: jest.fn()
  },
  alterarLimiteComercialUseCase: {
    executar: jest.fn()
  },
  consultarHistoricoPerfilUseCase: {
    executar: jest.fn()
  },
  consultarScoreConfiabilidadeUseCase: {
    executar: jest.fn()
  },
  consultarLimiteDisponivelUseCase: {
    executar: jest.fn()
  },
  criarConsignacaoUseCase: {
    executar: jest.fn()
  },
  editarConsignacaoUseCase: {
    executar: jest.fn()
  },
  cancelarConsignacaoRascunhoUseCase: {
    executar: jest.fn()
  },
  adicionarItemConsignacaoUseCase: {
    executar: jest.fn()
  },
  alterarQuantidadeItemUseCase: {
    executar: jest.fn()
  },
  removerItemConsignacaoUseCase: {
    executar: jest.fn()
  },
  registrarEntregaConsignacaoUseCase: {
    executar: jest.fn()
  },
  registrarDevolucaoAntesPrestacaoUseCase: {
    executar: jest.fn()
  },
  transferirItensEntreConsignacoesUseCase: {
    executar: jest.fn()
  },
  abrirPrestacaoUseCase: {
    executar: jest.fn()
  },
  registrarVendaPrestacaoUseCase: {
    executar: jest.fn()
  },
  registrarPerdaUseCase: {
    executar: jest.fn()
  },
  registrarCortesiaUseCase: {
    executar: jest.fn()
  },
  registrarPagamentoPrestacaoUseCase: {
    executar: jest.fn()
  },
  fecharPrestacaoUseCase: {
    executar: jest.fn()
  },
  reabrirPrestacaoUseCase: {
    executar: jest.fn()
  },
  dashboardProjectionService: {
    executar: jest.fn()
  },
  contaCorrenteProjectionService: {
    executar: jest.fn()
  },
  timelineProjectionService: {
    executar: jest.fn()
  },
  resumoPrestacaoProjectionService: {
    executar: jest.fn()
  },
  saldoProjectionService: {
    executar: jest.fn()
  },
  historicoProjectionService: {
    executar: jest.fn()
  },
  indicadoresProjectionService: {
    executar: jest.fn()
  },
  situacaoClienteProjectionService: {
    executar: jest.fn()
  },
  insightsProjectionService: {
    executar: jest.fn()
  },
  pendenciasProjectionService: {
    executar: jest.fn()
  },
  recomendacoesProjectionService: {
    executar: jest.fn()
  },
  playbooksProjectionService: {
    executar: jest.fn()
  },
  workflowProjectionService: {
    executar: jest.fn()
  },
  recommendationService: {
    executar: jest.fn()
  }
};

// Mock do obterContainer
jest.mock('../../index', () => ({
  obterContainer: () => mockContainer,
  VERSAO_MODULO: '2.5'
}));

// Setup do app Express
const app = express();
app.use(express.json());
app.use('/api/v1/comercial', comercialRoutes);

describe('Motor Comercial API — Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    test('GET /api/v1/comercial/health deve retornar status ok', async () => {
      const response = await request(app)
        .get('/api/v1/comercial/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        motor: 'motor-comercial',
        versao: '2.5',
        api: 'v1'
      });
    });
  });

  describe('Headers', () => {
    test('Deve incluir X-Request-ID e X-Correlation-ID nas respostas', async () => {
      const response = await request(app)
        .get('/api/v1/comercial/health')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    test('Deve usar X-Request-ID e X-Correlation-ID fornecidos', async () => {
      const response = await request(app)
        .get('/api/v1/comercial/health')
        .set('X-Request-ID', 'test-request-id')
        .set('X-Correlation-ID', 'test-correlation-id')
        .expect(200);

      expect(response.headers['x-request-id']).toBe('test-request-id');
      expect(response.headers['x-correlation-id']).toBe('test-correlation-id');
    });
  });

  describe('Perfil Comercial', () => {
    describe('GET /api/v1/comercial/perfil-comercial', () => {
      test('Deve listar perfis com sucesso', async () => {
        const mockPerfis = [
          {
            id: '1',
            clienteId: 'client-1',
            perfilTipo: 'CONSIGNADO',
            ativo: true,
            bloqueado: false,
            limiteComercial: 10000,
            saldoAberto: 0,
            observacoes: null,
            dataAtivacao: '2024-01-01T00:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ];

        mockContainer.perfilComercialRepository.listar.mockResolvedValue(mockPerfis);

        const response = await request(app)
          .get('/api/v1/comercial/perfil-comercial')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe('1');
        expect(response.body.metadata.total).toBe(1);
      });

      test('Deve filtrar por clienteId', async () => {
        mockContainer.perfilComercialRepository.listar.mockResolvedValue([]);

        await request(app)
          .get('/api/v1/comercial/perfil-comercial?clienteId=client-1')
          .expect(200);

        expect(mockContainer.perfilComercialRepository.listar).toHaveBeenCalledWith({
          clienteId: 'client-1',
          perfilTipo: undefined,
          ativo: undefined,
          bloqueado: undefined
        });
      });
    });

    describe('GET /api/v1/comercial/perfil-comercial/:id', () => {
      test('Deve consultar perfil por ID com sucesso', async () => {
        const mockPerfil = {
          id: '1',
          clienteId: 'client-1',
          perfilTipo: 'CONSIGNADO',
          ativo: true,
          bloqueado: false,
          limiteComercial: 10000,
          saldoAberto: 0,
          observacoes: null,
          dataAtivacao: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        mockContainer.perfilComercialRepository.buscarPorId.mockResolvedValue(mockPerfil);

        const response = await request(app)
          .get('/api/v1/comercial/perfil-comercial/1')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe('1');
      });

      test('Deve retornar 404 quando perfil não encontrado', async () => {
        mockContainer.perfilComercialRepository.buscarPorId.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/v1/comercial/perfil-comercial/999')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });

    describe('POST /api/v1/comercial/perfil-comercial', () => {
      test('Deve criar perfil com sucesso', async () => {
        const mockResult = {
          perfil: { id: '1' },
          correlationId: 'corr-1'
        };

        mockContainer.criarPerfilComercialUseCase.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/comercial/perfil-comercial')
          .send({
            clienteId: 'client-1',
            perfilTipo: 'CONSIGNADO',
            limiteComercial: 10000
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.perfil.id).toBe('1');
      });

      test('Deve retornar erro de validação quando dados inválidos', async () => {
        const response = await request(app)
          .post('/api/v1/comercial/perfil-comercial')
          .send({
            perfilTipo: 'CONSIGNADO'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details.errors).toContain('clienteId é obrigatório');
      });
    });

    describe('PATCH /api/v1/comercial/perfil-comercial/:id/bloquear', () => {
      test('Deve bloquear perfil com sucesso', async () => {
        const mockResult = {
          perfil: { id: '1', bloqueado: true },
          correlationId: 'corr-1'
        };

        mockContainer.bloquearPerfilComercialUseCase.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .patch('/api/v1/comercial/perfil-comercial/1/bloquear')
          .send({
            motivo: 'Motivo do bloqueio',
            usuarioId: 'user-1'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('Deve retornar erro quando motivo não fornecido', async () => {
        const response = await request(app)
          .patch('/api/v1/comercial/perfil-comercial/1/bloquear')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('PATCH /api/v1/comercial/perfil-comercial/:id/limite', () => {
      test('Deve alterar limite com sucesso', async () => {
        const mockResult = {
          perfil: { id: '1', limiteComercial: 15000 },
          limiteAnterior: 10000,
          limiteNovo: 15000,
          correlationId: 'corr-1'
        };

        mockContainer.alterarLimiteComercialUseCase.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .patch('/api/v1/comercial/perfil-comercial/1/limite')
          .send({
            novoLimite: 15000,
            motivo: 'Aumento de limite'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('Deve retornar erro quando novoLimite inválido', async () => {
        const response = await request(app)
          .patch('/api/v1/comercial/perfil-comercial/1/limite')
          .send({
            novoLimite: -100
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Consignação', () => {
    describe('GET /api/v1/comercial/consignacoes', () => {
      test('Deve listar consignações com sucesso', async () => {
        const mockConsignacoes = [
          {
            id: '1',
            clienteId: 'client-1',
            perfilComercialId: 'perfil-1',
            status: 'ENTREGUE',
            documento: {},
            observacao: null,
            usuarioAberturaId: 'user-1',
            dataAbertura: '2024-01-01T00:00:00Z',
            dataEntrega: '2024-01-02T00:00:00Z',
            dataEntregaPrevista: '2024-01-02T00:00:00Z',
            dataFechamento: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z'
          }
        ];

        mockContainer.consignacaoRepository.listar.mockResolvedValue(mockConsignacoes);

        const response = await request(app)
          .get('/api/v1/comercial/consignacoes')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
      });
    });

    describe('POST /api/v1/comercial/consignacoes', () => {
      test('Deve criar consignação com sucesso', async () => {
        const mockResult = {
          consignacao: { id: '1' },
          correlationId: 'corr-1'
        };

        mockContainer.criarConsignacaoUseCase.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/comercial/consignacoes')
          .send({
            clienteId: 'client-1',
            perfilComercialId: 'perfil-1',
            documento: { situacao: 'RASCUNHO' }
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.consignacao.id).toBe('1');
      });

      test('Deve retornar erro de validação quando dados inválidos', async () => {
        const response = await request(app)
          .post('/api/v1/comercial/consignacoes')
          .send({
            clienteId: 'client-1'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /api/v1/comercial/consignacoes/:id/itens', () => {
      test('Deve adicionar item com sucesso', async () => {
        const mockResult = { item: { id: 'item-1' } };

        mockContainer.adicionarItemConsignacaoUseCase.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/comercial/consignacoes/1/itens')
          .send({
            produtoId: 'prod-1',
            quantidade: 10,
            precoUnitario: 50.00
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('Deve retornar erro quando quantidade inválida', async () => {
        const response = await request(app)
          .post('/api/v1/comercial/consignacoes/1/itens')
          .send({
            produtoId: 'prod-1',
            quantidade: -5
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /api/v1/comercial/consignacoes/:id/prestacao/venda', () => {
      test('Deve registrar venda com sucesso', async () => {
        const mockResult = { venda: { id: 'venda-1' } };

        mockContainer.registrarVendaPrestacaoUseCase.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/comercial/consignacoes/1/prestacao/venda')
          .send({
            produtoId: 'prod-1',
            quantidade: 5,
            precoVenda: 60.00
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('Deve retornar erro quando precoVenda inválido', async () => {
        const response = await request(app)
          .post('/api/v1/comercial/consignacoes/1/prestacao/venda')
          .send({
            produtoId: 'prod-1',
            quantidade: 5,
            precoVenda: -10
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Projections', () => {
    describe('GET /api/v1/comercial/projections/dashboard', () => {
      test('Deve retornar dashboard com sucesso', async () => {
        const mockResult = {
          dados: {
            cards: [
              { titulo: 'Valor Consignado', valor: 10000 }
            ],
            kpis: {},
            totais: {},
            alertas: []
          },
          metadata: { escopo: 'GLOBAL' }
        };

        mockContainer.dashboardProjectionService.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .get('/api/v1/comercial/projections/dashboard')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.cards).toBeDefined();
      });
    });

    describe('GET /api/v1/comercial/projections/insights', () => {
      test('Deve retornar insights com sucesso', async () => {
        const mockResult = {
          dados: {
            insights: [{ codigo: 'SALDO_EM_ABERTO', categoria: 'FINANCEIRO', titulo: 'Saldo', mensagem: 'Teste' }],
            quantidade: 1
          },
          metadata: { escopo: 'GLOBAL' }
        };

        mockContainer.insightsProjectionService.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .get('/api/v1/comercial/projections/insights')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.insights).toHaveLength(1);
        expect(response.body.metadata.escopo).toBe('GLOBAL');
      });
    });

    describe('GET /api/v1/comercial/projections/pendencias', () => {
      test('Deve retornar pendências com sucesso', async () => {
        const mockResult = {
          dados: {
            resumo: { total: 1, criticos: 1, pendentes: 1 },
            criticas: [{ id: 'a1', descricao: 'Crítico' }],
            alertas: [{ id: 'a1', descricao: 'Crítico', severidade: 'CRITICAL' }],
            proximasAcoes: []
          },
          metadata: { escopo: 'GLOBAL' }
        };

        mockContainer.pendenciasProjectionService.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .get('/api/v1/comercial/projections/pendencias')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.resumo.criticos).toBe(1);
      });
    });

    describe('GET /api/v1/comercial/projections/recomendacoes', () => {
      test('Deve retornar recomendações com sucesso', async () => {
        const mockResult = {
          dados: {
            resumo: { total: 2, prioritarias: 1 },
            recomendacoes: [
              { id: 'rec-1', titulo: 'Cobrança', categoria: 'FINANCEIRO', confianca: 85 }
            ],
            prioritarias: [{ id: 'rec-1', titulo: 'Cobrança' }],
            kpis: { emitidas: 2, taxaAceitacao: 0 }
          },
          metadata: { escopo: 'GLOBAL' }
        };

        mockContainer.recomendacoesProjectionService.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .get('/api/v1/comercial/projections/recomendacoes')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.recomendacoes).toHaveLength(1);
      });
    });

    describe('GET /api/v1/comercial/projections/playbooks', () => {
      test('Deve retornar playbooks com sucesso', async () => {
        const mockResult = {
          dados: {
            resumo: { total: 12 },
            playbooks: [
              { id: 'PB-001', codigo: '001', nome: 'Cobrar Cliente Inadimplente', categoria: 'COBRANCA', aplicavel: true }
            ],
            sugeridos: [{ id: 'PB-001', codigo: '001', nome: 'Cobrar Cliente Inadimplente', score: 90 }],
            kpis: { catalogoTotal: 12, iniciados: 0, concluidos: 0, emAndamento: 0 }
          },
          metadata: { escopo: 'GLOBAL' }
        };

        mockContainer.playbooksProjectionService.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .get('/api/v1/comercial/projections/playbooks')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.playbooks).toHaveLength(1);
        expect(response.body.data.sugeridos).toHaveLength(1);
      });
    });

    describe('GET /api/v1/comercial/projections/workflow', () => {
      test('Deve retornar workflow operacional com sucesso', async () => {
        const mockResult = {
          dados: {
            resumo: { workflowsAtivos: 3, concluidosHoje: 0, bloqueados: 1, emAtraso: 1 },
            fila: [{ id: 'WF-1', titulo: 'Cobrança pendente', coluna: 'novo' }],
            workflows: [{ id: 'WF-1', titulo: 'Cobrança pendente' }],
            kanban: { novo: [{ id: 'WF-1' }], emAndamento: [], aguardando: [], bloqueado: [], concluido: [] },
            sla: { dentroPrazo: 2, proximoVencimento: 0, vencido: 1, itens: [] },
            distribuicao: [{ operador: 'Não atribuído', quantidade: 3 }],
            timeline: [],
            historico: []
          },
          metadata: { escopo: 'GLOBAL' }
        };

        mockContainer.workflowProjectionService.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .get('/api/v1/comercial/projections/workflow')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.resumo.workflowsAtivos).toBe(3);
        expect(response.body.data.kanban.novo).toHaveLength(1);
      });
    });

    describe('GET /api/v1/comercial/projections/situacao-cliente', () => {
      test('Deve retornar situação do cliente com sucesso', async () => {
        const mockResult = {
          dados: {
            clienteId: 'client-1',
            situacao: 'ATIVO',
            score: 850,
            nivelRisco: 'BAIXO',
            saldoEmAberto: 2500,
            limiteDisponivel: 7500,
            alertas: [],
            recomendacoes: []
          }
        };

        mockContainer.situacaoClienteProjectionService.executar.mockResolvedValue(mockResult);

        const response = await request(app)
          .get('/api/v1/comercial/projections/situacao-cliente?clienteId=client-1')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.clienteId).toBe('client-1');
      });

      test('Deve retornar erro quando clienteId não fornecido', async () => {
        const response = await request(app)
          .get('/api/v1/comercial/projections/situacao-cliente')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/v1/comercial/projections/resumo-prestacao', () => {
      test('Deve retornar erro quando consignacaoId não fornecido', async () => {
        const response = await request(app)
          .get('/api/v1/comercial/projections/resumo-prestacao')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Error Handling', () => {
    test('Deve tratar erros de domínio corretamente', async () => {
      const DomainError = require('../../domain/errors/DomainError');
      const error = new DomainError('Test error', { codigo: 'TEST_ERROR' });

      mockContainer.perfilComercialRepository.buscarPorId.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/v1/comercial/perfil-comercial/1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TEST_ERROR');
    });

    test('Deve tratar erros genéricos corretamente', async () => {
      mockContainer.perfilComercialRepository.buscarPorId.mockRejectedValue(new Error('Generic error'));

      const response = await request(app)
        .get('/api/v1/comercial/perfil-comercial/1')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
