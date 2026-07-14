/**
 * Erros de domínio do Motor Comercial.
 *
 * @module motores/motor-comercial/domain/errors
 */

const DomainError = require('./DomainError');
const PerfilNaoEncontradoError = require('./PerfilNaoEncontradoError');
const ConsignacaoNaoEncontradaError = require('./ConsignacaoNaoEncontradaError');
const PerfilBloqueadoError = require('./PerfilBloqueadoError');
const PrestacaoJaFechadaError = require('./PrestacaoJaFechadaError');
const PrestacaoNaoAbertaError = require('./PrestacaoNaoAbertaError');
const LimiteComercialInsuficienteError = require('./LimiteComercialInsuficienteError');
const MovimentacaoInvalidaError = require('./MovimentacaoInvalidaError');
const DocumentoInvalidoError = require('./DocumentoInvalidoError');
const ProdutoNaoEncontradoNaConsignacaoError = require('./ProdutoNaoEncontradoNaConsignacaoError');
const ErroDuplicidadeDocumentoError = require('./ErroDuplicidadeDocumentoError');
const ClienteNaoEncontradoError = require('./ClienteNaoEncontradoError');
const PerfilDuplicadoError = require('./PerfilDuplicadoError');
const PerfilInvalidoError = require('./PerfilInvalidoError');
const PerfilJaAtivoError = require('./PerfilJaAtivoError');
const PerfilJaInativoError = require('./PerfilJaInativoError');
const ConsignacaoNaoEstaEmRascunhoError = require('./ConsignacaoNaoEstaEmRascunhoError');
const ProdutoDuplicadoNaConsignacaoError = require('./ProdutoDuplicadoNaConsignacaoError');
const ProdutoInvalidoError = require('./ProdutoInvalidoError');
const QuantidadeInvalidaError = require('./QuantidadeInvalidaError');
const ConsignacaoSemItensError = require('./ConsignacaoSemItensError');
const ClienteNaoHabilitadoParaConsignacaoError = require('./ClienteNaoHabilitadoParaConsignacaoError');
const DocumentoDuplicadoError = require('./DocumentoDuplicadoError');
const ConsignacaoNaoEntregueError = require('./ConsignacaoNaoEntregueError');
const EntregaJaRealizadaError = require('./EntregaJaRealizadaError');
const TransferenciaInvalidaError = require('./TransferenciaInvalidaError');
const QuantidadeSuperiorAoSaldoError = require('./QuantidadeSuperiorAoSaldoError');
const PerfilSemLimiteDisponivelError = require('./PerfilSemLimiteDisponivelError');
const ClienteBloqueadoError = require('./ClienteBloqueadoError');
const PrestacaoJaAbertaError = require('./PrestacaoJaAbertaError');
const ProdutoNaoPertencePrestacaoError = require('./ProdutoNaoPertencePrestacaoError');
const PagamentoMaiorQueSaldoError = require('./PagamentoMaiorQueSaldoError');
const SaldoPrestacaoInconsistenteError = require('./SaldoPrestacaoInconsistenteError');
const PrestacaoSemMovimentacoesError = require('./PrestacaoSemMovimentacoesError');
const ReaberturaNaoAutorizadaError = require('./ReaberturaNaoAutorizadaError');
const OperacaoNaoAutorizadaError = require('./OperacaoNaoAutorizadaError');

module.exports = {
  DomainError,
  PerfilNaoEncontradoError,
  ConsignacaoNaoEncontradaError,
  PerfilBloqueadoError,
  PrestacaoJaFechadaError,
  PrestacaoJaAbertaError,
  PrestacaoNaoAbertaError,
  LimiteComercialInsuficienteError,
  MovimentacaoInvalidaError,
  DocumentoInvalidoError,
  ProdutoNaoEncontradoNaConsignacaoError,
  ErroDuplicidadeDocumentoError,
  ClienteNaoEncontradoError,
  PerfilDuplicadoError,
  PerfilInvalidoError,
  PerfilJaAtivoError,
  PerfilJaInativoError,
  ConsignacaoNaoEstaEmRascunhoError,
  ProdutoDuplicadoNaConsignacaoError,
  ProdutoInvalidoError,
  QuantidadeInvalidaError,
  ConsignacaoSemItensError,
  ClienteNaoHabilitadoParaConsignacaoError,
  DocumentoDuplicadoError,
  ConsignacaoNaoEntregueError,
  EntregaJaRealizadaError,
  TransferenciaInvalidaError,
  QuantidadeSuperiorAoSaldoError,
  PerfilSemLimiteDisponivelError,
  ClienteBloqueadoError,
  ProdutoNaoPertencePrestacaoError,
  PagamentoMaiorQueSaldoError,
  SaldoPrestacaoInconsistenteError,
  PrestacaoSemMovimentacoesError,
  ReaberturaNaoAutorizadaError,
  OperacaoNaoAutorizadaError
};
