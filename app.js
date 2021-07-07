const createError = require('http-errors');
const express = require('express');
const session = require('express-session')
const path = require('path');
const logger = require('morgan');
const okta = require('@okta/okta-sdk-nodejs');
const ExpressOIDC = require('@okta/oidc-middleware').ExpressOIDC;
const config = require('config');

// bring okta variables
const orgUrl = config.get('orgUrl');
const token = config.get('token');
const issuer = config.get('issuer');
const client_id = config.get('client_id');
const client_secret = config.get('client_secret');


// define routes
let dasboardRouter = require('./routes/dashboard');
let publicRouter = require('./routes/public');
let userRouter = require('./routes/users');

const app = express();

// oktaClient for retrieving user data from okta API
const  oktaClient = new okta.Client({
  orgUrl: orgUrl,
  token: token
});

const oidc = new ExpressOIDC({
  issuer: issuer,
  client_id: client_id,
  client_secret: client_secret,
  redirect_uri: 'http://localhost:3000/users/callback',
  appBaseUrl: 'http://localhost:3000',
  scope:'openid profile',
  routes: {
    login: {
      path: '/users/login'
    },
    callback: {
      path: '/users/callback',
      defaultRedirect: '/dashboard'
    }
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:'coconutmonkeybananaapplepie',
  resave: true,
  saveUninitialized: false
}))
app.use(oidc.router);

app.use((req, res, next) => {
  if(!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    })
})

app.use('/', publicRouter);
app.use('/dashboard',loginRequired, dasboardRouter);
app.use('/users', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get ('/test', (req, res) => {
  res.json({ profile: req.user ? req.user.profile :  null});
});

function loginRequired(res, res, next) {
  if(!req.user){
    return res.status(401).render("unauthenticated")
  }
  next();
}


module.exports = app;
