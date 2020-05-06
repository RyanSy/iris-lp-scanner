var express = require('express');
var router = express.Router();
var fs = require('fs');
var cors = require('cors');
var qs = require('qs');
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

router.get('/search/:barcode', cors(), function(req, res) {
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

router.post('/add-item', cors(), function(req, res) {
  console.log('/add-item route called');
  function createItem() {
    return axios({
            method: 'post',
            url: 'https://connect.squareupsandbox.com/v2/catalog/object',
            headers: squareRequestHeaders,
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
          .then(function(response) {
            console.log('========== item created ==========');
            console.log(response.data.catalog_object);
            var catalogObjectID = response.data.catalog_object.id;
            var catalogObjectVersion = response.data.catalog_object.version
            createItemVariation(catalogObjectID);
            createImage(catalogObjectID, catalogObjectVersion);
          })
          .catch(function(error) {
            catchError(error);
          });
  }

  function createItemVariation(catalogObjectID) {
    return axios({
            method: 'post',
            url: 'https://connect.squareupsandbox.com/v2/catalog/object',
            headers: squareRequestHeaders,
            data: {
              'idempotency_key': uuidv4(),
              'object': {
                'id': '#2',
                'type': 'ITEM_VARIATION',
                'item_variation_data': {
                  'item_id': catalogObjectID,
                  'name': req.body.title,
                  'price_money': {
                    'amount': parseFloat(req.body.price)*100,
                    'currency': 'USD'
                  },
                  'pricing_type': 'FIXED_PRICING',
                  'sku': req.body.barcode
                }
              }
            }
          })
          .then(function(response) {
            console.log('========== item variation created ==========');
            console.log(response.data.catalog_object);
            var itemVariationID = response.data.catalog_object.id;
            changeQuantity(itemVariationID);
          })
          .catch(function (error) {
            catchError(error);
          });
  }

  function changeQuantity(itemVariationID) {
    var d = new Date();
    var occurred_at = d.toISOString();
    return axios({
            method: 'post',
            url: 'https://connect.squareupsandbox.com/v2/inventory/batch-change',
            headers: squareRequestHeaders,
            data: {
              'idempotency_key': uuidv4(),
              'changes': [
                {
                  'type': 'ADJUSTMENT',
                  'adjustment': {
                    'catalog_object_id': itemVariationID,
                    'quantity': req.body.quantity,
                    'location_id': process.env.LOCATION_ID,
                    'from_state': 'NONE',
                    'to_state': 'IN_STOCK',
                    'occurred_at': occurred_at
                  }
                }
              ],
              'ignore_unchanged_counts': true
            }
          })
          .then(function(response) {
            console.log('========== quantity changed ==========');
            console.log(response.data);
          })
          .catch(function (error) {
            catchError(error);
          });
  }

  function createImage(catalogObjectID) {
    axios({
      method: 'get',
      url: req.body.image_url,
      responseType: 'stream',
      headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
    })
    // consider refactoring below to save image to square directly from discogs response stream
    .then(function(response) {
      console.log(`========== got image ==========\n ${response.data}`);
      response.data.pipe(fs.createWriteStream('./tmp/item.jpg'));
    })
    .then(function(response) {
      console.log('========== getting updated object version ==========');
      axios({
        method: 'get',
        url: `https://connect.squareupsandbox.com/v2/catalog/object/${catalogObjectID}`,
        headers: squareRequestHeaders
      })
      .then(function(response) {
        console.log('========== response.data ==========\n', response.data );
        return response.data.object
      })
      .then(function(response) {
        console.log('========== saving image to square ==========\n', response);
        var formData = new FormData();
        var imageFile = fs.createReadStream('./tmp/item.jpg');
        var requestObject = JSON.stringify({
          'idempotency_key': uuidv4(),
          'object_id': catalogObjectID,
          'image': {
            'id': '#1',
            'type': 'IMAGE',
            'image_data': {
              'caption': req.body.title
            },
            'version': response.version
          }
        });
        formData.append('file', imageFile);
        formData.append('request', requestObject);

        axios({
          method: 'post',
          url: 'https://connect.squareupsandbox.com/v2/catalog/images',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
            'Cache-Control': 'no-cache',
            'Square-Version': '2020-04-22',
            'Content-Disposition': `form-data; name="item"; filename="item.jpg"`,
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
          },
          data: formData
        })
        .then(function(response) {
          console.log('========= image saved to square ==========');
          console.log('saved image to square response:\n', response);
        })
        .catch(function(error) {
          console.log('========== error saving image to square ==========');
          catchError(error);
        });
      })
    })
    .catch(function (error) {
      console.log('createImage() ERROR');
      catchError(error);
    });
  }

  axios.all([createItem()])
    .then(axios.spread(function(one, two) {
      res.end();
    }))
    .catch(function (error) {
      console.log('axios.all() error');
      catchError(error);
    });

}); // end add-item route

module.exports = router;
