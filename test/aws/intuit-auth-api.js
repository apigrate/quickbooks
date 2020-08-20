/**
 * A set of AWS API Gateway endpoints that wrap the Intuit QuickBooks Online OAuth API.
 * 
 * Authorization data is stored securely in Amazon S3.
 */
const debug = require('debug')('gr8:quickbooks:aws');

const {getIntuitAuthorizationUrl, QboConnector} = require('../../index');

const {AwsStorage} = require('./storage');
let stateStorage = new AwsStorage(process.env.AWS_BUCKET, `credentials/intuit/${process.env.NODE_ENV}-state.json`);
let credentialsStorage = new AwsStorage(process.env.AWS_BUCKET, `credentials/intuit/${process.env.NODE_ENV}-credentials.json`);

const { v4: uuidv4 } = require('uuid');

const qbo = new QboConnector({
  client_id: process.env.INTUIT_CLIENT_ID,
  client_secret: process.env.INTUIT_CLIENT_SECRET,
  credential_initializer: async ()=>{return credentialsStorage.get(); }
});
qbo.on("token.refreshed", async (creds)=>{
  try{
    if(!creds||!creds.access_token){
      throw new Error(JSON.stringify(creds));
    }
    debug(`Storing updated Intuit credentials...\n${JSON.stringify(creds)}`);
    let current = await credentialsStorage.get();
    if(!current) current = {};
    let updated = Object.assign(current, creds);
    await credentialsStorage.set(updated);
    debug('...success.');
  }catch(ex){
    console.error('Error storing Intuit credentials. '+ ex.message)
    console.error(ex);
  }
});


/**
 * API Gateway endpoint that redirects the end-user to the Intuit authorization page, beginning the OAuth process.
 */
exports.intuitConnect = async (event, context) => {
  
  let stateObj = {state: uuidv4()};
  await stateStorage.set(stateObj);//store to verify elsewhere

  // Redirect to the authorization URL.
  return {
      statusCode: 302,
      headers: { "Location" : getIntuitAuthorizationUrl(process.env.INTUIT_CLIENT_ID, process.env.INTUIT_REDIRECT_URI, stateObj.state) },
  };

};

