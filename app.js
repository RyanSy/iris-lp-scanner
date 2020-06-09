var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
llvar createController = require('./controllers/createController');
var updateController = require('./controllers/updateController');
var port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cors());
app.options('*', cors());

app.get('/test', function(req, res, next) {
  res.json({message: 'this is a test'});
});

app.get('/search/:barcode', function(req, res, next) {
  console.log(`\n========== /search/${req.params.barcode} route called ==========\n`);
  require('dotenv').config();
  const axios = require('axios');
  const FormData = require('form-data');
  const { v4: uuidv4 } = require('uuid');
  const catchError = require('./helpers/catchError');
  const squareRequestHeaders = require('./helpers/squareRequestHeaders');
  axios({
          method: 'post',
          url: 'https://connect.squareup.com/v2/catalog/search',
          headers: squareRequestHeaders,
          data: {
            'object_types': ['ITEM'],
            'query': {
              'text_query': {
                'keywords': [req.params.barcode]
              }
            },
            'include_related_objects': true
          }
      })
      .then(function(response) {
        // if found, consider generating url directing to item on square dashboard
        if (response.data.objects) {
          console.log('item found in square catalog:\n', response.data.objects[0], '\n');
          console.log('item variation found in square catalog:\n', response.data.objects[0].item_data.variations[0], '\n');
          var item = response.data.objects[0];
          var item_id = item.id;
          var item_variation = item.item_data.variations[0];
          var item_variation_id = item_variation.id;
          var item_variation_version = item_variation.version;
          var image_url = response.data.related_objects[0].image_data.url;
          var title = item.item_data.name;
          var price = parseFloat(item_variation.item_variation_data.price_money.amount)/100;
          retrieveInventoryCount(item_variation_id)
            .then(function(result) {
              var itemObj = {};
              var quantity = parseInt(result.quantity);
              var item_state = result.state;
              itemObj.quantity = quantity;
              itemObj.item_state = item_state;
              res.json({
                title: title,
                quantity: quantity,
                price: price,
                cover_image: image_url,
                item_id: item_id,
                item_variation_id: item_variation_id,
                item_variation_version: item_variation_version,
                item_state: item_state
              });
            });
        } else {
          console.log('item not found in square catalog, searching discogs\n');
          searchDiscogs();
          }
      })
      .catch(function(error) {
        console.log('error searching square\n');
        catchError(error);
      });

  function retrieveInventoryCount(catalog_object_id) {
    return axios({
      method: 'get',
      url: `https://connect.squareup.com/v2/inventory/${catalog_object_id}`,
      headers: squareRequestHeaders
    })
    .then(function(response) {
      console.log('inventory count retreived:\n', response.data.counts[0], '\n');
      return response.data.counts[0];
    })
    .catch(function(error) {
      console.log('error retrieving inventory count\n');
      catchError(error);
    });
  }

  function searchDiscogs() {
    return axios({
      method: 'get',
      url: `https://api.discogs.com//database/search?q={${req.params.barcode}}&{?barcode}&token=${process.env.DISCOGS_USER_TOKEN}`,
      headers: {'User-Agent': 'IRIS-LP-Scanner/1.0'}
    })
    .then(function(response) {
      if (response.data.results.length > 0) {
        console.log('item found on discogs:\n', response.data.results[0], '\n');
        res.json(response.data.results[0]);
      } else {
        console.log('item not found on discogs\n');
        res.json({ title: 'Item not found' });
      }
    })
    .catch(function(error) {
      console.log('error searching discogs\n');
      catchError(error);
    });
  }
});

app.post('/create', createController);

app.post('/update', updateController);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.error(err.stack)
        res.status(err.status || 500);
        res.send(err.message);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
