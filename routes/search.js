var express = require('express');
var router = express.Router();
var cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

router.use(cors());

require('dotenv').config();

const squareRequestHeaders = {
  'Square-Version': '2020-04-22',
  'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

function catchError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message);
  }
  console.log(error.config);
}

router.get('/:barcode', cors(), function(req, res) {
  console.log(`/search/${req.params.barcode} route called`);
  axios({
          method: 'post',
          url: 'https://connect.squareupsandbox.com/v2/catalog/search',
          headers: squareRequestHeaders,
          data: {
            'object_types': ['ITEM_VARIATION'],
            'query': {
              'text_query': {
                'keywords': [req.params.barcode]
              }
            }
          }
      })
      .then(function(response) {
        // if found, consider generating url directing to item on square dashboard
        // look for image url
        if (response.data.objects) {
          console.log('search square result:\n', response.data.objects[0]);
          var item = response.data.objects[0];
          var title = item.item_variation_data.name;
          var price = parseInt(item.item_variation_data.price_money.amount)/100;
          retrieveInventoryCount(item.id).then(function(result) {
            var quantity = parseInt(result);
            res.json({
              title: title,
              quantity: quantity,
              price: price
            });
          });
        } else {
          console.log('item not found in catalog, searching discogs');
          searchDiscogs();
          }
      })
      .catch(function(error) {
        console.log('error searching square');
        catchError(error);
      });

  function retrieveInventoryCount(catalog_object_id) {
    console.log('retrieveInventoryCount() called');
    return axios({
      method: 'get',
      url: `https://connect.squareupsandbox.com/v2/inventory/${catalog_object_id}`,
      headers: squareRequestHeaders
    })
    .then(function(response) {
      console.log('retrieveInventoryCount() response:\n', response.data.counts[0].quantity);
      return response.data.counts[0].quantity;
    })
    .catch(function(error) {
      console.log('error retrieving inventory count');
      catchError(error);
    });
  }

  function searchDiscogs() {
    console.log('searchDiscogs() called');
    return axios({
      method: 'get',
      url: `https://api.discogs.com//database/search?q={${req.params.barcode}}&{?barcode}&token=${process.env.DISCOGS_USER_TOKEN}`,
      headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
    })
    .then(function(response) {
      if (response.data.results.length > 0) {
        console.log('item found on discogs:\n', response.data.results[0]);
        res.json(response.data.results[0]);
      } else {
        console.log('item not found on discogs');
        res.json({ title: 'Item not found' });
      }
    })
    .catch(function(error) {
      console.log('error searching discogs');
      catchError(error);
    });
  }
});

module.exports = router;
