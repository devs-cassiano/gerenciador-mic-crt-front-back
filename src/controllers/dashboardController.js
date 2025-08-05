
const DashboardService = require('../services/dashboardService');
const LicenseService = require('../services/licenseService');

class DashboardController {
  static async getAllLicensesWithValidity(req, res) {
    const result = await LicenseService.getAllLicensesWithValidity();
    res.status(result.success ? 200 : 500).json(result);
  }
  static async getMonthlyReport(req, res) {
    const { transportadoraId, ano, mes } = req.query;
    
    const result = await DashboardService.getMonthlyReport({
      transportadoraId,
      ano,
      mes
    });

    res.status(result.success ? 200 : 500).json(result);
  }

  static async getGeneralStats(req, res) {
    const result = await DashboardService.getGeneralStats();
    res.status(result.success ? 200 : 500).json(result);
  }
}

module.exports = DashboardController;