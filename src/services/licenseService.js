const TransportadoraModel = require('../models/transportadoraModel');
const DestinationLicenseModel = require('../models/destinationLicenseModel');
const ApiResponse = require('../utils/response');

class LicenseService {
  static async getAllLicensesWithValidity() {
    try {
      const transportadoras = await TransportadoraModel.findAll();
      const now = new Date();
      const valid = [], expiringSoon = [], expired = [];
      const all = [];

      for (const t of transportadoras) {
        const licenses = await DestinationLicenseModel.findByTransportadora(t.id);
        for (const lic of licenses) {
          // Parse vencimentoLicenca (DD/MM/YYYY)
          let [d, m, y] = lic.vencimentoLicenca.split('/');
          let venc = new Date(`${y}-${m}-${d}T00:00:00`);
          let daysDiff = Math.ceil((venc - now) / (1000 * 60 * 60 * 24));
          let status = '';
          if (daysDiff < 0) status = 'expired';
          else if (daysDiff <= 180) status = 'expiringSoon';
          else status = 'valid';
          all.push({
            ...lic,
            transportadora: { id: t.id, nome: t.nome, pais: t.pais },
            status,
            diasParaVencer: daysDiff
          });
          if (status === 'expired') expired.push(all[all.length-1]);
          else if (status === 'expiringSoon') expiringSoon.push(all[all.length-1]);
          else valid.push(all[all.length-1]);
        }
      }
      return ApiResponse.success({ all, valid, expiringSoon, expired }, 'Licenças listadas com status de validade');
    } catch (err) {
      return ApiResponse.error('Erro ao listar licenças', 500);
    }
  }
}

module.exports = LicenseService;
