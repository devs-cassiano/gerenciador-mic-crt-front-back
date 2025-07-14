const TransportadoraService = require('../services/transportadoraService');

class TransportadoraController {
  static async create(req, res) {
    const { 
      nome, 
      pais, 
      numeroRegistro, 
      numeroInicialCRT = 1, 
      numeroInicialMicDta = 1,
      paisesDestino = []
    } = req.body;
    
    if (!nome || !pais || !numeroRegistro) {
      return res.status(400).json({
        success: false,
        message: 'Nome, país e número de registro são obrigatórios'
      });
    }

    const result = await TransportadoraService.create({ 
      nome, 
      pais, 
      numeroRegistro, 
      numeroInicialCRT, 
      numeroInicialMicDta,
      paisesDestino
    });
    
    res.status(result.success ? 201 : result.statusCode || 400).json(result);
  }

  static async getAll(req, res) {
    const result = await TransportadoraService.getAll();
    res.status(result.success ? 200 : 500).json(result);
  }

  static async getById(req, res) {
    const { id } = req.params;
    const result = await TransportadoraService.getById(id);
    res.status(result.success ? 200 : result.statusCode || 500).json(result);
  }

  static async update(req, res) {
    const { id } = req.params;
    const { 
      nome, 
      pais, 
      numeroRegistro, 
      numeroInicialCRT, 
      numeroInicialMicDta,
      paisesDestino = []
    } = req.body;
    
    if (!nome || !pais || !numeroRegistro) {
      return res.status(400).json({
        success: false,
        message: 'Nome, país e número de registro são obrigatórios'
      });
    }

    const result = await TransportadoraService.update(id, { 
      nome, 
      pais, 
      numeroRegistro, 
      numeroInicialCRT, 
      numeroInicialMicDta,
      paisesDestino
    });
    
    res.status(result.success ? 200 : result.statusCode || 400).json(result);
  }

  static async delete(req, res) {
    const { id } = req.params;
    const result = await TransportadoraService.delete(id);
    res.status(result.success ? 200 : result.statusCode || 400).json(result);
  }

  static async getAvailableCountries(req, res) {
    const result = TransportadoraService.getAvailableCountries();
    res.status(200).json(result);
  }

  static async getDestinationLicenses(req, res) {
    const result = TransportadoraService.getDestinationLicenses();
    res.status(200).json(result);
  }
}

module.exports = TransportadoraController;