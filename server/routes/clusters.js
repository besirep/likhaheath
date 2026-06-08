const express = require('express');
const router = express.Router();
const clusterController = require('../controllers/clusterController');

router.get('/', clusterController.getAll);
router.post('/', clusterController.create);
router.get('/:id', clusterController.getOne);
router.put('/:id', clusterController.update);
router.post('/:id/patients/:patientId', clusterController.addPatient);
router.delete('/:id/patients/:patientId', clusterController.removePatient);

module.exports = router;
