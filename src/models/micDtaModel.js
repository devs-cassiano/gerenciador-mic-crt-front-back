const database = require('../config/database');

class MicDtaModel {
  static async create(micDta) {
    return new Promise((resolve, reject) => {
      const { numero, tipo, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, crtId, transportadoraId, dataCriacao } = micDta;
      const sql = `
        INSERT INTO mic_dta (numero, tipo, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, crtId, transportadoraId, dataCriacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      database.getInstance().run(sql, [numero, tipo, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, crtId, transportadoraId, dataCriacao], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...micDta });
        }
      });
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, 
               t.nome as transportadoraNome, 
               t.pais as transportadoraPais,
               c.numero as crtNumero,
               c.faturaComercial as crtFaturaComercial
        FROM mic_dta m
        JOIN transportadoras t ON m.transportadoraId = t.id
        LEFT JOIN crt c ON m.crtId = c.id
        ORDER BY m.numero
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
        SELECT m.*, 
               t.nome as transportadoraNome, 
               t.pais as transportadoraPais,
               c.numero as crtNumero,
               c.faturaComercial as crtFaturaComercial
        FROM mic_dta m
        JOIN transportadoras t ON m.transportadoraId = t.id
        LEFT JOIN crt c ON m.crtId = c.id
        WHERE m.transportadoraId = ?
        ORDER BY m.numero
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

  static async findByCrt(crtId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, 
               t.nome as transportadoraNome, 
               t.pais as transportadoraPais,
               c.numero as crtNumero,
               c.faturaComercial as crtFaturaComercial
        FROM mic_dta m
        JOIN transportadoras t ON m.transportadoraId = t.id
        JOIN crt c ON m.crtId = c.id
        WHERE m.crtId = ? AND m.tipo = 'NORMAL'
        ORDER BY m.numero
      `;
      
      database.getInstance().all(sql, [crtId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static async findByTipo(tipo) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, 
               t.nome as transportadoraNome, 
               t.pais as transportadoraPais,
               c.numero as crtNumero,
               c.faturaComercial as crtFaturaComercial
        FROM mic_dta m
        JOIN transportadoras t ON m.transportadoraId = t.id
        LEFT JOIN crt c ON m.crtId = c.id
        WHERE m.tipo = ?
        ORDER BY m.numero
      `;
      
      database.getInstance().all(sql, [tipo], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static async countByTransportadoraAndMonth(transportadoraId, month, year) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM mic_dta
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

module.exports = MicDtaModel;