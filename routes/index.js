var express = require('express');
var router = express.Router();
var cors = require('cors');
const axios = require('axios');

router.use(cors());

require('dotenv').config();

/* GET home page. */
router.get('/search/:barcode', function(req, res) {
  axios({
    method: 'get',
    url: `https://api.discogs.com//database/search?q={${req.params.barcode}}&{?barcode}&token=${process.env.DISCOGS_USER_TOKEN}`,
    headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
  })
  .then(function(response) {
    console.log(response.data.results[0]);
    res.json(response.data.results[0]);
  });
});

module.exports = router;
