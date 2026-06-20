const SitefAdapter = require('./adapters/sitefAdapter');
const StoneAdapter = require('./adapters/stoneAdapter');
const CieloAdapter = require('./adapters/cieloAdapter');
const RedeAdapter = require('./adapters/redeAdapter');
const GetnetAdapter = require('./adapters/getnetAdapter');
const PayGoAdapter = require('./adapters/paygoAdapter');
const tefConfigRepository = require('../../repositories/tefConfigRepository');

async function obterAdapter() {
  const registro = await tefConfigRepository.buscarConfiguracaoPrincipal();
  
  if (!registro) {
    throw new Error('TEF não configurado');
  }

  const provedor = registro.provedor;

  const adapters = {
    sitef: SitefAdapter,
    stone: StoneAdapter,
    cielo: CieloAdapter,
    rede: RedeAdapter,
    getnet: GetnetAdapter,
    paygo: PayGoAdapter
  };

  const Adapter = adapters[provedor];

  if (!Adapter) {
    throw new Error(
      `Provedor TEF não suportado: ${provedor}`
    );
  }

  return new Adapter(registro);
}

module.exports = {
  obterAdapter
};
