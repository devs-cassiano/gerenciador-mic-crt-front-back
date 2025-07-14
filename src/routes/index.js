const express = require('express');
const transportadoraRoutes = require('./transportadoraRoutes');
const crtRoutes = require('./crtRoutes');
const micDtaRoutes = require('./micDtaRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.use('/transportadoras', transportadoraRoutes);
router.use('/crt', crtRoutes);
router.use('/mic-dta', micDtaRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;