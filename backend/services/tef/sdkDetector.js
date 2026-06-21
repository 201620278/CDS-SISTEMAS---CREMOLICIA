const fs = require('fs');

class SDKDetector {

    localizarSDKs() {

        const locais = [
            'C:/CliSiTef/Clisitef64I.dll',
            'C:/CliSiTef/Clisitef32I.dll',

            'C:/Program Files/CliSiTef/Clisitef64I.dll',
            'C:/Program Files/CliSiTef/Clisitef32I.dll',

            'C:/Program Files (x86)/CliSiTef/Clisitef64I.dll',
            'C:/Program Files (x86)/CliSiTef/Clisitef32I.dll',

            'C:/SiTef/Clisitef64I.dll',
            'C:/SiTef/Clisitef32I.dll',

            'C:/TEF/Clisitef64I.dll',
            'C:/TEF/Clisitef32I.dll',

            'C:/PayGo/PayGo.dll',
            'C:/Program Files/PayGo/PayGo.dll',
            'C:/Program Files (x86)/PayGo/PayGo.dll'
        ];

        const encontrados = [];

        for (const arquivo of locais) {

            if (fs.existsSync(arquivo)) {

                encontrados.push({
                    caminho: arquivo,
                    encontrado: true
                });
            }
        }

        return encontrados;
    }
}

module.exports = new SDKDetector();
