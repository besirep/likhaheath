const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const {
  getDoctorQueue,
  updateQueueStatus,
  saveConsultation,
  getConsultationHistory,
  updateConsultation,
} = require('../controllers/consultationController');

// All routes require an authenticated doctor
router.use(auth);

router.get('/queue',               getDoctorQueue);         // GET  /api/consultations/queue
router.patch('/queue/:queueId/status', updateQueueStatus);  // PATCH /api/consultations/queue/:id/status
router.post('/',                   saveConsultation);       // POST /api/consultations
router.get('/history',             getConsultationHistory); // GET  /api/consultations/history
router.put('/:id',                 updateConsultation);     // PUT  /api/consultations/:id

module.exports = router;
