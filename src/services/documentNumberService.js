const database = require('../config/database');
const TransportadoraModel = require('../models/transportadoraModel');
const DestinationLicenseModel = require('../models/destinationLicenseModel');
const { COUNTRIES } = require('../config/countries');

class DocumentNumberService {
  static async getLicenseForAnyDirection(transportadoraId, paisA, paisB) {
    // Busca licença para paisA como destino ou paisB como destino
    const destinationLicense = await DestinationLicenseModel.findByTransportadora(transportadoraId);
    let license = destinationLicense.find(dl => dl.paisDestino === paisA);
    if (!license) {
      license = destinationLicense.find(dl => dl.paisDestino === paisB);
    }
    // Se não encontrar, verifica se país de registro é igual a origem ou destino
    const transportadora = await TransportadoraModel.findById(transportadoraId);
    if (!license && (transportadora.pais === paisA || transportadora.pais === paisB)) {
      // Cria licença fictícia usando país de registro
      license = {
        licenca: transportadora.pais === 'BR' ? transportadora.numeroRegistro : transportadora.numeroRegistro,
        idoneidade: transportadora.pais !== 'BR' ? transportadora.numeroRegistro : undefined,
        paisDestino: transportadora.pais
      };
    }
    return license;
  }

  static async getLicenseForAnyDirectionCRT(transportadoraId, paisOrigemCodigo, paisDestinoCodigo) {
    const destinationLicense = await DestinationLicenseModel.findByTransportadora(transportadoraId);
    let license = destinationLicense.find(dl => dl.paisDestino === paisOrigemCodigo);
    if (!license) {
      license = destinationLicense.find(dl => dl.paisDestino === paisDestinoCodigo);
    }
    const transportadora = await TransportadoraModel.findById(transportadoraId);
    // Se não encontrar, verifica se país de registro é igual a origem ou destino
    if (!license && (transportadora.pais === paisOrigemCodigo || transportadora.pais === paisDestinoCodigo)) {
      license = {
        licenca: transportadora.pais === 'BR' ? transportadora.numeroRegistro : transportadora.numeroRegistro,
        idoneidade: transportadora.pais !== 'BR' ? transportadora.numeroRegistro : undefined,
        paisDestino: transportadora.pais
      };
    }
    // Se ainda não encontrar, verifica se o destino é igual ao país da transportadora
    if (!license && paisDestinoCodigo === transportadora.pais) {
      license = {
        licenca: transportadora.pais === 'BR' ? transportadora.numeroRegistro : transportadora.numeroRegistro,
        idoneidade: transportadora.pais !== 'BR' ? transportadora.numeroRegistro : undefined,
        paisDestino: transportadora.pais
      };
    }
    return license;
  }

  static async getLicenseBetweenCountries(transportadoraId, paisA, paisB) {
    const destinationLicense = await DestinationLicenseModel.findByTransportadora(transportadoraId);
    // Busca licença que vincule os dois países, em qualquer sentido
    return destinationLicense.find(dl =>
      (dl.paisDestino === paisA && (paisB === dl.paisOrigem || !dl.paisOrigem)) ||
      (dl.paisDestino === paisB && (paisA === dl.paisOrigem || !dl.paisOrigem))
    ) || destinationLicense.find(dl =>
      (dl.paisDestino === paisA || dl.paisDestino === paisB)
    );
  }

  static async getNextNumbers(tipo, transportadoraId, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, quantidade) {
    try {
      let licencaComp = licencaComplementar;
      const transportadora = await TransportadoraModel.findById(transportadoraId);
      if (!transportadora) {
        throw new Error('Transportadora não encontrada');
      }
      // Sempre buscar a licença normalmente, independente do país de destino
      const licenseForDirection = await DestinationLicenseModel.findLicenseForCountries(transportadoraId, paisOrigemCodigo, paisDestinoCodigo);
      if (!licenseForDirection) {
        throw new Error(`Transportadora não possui licença que vincule os países ${paisOrigemCodigo} e ${paisDestinoCodigo}`);
      }
      if (transportadora.pais === 'BR') {
        const match = licenseForDirection.licenca.match(/^[A-Z]*?(\d{4})/);
        if (match) {
          licencaComp = match[1];
        }
      } else {
        licencaComp = licenseForDirection.idoneidade || licenseForDirection.licenca;
      }

      return new Promise((resolve, reject) => {
        database.getInstance().serialize(() => {
          // Buscar última sequência GLOBAL por transportadora e tipo
          const selectSql = `
            SELECT ultimoNumero FROM number_sequences 
            WHERE tipo = ? AND transportadoraId = ?
          `;
          database.getInstance().get(selectSql, [
            tipo,
            transportadoraId
          ], (err, row) => {
            if (err) {
              reject(err);
              return;
            }

            let ultimoNumero;
            if (row) {
              ultimoNumero = row.ultimoNumero;
            } else {
              ultimoNumero = tipo === 'CRT' ? 
                (transportadora.numeroInicialCRT - 1) : 
                (transportadora.numeroInicialMicDta - 1);
            }

            const numeros = [];
            for (let i = 0; i < quantidade; i++) {
              ultimoNumero++;
              const numeroFormatado = String(ultimoNumero).padStart(5, '0');
              // Prefixo sempre do país de origem do documento
              const numeroCompleto = `${paisOrigemCodigo}${licencaComp}${numeroFormatado}`;
              numeros.push({
                numero: numeroCompleto,
                paisOrigemCodigo,
                paisDestinoCodigo: paisDestinoCodigo || null,
                licencaComplementar: licencaComp,
                numeroSequencial: ultimoNumero
              });
            }

            // Atualizar ou inserir a sequência com o último número gerado
            const upsertSql = `
              INSERT INTO number_sequences (tipo, transportadoraId, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, ultimoNumero)
              VALUES (?, ?, '', '', '', ?)
              ON CONFLICT(tipo, transportadoraId, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar)
              DO UPDATE SET ultimoNumero = ?
            `;
            database.getInstance().run(upsertSql, [
              tipo,
              transportadoraId,
              ultimoNumero,
              ultimoNumero
            ], (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(numeros);
              }
            });
          });
        });
      });
    } catch (error) {
      throw error;
    }
  }

  static async getNextNumbersForLastre(transportadoraId, paisOrigemCodigo, paisDestinoCodigo, quantidade, licencaComplementar = null) {
    // Chama getNextNumbers com a mesma lógica
    return this.getNextNumbers('MIC-DTA', transportadoraId, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, quantidade);
  }

  static validateCountryCode(countryCode) {
    return COUNTRIES.hasOwnProperty(countryCode);
  }

  static getAvailableCountries() {
    return Object.values(COUNTRIES);
  }
}

module.exports = DocumentNumberService;