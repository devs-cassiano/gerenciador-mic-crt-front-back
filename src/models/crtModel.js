const database = require('../config/database');

class CrtModel {
  static async create(crt) {
    return new Promise((resolve, reject) => {
      const { numero, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, faturaComercial, exportador, importador, dataCriacao, transportadoraId } = crt;
      const sql = `
        INSERT INTO crt (numero, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, faturaComercial, exportador, importador, dataCriacao, transportadoraId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      database.getInstance().run(sql, [numero, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, faturaComercial, exportador, importador, dataCriacao, transportadoraId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...crt });
        }
      });
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, t.nome as transportadoraNome, t.pais as transportadoraPais
        FROM crt c
        JOIN transportadoras t ON c.transportadoraId = t.id
        ORDER BY c.numero
      `;
      
      database.getInstance().all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static async findByTransportadora(transportadoraId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, t.nome as transportadoraNome, t.pais as transportadoraPais
        FROM crt c
        JOIN transportadoras t ON c.transportadoraId = t.id
        WHERE c.transportadoraId = ?
        ORDER BY c.numero
      `;
      
      database.getInstance().all(sql, [transportadoraId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, t.nome as transportadoraNome, t.pais as transportadoraPais
        FROM crt c
        JOIN transportadoras t ON c.transportadoraId = t.id
        WHERE c.id = ?
      `;
      
      database.getInstance().get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static async countByTransportadoraAndMonth(transportadoraId, month, year) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM crt
        WHERE transportadoraId = ? 
        AND strftime('%m', createdAt) = ? 
        AND strftime('%Y', createdAt) = ?
      `;
      
      database.getInstance().get(sql, [transportadoraId, month, year], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }
}

module.exports = CrtModel;