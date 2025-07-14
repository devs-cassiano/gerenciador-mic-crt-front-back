const MicDtaModel = require('../models/micDtaModel');
const CrtModel = require('../models/crtModel');
const DestinationLicenseModel = require('../models/destinationLicenseModel');
const TransportadoraModel = require('../models/transportadoraModel');
const DocumentNumberService = require('./documentNumberService');
const DateUtils = require('../utils/dateUtils');
const ApiResponse = require('../utils/response');

class MicDtaService {
  static async create(micDtaData) {
    try {
      const { tipo = 'NORMAL', crtId, transportadoraId, paisOrigemCodigo, paisDestinoCodigo, quantidade = 1 } = micDtaData;

      console.log(`📋 Criando MIC/DTA tipo: ${tipo}`);

      if (tipo === 'NORMAL') {
        return await this.createNormal({ crtId, quantidade });
      } else if (tipo === 'LASTRE') {
        return await this.createLastre({ transportadoraId, paisOrigemCodigo, paisDestinoCodigo, quantidade });
      } else {
        return ApiResponse.error('Tipo de MIC/DTA inválido. Use NORMAL ou LASTRE', 400);
      }
    } catch (error) {
      return ApiResponse.error('Erro ao criar MIC/DTA: ' + error.message, 500);
    }
  }

  static async createNormal({ crtId, quantidade }) {
    // Verificar se o CRT existe e buscar suas informações
    const crt = await CrtModel.findById(crtId);
    if (!crt) {
      return ApiResponse.error('CRT não encontrado', 404);
    }

    // Herdar TODAS as informações do CRT automaticamente
    const paisOrigemCodigo = crt.paisOrigemCodigo;
    const paisDestinoCodigo = crt.paisDestinoCodigo;
    const licencaComplementar = crt.licencaComplementar;
    const transportadoraId = crt.transportadoraId;

    console.log(`   📋 NORMAL - Herdando do CRT ${crt.numero}:`);
    console.log(`   - País Origem: ${paisOrigemCodigo}`);
    console.log(`   - País Destino: ${paisDestinoCodigo}`);
    console.log(`   - Licença: ${licencaComplementar}`);

    // Gerar números sequenciais usando as informações herdadas do CRT
    const numerosData = await DocumentNumberService.getNextNumbers(
      'MIC-DTA', 
      transportadoraId, 
      paisOrigemCodigo, 
      paisDestinoCodigo,
      licencaComplementar,
      quantidade
    );

    const dataCriacao = DateUtils.getCurrentDate();
    const micDtasCreated = [];
    
    // Criar MIC/DTAs NORMAL com informações herdadas
    for (const numeroData of numerosData) {
      const micDta = await MicDtaModel.create({
        numero: numeroData.numero,
        tipo: 'NORMAL',
        paisOrigemCodigo: numeroData.paisOrigemCodigo,
        paisDestinoCodigo: numeroData.paisDestinoCodigo,
        licencaComplementar: numeroData.licencaComplementar,
        numeroSequencial: numeroData.numeroSequencial,
        crtId,
        transportadoraId,
        dataCriacao
      });
      micDtasCreated.push(micDta);
    }

    return ApiResponse.success({
      micDtas: micDtasCreated,
      tipo: 'NORMAL',
      herdadoDoCrt: {
        numero: crt.numero,
        paisOrigem: paisOrigemCodigo,
        paisDestino: paisDestinoCodigo,
        licenca: licencaComplementar
      }
    }, `${quantidade} MIC/DTA(s) NORMAL criado(s) com sucesso, herdando dados do CRT ${crt.numero}`);
  }

  static async createLastre({ transportadoraId, paisOrigemCodigo, paisDestinoCodigo, quantidade }) {
    // Verificar se a transportadora existe
    const transportadora = await TransportadoraModel.findById(transportadoraId);
    if (!transportadora) {
      return ApiResponse.error('Transportadora não encontrada', 404);
    }

    // Para LASTRE, o país de origem pode ser diferente do país da transportadora
    // Exemplo: transportadora emitindo LASTRE vindo de outro país
    const paisOrigem = paisOrigemCodigo || transportadora.pais;

    // Validar países
    if (!DocumentNumberService.validateCountryCode(paisOrigem)) {
      return ApiResponse.error('Código de país de origem inválido', 400);
    }

    if (!DocumentNumberService.validateCountryCode(paisDestinoCodigo)) {
      return ApiResponse.error('Código de país de destino inválido', 400);
    }

    console.log(`   🚛 LASTRE - Configuração:`);
    console.log(`   - Transportadora: ${transportadora.nome} (${transportadora.pais})`);
    console.log(`   - País Origem (viagem): ${paisOrigem}`);
    console.log(`   - País Destino: ${paisDestinoCodigo}`);

    // Usar o método específico para LASTRE (suporta brasileiras e estrangeiras)
    const numerosData = await DocumentNumberService.getNextNumbersForLastre(
      transportadoraId, 
      paisOrigem, 
      paisDestinoCodigo,
      quantidade
    );

    const dataCriacao = DateUtils.getCurrentDate();
    const micDtasCreated = [];
    
    // Criar MIC/DTAs LASTRE sem CRT
    for (const numeroData of numerosData) {
      const micDta = await MicDtaModel.create({
        numero: numeroData.numero,
        tipo: 'LASTRE',
        paisOrigemCodigo: numeroData.paisOrigemCodigo,
        paisDestinoCodigo: numeroData.paisDestinoCodigo,
        licencaComplementar: numeroData.licencaComplementar,
        numeroSequencial: numeroData.numeroSequencial,
        crtId: null, // LASTRE não tem CRT
        transportadoraId,
        dataCriacao
      });
      micDtasCreated.push(micDta);
    }

    return ApiResponse.success({
      micDtas: micDtasCreated,
      tipo: 'LASTRE',
      configuracao: {
        transportadora: transportadora.nome,
        paisOrigem: paisOrigem,
        paisDestino: paisDestinoCodigo,
        licenca: licencaComplementar,
        observacao: 'MIC/DTA LASTRE - Caminhão sem carga'
      }
    }, `${quantidade} MIC/DTA(s) LASTRE criado(s) com sucesso para ${transportadora.nome}`);
  }

  static async getAll() {
    try {
      const micDtas = await MicDtaModel.findAll();
      return ApiResponse.success(micDtas);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar MIC/DTAs', 500);
    }
  }

  static async getByTransportadora(transportadoraId) {
    try {
      const micDtas = await MicDtaModel.findByTransportadora(transportadoraId);
      return ApiResponse.success(micDtas);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar MIC/DTAs da transportadora', 500);
    }
  }

  static async getByCrt(crtId) {
    try {
      const micDtas = await MicDtaModel.findByCrt(crtId);
      return ApiResponse.success(micDtas);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar MIC/DTAs do CRT', 500);
    }
  }

  static async getByTipo(tipo) {
    try {
      const micDtas = await MicDtaModel.findByTipo(tipo);
      return ApiResponse.success(micDtas);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar MIC/DTAs por tipo', 500);
    }
  }
}

module.exports = MicDtaService;