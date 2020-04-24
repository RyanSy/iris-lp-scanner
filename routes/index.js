var express = require('express');
var router = express.Router();
var fs = require('fs');
var cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

router.use(cors());

require('dotenv').config();

router.get('/search/:barcode', cors(), function(req, res) {
  axios({
    method: 'get',
    url: `https://api.discogs.com//database/search?q={${req.params.barcode}}&{?barcode}&token=${process.env.DISCOGS_USER_TOKEN}`,
    headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
  })
  .then(function(response) {
    console.log(response.data.results[0]);
    res.json(response.data.results[0]);
  })
  .catch(function (error) {
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
  });
});

router.post('/add-item', cors(), function(req, res) {
  // search for item in catalog - if found, update price/quantity, else create new item/item variation/get image/save images

  const squareRequestHeaders = {
    'Square-Version': '2020-04-22',
    'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };

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
            createItemVariation(catalogObjectID);
          })
          .catch(function (error) {
            console.log('========== error creating item ==========');
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
                    'amount': parseInt(req.body.price)*100,
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
            console.log('========== error creating item variation ==========');
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
            console.log('========== error changing quantity ==========');
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
          });
  }

  function getImage() {
    axios({
      method: 'get',
      url: req.body.image_url,
      responseType: 'stream',
      headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
    })
    .then(function(response) {
      console.log(`========== got image ==========\n${response.data}`);
      response.data.pipe(fs.createWriteStream(`./tmp/${req.body.title}.jpg`));
    })
    .catch(function (error) {
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
    });
  }

  axios.all([createItem(), getImage()])
    .then(axios.spread(function(one, two) {
      res.end();
    }))
    .catch(function (error) {
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
    });



  // save image to square
    // .then(function(response) {
    //   response.data.pipe(fs.createWriteStream(`./tmp/${req.body.title}.jpg`));
    //     const form = new FormData();
    //     form.append('idempotency_key', uuidv4());
    //     form.append('object_id', catalogObjectID);
    //     form.append('image', fs.createReadStream(`./tmp/${req.body.title}.jpg`));
    //     const formHeaders = form.getHeaders();
    //     axios.post('https://connect.squareupsandbox.com/v2/catalog/images', form, {
    //       headers: {
    //         ...formHeaders,
    //         'Accept': 'application/json',
    //         'Square-Version': '2020-03-25',
    //         'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
    //         'Content-Type': 'multipart/form-data'
    //       },
    //     })
  //         // catch save image to square error
  //         .catch((error) => {
  //           console.error('Error saving image to square:\n', error.response.data);
  //         });
  //         res.end();
  //     })
  //     // catch get image from discogs error
  //     .catch((error) => {
  //       console.error('Error getting image from discogs:\n', error);
  //     });
  //   })
  //   // catch create item variation error
  //   .catch((error) => {
  //     console.error('Error creating item variation:\n', error.response.data.errors);
  //   });
  // })

  //
  // // save image to square
  // .then(function(response) {
  //   console.log('then after getting image from discogs - Response:\n', response);

  // })

  // catch create item error

}); // end add-item route

module.exports = router;
