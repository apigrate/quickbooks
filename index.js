const fetch = require('node-fetch');
const qs = require('query-string');

var debug   = require('debug')('gr8:quickbooks');
var verbose = require('debug')('gr8:quickbooks:verbose');

const EventEmitter = require('events');

const AUTHORIZATION_ENDPOINT = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_ENDPOINT = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const REVOCATION_ENDPOINT = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
const USER_AGENT = 'Apigrate QuickBooks NodeJS Connector/3.x';

/**
 * NodeJS QuickBooks connector class. 
 * 
 * @version 3.x
 * @example
 *  
 */
class QboConnector extends EventEmitter{
  /**
   * 
   * @constructor 
   * @param {object} config 
   * @param {string} config.client_id 
   * @param {string} config.client_secret 
   * @param {string} config.access_token 
   * @param {string} config.refresh_token 
   * @param {string} config.realm_id 
   * @param {string} config.base_url defaults to 'https://quickbooks.api.intuit.com/v3' if not provided. If you are testing with a sandbox 
   * environment, consult the documentation for the base url to use (e.g. 'https://sandbox-quickbooks.api.intuit.com/v3')
   * @param {number} config.minor_version optional minor version to use on API calls to the QuickBooks API
   * @param {function} config.credential_initializer optional function returning an object with the initial credentials to be used, of the form
   * `{ access_token, refresh_token, realm_id}`. This function is invoked on the first API method invocation automatically. If you omit this function, you'll need
   * to call the setCredentials method prior to your first API method invocation. 
   */
  constructor(config){
    super();
    this.client_id=config.client_id;
    this.client_secret=config.client_secret;
    this.access_token=config.access_token || null;
    this.refresh_token=config.refresh_token || null;
    this.realm_id=config.realm_id || null;
    this.minor_version = config.minor_version || null;
    this.credential_initializer = config.credential_initializer || null;
    this.base_url = config.base_url || 'https://quickbooks.api.intuit.com/v3';

    this.registry = [
      //transaction entities
      { handle: 'Bill',             name: 'Bill',             fragment: 'bill',           query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'BillPayment',      name: 'BillPayment',      fragment: 'billpayment',    query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'CreditMemo',       name: 'CreditMemo',       fragment: 'creditmemo',     query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'Deposit',          name: 'Deposit',          fragment: 'deposit',        query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'Estimate',         name: 'Estimate',         fragment: 'estimate',       query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'Invoice',          name: 'Invoice',          fragment: 'invoice',        query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'JournalEntry',     name: 'JournalEntry',     fragment: 'journalentry',   query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'Payment',          name: 'Payment',          fragment: 'payment',        query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'Purchase',         name: 'Purchase',         fragment: 'purchase',       query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'Purchaseorder',    name: 'Purchaseorder',    fragment: 'purchaseorder',  query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'RefundReceipt',    name: 'RefundReceipt',    fragment: 'refundreceipt',  query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'SalesReceipt',     name: 'SalesReceipt',     fragment: 'salesreceipt',   query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'TimeActivity',     name: 'TimeActivity',     fragment: 'timeactivity',   query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'Transfer',         name: 'Transfer',         fragment: 'transfer',       query:true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'VendorCredit',     name: 'VendorCredit',     fragment: 'vendorcredit',   query:true,  create:true,  read: true,  update: true,  delete: true },
      //named list entities
      { handle: 'Account',            name: 'Account',          fragment: 'account',           query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'Budget',             name: 'Budget',           fragment: 'budget',            query: true,  create:false, read: true,  update: false, delete: false },
      { handle: 'Class',              name: 'Class',            fragment: 'class',             query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'CompanyCurrency',    name: 'CompanyCurrency',  fragment: 'companycurrency',   query: true,  create:true,  read: true,  update: true,  delete: true },
      { handle: 'Customer',           name: 'Customer',         fragment: 'customer',          query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'Department',         name: 'Department',       fragment: 'department',        query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'Employee',           name: 'Employee',         fragment: 'employee',          query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'Item',               name: 'Item',             fragment: 'item',              query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'Journalcode',        name: 'Journalcode',      fragment: 'journalcode',       query: true,  create:true,  read: true,  update: true,  delete: false },//FR only.
      { handle: 'PaymentMethod',      name: 'PaymentMethod',    fragment: 'paymentmethod',     query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'TaxAgency',          name: 'TaxAgency',        fragment: 'taxagency',         query: true,  create:true,  read: true,  update: false, delete: false },
      { handle: 'TaxCode',            name: 'TaxCode',          fragment: 'taxcode',           query: true,  create:true,  read: true,  update: false, delete: false },
      { handle: 'TaxRate',            name: 'TaxRate',          fragment: 'taxrate',           query: true,  create:true,  read: true,  update: false, delete: false },
      { handle: 'TaxService',         name: 'TaxService',       fragment: 'taxservice',        query: true,  create:true,  read: false, update: false, delete: false },
      { handle: 'Term',               name: 'Term',             fragment: 'term',              query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'Vendor',             name: 'Vendor',           fragment: 'vendor',            query: true,  create:true,  read: true,  update: true,  delete: false },
      { handle: 'Attachable',         name: 'Attachable',       fragment: 'attachable',        query: true,  create:true,  read: true,  update: true,  delete: true },
      //supporting entities
      { handle: 'CompanyInfo',        name: 'CompanyInfo',      fragment: 'companyinfo',       query: true,  create:false, read: true,  update: true,  delete: false },
      { handle: 'Preferences',        name: 'Preferences',      fragment: 'preferences',       query: true,  create:false, read: true,  update: true,  delete: false },
      //reports
      { handle: 'AccountListDetailReport',          name: 'AccountList',                  fragment: 'AccountList',                report: true },
      { handle: 'APAgingDetailReport',              name: 'AgedPayableDetail',            fragment: 'AgedPayableDetail',          report: true },
      { handle: 'APAgingSummaryReport',             name: 'AgedPayables',                 fragment: 'AgedPayables',               report: true },
      { handle: 'ARAgingDetailReport',              name: 'AgedReceivableDetail',         fragment: 'AgedReceivableDetail',       report: true },
      { handle: 'ARAgingSummaryReport',             name: 'AgedReceivables',              fragment: 'AgedReceivables',            report: true },
      { handle: 'BalanceSheetReport',               name: 'BalanceSheet',                 fragment: 'BalanceSheet',               report: true },
      { handle: 'CashFlowReport',                   name: 'CashFlow',                     fragment: 'CashFlow',                   report: true },
      { handle: 'CustomerBalanceReport',            name: 'CustomerBalance',              fragment: 'CustomerBalance',            report: true },
      { handle: 'CustomerBalanceDetailReport',      name: 'CustomerBalanceDetail',        fragment: 'CustomerBalanceDetail',      report: true },
      { handle: 'CustomerIncomeReport',             name: 'CustomerIncome',               fragment: 'CustomerIncome',             report: true },
      { handle: 'GeneralLedgerReport',              name: 'GeneralLedger',                fragment: 'GeneralLedger',              report: true },
      { handle: 'GeneralLedgerReportFR',            name: 'GeneralLedgerFR',              fragment: 'GeneralLedgerFR',            report: true }, //FR locale
      { handle: 'InventoryValuationSummaryReport',  name: 'InventoryValuationSummary',    fragment: 'InventoryValuationSummary',  report: true },
      { handle: 'JournalReport',                    name: 'JournalReport',                fragment: 'JournalReport',              report: true },
      { handle: 'ProfitAndLossReport',              name: 'ProfitAndLoss',                fragment: 'ProfitAndLoss',              report: true },
      { handle: 'ProfitAndLossDetailReport',        name: 'ProfitAndLossDetail',          fragment: 'ProfitAndLossDetail',        report: true },
      { handle: 'SalesByClassSummaryReport',        name: 'ClassSales',                   fragment: 'ClassSales',                 report: true },
      { handle: 'SalesByCustomerReport',            name: 'CustomerSales',                fragment: 'CustomerSales',              report: true },
      { handle: 'SalesByDepartmentReport',          name: 'DepartmentSales',              fragment: 'DepartmentSales',            report: true },
      { handle: 'SalesByProductReport',             name: 'ItemSales',                    fragment: 'ItemSales',                  report: true },
      { handle: 'TaxSummaryReport',                 name: 'TaxSummary',                   fragment: 'TaxSummary',                 report: true },
      { handle: 'TransactionListReport',            name: 'TransactionList',              fragment: 'TransactionList',            report: true },
      { handle: 'TrialBalanceReportFR',             name: 'TrialBalanceFR',               fragment: 'TrialBalanceFR',             report: true }, //FR locale
      { handle: 'TrialBalanceReport',               name: 'TrialBalance',                 fragment: 'TrialBalance',               report: true },
      { handle: 'VendorBalanceReport',              name: 'VendorBalance',                fragment: 'VendorBalance',              report: true },
      { handle: 'VendorBalanceDetailReport',        name: 'VendorBalanceDetail',          fragment: 'VendorBalanceDetail',        report: true },
      { handle: 'VendorExpensesReport',             name: 'VendorExpenses',               fragment: 'VendorExpenses',             report: true },

    ];

    this.accounting={};

  }//end constructor

