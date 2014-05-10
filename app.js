var express = require('express')
, app = express()
, server = require('http').createServer(app)
, routes = require('./routes')
, chatServer =require('./chatServer')(server);

  app.set('port', process.env.PORT || 3000);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use('/components', express.static(__dirname + '/components'));
  app.use('/js', express.static(__dirname + '/js'));
  app.use('/icons', express.static(__dirname + '/icons'));
  app.use(app.router);
  app.set('view engine', 'ejs');

  app.get('/', routes.index);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});