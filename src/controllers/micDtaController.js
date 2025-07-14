const MicDtaService = require('../services/micDtaService');

class MicDtaController {
  static async create(req, res) {
    const { tipo = 'NORMAL', crtId, transportadoraId, paisOrigemCodigo, paisDestinoCodigo, quantidade = 1 } = req.body;
    
    // Validações específicas por tipo
    if (tipo === 'NORMAL') {
      if (!crtId) {
        return res.status(400).json({
          success: false,
          message: 'Para MIC/DTA NORMAL, CRT ID é obrigatório'
        });
      }
    } else if (tipo === 'LASTRE') {
      if (!transportadoraId || !paisDestinoCodigo) {
        return res.status(400).json({
          success: false,
          message: 'Para MIC/DTA LASTRE, transportadoraId e paisDestinoCodigo são obrigatórios'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tipo deve ser NORMAL ou LASTRE'
      });
    }

    if (quantidade < 1 || quantidade > 100) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade deve ser entre 1 e 100'
      });
    }

    const result = await MicDtaService.create({ 
      tipo, 
      crtId, 
      transportadoraId, 
      paisOrigemCodigo, 
      paisDestinoCodigo, 
      quantidade 
    });
    
    res.status(result.success ? 201 : result.statusCode || 400).json(result);
  }

  static async getAll(req, res) {
    const result = await MicDtaService.getAll();
    res.status(result.success ? 200 : 500).json(result);
  }

  static async getByTransportadora(req, res) {
    const { transportadoraId } = req.params;
    const result = await MicDtaService.getByTransportadora(transportadoraId);
    res.status(result.success ? 200 : 500).json(result);
  }

  static async getByCrt(req, res) {
    const { crtId } = req.params;
    const result = await MicDtaService.getByCrt(crtId);
    res.status(result.success ? 200 : 500).json(result);
  }

  static async getByTipo(req, res) {
    const { tipo } = req.params;
    
    if (!['NORMAL', 'LASTRE'].includes(tipo.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Tipo deve ser NORMAL ou LASTRE'
      });
    }
    
    const result = await MicDtaService.getByTipo(tipo.toUpperCase());
    res.status(result.success ? 200 : 500).json(result);
  }

  static async getNextNumber(req, res) {
    return res.status(404).json({
      success: false,
      message: 'Preview de número desabilitado.'
    });
  }
}

module.exports = MicDtaController;