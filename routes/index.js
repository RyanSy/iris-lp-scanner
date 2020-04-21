var express = require('express');
var router = express.Router();
var cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

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
  var catalogObjectID;

  // create the item
  axios({
    method: 'post',
    url: 'https://connect.squareupsandbox.com/v2/catalog/object',
    headers: {
      'Square-Version': '2020-03-25',
      'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    data: {
      'idempotency_key': uuidv4(),
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
  // create item variation
  .then(function(response) {
    console.log('then after creating item - Response:\n', response.data);
    catalogObjectID = response.data.catalog_object.id;
    console.log('catalogObjectID: ', catalogObjectID);
    axios({
      method: 'post',
      url: 'https://connect.squareupsandbox.com/v2/catalog/object',
      headers: {
        'Square-Version': '2020-03-25',
        'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        'idempotency_key': uuidv4(),
        'object': {
          'id': '#2',
          'type': 'ITEM_VARIATION',
          'item_variation_data': {
            'name': req.body.title,
            'item_id': catalogObjectID,
            'price_money': {
              'amount': parseInt(req.body.price)*100,
              'currency': 'USD'
            },
            'pricing_type': 'FIXED_PRICING'
          }
        }
      }
    })

    .then(function(response) {
      console.log('then after creating item variation:\n', response.data);
      res.end();
    })
    // catch create item variation error
    .catch((error) => {
      console.error('Error creating item variation:\n', error.response.data.errors);
    });
  })

  // // get image from discogs
  // .then(function(response) {
  //   console.log('then after creating item variation - Response:\n', response);
  //   axios({
  //     method: 'get',
  //     url: req.body.image_url,
  //     headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
  //   })
        // catch get image from discogs error
  //   .catch((error) => {
  //     console.error('Error getting image from discogs:\n', error.response);
  //   });
  // })
  //
  // // save image to square
  // .then(function(response) {
  //   console.log('then after getting image from discogs - Response:\n', response);
  //   const form = new FormData();
  //   form.append('idempotency_key', Math.random().toString(36).slice(2));
  //   form.append('object_id', catalogObjectID);
  //   form.append('image', response);
  //   const formHeaders = form.getHeaders();
  //   axios.post('https://connect.squareupsandbox.com/v2/catalog/images', form, {
  //     headers: {
  //       ...formHeaders,
  //       'Square-Version': '2020-03-25',
  //       'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`
  //     },
  //   })
        // catch save image to square error
  //   .catch((error) => {
  //     console.error('Error saving image to square:\n', error.response.data);
  //   });
  //   res.end();
  // })

  // catch create item error
  .catch((error) => {
    console.error('Error creating item:\n', error.response.data.errors);
  });
});

module.exports = router;
