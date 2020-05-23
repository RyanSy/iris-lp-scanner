var express = require('express');
var router = express.Router();
var cors = require('cors');
var searchController = require('../controllers/searchController');
var createController = require('../controllers/createController');
var updateController = require('../controllers/updateController');

router.use(cors());

router.get('/search/:barcode', cors(), searchController);

router.post('/create', cors(), createController);

router.post('/update', cors(), updateController);

module.exports = router;
