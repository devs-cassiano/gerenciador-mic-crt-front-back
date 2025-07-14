const CrtModel = require('../models/crtModel');
const MicDtaModel = require('../models/micDtaModel');
const TransportadoraModel = require('../models/transportadoraModel');
const ApiResponse = require('../utils/response');

class DashboardService {
  static async getMonthlyReport(filters = {}) {
    try {
      const { transportadoraId, ano, mes } = filters;
      
      // Se não informado, usar o mês/ano atual
      const currentDate = new Date();
      const year = ano || currentDate.getFullYear().toString();
      const month = mes || (currentDate.getMonth() + 1).toString().padStart(2, '0');

      const transportadoras = transportadoraId 
        ? [await TransportadoraModel.findById(transportadoraId)]
        : await TransportadoraModel.findAll();

      const report = [];

      for (const transportadora of transportadoras) {
        if (!transportadora) continue;

        const crtCount = await CrtModel.countByTransportadoraAndMonth(
          transportadora.id, 
          month, 
          year
        );

        const micDtaCount = await MicDtaModel.countByTransportadoraAndMonth(
          transportadora.id, 
          month, 
          year
        );

        report.push({
          transportadora: {
            id: transportadora.id,
            nome: transportadora.nome,
            pais: transportadora.pais
          },
          periodo: `${month}/${year}`,
          documentos: {
            crt: crtCount,
            micDta: micDtaCount,
            total: crtCount + micDtaCount
          }
        });
      }

      return ApiResponse.success(report, 'Relatório mensal gerado com sucesso');
    } catch (error) {
      return ApiResponse.error('Erro ao gerar relatório', 500);
    }
  }

  static async getGeneralStats() {
    try {
      const transportadoras = await TransportadoraModel.findAll();
      const crts = await CrtModel.findAll();
      const micDtas = await MicDtaModel.findAll();

      const stats = {
        totalTransportadoras: transportadoras.length,
        totalCrts: crts.length,
        totalMicDtas: micDtas.length,
        totalDocumentos: crts.length + micDtas.length
      };

      return ApiResponse.success(stats, 'Estatísticas gerais obtidas com sucesso');
    } catch (error) {
      return ApiResponse.error('Erro ao obter estatísticas', 500);
    }
  }
}

module.exports = DashboardService;