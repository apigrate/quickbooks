var request = require('request-promise-native');
var _ = require('lodash');
var debug = require('debug')('gr8:qbo');
const uuidv4 = require('uuid/v4');
const EventEmitter = require('events');
const AUTHORIZATION_ENDPOINT = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_ENDPOINT = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
/**
  QBO API Library
  opts {
    timeout: 10000, //in ms
    return_full_response: true, //whether to return just data + intuit_tid (when false) or the full JSON body (when true)
  }
*/
class QboConnector extends EventEmitter{
  constructor(client_id, client_secret, access_token, refresh_token, realm_id, opts){
    super();
    this.client_id=client_id;
    this.client_secret=client_secret;
    this.access_token=access_token;
    this.refresh_token=refresh_token;
    this.realm_id=realm_id;
    if(!opts){
      opts = {
        return_full_response: false,//future use
        timeout: 10000,
        minorversion: null
      }
    }
    this.opts = opts;


    this.registry = [
      //Transactional
      { name: 'Bill',             singular: 'bill',           plural: 'bills',            query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'BillPayment',      singular: 'billpayment',    plural: 'billpayments',     query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'CreditMemo',       singular: 'creditmemo',     plural: 'creditmemos',      query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'Deposit',          singular: 'deposit',        plural: 'deposits',         query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'Estimate',         singular: 'estimate',       plural: 'estimates',        query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'Invoice',          singular: 'invoice',        plural: 'invoices',         query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'JournalEntry',     singular: 'journalentry',   plural: 'journalentries',   query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'Payment',          singular: 'payment',        plural: 'payments',         query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'Purchase',         singular: 'purchase',       plural: 'purchases',        query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'Purchaseorder',    singular: 'purchaseorder',  plural: 'purchaseorders',   query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'RefundReceipt',    singular: 'refundreceipt',  plural: 'refundreceipts',   query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'SalesReceipt',     singular: 'salesreceipt',   plural: 'salesreceipts',    query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'TimeActivity',     singular: 'timeactivity',   plural: 'timeactivities',   query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'Transfer',         singular: 'transfer',       plural: 'transfers',        query:true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'VendorCredit',     singular: 'vendorcredit',   plural: 'vendorcredits',    query:true,  create:true,  read: true,  update: true,  delete: true },
      //Named List
      { name: 'Account',          singular: 'account',          plural: 'accounts',          query: true,  create:true,  read: true,  update: true,  delete: false },
      { name: 'Budget',           singular: 'budget',           plural: 'budgets',           query: true,  create:false, read: true,  update: false, delete: false },
      { name: 'Class',            singular: 'class',            plural: 'classes',            query: true,  create:true,  read: true,  update: true,  delete: false },
      { name: 'CompanyCurrency',  singular: 'companycurrency',  plural: 'companycurrencies',  query: true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'Customer',         singular: 'customer',         plural: 'customers',        query: true,  create:true,  read: true,  update: true,  delete: false },
      { name: 'Department',       singular: 'department',       plural: 'departments',      query: true,  create:true,  read: true,  update: true,  delete: false },
      { name: 'Employee',         singular: 'employee',         plural: 'employees',        query: true,  create:true,  read: true,  update: true,  delete: false },
      { name: 'Item',             singular: 'item',             plural: 'items',            query: true,  create:true,  read: true,  update: true,  delete: false },
      { name: 'Journalcode',      singular: 'journalcode',      plural: 'journalcodes',     query: true,  create:true,  read: true,  update: true,  delete: false },//FR only.
      { name: 'PaymentMethod',    singular: 'paymentmethod',    plural: 'paymentmethods',   query: true,  create:true,  read: true,  update: true,  delete: false },
      { name: 'TaxAgency',        singular: 'taxagency',        plural: 'taxagencies',      query: true,  create:true,  read: true,  update: false, delete: false },
      { name: 'TaxCode',          singular: 'taxcode',          plural: 'taxcodes',         query: true,  create:true,  read: true,  update: false, delete: false },
      { name: 'TaxRate',          singular: 'taxrate',          plural: 'taxrates',         query: true,  create:true,  read: true,  update: false, delete: false },
      { name: 'TaxService',       singular: 'taxservice',       plural: 'taxservices',      query: true,  create:true,  read: false, update: false, delete: false },
      { name: 'Term',             singular: 'term',             plural: 'terms',            query: true,  create:true,  read: true,  update: true,  delete: false },
      { name: 'Vendor',           singular: 'vendor',           plural: 'vendors',          query: true,  create:true,  read: true,  update: true,  delete: false },
      //supporting
      { name: 'Attachable',       singular: 'attachable',       plural: 'attachables',      query: true,  create:true,  read: true,  update: true,  delete: true },
      { name: 'CompanyInfo',      singular: 'companyinfo',      plural: 'companyinfo',      query: true,  create:false, read: true,  update: true,  delete: false },
      { name: 'Preferences',      singular: 'preferences',      plural: 'preferences',      query: true,  create:false, read: true,  update: true,  delete: false }
    ];

    this.accounting={};

    //TODO: make these URLS configurable via opts.
    this.baseUrl = `https://quickbooks.api.intuit.com/v3/company/${realm_id}`;
    if(!opts || !opts.production){
      this.baseUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realm_id}`;
    }
    this.authorizationEndpoint = AUTHORIZATION_ENDPOINT;
    this.tokenEndpoint = TOKEN_ENDPOINT;
    this.revocationEndpoint = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

    this.baseRequest = request.defaults({
      baseUrl : this.baseUrl,
      headers:{
        'User-Agent': '@apigrate-qbo/1.0 Apigrate QuickBooks Online Connector for NodeJS',
        'Content-Type': 'application/json',
      },
      json: true,
      resolveWithFullResponse: opts ? opts.return_full_response : false,
      timeout: opts && opts.timeout ? opts.timeout : 10000 //timeout of 10s by default
    });

  }//end constructor


  /**
   * Assigns supported REST functions to the "accounting" entity
   */
  init(){
    var self = this;
    _.each(this.registry, function(e){
      var options = {};
      if(e.create){
        options.create = function(payload, reqid){
          var qs = {};
          if(reqid){
            qs.requestid=reqid ;
          }
          if(self.opts.minorversion){
            qs.minorversion = self.opts.minorversion;
          }
          return self._post(e.name, `/${e.singular}`, qs, payload);
        }
      }

      if(e.update){
        options.update = function(payload, reqid){
          var qs = {operation: 'update'};
          if(reqid){
            qs.requestid=reqid ;
          }
          if(self.opts.minorversion){
            qs.minorversion = self.opts.minorversion;
          }
          return self._post(e.name, `/${e.singular}`, qs, payload);
        }
      }

      if(e.read){
        options.get = function(id, reqid){
          var qs = null;
          if(reqid){
            qs = { requestid: reqid };
          }
          if(self.opts.minorversion){
            if(!qs) qs = {};
            qs.minorversion = self.opts.minorversion;
          }
          return self._get(e.name, `/${e.singular}/${id}`, qs);
        }
      }

      if(e['delete']){
        options.delete = function(payload, reqid){
          var qs = {operation: 'delete'};
          if(reqid){
            qs.requestid=reqid ;
          }
          if(self.opts.minorversion){
            qs.minorversion = self.opts.minorversion;
          }
          return self._post(e.name, `/${e.singular}`, qs, payload);
        }
      }

      if(e.query){
        options.query = function(queryStatement, reqid){
          if(!queryStatement){
            queryStatement = `select * from ${e.name}`;
          }
          var qs = {
            query: queryStatement
          };
          if(reqid){
            qs.requestid = reqid;
          }
          if(self.opts.minorversion){
            if(!qs) qs = {};
            qs.minorversion = self.opts.minorversion;
          }
          return self._get(e.name, `/query`, qs);
        }
      }
      self.accounting[e.plural]=options;
    });
    return self;
  }




  /**
    Sends any GET request for API calls. Includes token refresh retry capabilities.
    @param {string} entityName the name of the entity in the registry.
    @param {string} uri (after base url).
    @param {object} qs query string hash
    @param {string} skip_refresh_token whether to skip a refresh token attempt (default false, meaning it will
      initially attempt to get a refresh token if a 401 is received)
  */
  _get(entityName, uri, qs, skip_refresh_token){
    var self = this;
    return new Promise(function(resolve, reject) {
      debug(`GET ${entityName} ${uri}`);

      var updated = self.baseRequest.defaults({
        method: 'GET',
        uri: uri,
        qs: qs,
        headers: {'Authorization': `Bearer ${self.access_token}` } //the latest token
      });
      updated()
      .then(function(res){
        resolve(res);
      })
      .catch(function(err){
        if(err.statusCode && err.statusCode===401 && !skip_refresh_token){
          //If 401 and refresh is allowed, try refreshing the token and retrying this API call.
          debug(`unauthorized (status code is ${err.statusCode})`)
          self.refreshAccessToken()
          .then(function(result){
            return self._get(entityName, uri, qs, true);
          }).then(function(result){
            //Recurse with 'refresh' turned off.
            resolve( result );
          })
          .catch(function(err2){
          	reject( err2 );
          });
        } else {
          self.handleError(err);
          reject( err );
        }

      });
    });
  }


  _post(entityName, uri, qs, body, skip_refresh_token){
    var self = this;
    return new Promise(function(resolve, reject) {

      debug(`POST ${uri}`);
      var updated = self.baseRequest.defaults({
        method: 'POST',
        uri: uri,
        qs: qs,
        body: body,
        headers: {'Authorization': `Bearer ${self.access_token}` } //the latest token
      });
      updated()
      .then(function(res){
        resolve(res);
      })
      .catch(function(err){
        console.error(`error: ${JSON.stringify(err)}`);

        if(err.statusCode && err.statusCode===401 && !skip_refresh_token){
          //If 401 and refresh is allowed, try refreshing the token and retrying this API call.
          debug(`unauthorized (status code is ${err.statusCode})`)
          self.refreshAccessToken()
          .then(function(result){

            //Recurse with 'refresh' turned off.
            return self._post(entityName, uri, null, body, true);
          }).then(function(result){
            resolve( result );
          })
          .catch(function(err2){
            reject( err2 );
          });
        } else {
          self.handleError(err);
          reject( err );
        }

      });
    });
  }

  handleError(err){
    if(!err || !err.name==='StatusCodeError') return;

    if(err.error && err.error.Fault ){
      _.each(err.error.Fault.Error, function(x){
        switch(x.code){
          case "500":
            console.error(`${x.Detail}. Recommendation: possible misconfiguration the entity name is not recognized.`)
            break;
          case "610":
            //Entity is not found.
            break;
          case "2010":
            console.error(`${x.Detail}. Recommendation: check the properties on your payload.`)

            break;
          case "4000":
            console.error(`${x.Detail}. Recommendation: check punctuation in your query. For example, you might be using double quotes instead of single quotes.`)
            break;
          case "4001":
            console.error(`${x.Detail}. Recommendation: check your entity and attribute names to make sure the match QuickBooks API specifications.`)
            break;
          default:
            console.error(x.Detail);
            break;
        }

      });
    }
  }





  /**
    Refreshes the access token. Internally used to reset the access token.

     An event 'token.refresh' is published when a token has been successfully refreshed.
     Event payload example:
     @example: {
      token_type: 'string',
      access_token: 'string',
      expires: 'duration in seconds',
      refresh_token : 'string',
      x_refresh_token_expires_in: 'duration in seconds'
      };
  */
  refreshAccessToken(){
    var self = this;
    return new Promise(function(resolve, reject) {
      debug('Refreshing QuickBooks Online API access token.')
      request({
        method : 'POST',
        url : TOKEN_ENDPOINT,
        headers:{
          'User-Agent': '@apigrate-qbo/1.0 Apigrate QuickBooks Online Connector for NodeJS',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth:{
          username: self.client_id,
          password: self.client_secret
        },
        form: {
          grant_type: 'refresh_token',
          refresh_token: self.refresh_token
          // ,client_id: self.client_id,
          // client_secret: self.client_secret
        },
        json: true
      })
      .then(function(response){
        //Internally, adjust the tokens, but also broadcast an event so other entities can see it.
        self.access_token = response.access_token;
        self.refresh_token = response.refresh_token;
        //response.token_type;
        //response.expires;
        //response.x_refresh_token_expires_in;
        var info = {
          token_type: response.token_type,
          access_token: response.access_token,
          expires: response.expires,
          refresh_token : response.refresh_token,
          x_refresh_token_expires_in: response.x_refresh_token_expires_in
        };

        debug(`New access token info:\n${JSON.stringify(info,null,2)}`)
        self.emit('token.refreshed', info);

        resolve(response);
      })
      .catch(function(err){
        console.error(`Error refreshing access token. ${err.message}`)
      	reject( new Error(err) );
      });
    });
  }

  /**
   * Disconnects the user from QBO (invalidates the access token and request token).
   * After calling this method, the user will be forced to authenticate again.
   * Emits the "token.revoked" event, handing back the data passed back from QBO.
   */
  disconnect(){
    var self = this;
    return new Promise(function(resolve, reject) {
      debug(`Disconnecting from the QuickBooks Online API.`)
      request({
        method : 'POST',
        url : self.revocationEndpoint,
        headers:{
          'User-Agent': '@apigrate-qbo/1.0 Apigrate QuickBooks Online Connector for NodeJS',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        auth:{
          username: self.client_id,
          password: self.client_secret
        },
        body: {
          token: self.refresh_token
        },
        json: true
      })
      .then(function(response){
        debug(`Disconnection result:\n${JSON.stringify(response,null,2)}`)
        self.emit('token.revoked', response);

        resolve(response);
      })
      .catch(function(err){
        console.error(`Error during QuickBooks disconnection process. ${JSON.stringify(err,null,2)}`)
        reject( err );
      });
    });
  }
};

exports.QboConnector=QboConnector;

/**
  Returns a fully populated validation URL to be used for initiating an OAuth request.
  @param {string} client_id Identifies which app is making the request
  @param {string} redirectUri Determines where the response is sent. The value
    of this parameter must exactly match one of the values listed for this app in the app settings.
  @param {string} state Provides any state that might be useful to your application upon receipt
    of the response. The Intuit Authorization Server roundtrips this parameter, so your application
    receives the same value it sent. Including a CSRF token in the state is recommended.
  @return the authorization URL string with all parameters set and encoded.
  Note, when the redirectUri is invoked, it will contain the following query parameters:
  1. code (what you exchange for a token)
  2. realmId - this identifies the QBO company and should be used
*/
exports.getQuickBooksAuthorizationUrl = function(client_id, redirectUri, state){

  var url = `${AUTHORIZATION_ENDPOINT}`
    + `?client_id=${encodeURIComponent(client_id)}`
    + `&scope=${encodeURIComponent('com.intuit.quickbooks.accounting')}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&response_type=code`
    + `&state=${encodeURIComponent(state)}`;

  return url;
}

/**
  Issues a POST request to obtain an access token. Note that this will callback to
  the specified redirect URI.
*/
exports.getQuickBooksAccessToken = function(client_id, client_secret, code, redirect_uri){
  return request({
    method : 'POST',
    url : TOKEN_ENDPOINT,
    headers:{
      'User-Agent': '@apigrate-qbo/1.0 Apigrate QuickBooks Online Connector for NodeJS',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth:{
      username: client_id,
      password: client_secret
    },
    form: {
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri
    },
    json: true
  });
}
