module.exports = function(req, res) {
  console.log('/save-item route called');
  require('dotenv').config();
  const axios = require('axios');
  const { v4: uuidv4 } = require('uuid');
  const catchError = require('../helpers/catchError');
  const squareRequestHeaders = require('../helpers/squareRequestHeaders');

  function updateItem(catalogObjectID) {
    var item_variation_id = req.body.item_variation_id;
    return axios({
            method: 'post',
            url: 'https://connect.squareup.com/v2/catalog/object',
            headers: squareRequestHeaders,
            data: {
              'idempotency_key': uuidv4(),
              'object': {
                'id': item_variation_id,
                'type': 'ITEM_VARIATION',
                'version': req.body.item_variation_version,
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
            console.log('========== item variation updated ==========');
            console.log(response.data.catalog_object);
            var itemVariationID = response.data.catalog_object.id;
            updateQuantity(itemVariationID);
          })
          .catch(function(error) {
            console.log('========== error updating item variation ==========');
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
                  'type': 'PHYSICAL_COUNT',
                  'physical_count': {
                    'catalog_object_id': itemVariationID,
                    'quantity': req.body.total_quantity.toString(),
                    'location_id': process.env.LOCATION_ID,
                    'state': req.body.item_state,
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

  updateItem(req.body.item_id);
}
