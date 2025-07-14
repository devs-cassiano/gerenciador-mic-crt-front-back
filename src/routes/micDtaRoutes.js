const express = require('express');
const MicDtaController = require('../controllers/micDtaController');

const router = express.Router();

router.post('/', MicDtaController.create);
router.get('/', MicDtaController.getAll);
router.get('/transportadora/:transportadoraId', MicDtaController.getByTransportadora);
router.get('/crt/:crtId', MicDtaController.getByCrt);
router.get('/tipo/:tipo', MicDtaController.getByTipo); // Nova rota para buscar por tipo

module.exports = router;