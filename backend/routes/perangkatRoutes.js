const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const perangkatController = require('../controllers/perangkatController');
const pengaturanController = require('../controllers/pengaturanController');

router.use(protect);

// Perangkat routes
router.route('/')
  .post(perangkatController.daftarPerangkat)
  .get(perangkatController.ambilSemuaPerangkat);

router.route('/:idPerangkat')
  .get(perangkatController.ambilPerangkat)
  .put(perangkatController.updatePerangkat)
  .delete(perangkatController.hapusPerangkat);

router.route('/:idPerangkat/relay')
  .put(perangkatController.updateStatusRelay);

// Pengaturan routes
router.route('/:idPerangkat/pengaturan')
  .get(pengaturanController.ambilPengaturan)
  .put(pengaturanController.updatePengaturan);

router.route('/:idPerangkat/pengaturan/wifi')
  .put(pengaturanController.updateKonfigurasiWifi);

router.route('/:idPerangkat/pengaturan/reset')
  .post(pengaturanController.resetPengaturanDefault);

module.exports = router;