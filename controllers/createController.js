module.exports = function(req, res) {
  console.log('/save-item route called: \n', req.body);
  require('dotenv').config();
  var fs = require('fs');
  const axios = require('axios');
  const FormData = require('form-data');
  const { v4: uuidv4 } = require('uuid');
  const catchError = require('../helpers/catchError');
  const squareRequestHeaders = require('../helpers/squareRequestHeaders');
  function saveItem() {
    if (req.body.item_id) {
      var item_id = req.body.item_id;
    } else {
      var item_id = '#1';
    }
    return axios({
            method: 'post',
            url: 'https://connect.squareup.com/v2/catalog/object',
            headers: squareRequestHeaders,
            data: {
              'idempotency_key': uuidv4(),
              'object': {
                'id': item_id,
                'type': 'ITEM',
                'item_data': {
                  'name': req.body.title,
                  'description': `UPC: ${req.body.barcode}`
                }
              }
            }
          })
          .then(function(response) {
            console.log('========== item saved ==========');
            console.log(response.data.catalog_object);
            var catalogObjectID = response.data.catalog_object.id;
            var catalogObjectVersion = response.data.catalog_object.version
            saveItemVariation(catalogObjectID);
            createImage(catalogObjectID, catalogObjectVersion);
            res.end();
          })
          .catch(function(error) {
            console.log('========== error saving item ==========');
            catchError(error);
          });
  }

  function saveItemVariation(catalogObjectID) {
    if (req.body.item_variation_id) {
      var item_variation_id = req.body.item_variation_id;
    } else {
      var item_variation_id = '#2';
    }
    return axios({
            method: 'post',
            url: 'https://connect.squareup.com/v2/catalog/object',
            headers: squareRequestHeaders,
            data: {
              'idempotency_key': uuidv4(),
              'object': {
                'id': item_variation_id,
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
            console.log('========== item variation saved ==========');
            console.log(response.data.catalog_object);
            var itemVariationID = response.data.catalog_object.id;
            updateQuantity(itemVariationID);
          })
          .catch(function(error) {
            console.log('========== error saving item variation ==========');
            catchError(error);
          });
  }

  function updateQuantity(itemVariationID) {
    var d = new Date();
    var occurred_at = d.toISOString();
    var item_state = 'NONE';
    return axios({
            method: 'post',
            url: 'https://connect.squareup.com/v2/inventory/batch-change',
            headers: squareRequestHeaders,
            data: {
              'idempotency_key': uuidv4(),
              'changes': [
                {
                  'type': 'ADJUSTMENT',
                  'adjustment': {
                    'catalog_object_id': itemVariationID,
                    'quantity': req.body.quantity_received,
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
            catchError(error);
          });
  }

  function createImage(catalogObjectID) {
    // get image from Discogs
    axios({
      method: 'get',
      url: req.body.image_url,
      responseType: 'stream',
      headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
    })
    // consider refactoring below to save image to square directly from discogs response stream
    .then(function(response) {
      response.data.pipe(fs.createWriteStream('./tmp/item.jpg'));
    })
    .then(function(response) {
      // get updated object version
      console.log('========== getting updated object version ==========');
      axios({
        method: 'get',
        url: `https://connect.squareup.com/v2/catalog/object/${catalogObjectID}`,
        headers: squareRequestHeaders
      })
      .then(function(response) {
        console.log('========== response.data ==========\n', response.data );
        return response.data.object
      })
      .then(function(response) {
        // save image to square
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
          url: 'https://connect.squareup.com/v2/catalog/images',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
            'Cache-Control': 'no-cache',
            'Square-Version': '2020-04-22',
            'Content-Disposition': `form-data; name="item"; filename="item.jpg"`,
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
          },
          data: formData
        })
        .then(function(response) {
          console.log('========= image saved to square ==========');
          console.log(response.data);
          fs.unlink('./tmp/item.jpg', (err) => {
            if (err) throw err;
            console.log('./tmp/item.jpg has been deleted.');
          });
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

  axios.all([saveItem()])
    .then(axios.spread(function(one, two) {
      console.log('========== axios.all() called ==========');
      res.end();
    }))
    .catch(function (error) {
      console.log('axios.all() error');
      catchError(error);
    });
}
