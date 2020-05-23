module.exports = function(req, res) {
  console.log('/save-item route called');
  require('dotenv').config();
  const axios = require('axios');
  const { v4: uuidv4 } = require('uuid');
  const catchError = require('../helpers/catchError');
  const squareRequestHeaders = require('../helpers/squareRequestHeaders');

  function updateQuantity(itemVariationID) {
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
                  'type': 'PHYSICAL_COUNT',
                  'physical_count': {
                    'catalog_object_id': itemVariationID,
                    'quantity': req.body.total_quantity,
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

  updateQuantity(req.body.item_variation_id);
}
