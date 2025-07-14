const TransportadoraModel = require('../models/transportadoraModel');
const DestinationLicenseModel = require('../models/destinationLicenseModel');
const { COUNTRIES } = require('../config/countries');
const ApiResponse = require('../utils/response');

class TransportadoraService {
  static async create(transportadoraData) {
    try {
      const { 
        nome, 
        pais, 
        numeroRegistro, 
        numeroInicialCRT = 1, 
        numeroInicialMicDta = 1,
        paisesDestino = [] 
      } = transportadoraData;

      // Validar país
      if (!COUNTRIES[pais]) {
        return ApiResponse.error('Código de país inválido', 400);
      }

      // Criar transportadora
      const transportadora = await TransportadoraModel.create({
        nome,
        pais,
        numeroRegistro,
        numeroInicialCRT,
        numeroInicialMicDta
      });

      // Para TODAS as transportadoras (brasileiras e estrangeiras), processar países de destino
      if (paisesDestino.length > 0) {
        for (const destino of paisesDestino) {
          const { paisDestino, licenca, idoneidade, vencimentoLicenca } = destino;
          
          // Validar país de destino
          if (!COUNTRIES[paisDestino]) {
            return ApiResponse.error(`País de destino inválido: ${paisDestino}`, 400);
          }

          // Licença é obrigatória para cada destino (para todas as transportadoras)
          if (!licenca) {
            return ApiResponse.error(`Licença obrigatória para destino: ${paisDestino}`, 400);
          }

          // Para transportadoras brasileiras, validar formato da licença (deve ter pelo menos 4 dígitos)
          if (pais === 'BR') {
            const licencaPattern = /^[A-Z]*\d{4}/;
            if (!licencaPattern.test(licenca)) {
              return ApiResponse.error(`Licença brasileira deve conter pelo menos 4 dígitos após as letras iniciais (ex: BR1234/56) para destino: ${paisDestino}`, 400);
            }
          }

          // Para transportadoras estrangeiras (não brasileiras), idoneidade é obrigatória
          if (pais !== 'BR' && !idoneidade) {
            return ApiResponse.error(`Idoneidade obrigatória para transportadoras estrangeiras no destino: ${paisDestino}`, 400);
          }

          await DestinationLicenseModel.create({
            transportadoraId: transportadora.id,
            paisDestino,
            licenca,
            idoneidade,
            vencimentoLicenca
          });
        }
      }

      // Buscar dados completos incluindo licenças
      const transportadoraCompleta = await this.getById(transportadora.id);
      
      return transportadoraCompleta;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return ApiResponse.error('Número de registro já existe', 400);
      }
      return ApiResponse.error('Erro ao criar transportadora: ' + error.message, 500);
    }
  }

  static async getAll() {
    try {
      const transportadoras = await TransportadoraModel.findAll();
      
      // Buscar licenças para TODAS as transportadoras
      for (const transportadora of transportadoras) {
        transportadora.paisesDestino = await DestinationLicenseModel.findByTransportadora(transportadora.id);
      }
      
      return ApiResponse.success(transportadoras);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar transportadoras', 500);
    }
  }

  static async getById(id) {
    try {
      const transportadora = await TransportadoraModel.findById(id);
      if (!transportadora) {
        return ApiResponse.error('Transportadora não encontrada', 404);
      }

      // Buscar licenças para TODAS as transportadoras
      transportadora.paisesDestino = await DestinationLicenseModel.findByTransportadora(id);

      return ApiResponse.success(transportadora);
    } catch (error) {
      return ApiResponse.error('Erro ao buscar transportadora', 500);
    }
  }

  static async update(id, transportadoraData) {
    try {
      const { 
        nome, 
        pais, 
        numeroRegistro, 
        numeroInicialCRT, 
        numeroInicialMicDta,
        paisesDestino = [] 
      } = transportadoraData;

      // Validar país
      if (!COUNTRIES[pais]) {
        return ApiResponse.error('Código de país inválido', 400);
      }

      const updated = await TransportadoraModel.update(id, {
        nome,
        pais,
        numeroRegistro,
        numeroInicialCRT,
        numeroInicialMicDta
      });

      if (!updated) {
        return ApiResponse.error('Transportadora não encontrada', 404);
      }

      // Atualizar licenças para TODAS as transportadoras
      // Remover licenças existentes
      await DestinationLicenseModel.deleteByTransportadora(id);
      
      // Adicionar novas licenças
      for (const destino of paisesDestino) {
        const { paisDestino, licenca, idoneidade, vencimentoLicenca } = destino;
        
        if (!COUNTRIES[paisDestino]) {
          return ApiResponse.error(`País de destino inválido: ${paisDestino}`, 400);
        }

        if (!licenca) {
          return ApiResponse.error(`Licença obrigatória para destino: ${paisDestino}`, 400);
        }

        // Para transportadoras brasileiras, validar formato da licença (deve ter pelo menos 4 dígitos)
        if (pais === 'BR') {
          const licencaPattern = /^[A-Z]*\d{4}/;
          if (!licencaPattern.test(licenca)) {
            return ApiResponse.error(`Licença brasileira deve conter pelo menos 4 dígitos após as letras iniciais (ex: BR1234/56) para destino: ${paisDestino}`, 400);
          }
        }

        // Para transportadoras estrangeiras (não brasileiras), idoneidade é obrigatória
        if (pais !== 'BR' && !idoneidade) {
          return ApiResponse.error(`Idoneidade obrigatória para transportadoras estrangeiras no destino: ${paisDestino}`, 400);
        }

        await DestinationLicenseModel.create({
          transportadoraId: id,
          paisDestino,
          licenca,
          idoneidade,
          vencimentoLicenca
        });
      }

      return ApiResponse.success(null, 'Transportadora atualizada com sucesso');
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return ApiResponse.error('Número de registro já existe', 400);
      }
      return ApiResponse.error('Erro ao atualizar transportadora: ' + error.message, 500);
    }
  }

  static async delete(id) {
    try {
      const deleted = await TransportadoraModel.delete(id);
      if (!deleted) {
        return ApiResponse.error('Transportadora não encontrada', 404);
      }
      return ApiResponse.success(null, 'Transportadora deletada com sucesso');
    } catch (error) {
      return ApiResponse.error('Erro ao deletar transportadora', 500);
    }
  }

  static getAvailableCountries() {
    return ApiResponse.success(Object.values(COUNTRIES));
  }
}

module.exports = TransportadoraService;