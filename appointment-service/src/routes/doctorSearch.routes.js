const express = require('express');
const { searchDoctors } = require('../controllers/doctorSearch.controller');

const router = express.Router();

router.get('/doctors/search', searchDoctors);

module.exports = router;
