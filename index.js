/*
  Copyright 2019-2020 Apigrate LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
const fetch = require('node-fetch');
const qs = require('query-string');

var debug   = require('debug')('gr8:quickbooks');
var verbose = require('debug')('gr8:quickbooks:verbose');

const EventEmitter = require('events');

const AUTHORIZATION_ENDPOINT = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_ENDPOINT = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const REVOCATION_ENDPOINT = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
const USER_AGENT = 'Apigrate QuickBooks NodeJS Connector/3.x';
const PRODUCTION_API_BASE_URL = 'https://quickbooks.api.intuit.com/v3';
const SANDBOX_API_BASE_URL = 'https://sandbox-quickbooks.api.intuit.com/v3';

exports.PRODUCTION_API_BASE_URL = PRODUCTION_API_BASE_URL;
exports.SANDBOX_API_BASE_URL = SANDBOX_API_BASE_URL;

/**
 * NodeJS QuickBooks connector class. 
 * 
 * @version 3.1.x
 */
class QboConnector extends EventEmitter{
  /**
   * @param {object} config 
   * @param {string} config.client_id (required) the Intuit-generated client id for your app 
   * @param {string} config.client_secret (required) the Intuit-generate client secret for your app
   * @param {string} config.redirect_uri (required) a valid OAuth2 redirect URI for your app 
   * @param {string} config.access_token access token obtained via the OAuth2 process
   * @param {string} config.refresh_token  refresh token obtained via the Oauth2 process, used to obtain access tokens automatically when they expire
   * @param {string} config.realm_id company identifer for the QuickBooks instance
   * @param {string} config.base_url defaults to 'https://quickbooks.api.intuit.com/v3' if not provided. If you are testing with a sandbox 
   * environment, consult the documentation for the base url to use (e.g. 'https://sandbox-quickbooks.api.intuit.com/v3')
   * @param {number} config.minor_version optional minor version to use on API calls to the QuickBooks API. This will become the default minor version applied to all
   * API calls. You can override the minor_version on specific calls, by providing it as an options argument on the API call. 
   * See https://developer.intuit.com/app/developer/qbo/docs/develop/explore-the-quickbooks-online-api/minor-versions to learn more about minor versions.
   * @param {function} config.credential_initializer optional (but recommended) function returning an object with the initial credentials to be used, of the form
   * `{ access_token, refresh_token, realm_id}`. This function is invoked on the first API method invocation automatically. If you omit this function, you'll need
   * to call the setCredentials method prior to your first API method invocation. 
   */
  constructor(config){
    super();
    
    if(!config.client_id || !config.client_secret || !config.redirect_uri){
      throw new CredentialsError(`Invalid configuration. The "client_id", "client_secret", and "redirect_uri" properties are all required.`);
    }
    this.client_id=config.client_id;
    this.client_secret=config.client_secret;
    this.redirect_uri=config.redirect_uri;

    this.access_token=config.access_token || null;
    this.refresh_token=config.refresh_token || null;
    this.realm_id=config.realm_id || null;

    this.minor_version = config.minor_version || null;
    this.credential_initializer = config.credential_initializer || null;
    this.base_url = config.base_url || PRODUCTION_API_BASE_URL;

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
      //supporting entities
      { handle: 'Attachable',         name: 'Attachable',       fragment: 'attachable',        query: true,  create:true,  read: true,  update: true,  delete: true },
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
   * @param {string} creds.realm_id the Intuit realm (company id)
   * @param {string} creds.refresh_token the Intuit refresh token 
   */
  setCredentials(creds){
    if(!creds) throw new CredentialsError("No credentials provided.");
    if(creds.access_token){
      if(this.access_token && this.access_token !== creds.access_token){
        //Informational. Intuit sent a replacement access token that is different than the one currently stored.
        debug(`A replacement access_token was detected:\n${creds.access_token}`);
      }
      this.access_token = creds.access_token;
    }
    if(creds.refresh_token){
      if(this.refresh_token && this.refresh_token !== creds.refresh_token){
        //Informational. Intuit sent a replacement refresh token that is different than the one currently stored.
        debug(`A replacement refresh_token was detected:\n${creds.refresh_token}`);
      }
      this.refresh_token = creds.refresh_token;
    }
    if(creds.realm_id){
      if(this.realm_id && this.realm_id !== creds.realm_id){
        //Informational. Intuit sent a replacement realm that is different than the one currently stored.
        debug(`A replacement realm_id was detected:\n${creds.realm_id}`);
      }
      this.realm_id = creds.realm_id;
    }
    // verbose(`${this.access_token}\n${this.refresh_token}\n${this.realm_id}`)
  }

  /**
   * Get the object through which you can interact with the QuickBooks Online Accounting API.
   */
  accountingApi(){

    var self = this;
    self.registry.forEach( function(e){
      var options = {name: e.name, fragment: e.fragment };
      if(e.create){
        options.create = function(payload, opts){
          var qs = {};
          if(opts && opts.reqid){
            qs.requestid=opts.reqid ;
          }
          if(opts && opts.minor_version){
            qs.minorversion = opts.minor_version;
          } else if(self.minor_version){
            qs.minorversion = self.minor_version;
          }
          return self._post.call(self, e.name, `/${e.fragment}`, qs, payload);
        }
      }

      if(e.update){
        options.update = function(payload, opts){
          var qs = {operation: 'update'};
          if(opts && opts.reqid){
            qs.requestid=opts.reqid ;
          }
          if(opts && opts.minor_version){
            qs.minorversion = opts.minor_version;
          } else if(self.minor_version){
            qs.minorversion = self.minor_version;
          }
          return self._post.call(self, e.name, `/${e.fragment}`, qs, payload);
        }
      }

      if(e.read){
        options.get = function(id, opts){
          var qs = null;
          if(opts && opts.reqid){
            if(!qs) qs = {};
            qs.requestid=opts.reqid ;
          }
          if(opts && opts.minor_version){
            if(!qs) qs = {};
            qs.minorversion = opts.minor_version;
          } else if(self.minor_version){
            if(!qs) qs = {};
            qs.minorversion = self.minor_version;
          }
          return self._get.call(self, e.name, `/${e.fragment}/${id}`, qs);
        }
      }

      if(e['delete']){
        options.delete = function(payload, opts){
          var qs = {operation: 'delete'};
          if(opts && opts.reqid){
            qs.requestid=opts.reqid ;
          }
          if(opts && opts.minor_version){
            qs.minorversion = opts.minor_version;
          } else if(self.minor_version){
            qs.minorversion = self.minor_version;
          }
          return self._post.call(self, e.name, `/${e.fragment}`, qs, payload);
        }
      }

      if(e.query){
        options.query = function(queryStatement, opts){
          if(!queryStatement){
            queryStatement = `select * from ${e.name}`;
          }
          var qs = {
            query: queryStatement
          };
          if(opts && opts.reqid){
            qs.requestid=opts.reqid ;
          }
          if(opts && opts.minor_version){
            qs.minorversion = opts.minor_version;
          } else if(self.minor_version){
            if(!qs) qs = {};
            qs.minorversion = self.minor_version;
          }
          
          return self._get.call(self, e.name, `/query`, qs);
        }
      }

      if(e.report){
        options.query = function(parms, opts){
          
          var qs = parms || {};
          if(opts && opts.reqid){
            qs.requestid=opts.reqid ;
          }
          if(opts && opts.minor_version){
            qs.minorversion = opts.minor_version;
          } else if(self.minor_version){
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
    return this.doFetch(
      "GET", 
      `${uri}`, 
      qs, 
      null, 
      {entityName}
    );
  }


  async _post(entityName, uri, qs, body){
    return this.doFetch(
      "POST", 
      `${uri}`, 
      qs, 
      body, 
      {entityName}
    );
  }


  async _batch(body){
    return this.doFetch(
      "POST", 
      `/batch`, 
      null, 
      body
    );
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
      if(!this.refresh_token) verbose(`Missing refresh_token.`);
      if(!this.access_token) verbose(`Missing access_token.`);
      if(!this.realm_id) verbose(`Missing realm_id.`);
      if(this.credential_initializer){
        verbose(`Obtaining credentials from initializer...`);
        let creds = await this.credential_initializer.call();
        if(creds){
          this.setCredentials(creds);
        }
        if(!this.refresh_token || !this.access_token || !this.realm_id){
          throw new CredentialsError("Missing credentials after initializer.")
        }
      } else {
        throw new CredentialsError("Missing credentials. Please provide them explicitly, or use an initializer function.");
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
          if(response.status === 401 ){
            //These will be retried once after attempting to refresh the access token.
            throw new ApiAuthError(JSON.stringify(result));
          } else if (response.status === 429 ){
            //API Throttling Error
            throw new ApiThrottlingError("API request limit reached.", result);
          }
          //client errors
          let explain = '';
          if(result && result.Fault ){
            result.Fault.Error.forEach( function(x){
              //This function just logs output (or returns the result if "not found")
              switch(x.code){
                case "500":
                  explain += `\nError code ${x.code}. ${x.Detail}. Recommendation: possible misconfiguration the entity name is not recognized.`;
                  break;
                case "2010":
                  explain += `\nError code ${x.code}. ${x.Detail}. Recommendation: possible misconfiguration the entity name is not recognized.`;
                  break;
                case "4000":
                  explain += `\nError code ${x.code}. ${x.Detail}. Recommendation: check your query, including punctuation etc. For example, you might be using double quotes instead of single quotes.`;
                  break;
                case "4001":
                  explain += `\nError code ${x.code}. ${x.Detail}. Recommendation: check your entity and attribute names to make sure the match QuickBooks API specifications.`;
                  break;
                default:
                  explain += `\nError code ${x.code}. ${x.Detail}.`;
              }
            });
          }
          if(!explain) explain = JSON.stringify(result);
          throw new ApiError(`Client Error (HTTP ${response.status}) ${explain}`, result);
          
        } else if (response.status >=500) {
          //server side errors
          verbose(`  server error. response payload: ${JSON.stringify(result)}`);
          throw new ApiError(`Server Error (HTTP ${response.status})`, result);
        }
        return result;
      }
      return result;

    }catch(err){
      if(err instanceof ApiAuthError){
        if(options.retries < 1){
          debug(`Attempting to refresh access token...`);
          //Refresh the access token.
          await this.getAccessToken();
          
          options.retries+=1;
          debug(`...refreshed OK.`);
          //Retry the request
          debug(`Retrying (${options.retries}) request...`);
          let retryResult = await this.doFetch(method, url, query, payload, options);
          return retryResult;
        } else {
          debug(`No further retry (already retried ${options.retries} times).`);
          throw err;
        }

      }
      //All other errors are re-thrown.
      throw err;
    }
  }

  /**
   * Calls the Intuit OAuth2 token endpoint for either an authorization_code grant (if the code is provided) or a
   * refresh_token grant. In either case the internal credentials are refreshed, and the "token.refreshed" event is
   * omitted with the credentials returned so they can be stored securely for subsequent use.
   * 
   * @param {string} code (optional) authorization code obtained from the user consent part of the OAuth2 flow.
   * If provided, the method assumes an authorization_code grant type is being requested; otherwise the refresh_token
   * grant type is assumed. 
   * @param {string} realm_id (conditional) required when the code is provided. Identifies the quickbooks company. Internally sets the realm_id on the connector.
   * @returns the access token data payload
   * @throws CredentialsError on invalid grants.
   * @emits `token.refreshed` with the data payload
   * @example 
   *  {
   *    token_type: "Bearer"
   *    realm_id: string,
   *    access_token: string,
   *    expires_in: number, //(number of seconds access token lives),
   *    refresh_token: string,
   *    x_refresh_token_expires_in: number //(number of seconds refresh token lives)
   *  }
   */
  async getAccessToken(code, realm_id){
    let fetchOpts = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
        'Authorization': `Basic ${Buffer.from( this.client_id+':'+this.client_secret ).toString('base64')}`,
      } 
    };
    verbose(`Headers: ${JSON.stringify(fetchOpts.headers, null, 2)}`);
    let grant_type = 'refresh_token';
    if(code){
      grant_type = 'authorization_code';
      debug(`Exchanging authorization code for an Intuit access token...`);
      fetchOpts.body = `code=${encodeURIComponent(code)}&grant_type=${grant_type}&redirect_uri=${encodeURIComponent(this.redirect_uri)}`;
    } else {
      debug('Refreshing Intuit access token...');
      fetchOpts.body = `grant_type=${grant_type}&refresh_token=${encodeURIComponent(this.refresh_token)}`;
    }

    verbose(`Sending: ${fetchOpts.body}`);
    let response = await fetch(TOKEN_ENDPOINT, fetchOpts); 
    if(!response.ok){
      debug('...unsuccessful.')
      let result = await response.json();
      throw new CredentialsError(`Unsuccessful ${grant_type} grant. (HTTP-${response.status}): ${JSON.stringify(result)}`);
    }

    let result = await response.json();
    verbose(`Received:\n${JSON.stringify(result)}`);
  
    let credentials = {};
    Object.assign(credentials, result);

    if(realm_id){
      // if realm_id is explicitly provided, initialize with existing realm id - usually realm id is not available on a refresh
      credentials.realm_id=realm_id; 
    } else if (this.realm_id){
      // otherwise use internal realm id if available
      credentials.realm_id = this.realm_id;
    }

    if(result.realmId){//Note spelling! Intuit calls it realmId not realm_id.
      //If realmId is ever returned explicitly, use it.
      credentials.realm_id=result.realmId;
    }

    // Reset the internal credentials (this detects changes)
    this.setCredentials(credentials);
    
    //After the internal credentials are refreshed, emit the event.
    this.emit('token.refreshed', credentials);

    return credentials;
  }


  /**
   * Disconnects the user from Intuit QBO API (invalidates the access token and request token).
   * After calling this method, the user will be forced to authenticate again.
   * Emits the "token.revoked" event, handing back the data passed back from QBO.
   */
  async disconnect(){
    try{

      debug(`Disconnecting from the Intuit API.`)
      if(this.credential_initializer){
        //Get latest credentials before disconnecting.
        let creds = await this.credential_initializer.call();
        verbose(`Obtained credentials from initializer:${JSON.stringify(creds)}.`);
        if(creds){
          this.setCredentials(creds);
        }
      }
      if(this.refresh_token){  
        let payload = {token: this.refresh_token}
        verbose(`Disconnection payload:\n${JSON.stringify(payload)}`);
        let fetchOpts = {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(this.client_id+':'+this.client_secret).toString('base64')}`,
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
          },
          body: JSON.stringify(payload)
        };

        let response = await fetch(REVOCATION_ENDPOINT, fetchOpts);
        let result = await response.text()
        if(response.ok){
          this.emit('token.revoked', result);
        } else {
          console.warn(`Intuit responded with HTTP-${response.status} ${result}` )
        }
        return result;
      } else {
        debug("No token found to revoke.");
      }

    }catch(err){
      console.error(err);
      console.error(`Error during Intuit API disconnection process. ${JSON.stringify(err,null,2)}`)
      throw err;
    }
  }
};

exports.QboConnector=QboConnector;

/**
  Returns a fully populated validation URL to be used for initiating an Intuit OAuth request.
  @param {string} client_id Identifies which app is making the request
  @param {string} redirect_uri Determines where the response is sent. The value
    of this parameter must exactly match one of the values listed for this app in the app settings.
  @param {string} state Provides any state that might be useful to your application upon receipt
    of the response. The Intuit Authorization Server roundtrips this parameter, so your application
    receives the same value it sent. Including a CSRF token in the state is recommended.
  @return the authorization URL string with all parameters set and encoded.
  Note, when the redirectUri is invoked, it will contain the following query parameters:
  1. `code` (what you exchange for a token)
  2. `realmId` - this identifies the QBO company and should be used (note spelling)
*/
exports.getIntuitAuthorizationUrl = function(client_id, redirect_uri, state){

  var url = `${AUTHORIZATION_ENDPOINT}`
    + `?client_id=${encodeURIComponent(client_id)}`
    + `&scope=${encodeURIComponent('com.intuit.quickbooks.accounting')}`
    + `&redirect_uri=${encodeURIComponent(redirect_uri)}`
    + `&response_type=code`
    + `&state=${encodeURIComponent(state)}`;

  return url;
}

/** An API error from the connector, typically including a captured `payload` object you can work with to obtain more information about the error and how to handle it. */
class ApiError extends Error {
  constructor(msg, payload){
    super(msg);
    this.payload = payload;//Stores the Intuit response.
  }
};
/** Specific type of API error indicating the API request limit has been reached. */
class ApiThrottlingError extends ApiError {
  constructor(msg, payload){
    super(msg, payload);
  }
}
class ApiAuthError extends Error {};//only used internally.
class CredentialsError extends Error{};//For missing/incomplete/invalid OAuth credentials.
exports.ApiError = ApiError;
exports.ApiThrottlingError = ApiThrottlingError;
exports.CredentialsError = CredentialsError;