const database = require('../config/database');

class TransportadoraModel {
  static async create(transportadora) {
    return new Promise((resolve, reject) => {
      const { nome, pais, numeroRegistro, numeroInicialCRT, numeroInicialMicDta } = transportadora;
      const sql = `
        INSERT INTO transportadoras (nome, pais, numeroRegistro, numeroInicialCRT, numeroInicialMicDta)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      database.getInstance().run(sql, [nome, pais, numeroRegistro, numeroInicialCRT || 1, numeroInicialMicDta || 1], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...transportadora });
        }
      });
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM transportadoras ORDER BY nome';
      
      database.getInstance().all(sql, [], (err, rows) => {
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
      const sql = 'SELECT * FROM transportadoras WHERE id = ?';
      
      database.getInstance().get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static async update(id, transportadora) {
    return new Promise((resolve, reject) => {
      const { nome, pais, numeroRegistro, numeroInicialCRT, numeroInicialMicDta } = transportadora;
      const sql = `
        UPDATE transportadoras 
        SET nome = ?, pais = ?, numeroRegistro = ?, numeroInicialCRT = ?, numeroInicialMicDta = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      database.getInstance().run(sql, [nome, pais, numeroRegistro, numeroInicialCRT, numeroInicialMicDta, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM transportadoras WHERE id = ?';
      
      database.getInstance().run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }
}

module.exports = TransportadoraModel;