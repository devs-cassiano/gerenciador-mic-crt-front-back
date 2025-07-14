const express = require('express');
const CrtController = require('../controllers/crtController');

const router = express.Router();

router.post('/', CrtController.create);
router.get('/', CrtController.getAll);
router.get('/:id', CrtController.getById);
router.get('/transportadora/:transportadoraId', CrtController.getByTransportadora);

module.exports = router;