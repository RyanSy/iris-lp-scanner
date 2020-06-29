module.exports = function(req, res, next) {
  console.log('\n========== /create route called ==========\n req.body:\n', req.body, '\n');
  require('dotenv').config();
  var fs = require('fs');
  const axios = require('axios');
  const FormData = require('form-data');
  const { v4: uuidv4 } = require('uuid');
  const catchError = require('../helpers/catchError');
  const squareRequestHeaders = require('../helpers/squareRequestHeaders');

  function saveItem() {
    return axios({
            method: 'post',
            url: 'https://connect.squareup.com/v2/catalog/object',
            headers: squareRequestHeaders,
            data: {
              'idempotency_key': uuidv4(),
              'object': {
                'id': '#1',
                'type': 'ITEM',
                'item_data': {
                  'name': req.body.title,
                  'description': `UPC: ${req.body.barcode}`,
                  'variations': [
                    {
                      'id': '#2',
                      'type': 'ITEM_VARIATION',
                      'item_variation_data': {
                        'price_money': {
                          'amount': parseFloat(req.body.price)*100,
                          'currency': 'USD'
                        },
                        'pricing_type': 'FIXED_PRICING',
                        'sku': req.body.barcode,
                        'track_inventory': true
                      }
                    }
                  ],
                  'tax_ids': [process.env.TAX_ID]
                }
              }
            }
          })
          .then(function(response) {
            console.log('item saved\n');
            var itemVariationID = response.data.catalog_object.item_data.variations[0].id;
            var catalogObjectID = response.data.catalog_object.id;
            updateQuantity(itemVariationID);
            return catalogObjectID  ;
          })
          .catch(function(error) {
            console.log('error saving item\n');
            catchError(error);
          });
  }

  function updateQuantity(itemVariationID) {
    var d = new Date();
    var occurred_at = d.toISOString();
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
            console.log('quantity saved\n');
          })
          .catch(function (error) {
            console.log('error updating quantity\n');
            catchError(error);
          });
  }

  function createImage(catalogObjectID) {
    // get image from discogs
    axios({
      method: 'get',
      url: req.body.image_url,
      responseType: 'stream',
      headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
    })
    .then(function(response) {
      console.log('image downloaded from discogs\n');
      response.data.pipe(fs.createWriteStream('item.jpg'));
    })
    .catch(function(error) {
      console.log('error getting image from discogs\n');
      catchError(error);
    });
    // get updated object version
    axios({
      method: 'get',
      url: `https://connect.squareup.com/v2/catalog/object/${catalogObjectID}`,
      headers: squareRequestHeaders
    })
    .then(function(response) {
      console.log('retreived updated object version\n');
      return response.data.object.version
    })
    .then(function(version) {
      // save image to square
      var formData = new FormData();
      var imageFile = fs.createReadStream('item.jpg');
      var requestObject = JSON.stringify({
        'idempotency_key': uuidv4(),
        'object_id': catalogObjectID,
        'image': {
          'id': '#1',
          'type': 'IMAGE',
          'image_data': {
            'caption': req.body.title
          },
          'version': version
        }
      });
      formData.append('request', imageFile);
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
        console.log('image saved\n');
        fs.unlink('item.jpg', (err) => {
          if (err) throw err;
          console.log('item.jpg has been deleted\n');
        })
      })
      .catch(function(error) {
        console.log('error saving image\n');
        catchError(error);
      });
    });
  }

  function createCatalogObject() {
    console.log('creating catalog object\n');
    return saveItem()
    .then(createImage);
  }

  createCatalogObject().then(function() {
    console.log('catalog item created\n');
  });
}