  /**
   * Sets the credentials on the connector. If any of the creds properties are missing,
   * the corresponding internal property will NOT be set.
   * @param {object} creds
   * @param {string} creds.access_token the Intuit access token 
   * @param {string} creds.realm_id the Intuit realm_id
   * @param {string} creds.refresh_token the Intuit refresh token 
   */
  setCredentials(creds){
    if(!creds) throw new Error("No credentials provided.");
    if(creds.access_token){
      this.access_token = creds.access_token;
    }
    if(creds.refresh_token){
      this.refresh_token = creds.refresh_token;
    }
    if(creds.realm_id){
      this.realm_id = creds.realm_id;
    }
    // verbose(`${this.access_token}\n${this.refresh_token}\n${this.realm_id}`)
  }

  /**
   * Get the object through which you can interact with the QuickBooks Online Accounting API.
   */
  acccountingApi(){

    var self = this;
    self.registry.forEach( function(e){
      var options = {name: e.name, fragment: e.fragment };
      if(e.create){
        options.create = function(payload, reqid){
          var qs = {};
          if(reqid){
            qs.requestid=reqid ;
          }
          if(self.minor_version){
            qs.minorversion = self.minor_version;
          }
          return self._post.call(self, e.name, `/${e.fragment}`, qs, payload);
        }
      }

      if(e.update){
        options.update = function(payload, reqid){
          var qs = {operation: 'update'};
          if(reqid){
            qs.requestid=reqid ;
          }
          if(self.minor_version){
            qs.minorversion = self.minor_version;
          }
          return self._post.call(self, e.name, `/${e.fragment}`, qs, payload);
        }
      }

      if(e.read){
        options.get = function(id, reqid){
          var qs = null;
          if(reqid){
            qs = { requestid: reqid };
          }
          if(self.minor_version){
            if(!qs) qs = {};
            qs.minorversion = self.minor_version;
          }
          return self._get.call(self, e.name, `/${e.fragment}/${id}`, qs);
        }
      }

      if(e['delete']){
        options.delete = function(payload, reqid){
          var qs = {operation: 'delete'};
          if(reqid){
            qs.requestid=reqid ;
          }
          if(self.minor_version){
            qs.minorversion = self.minor_version;
          }
          return self._post.call(self, e.name, `/${e.fragment}`, qs, payload);
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
          if(self.minor_version){
            if(!qs) qs = {};
            qs.minorversion = self.minor_version;
          }
          
          return self._get.call(self, e.name, `/query`, qs);
        }
      }

      if(e.report){
        options.query = function(parms, reqid){
          
          var qs = parms || {};
          if(reqid){
            qs.requestid = reqid;
          }
          if(self.minor_version){
            if(!qs) qs = {};
            qs.minorversion = self.minor_version;
          }
          
          return self._get.call(self, e.name, `/reports/${e.fragment}`, qs);
        }
      }

      self.accounting[e.handle]=options;

    });
    self.accounting.batch=function(payload){ return self._batch.call(self, payload); }//and the batch method as well...

    return self.accounting;
  }


