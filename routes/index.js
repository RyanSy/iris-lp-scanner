var express = require('express');
var router = express.Router();
var cors = require('cors');
const axios = require('axios');

router.use(cors());

require('dotenv').config();

/* GET home page. */
router.get('/search/:barcode', cors(), function(req, res) {
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

router.post('/add-item', cors(), function(req, res) {
  axios({
    method: 'post',
    url: 'https://connect.squareupsandbox.com/v2/catalog/object',
    headers: {
      'Square-Version': '2020-03-25',
      'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    data: {
      'idempotency_key': '44143ec6-7de3-11ea-bc55-0242ac130003',
      'object': {
        'id': '#1',
        'type': 'ITEM',
        'item_data': {
          'name': req.body.title,
          'description': `UPC: ${req.body.barcode}`
        }
      }
    }
  })
  .then(function(response) {
    console.log('Response data:\n', response.data);
    res.end();
  })
  .catch((error) => {
    console.error('Error:\n', error.response.data);
  })
});

module.exports = router;
