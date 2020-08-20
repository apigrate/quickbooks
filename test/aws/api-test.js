require('dotenv').config();

const {getIntuitAuthorizationUrl, QboConnector} = require('../../index');
const {AwsStorage} = require('./storage');
let credentialsStorage = new AwsStorage(process.env.AWS_BUCKET, `credentials/intuit/${process.env.NODE_ENV}-credentials.json`);

const qbo = new QboConnector({
  client_id: process.env.INTUIT_CLIENT_ID,
  client_secret: process.env.INTUIT_CLIENT_SECRET,
  base_url: 'https://sandbox-quickbooks.api.intuit.com/v3', //sandbox!
  credential_initializer: async ()=>{return credentialsStorage.get(); }
});

qbo.on("token.refreshed", async (creds)=>{
  try{
    if(!creds||!creds.access_token){
      throw new Error(JSON.stringify(creds));
    }
    console.log(`Storing updated Intuit credentials...\n${JSON.stringify(creds)}`);
    let current = await credentialsStorage.get();
    if(!current) current = {};
    let updated = Object.assign(current, creds);
    await credentialsStorage.set(updated);
    onsole.log('...success.');
  }catch(ex){
    console.error('Error storing Intuit credentials. '+ ex.message)
    console.error(ex);
  }
});

(async () => {

  try{
    let qboApi = await qbo.acccountingApi();
    let result = null;

    result = await qboApi.Item.query(`SELECT * from Item WHERE Active=true`);

    // result = await qboApi.TransactionListReport.query({start_date: '2019-01-01', end_date: '2020-04-01'});

    console.log(`Result:\n${JSON.stringify(result, null, 2)}`);
  }catch(ex){
    console.error(ex);
  }

})()

