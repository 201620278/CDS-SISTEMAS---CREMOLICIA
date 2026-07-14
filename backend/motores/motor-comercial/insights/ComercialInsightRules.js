/**
 * Regras de Insight Comercial — Shared Insight Engine.
 *
 * Sprint O-8: leitura via Projection Services, sem alteração de domínio.
 *
 * @module motores/motor-comercial/insights/ComercialInsightRules
 */

const IInsightRule = require('../../../shared/insights/contracts/IInsightRule');
const { prestacaoEstaAberta } = require('../usecases/consignacao/consignacaoOperacaoHelpers');

class SaldoEmAbertoRule extends IInsightRule {
  codigo() { return 'SALDO_EM_ABERTO'; }
  categoria() { return 'FINANCEIRO'; }
  prioridade() { return 'HIGH'; }
  severidade() { return 'HIGH'; }

  async executar(context) {
    const dashboard = await context.projectionServices.dashboard.executar(context.metadata || {});
    const saldo = Number(dashboard.totais?.saldoEmAberto ?? 0);
    if (saldo <= 0) return null;
    return {
      titulo: 'Saldo em aberto',
      mensagem: `Saldo comercial em aberto: R$ ${saldo.toFixed(2)}`,
      dados: { saldo, origemProjecao: 'dashboard' }
    };
  }
}

class PerdaElevadaRule extends IInsightRule {
  codigo() { return 'PERDA_ELEVADA'; }
  categoria() { return 'INTELIGENCIA'; }
  prioridade() { return 'HIGH'; }
  severidade() { return 'HIGH'; }

  async executar(context) {
    const result = await context.projectionServices.indicadores.executar(context.metadata || {});
    const percentual = Number(result.indicadores?.percentualPerda ?? 0);
    if (percentual <= 10) return null;
    return {
      titulo: 'Perdas acima da média',
      mensagem: `Percentual de perda: ${percentual.toFixed(2)}%`,
      dados: { percentual, origemProjecao: 'indicadores' }
    };
  }
}

class ConversaoBaixaRule extends IInsightRule {
  codigo() { return 'CONVERSAO_BAIXA'; }
  categoria() { return 'INTELIGENCIA'; }
  prioridade() { return 'NORMAL'; }
  severidade() { return 'MEDIUM'; }

  async executar(context) {
    const result = await context.projectionServices.indicadores.executar(context.metadata || {});
    const conversao = Number(result.indicadores?.percentualConversao ?? 100);
    if (conversao >= 50) return null;
    return {
      titulo: 'Conversão baixa',
      mensagem: `Taxa de conversão: ${conversao.toFixed(2)}%`,
      dados: { conversao, origemProjecao: 'indicadores' }
    };
  }
}

class CortesiaElevadaRule extends IInsightRule {
  codigo() { return 'CORTESIAS_ELEVADAS'; }
  categoria() { return 'INTELIGENCIA'; }
  prioridade() { return 'NORMAL'; }
  severidade() { return 'MEDIUM'; }

  async executar(context) {
    const result = await context.projectionServices.saldos.executar(context.metadata || {});
    const cortesia = Number(result.dados?.saldoCortesia ?? result.totais?.saldoCortesia ?? 0);
    const vendido = Number(result.dados?.saldoVendido ?? result.totais?.saldoVendido ?? 0);
    if (vendido <= 0 || cortesia / vendido <= 0.15) return null;
    return {
      titulo: 'Cortesias elevadas',
      mensagem: `Cortesias representam ${((cortesia / vendido) * 100).toFixed(1)}% das vendas`,
      dados: { cortesia, vendido, origemProjecao: 'saldos' }
    };
  }
}

class ClienteBloqueadoRule extends IInsightRule {
  codigo() { return 'CLIENTE_BLOQUEADO'; }
  categoria() { return 'COMERCIAL'; }
  prioridade() { return 'URGENT'; }
  severidade() { return 'CRITICAL'; }

  async executar(context) {
    const repo = context.repositories.perfilComercialRepository;
    if (!repo) return null;
    const perfis = await repo.listar({ bloqueado: true, ...(context.metadata?.clienteId ? { clienteId: context.metadata.clienteId } : {}) });
    if (!perfis.length) return null;
    const perfil = perfis[0];
    return {
      titulo: 'Cliente bloqueado',
      mensagem: `Perfil comercial bloqueado (cliente ${perfil.clienteId})`,
      dados: {
        clienteId: perfil.clienteId,
        perfilComercialId: perfil.id,
        origemProjecao: 'perfil-comercial'
      }
    };
  }
}

class PrestacaoAtrasadaRule extends IInsightRule {
  codigo() { return 'PRESTACAO_ATRASADA'; }
  categoria() { return 'COMERCIAL'; }
  prioridade() { return 'URGENT'; }
  severidade() { return 'CRITICAL'; }

