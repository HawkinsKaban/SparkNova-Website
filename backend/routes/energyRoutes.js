const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const energiController = require('../controllers/energiController');

router.use(protect);

router.post('/pembacaan', energiController.catatPembacaanEnergi);

// Menggunakan nama method yang sesuai dengan controller
router.get('/pembacaan/:idPerangkat', energiController.ambilRiwayatPenggunaan);

router.get('/statistik/:idPerangkat/:periode', energiController.ambilStatistikPenggunaan);

router.get('/riwayat/:idPerangkat', energiController.ambilRiwayatPenggunaan);

module.exports = router;