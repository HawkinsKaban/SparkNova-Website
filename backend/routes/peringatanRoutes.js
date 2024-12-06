const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const peringatanController = require('../controllers/peringatanController');

router.use(protect);

router.get('/:idPerangkat', peringatanController.ambilPeringatan);
router.put('/:idPeringatan/selesai', peringatanController.selesaikanPeringatan);

module.exports = router;