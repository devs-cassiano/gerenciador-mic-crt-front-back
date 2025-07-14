const express = require('express');
const TransportadoraController = require('../controllers/transportadoraController');

const router = express.Router();

router.post('/', TransportadoraController.create);
router.get('/', TransportadoraController.getAll);
router.get('/paises', TransportadoraController.getAvailableCountries);
router.get('/licencas-destino', TransportadoraController.getDestinationLicenses);
router.get('/:id', TransportadoraController.getById);
router.put('/:id', TransportadoraController.update);
router.delete('/:id', TransportadoraController.delete);

module.exports = router;