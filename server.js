//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');

var session = require('express-session');
var bodyParser = require('body-parser');
var Keycloak = require('keycloak-connect');
var cors = require('cors');

Object.assign=require('object-assign')

app.use(bodyParser.json());
// Enable CORS support
app.use(cors());

var memoryStore = new session.MemoryStore();

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Provide the session store to the Keycloak so that sessions
// can be invalidated from the Keycloak console callback.
//
// Additional configuration is read from keycloak.json file
// installed from the Keycloak web console.

var keycloak = new Keycloak({
  store: memoryStore
});

app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));

app.get('/service/public', function (req, res) {
  res.json({message: 'public'});
});

app.get('/service/secured', keycloak.protect('realm:user'), function (req, res) {
  res.json({message: 'secured'});
});

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
    res.render('index.html', { pageCountMessage : null});
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