  /**
    Sends any GET request for API calls. Includes token refresh retry capabilities.
    @param {string} entityName the name of the entity in the registry.
    @param {string} uri (after base url).
    @param {object} qs query string hash
  */
  async _get(entityName, uri, qs){
    return await this.doFetch(
      "GET", 
      `${uri}`, 
      qs, 
      null, 
      {entityName}
    );
  }


  async _post(entityName, uri, qs, body){
    return await this.doFetch(
      "POST", 
      `${uri}`, 
      qs, 
      body, 
      {entityName}
    );
  }


  async _batch(body){
    return await this.doFetch(
      "POST", 
      `/batch`, 
      null, 
      body
    );
  }

  handleStatusCodeError(err){
    if(!err || err.name !== 'StatusCodeError') return;

    if(err.error && err.error.Fault ){
      err.error.Fault.Error.forEach( function(x){
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
   * Internal method to make an API call using node-fetch.
   * 
   * @param {string} method GET|POST|PUT|DELETE
   * @param {string} url api endpoint url (without query parameters)
   * @param {object} query hash of query string parameters to be added to the url
   * @param {object} payload for POST, PUT methods, the data payload to be sent
   * @param {object} options hash of additional options
   * @param {object} options.headers hash of headers. Specifying the headers option completely
   * replaces the default headers.
   */
  async doFetch(method, url, query, payload, options){
    if(!this.refresh_token || !this.access_token || !this.realm_id){
      if(this.credential_initializer){
        let creds = await this.credential_initializer.call();
        verbose(`Obtained credentials from initializer:${JSON.stringify(creds)}.`);
        if(creds){
          this.setCredentials(creds);
        }
      } else {
        throw new Error("Missing credentials. Please provide them explicitly, or use an initializer function.")
      }
    }
    if(!options){
      options = {};
    }
    if(!options.retries){
      options.retries = 0;
    }

    let fetchOpts = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT
      },
    };

    if(this.access_token){
      fetchOpts.headers.Authorization = `Bearer ${this.access_token}`;
    }

    if(options && options.headers){
      fetchOpts.headers = options.headers;
    }
    
    let qstring = '';
    if(query){
      qstring = qs.stringify(query);
      qstring = '?'+qstring;
    }
    let full_url = `${this.base_url}/company/${this.realm_id}${url}${qstring}`;
    
    if(payload){
      if(fetchOpts.headers['Content-Type']==='application/x-www-form-urlencoded'){
        fetchOpts.body = payload
        verbose(`  raw payload: ${payload}`);
      } else {
        //assume json
        fetchOpts.body = JSON.stringify(payload);
        verbose(`  JSON payload: ${JSON.stringify(payload)}`);
      
      }
    }

    try{
      debug(`${method}${options.entityName?' '+options.entityName:''} ${full_url}`);
      
      let response = await fetch(full_url, fetchOpts);

      let result = null;
      if(response.ok){
        debug(`  ...OK HTTP-${response.status}`);
        result = await response.json();
        verbose(`  response payload: ${JSON.stringify(result)}`);
      } else {
        debug(`  ...Error. HTTP-${response.status}`);
    
        //Note: Some APIs return HTML or text depending on status code...
        let result = await response.json();
        if (response.status >=300 & response.status < 400){
          //redirection
        } else if (response.status >=400 & response.status < 500){
          if(response.status === 401 || response.status === 403){
            debug(result.error);
            //These will be retried once after attempting to refresh the access token.
            throw new ApiAuthError(JSON.stringify(result));
          }
          //client errors
          verbose(`  client error. response payload: ${JSON.stringify(result)}`);
        } else if (response.status >=500) {
          //server side errors
          verbose(`  server error. response payload: ${JSON.stringify(result)}`);
        } else { 
          throw err; //Cannot be handled.
        }
        return result;
      }
      return result;

    }catch(err){
      if(err instanceof ApiAuthError){
        if(options.retries < 1){
          debug(`Attempting to refresh access token...`);
          //Refresh the access token.
          await this.refreshAccessToken();
          
          options.retries ++;
          debug(`...refreshed OK.`);
          //Retry the request
          return this.doFetch(method, url, query, payload, options);
        } else {
          throw err;
        }

      }
      //Unhandled errors are noted and re-thrown.
      console.error(err);
      throw err;
    }
  }

  /**
   * Handles API responses that are not in the normal HTTP OK code range (e.g. 200) in a consistent manner.
   * Also identifies and throws authorization errors which may be used to trigger refresh-token handling.
   * @param {object} response the fetch response (without any of the data methods invoked) 
   * @param {string} url the full url used for the API call
   * @param {object} fetchOpts the options used by node-fetch
   */
  async handleNotOk(response, url, fetchOpts){
    debug(`  ...Error. HTTP-${response.status}`);
    
    //Note: Some APIs return HTML or text depending on status code...
    let result = await response.json();
    if (response.status >=300 & response.status < 400){
      //redirection
    } else if (response.status >=400 & response.status < 500){
      if(response.status === 401 || response.status === 403){
        debug(result.error);
        //These will be retried once after attempting to refresh the access token.
        throw new ApiAuthError(JSON.stringify(result));
      }
      //client errors
      verbose(`  client error. response payload: ${JSON.stringify(result)}`);
    } else if (response.status >=500) {
      //server side errors
      verbose(`  server error. response payload: ${JSON.stringify(result)}`);
    } else { 
      throw err; //Cannot be handled.
    }
    return result;
   
  }




  /**
   * Obtains a new access token and refresh token for an authorization code. Internally used to reset the access token.
   * 
   * @param {string} code received from the callback response.
   * @param {string} redirect_uri a valid redirect URI for your app.
   * @param {string} realm_id received from the callback response.
   * 
   * @returns the access token data payload
   * @emits `token.refreshed` with the data payload
   * @example 
   *  {
   *    token_type: "Bearer"
   *    access_token: string,
   *    expires_in: number, //(number of seconds access token lives),
   *    refresh_token: string,
   *    x_refresh_token_expires_in: number //(number of seconds refresh token lives)
   *  }
   * 
   */
  async exchangeCodeForAccessToken(code, redirect_uri, realm_id){
    verbose(`Exchanging code for access token.\n  code: ${code}\n  redirect uri: ${redirect_uri}\n  realm id:${realm_id}`)
    let fetchOpts = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
        'Authorization': `Basic ${Buffer.from(this.client_id+':'+this.client_secret).toString('base64')}`,
      },
      body: `code=${encodeURIComponent(code)}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(redirect_uri)}`
    };

    verbose(`Sending: ${fetchOpts.body}`);
    let result = await fetch(TOKEN_ENDPOINT, fetchOpts); 
    let response = await result.json();

    let credentials = {};
    Object.assign(credentials, response); //copy the data onto the credentials object.

    /*
      {
        token_type: "Bearer"
        access_token: string,
        expires_in: integer (number of seconds access token lives),
      }
    */
   
    this.access_token = credentials.access_token;
    if(credentials.refresh_token){
      //The refresh token should not be overwritten if it is not present.
      this.refresh_token = credentials.refresh_token;
    }

    //If realm id not included on the response, take it from the method parameters.
    if(!credentials.realm_id && realm_id){
      credentials.realm_id = realm_id;
    }

    //Internally set the realm id here, if avaialble.
    if(credentials.realm_id){
      this.realm_id = credentials.realm_id;
    }

    verbose(`New access token info:\n${JSON.stringify(credentials,null,2)}`)
    this.emit('token.refreshed', credentials);

  }

  
  /**
   * Refreshes the access token. Internally used to reset the access token.
   * 
   * @returns the access token data payload
   * @emits `token.refreshed` with the data payload
   * @example 
   *  {
   *    token_type: "Bearer"
   *    access_token: string,
   *    expires_in: number, //(number of seconds access token lives),
   *    refresh_token: string,
   *    x_refresh_token_expires_in: number //(number of seconds refresh token lives)
   *  }
   * 
   */
  async refreshAccessToken(){
    try{
      debug('Refreshing Intuit access token.')
      let fetchOpts = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          'Authorization': `Basic ${Buffer.from(this.client_id+':'+this.client_secret).toString('base64')}`,
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(this.refresh_token)}`
      };

      verbose(`Sending: ${fetchOpts.body}`)
      let response = await fetch(TOKEN_ENDPOINT, fetchOpts); 
      if(!response.ok){
        let result = await response.json();
        throw new Error(`...access token refresh unsuccessful. (HTTP-${response.status}): ${JSON.stringify(result)}`);
      }


      let result = await response.json();
      verbose(`Received:\n${JSON.stringify(result)}`);
    
      var info = {
        token_type: result.token_type,
        access_token: result.access_token,
        expires_in: result.expires_in,
        refresh_token : result.refresh_token,
        x_refresh_token_expires_in: result.x_refresh_token_expires_in
      };

      this.setCredentials(info);

      verbose(`New access token info:\n${JSON.stringify(info,null,2)}`)
      this.emit('token.refreshed', info);

      return info;

    }catch(err){
      console.error(`Error refreshing access token. ${err.message}`)
      throw err;
    }

  }

  /**
   * Disconnects the user from Intuit QBO API (invalidates the access token and request token).
   * After calling this method, the user will be forced to authenticate again.
   * Emits the "token.revoked" event, handing back the data passed back from QBO.
   */
  async disconnect(){
    try{

      debug(`Disconnecting from the Intuit API.`)
      let fetchOpts = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
          'Authorization': `Basic ${Buffer.from(this.client_id+':'+this.client_secret).toString('base64')}`,
        },
        body: JSON.stringify({token: this.refresh_token})
      };

      let result = await fetch(REVOCATION_ENDPOINT, fetchOpts); 
      let response = await result.json();

      verbose(`Disconnection result:\n${JSON.stringify(response,null,2)}`)

      this.emit('token.revoked', response);

      return response;

    }catch(err){
      console.error(`Error during Intuit API disconnection process. ${JSON.stringify(err,null,2)}`)
      throw err;
    }
  }
};

exports.QboConnector=QboConnector;

/**
  Returns a fully populated validation URL to be used for initiating an Intuit OAuth request.
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
exports.getIntuitAuthorizationUrl = function(client_id, redirectUri, state){

  var url = `${AUTHORIZATION_ENDPOINT}`
    + `?client_id=${encodeURIComponent(client_id)}`
    + `&scope=${encodeURIComponent('com.intuit.quickbooks.accounting')}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&response_type=code`
    + `&state=${encodeURIComponent(state)}`;

  return url;
}


class ApiError extends Error {};
class ApiAuthError extends Error {};
exports.ApiError = ApiError;