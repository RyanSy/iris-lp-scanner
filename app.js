var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var app = express();
var searchController = require('./controllers/searchController');
var createController = require('./controllers/createController');
var updateController = require('./controllers/updateController');
var port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.get('/search/:barcode', searchController);

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
