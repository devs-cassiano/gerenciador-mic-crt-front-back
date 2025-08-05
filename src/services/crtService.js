const CrtModel = require('../models/crtModel');
const TransportadoraModel = require('../models/transportadoraModel');
const DestinationLicenseModel = require('../models/destinationLicenseModel');
const DocumentNumberService = require('./documentNumberService');
const DateUtils = require('../utils/dateUtils');
const ApiResponse = require('../utils/response');

class CrtService {
  static async create(crtData) {
    try {
      const { 
        transportadoraId, 
        quantidade = 1, 
        faturaComercial, 
        exportador, 
        importador,
        paisOrigemCodigo,
        paisDestinoCodigo // Agora obrigatório para definir a licença
      } = crtData;

      // Verificar se a transportadora existe
      const transportadora = await TransportadoraModel.findById(transportadoraId);
      if (!transportadora) {
        return ApiResponse.error('Transportadora não encontrada', 404);
      }

      // Usar o país da transportadora como origem se não informado
      const paisOrigem = paisOrigemCodigo || transportadora.pais;

      // Validar país de origem
      if (!DocumentNumberService.validateCountryCode(paisOrigem)) {
        return ApiResponse.error('Código de país de origem inválido', 400);
      }

      // Validar país de destino (obrigatório)
      if (!paisDestinoCodigo) {
        return ApiResponse.error('País de destino é obrigatório para definir a licença', 400);
      }

      if (!DocumentNumberService.validateCountryCode(paisDestinoCodigo)) {
        return ApiResponse.error('Código de país de destino inválido', 400);
      }

      let licencaComplementar = null;
      // Se o país de destino for igual ao país de origem da transportadora, ignora validação de licença
      if (paisDestinoCodigo === transportadora.pais) {
        licencaComplementar = null;
        console.log('CRT - País de destino igual ao país de origem da transportadora. Ignorando validação de licença.');
      } else {
        // Buscar a licença da transportadora para o destino específico
        const destinationLicenses = await DestinationLicenseModel.findByTransportadora(transportadoraId);
        const licenseForDestination = destinationLicenses.find(dl => dl.paisDestino === paisDestinoCodigo);
        if (!licenseForDestination) {
          return ApiResponse.error(
            `Transportadora não possui licença configurada para destino ${paisDestinoCodigo}`, 
            400
          );
        }
        // Para transportadoras brasileiras, extrair os 4 primeiros dígitos após as letras iniciais
        if (transportadora.pais === 'BR') {
          const licenca = licenseForDestination.licenca;
          // Extrair os 4 primeiros dígitos após letras iniciais (ex: BR6023/1800648 → 6023)
          const match = licenca.match(/^[A-Z]*(\d{4})/);
          if (!match) {
            throw new Error(`Licença brasileira deve conter pelo menos 4 dígitos após as letras iniciais (ex: BR1234/56). Formato atual: ${licenca}`);
          }
          // Usar os 4 primeiros dígitos como idoneidade
          licencaComplementar = match[1];
          console.log(`   🇧🇷 CRT - Licença brasileira: ${licenca} → Idoneidade: ${licencaComplementar}`);
        } else {
          // Para transportadoras estrangeiras, usar a idoneidade
          if (!licenseForDestination.idoneidade) {
            throw new Error('Transportadora estrangeira deve ter idoneidade configurada para emitir CRT');
          }
          licencaComplementar = licenseForDestination.idoneidade;
          console.log(`   🌍 CRT - Transportadora estrangeira → Idoneidade: ${licencaComplementar}`);
        }
      }

      // Gerar números sequenciais
      const numerosData = await DocumentNumberService.getNextNumbers(
        'CRT', 
        transportadoraId, 
        paisOrigem, 
        paisDestinoCodigo,
        licencaComplementar,
        quantidade
      );

      const dataCriacao = DateUtils.getCurrentDate();
      const crtsCreated = [];
      
      // Criar CRTs
      for (const numeroData of numerosData) {
        const crt = await CrtModel.create({
          numero: numeroData.numero,
          paisOrigemCodigo: numeroData.paisOrigemCodigo,
          paisDestinoCodigo: paisDestinoCodigo,
          licencaComplementar: numeroData.licencaComplementar,
          numeroSequencial: numeroData.numeroSequencial,
          faturaComercial,
          exportador,
          importador,
          dataCriacao,
          transportadoraId
        });
        crtsCreated.push(crt);
      }

      return ApiResponse.success(crtsCreated, `${quantidade} CRT(s) criado(s) com sucesso`);
    } catch (error) {
      return ApiResponse.error('Erro ao criar CRT: ' + error.message, 500);
    }
  }

  static async getAll() {
    try {
      const crts = await CrtModel.findAll();
      return ApiResponse.success(crts);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar CRTs', 500);
    }
  }

  static async getByTransportadora(transportadoraId) {
    try {
      const crts = await CrtModel.findByTransportadora(transportadoraId);
      return ApiResponse.success(crts);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar CRTs da transportadora', 500);
    }
  }

  static async getById(id) {
    try {
      const crt = await CrtModel.findById(id);
      if (!crt) {
        return ApiResponse.error('CRT não encontrado', 404);
      }
      return ApiResponse.success(crt);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar CRT', 500);
    }
  }
}

module.exports = CrtService;