/**
 * API that receives the INTUIT OAuth callback, exchanges the authorization code for 
 * access credentials, stores the access credentials on S3, and displays HTML to the end-user
 * indicating success or failure.
 * 
 * It Receives a url like this:
 * @example
 * https://localhost:3000/trade/connected?code=j31nfYosMqsBZuYPXF3p7zIaHjjtgKz6BCmih19RzKrCxfkRIvoOhqsiOOIcgPnXg3X7JWiA2i7oMziNfMYKgYp%2BRZJsE1fcyhOJuvtwchV23jMIY7BhJ2T5x8Q0Sds2myn%2FP2Ia76MFrVz4ZaGE5Ym56k7Fy2wOaxMoa5t7%2FlMC9Hv7uDBpcHxO2p9iGd2Cf4OseJjFqEsR3bRNulkpQwz5F92JnoEsz3tRhQaGs9ZKCOlQ2o2oIU8ReInFPaVteN8aGMYa7dwcwrWSJBmWrI8ZfTr3hpaHXQuKGNl8D9FGhua0Qsh9V2DIx8lJJK2wh9kwaUZtEk%2BiOHv6qwzwkjDOQ%2F9BJ%2BNbnC%2FJIiDPQfECPbe3cUt9GZwPCYD1tB8OrN8gN6o3zbVFwUqYhGVRYNUwdm3QJ3fUOKNsyGWIGFueApNRH5YVg7DLjn8100MQuG4LYrgoVi%2FJHHvluyOa%2Bm%2BAdaB9G5%2B5vbR0cm4IrhHE0ZpOEMyoqrKbT%2BhMnVbYSktF8%2B%2BpiFk1MlEysIlcNdh261MblSVduv%2Bu%2FPEOHwbBEthct8do44YYPA%2FdlQYvG%2F7yTy%2FKIHDG0e1xV%2FAcoXXF36KAgM2My7mkrdBQkgD86U%2FjkQ%2BEeLaMQtLn4bKgm0kMWwKg0fm1i5bffHImWxIwo73RFTFkPip7F1jw%2FoLS6Ts6uWoJ57WY7xBFyBXqlwR2Vt7cSZ1inKVsH%2FCffGBgvN2Cam%2FQ%2FdyYLkJbNPSxQk9kw2feuZczpCKFPup4xr%2Fkz79yDdqTqr79fhdmf%2BCI5V6uOn8Be9dJKWvJUs3yzPkvDw7jmq0XCrz4c%2FwZ5ojqbfY2gFpiLorX1Fj5mSSgoRs4L%2FB5BMCW0B%2FCP%2Fnin2nCOaEuiOU7FKpAtjJ5I4kdfAYhZpA%3D212FD3x19z9sWBHDJACbC00B75E
 * ... which contains a code
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
exports.intuitCallback = async (event, context, callback) => {

  if(!event.queryStringParameters || !event.queryStringParameters.code){
    callback(null, {
      statusCode: 200,
      headers: { "Content-Type" : "text/html" },
      body: `<html><body><h3>Invalid usage.</h3></body></html>`
    });
  }
  //TODO: validate state parameter here...

  debug(`Exchanging code for access token...\ncode: ${event.queryStringParameters.code}\nrealmId:${event.queryStringParameters.realmId}`);

  qbo.realm_id = event.queryStringParameters.realmId;//Must be saved here.
  
  try{
    let result = await qbo.exchangeCodeForAccessToken( event.queryStringParameters.code, process.env.INTUIT_REDIRECT_URI, event.queryStringParameters.realmId );//fires the "token" event to store the credentials

    debug('...access token info:\n'+ JSON.stringify(result));

    callback(null, {
      statusCode: 200,
      headers: { "Content-Type" : "text/html" },
      body: `<html><body><h3>You have successfully authorized to the Intuit Quickbooks Online API.</h3></body></html>`
    });

  }catch(ex){
    console.error(ex);
    callback(null, {
      statusCode: 200,
      headers: { "Content-Type" : "text/html" },
      body: `<html><body><h3>Authorization to the Intuit Quickbooks Online API failed.</h3><p>Reason: <code>${ex.message}</code></p></body></html>`
    });
  }
  

};

/**
 * Programatic endpoint that refreshes the stored INTUIT API credentials. Returns
 * a JSON result indicating 
 * 
 * @returns
 * - HTTP 200 if refreshed OK. The credentials are saved on S3 and are returned
 * directlyu in the response.
 * 
 * - HTTP 500 if refresh failed. Note, the most likely cause of failures
 * is the expiration of the refresh token.
 * The refresh token is valid for 90 days. Per Intuit QuickBooks Online, the end user
 * MUST re-authenticate at that time manually.
 * 
 * @see https://developer.quickbooks.com/content/authentication-faq
 */
exports.intuitRefreshCredentials = async (event, context, callback) => {
  debug(`Refreshing access token...`);

  try{

    let creds = await credentialsStorage.get();
    debug(`...retrieved credentials successfully.`);

    let refreshInfo = await qbo.refreshAccessToken(creds.refresh_token);//fires the "token" event to store the credentials
    debug(`...refreshed and stored credentials successfully.`);

    creds.access_token = refreshInfo.access_token;
    creds.scope = refreshInfo.scope;
    creds.expires_in = refreshInfo.expires_in;

    callback(null, {
      statusCode: 200,
      headers: { "Content-Type" : "application/json" },
      body: JSON.stringify(creds)
    });

  }catch(ex){
    console.error(ex);
    let errResult = {
      message: "Unable to refresh access token.",
      error: ex.message
    };
    callback(null, {
      statusCode: 500,
      headers: { "Content-Type" : "application/json" },
      body: JSON.stringify(errResult)
    });
  }
};