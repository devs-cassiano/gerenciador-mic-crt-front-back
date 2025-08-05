const MicDtaService = require('../services/micDtaService');

class MicDtaController {
  static async create(req, res) {
    try {
      const { tipo } = req.body;
      if (!tipo || !['NORMAL', 'LASTRE'].includes(tipo.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Tipo deve ser NORMAL ou LASTRE'
        });
      }
      const result = await MicDtaService.create(req.body);
      res.status(result.success ? 201 : (result.statusCode || 400)).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro ao criar MIC/DTA', error: error.message });
    }
  }
  static async getCrtsByMicDta(req, res) {
    const { micDtaId } = req.params;
    const result = await MicDtaService.getCrtsByMicDta(micDtaId);
    res.status(result.success ? 200 : 500).json(result);
  }

  static async addCrts(req, res) {
    const { micDtaId } = req.params;
    const { crtIds } = req.body;
    if (!micDtaId || !Array.isArray(crtIds) || crtIds.length === 0) {
      return res.status(400).json({ success: false, message: 'micDtaId e crtIds (array) são obrigatórios' });
    }
    const result = await MicDtaService.addCrtsToMicDta(Number(micDtaId), crtIds);
    res.status(result.success ? 200 : result.statusCode || 400).json(result);
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