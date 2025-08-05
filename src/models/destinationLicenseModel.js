const database = require('../config/database');

class DestinationLicenseModel {
  static formatDateToBR(dateStr) {
    if (!dateStr) return null;
    // Aceita YYYY-MM-DD ou já DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  }

  static async create(destinationLicense) {
    return new Promise(async (resolve, reject) => {
      const { transportadoraId, paisDestino, licenca, idoneidade, vencimentoLicenca } = destinationLicense;
      const vencBR = this.formatDateToBR(vencimentoLicenca);
      const sql = `
        INSERT INTO destination_licenses (transportadoraId, paisDestino, licenca, idoneidade, vencimentoLicenca)
        VALUES (?, ?, ?, ?, ?)
      `;
      database.getInstance().run(sql, [transportadoraId, paisDestino, licenca, idoneidade, vencBR], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...destinationLicense, vencimentoLicenca: vencBR });
        }
      });
    });
  }

  static async findByTransportadora(transportadoraId) {
    console.log(`[LOG] Listando licenças da transportadora ${transportadoraId}`);
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM destination_licenses WHERE transportadoraId = ?';
      database.getInstance().all(sql, [transportadoraId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Formatar vencimentoLicenca para DD/MM/YYYY
          rows.forEach(row => {
            row.vencimentoLicenca = DestinationLicenseModel.formatDateToBR(row.vencimentoLicenca);
          });
          resolve(rows);
        }
      });
    });
  }

  static async deleteByTransportadora(transportadoraId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM destination_licenses WHERE transportadoraId = ?';
      
      database.getInstance().run(sql, [transportadoraId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  static async findLicenseByDestination(transportadoraId, paisDestino) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT licenca FROM destination_licenses WHERE transportadoraId = ? AND paisDestino = ?';
      
      database.getInstance().get(sql, [transportadoraId, paisDestino], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.licenca : null);
        }
      });
    });
  }

  static async findLicenseForCountries(transportadoraId, paisA, paisB) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM destination_licenses WHERE transportadoraId = ? AND (paisDestino = ? OR paisDestino = ?)`;
      database.getInstance().get(sql, [transportadoraId, paisA, paisB], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = DestinationLicenseModel;