const CrtService = require('../services/crtService');

class CrtController {
  static async create(req, res) {
    const { 
      transportadoraId, 
      quantidade = 1, 
      faturaComercial, 
      exportador, 
      importador,
      paisOrigemCodigo,
      paisDestinoCodigo
    } = req.body;
    
    if (!transportadoraId || !faturaComercial || !exportador || !importador || !paisDestinoCodigo) {
      return res.status(400).json({
        success: false,
        message: 'Transportadora ID, fatura comercial, exportador, importador e país de destino são obrigatórios'
      });
    }

    if (quantidade < 1 || quantidade > 100) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade deve ser entre 1 e 100'
      });
    }

    const result = await CrtService.create({
      transportadoraId,
      quantidade,
      faturaComercial,
      exportador,
      importador,
      paisOrigemCodigo,
      paisDestinoCodigo
    });

    res.status(result.success ? 201 : result.statusCode || 400).json(result);
  }

  static async getAll(req, res) {
    const result = await CrtService.getAll();
    res.status(result.success ? 200 : 500).json(result);
  }

  static async getByTransportadora(req, res) {
    const { transportadoraId } = req.params;
    const result = await CrtService.getByTransportadora(transportadoraId);
    res.status(result.success ? 200 : 500).json(result);
  }

  static async getById(req, res) {
    const { id } = req.params;
    const result = await CrtService.getById(id);
    res.status(result.success ? 200 : result.statusCode || 500).json(result);
  }
}

module.exports = CrtController;