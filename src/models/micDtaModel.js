const database = require('../config/database');

class MicDtaModel {
  static async create(micDta) {
    // Cria o MIC/DTA e retorna o id
    return new Promise((resolve, reject) => {
      const { numero, tipo, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, transportadoraId, dataCriacao } = micDta;
      const sql = `
        INSERT INTO mic_dta (numero, tipo, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, transportadoraId, dataCriacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      database.getInstance().run(sql, [numero, tipo, paisOrigemCodigo, paisDestinoCodigo, licencaComplementar, numeroSequencial, transportadoraId, dataCriacao], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...micDta });
        }
      });
    });
  }

  // Cria relação entre MIC/DTA e CRT na tabela de junção
  static async linkToCrt(micDtaId, crtId) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO micdta_crt (micDtaId, crtId) VALUES (?, ?)`;
      database.getInstance().run(sql, [micDtaId, crtId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Busca CRTs associados a um MIC/DTA
  static async getCrtsByMicDta(micDtaId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.* FROM crt c
        JOIN micdta_crt mc ON mc.crtId = c.id
        WHERE mc.micDtaId = ?
      `;
      database.getInstance().all(sql, [micDtaId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Busca MIC/DTAs associados a um CRT
  static async findByCrt(crtId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, t.nome as transportadoraNome, t.pais as transportadoraPais
        FROM mic_dta m
        JOIN micdta_crt mc ON mc.micDtaId = m.id
        JOIN transportadoras t ON m.transportadoraId = t.id
        WHERE mc.crtId = ? AND m.tipo = 'NORMAL'
        ORDER BY m.numero
      `;
      database.getInstance().all(sql, [crtId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, t.nome as transportadoraNome, t.pais as transportadoraPais
        FROM mic_dta m
        JOIN transportadoras t ON m.transportadoraId = t.id
        ORDER BY m.numero
      `;
      database.getInstance().all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findByTransportadora(transportadoraId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, t.nome as transportadoraNome, t.pais as transportadoraPais
        FROM mic_dta m
        JOIN transportadoras t ON m.transportadoraId = t.id
        WHERE m.transportadoraId = ?
        ORDER BY m.numero
      `;
      database.getInstance().all(sql, [transportadoraId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }


  static async findByTipo(tipo) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, t.nome as transportadoraNome, t.pais as transportadoraPais
        FROM mic_dta m
        JOIN transportadoras t ON m.transportadoraId = t.id
        WHERE m.tipo = ?
        ORDER BY m.numero
      `;
      database.getInstance().all(sql, [tipo], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
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