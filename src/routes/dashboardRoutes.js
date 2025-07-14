const express = require('express');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/relatorio-mensal', DashboardController.getMonthlyReport);
router.get('/estatisticas', DashboardController.getGeneralStats);

module.exports = router;