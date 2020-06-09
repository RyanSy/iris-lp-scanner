var express = require('express');
var router = express.Router();
var cors = require('cors');
var searchController = require('../controllers/searchController');
var createController = require('../controllers/createController');
var updateController = require('../controllers/updateController');

var corsOptions ={
  origin: 'https://irislpscanner.surge.sh',
  optionsSuccessStatus: 200
}

router.use(cors());

router.get('/search/:barcode', cors(corsOptions), searchController);

router.post('/create', cors(corsOptions), createController);

router.post('/update', cors(corsOptions), updateController);

module.exports = router;
