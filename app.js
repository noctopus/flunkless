var express = require('express')
, app = express()
, server = require('http').createServer(app)
, routes = require('./routes')
, chatServer =require('./chatServer')(server),
  graph = require('fbgraph');

  app.use(express.cookieParser() );
  app.use(express.session({ secret: 'nyan cat'}));

app.get('/auth/facebook', function(req, res) {
  if (!req.query.code) {
    var authUrl = graph.getOauthUrl({
      'client_id': '503116156483513',
      'redirect_uri': 'http://flunkless1.herokuapp.com/auth/facebook',
      'scope': 'user_about_me,read_stream'//you want to update scope to what you want in your app
    });

    if (!req.query.error) {
      res.redirect(authUrl);
    } else {
      res.send('access denied');
    }
    return;
  }

  graph.authorize({
    'client_id': '503116156483513',
    'redirect_uri': 'http://flunkless1.herokuapp.com/auth/facebook',
    'client_secret': '971560a5803d0cc840414403c3ca29df',
    'code': req.query.code
  }, function( err, facebookRes) {
    res.redirect('/UserHasLoggedIn');
  });
});

app.get('/UserHasLoggedIn', function(req, res) {
  graph.get('me', function(err, response) {
    console.log(err); //if there is an error this will return a value
    data = { facebookData: response};
    res.end(JSON.stringify(data));
  });
});


  var mongoose = require('mongoose');
  mongoose.connect('mongodb://cs121:cs121@oceanic.mongohq.com:10050/FlunkLess');
  var db = mongoose.connection;

  app.set('port', process.env.PORT || 3000);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use('/components', express.static(__dirname + '/components'));
  app.use('/js', express.static(__dirname + '/js'));
  app.use('/icons', express.static(__dirname + '/icons'));
  app.set("views", __dirname + "/public/views");
  app.set('view engine', 'ejs');
  app.use(app.router);

  app.get('/', routes.index);
  server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});