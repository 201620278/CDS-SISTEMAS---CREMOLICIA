const BasePinpad = require('./BasePinpad');
const GertecPinpad = require('./GertecPinpad');
const IngenicoPinpad = require('./IngenicoPinpad');
const VerifonePinpad = require('./VerifonePinpad');
const PaxPinpad = require('./PaxPinpad');

async function obterPinpad(config) {
  const fabricante = config.fabricante || config.fabricante;

  switch (fabricante) {
    case 'Gertec':
      return new GertecPinpad(config);
    case 'Ingenico':
      return new IngenicoPinpad(config);
    case 'Verifone':
      return new VerifonePinpad(config);
    case 'PAX':
      return new PaxPinpad(config);
    default:
      throw new Error(`Fabricante de PinPad não suportado: ${fabricante}`);
  }
}

module.exports = {
  obterPinpad
};