  async executar(context) {
    const repo = context.repositories.consignacaoRepository;
    if (!repo) return null;
    const consignacoes = await repo.listar(context.metadata?.clienteId ? { clienteId: context.metadata.clienteId } : {});
    const atrasada = consignacoes.find((c) => {
      if (c.status !== 'ENTREGUE' || !prestacaoEstaAberta(c)) return false;
      const entrega = c.dataEntrega ? new Date(c.dataEntrega) : null;
      if (!entrega) return false;
      const dias = Math.floor((Date.now() - entrega.getTime()) / (1000 * 60 * 60 * 24));
      return dias > 30;
    });
    if (!atrasada) return null;
    return {
      titulo: 'Prestação atrasada',
      mensagem: `Consignação ${atrasada.documento?.numero || atrasada.id} com prestação atrasada`,
      dados: {
        consignacaoId: atrasada.id,
        clienteId: atrasada.clienteId,
        documento: atrasada.documento?.numero,
        origemProjecao: 'consignacoes'
      }
    };
  }
}

class EntregaPendenteRule extends IInsightRule {
  codigo() { return 'ENTREGA_PENDENTE'; }
  categoria() { return 'OPERACIONAL'; }
  prioridade() { return 'HIGH'; }
  severidade() { return 'HIGH'; }

  async executar(context) {
    const repo = context.repositories.consignacaoRepository;
    if (!repo) return null;
    const consignacoes = await repo.listar(context.metadata?.clienteId ? { clienteId: context.metadata.clienteId } : {});
    const pendente = consignacoes.find((c) => c.status === 'RASCUNHO');
    if (!pendente) return null;
    return {
      titulo: 'Entrega pendente',
      mensagem: `Consignação ${pendente.documento?.numero || pendente.id} aguardando entrega`,
      dados: {
        consignacaoId: pendente.id,
        clienteId: pendente.clienteId,
        documento: pendente.documento?.numero,
        origemProjecao: 'consignacoes'
      }
    };
  }
}

class PrestacaoAbertaRule extends IInsightRule {
  codigo() { return 'PRESTACAO_ABERTA'; }
  categoria() { return 'OPERACIONAL'; }
  prioridade() { return 'NORMAL'; }
  severidade() { return 'MEDIUM'; }

  async executar(context) {
    const repo = context.repositories.consignacaoRepository;
    if (!repo) return null;
    const consignacoes = await repo.listar(context.metadata?.clienteId ? { clienteId: context.metadata.clienteId } : {});
    const aberta = consignacoes.find((c) => c.status === 'ENTREGUE' && prestacaoEstaAberta(c));
    if (!aberta) return null;
    return {
      titulo: 'Prestação aberta',
      mensagem: `Prestação aberta na consignação ${aberta.documento?.numero || aberta.id}`,
      dados: {
        consignacaoId: aberta.id,
        clienteId: aberta.clienteId,
        documento: aberta.documento?.numero,
        origemProjecao: 'consignacoes'
      }
    };
  }
}

class LimiteComprometidoRule extends IInsightRule {
  codigo() { return 'LIMITE_COMPROMETIDO'; }
  categoria() { return 'FINANCEIRO'; }
  prioridade() { return 'HIGH'; }
  severidade() { return 'HIGH'; }

  async executar(context) {
    if (!context.metadata?.clienteId) return null;
    const situacao = await context.projectionServices.situacaoCliente.executar({ clienteId: context.metadata.clienteId });
    const limite = Number(situacao.dados?.limite ?? 0);
    const saldo = Number(situacao.dados?.saldo ?? 0);
    if (limite <= 0 || saldo / limite < 0.85) return null;
    return {
      titulo: 'Limite comprometido',
      mensagem: `Cliente utilizou ${((saldo / limite) * 100).toFixed(0)}% do limite comercial`,
      dados: { limite, saldo, clienteId: context.metadata.clienteId, origemProjecao: 'situacao-cliente' }
    };
  }
}

function criarRegrasComerciais() {
  return [
    new SaldoEmAbertoRule(),
    new PerdaElevadaRule(),
    new ConversaoBaixaRule(),
    new CortesiaElevadaRule(),
    new ClienteBloqueadoRule(),
    new PrestacaoAtrasadaRule(),
    new EntregaPendenteRule(),
    new PrestacaoAbertaRule(),
    new LimiteComprometidoRule()
  ];
}

module.exports = {
  criarRegrasComerciais,
  SaldoEmAbertoRule,
  PerdaElevadaRule,
  ConversaoBaixaRule,
  CortesiaElevadaRule,
  ClienteBloqueadoRule,
  PrestacaoAtrasadaRule,
  EntregaPendenteRule,
  PrestacaoAbertaRule,
  LimiteComprometidoRule
};
