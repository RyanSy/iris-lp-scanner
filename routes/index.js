var express = require('express');
var router = express.Router();
var searchController = require('../controllers/searchController');
var createController = require('../controllers/createController');
var updateController = require('../controllers/updateController');

router.get('/search/:barcode', searchController);

router.post('/create', createController);

router.post('/update', updateController);

module.exports = router;