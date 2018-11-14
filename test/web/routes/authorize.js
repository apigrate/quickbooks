var fs      = require('fs');
var path    = require('path');
var express = require('express');
var _       = require('lodash');
var router  = express.Router();
var debug   = require('debug')('qbo-route');
var config  = require('../../../config');
var moment  = require('moment');
var { getQuickBooksAuthorizationUrl, getQuickBooksAccessToken } = require('../../../')();

var STATE = 'abc123'; //normally you'd generate this and store in session across requests.
var QUICKBOOKS_APP_CLIENT_ID = config.client_id;
var QUICKBOOKS_APP_CLIENT_SECRET = config.client_secret;

var AUTH_DATA_PATH = config.auth_file_path;

router.get('/', function(req, res, next) {

  let client_id=config.client_id;
  let redirect_uri=getRedirectURI(req); // see router function below...

  getQuickBooksAuthorizationUrl(QUICKBOOKS_APP_CLIENT_ID, redirect_uri, STATE);

  res.render('main', {
    quickbooksAuthUrl: getQuickBooksAuthorizationUrl(client_id, redirect_uri, STATE)
  });

});



/**
  This is the router function you should implement for QuickBooks authorization.
  This example saves the received credentials in a file. You should take a more
  secure approach and save this data in encrypted form in secure persistent storage
  (i.e. a database).
*/
router.get('/connected', function(req, res, next) {
  if(req.query.error === 'access_denied'){
    next( new Error('Access denied.') );
    return;
  }

  debug(`${JSON.stringify(req.query, null, 2)}`);
  // if(req.query.state !== req.session.csrf){
  //   LOGGER.error(`Possible cross-site forgery attempt from: ${req.ip}`);
  //   next( new Error('Not authorized.') );
  //   return;
  // }

  //If code parameter present, it means we need to exchange it for an access token.
  if(req.query.code){
    let auth_data = {
      user: req.query.realmId,
      code: req.query.code,//Technically you don't need to save the code. It is transient.
      refresh_token: "",
      refresh_token_expires: "",
      access_token: "",
      access_token_expires: ""

    };

    saveAuthData(auth_data)//Initialize the persistent storage (replace this with your own storage approach)
    .then(function(result){
      //Take the code and exchange it for an access token which will grant API access.
      debug(`Exchanging code "${req.query.code}" for access token...`)

      return getQuickBooksAccessToken(
        QUICKBOOKS_APP_CLIENT_ID,
        QUICKBOOKS_APP_CLIENT_SECRET,
        req.query.code,
        getRedirectURI(req)//see below
      );
    })
    .then(function(intuitResponse){
      //Received the access token. Now save it!
      debug(`Saving access token...`)

      auth_data.access_token = intuitResponse.access_token;
      auth_data.refresh_token = intuitResponse.refresh_token;
      auth_data.refresh_token_expires = intuitResponse.x_refresh_token_expires_in;
      auth_data.access_token_expires = moment.utc().add(intuitResponse.expires_in, 'seconds').format('YYYY-MM-DD HH:mm:ss');//access token expiration

      return saveAuthData(auth_data);
    })
    .then(function(result){
      debug(`Access token saved.`)
      res.render('done');
    })
    .catch(function(err){
      console.error(`Error authorizing to QuickBooks Online: ${err.message}`);
      next( new Error(`Error authorizing to QuickBooks Online: ${err.message}`) );
    });


  } else {
    //Something else called this URL that isn't QuickBooks. Naughty.
    res.status(400).end();

  }
});



// some simple helper functions for persisting the token (you would use an encrypted database connection instead)...


function getRedirectURI(req){
  return `${req.protocol}://${req.get('host')}/connected`
}


/**
  Returns the OAuth credentials in file storage.
*/
function readAuthData(){
  return new Promise(function(resolve, reject) {
    fs.readFile(AUTH_DATA_PATH, function(err, result){
      if(err){
        reject(err);
        return;
      }

      resolve(JSON.parse(result));
    })
  });
}

/**
  Saves OAuth credentials into file storage.
*/
function saveAuthData(data){
  return new Promise(function(resolve, reject) {

    fs.writeFile(AUTH_DATA_PATH, JSON.stringify(data), function(err, result){
      if(err){
        reject(err);
        return;
      }

      resolve(result);
    });

  });
}

module.exports=router;
