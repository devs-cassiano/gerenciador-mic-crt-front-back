// ...existing code...
const MicDtaModel = require('../models/micDtaModel');
const CrtModel = require('../models/crtModel');
const DestinationLicenseModel = require('../models/destinationLicenseModel');
const TransportadoraModel = require('../models/transportadoraModel');
const DocumentNumberService = require('./documentNumberService');
const DateUtils = require('../utils/dateUtils');
const ApiResponse = require('../utils/response');

class MicDtaService {
  static async create(data) {
    try {
      const { tipo } = data;
      if (tipo === 'NORMAL') {
        const { crtIds, transportadoraId, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, quantidade } = data;
        if (!Array.isArray(crtIds) || crtIds.length === 0) {
          return ApiResponse.error('crtIds é obrigatório para MIC-DTA NORMAL', 400);
        }
        // Gerar número do MIC-DTA
        const numeros = await DocumentNumberService.getNextNumbers(
          'MIC-DTA',
          transportadoraId,
          paisOrigemCodigo,
          paisDestinoCodigo,
          licencaComplementar,
          1
        );
        const numeroObj = (numeros && numeros[0]) ? numeros[0] : null;
        if (!numeroObj || !numeroObj.numero || !numeroObj.numeroSequencial) {
          return ApiResponse.error('Falha ao gerar número do MIC-DTA', 500);
        }
        // Cria o MIC-DTA principal
        const dataCriacao = data.dataCriacao || new Date().toISOString().slice(0, 10);
        const micDta = await MicDtaModel.create({ ...data, numero: numeroObj.numero, numeroSequencial: numeroObj.numeroSequencial, dataCriacao });
        // Associa todos os CRTs recebidos
        for (const crtId of crtIds) {
          await MicDtaModel.linkToCrt(micDta.id, crtId);
        }
        return ApiResponse.success({ ...micDta, crtIds }, 'MIC-DTA NORMAL criado e CRTs vinculados com sucesso');
      } else if (tipo === 'LASTRE') {
        // Gerar número do MIC-DTA LASTRE
        const { transportadoraId, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, quantidade } = data;
        const numeros = await DocumentNumberService.getNextNumbers(
          'MIC-DTA',
          transportadoraId,
          paisOrigemCodigo,
          paisDestinoCodigo,
          licencaComplementar,
          1
        );
        const numeroObj = (numeros && numeros[0]) ? numeros[0] : null;
        if (!numeroObj || !numeroObj.numero || !numeroObj.numeroSequencial) {
          return ApiResponse.error('Falha ao gerar número do MIC-DTA', 500);
        }
        // Criação de MIC-DTA LASTRE
        const dataCriacao = data.dataCriacao || new Date().toISOString().slice(0, 10);
        const micDta = await MicDtaModel.create({ ...data, numero: numeroObj.numero, numeroSequencial: numeroObj.numeroSequencial, dataCriacao });
        return ApiResponse.success(micDta, 'MIC-DTA LASTRE criado com sucesso');
      } else {
        return ApiResponse.error('Tipo inválido', 400);
      }
    } catch (error) {
      return ApiResponse.error('Erro ao criar MIC-DTA: ' + error.message, 500);
    }
  }

  static async getCrtsByMicDta(micDtaId) {
    try {
      const crts = await MicDtaModel.getCrtsByMicDta(micDtaId);
      return ApiResponse.success(crts);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar CRTs vinculados ao MIC/DTA: ' + error.message, 500);
    }
  }

  static async addCrtsToMicDta(micDtaId, crtIds) {
    try {
      if (!Array.isArray(crtIds) || crtIds.length === 0) {
        return ApiResponse.error('Informe um array de crtIds', 400);
      }
      for (const crtId of crtIds) {
        await MicDtaModel.linkToCrt(micDtaId, crtId);
      }
      return ApiResponse.success({ micDtaId, crtIds }, 'CRTs associados ao MIC/DTA com sucesso');
    } catch (error) {
      return ApiResponse.error('Erro ao associar CRTs ao MIC/DTA: ' + error.message, 500);
    }
  }
  // ...existing code...
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