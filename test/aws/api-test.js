require('dotenv').config();

const {QboConnector, ApiError} = require('../../index');
const {AwsStorage} = require('./storage');
let credentialsStorage = new AwsStorage(process.env.AWS_BUCKET, `credentials/intuit/${process.env.NODE_ENV}-credentials.json`);

const connector = new QboConnector({
  client_id: process.env.INTUIT_CLIENT_ID,
  client_secret: process.env.INTUIT_CLIENT_SECRET,
  redirect_uri: process.env.INTUIT_REDIRECT_URI,
  base_url: 'https://sandbox-quickbooks.api.intuit.com/v3', //sandbox!
  credential_initializer: async ()=>{return credentialsStorage.get(); }
});

connector.on("token.refreshed", async (creds)=>{
  try{
    if(!creds||!creds.access_token){
      throw new Error(JSON.stringify(creds));
    }
    console.log(`Storing updated Intuit credentials...\n${JSON.stringify(creds)}`);
    let current = await credentialsStorage.get();
    if(!current) current = {};
    let updated = Object.assign(current, creds);
    await credentialsStorage.set(updated);
    console.log('...success.');
  }catch(ex){
    console.error('Error storing Intuit credentials. '+ ex.message)
    console.error(ex);
  }
});

(async () => {

  try{
    let qbo = await connector.accountingApi();
    let result = null;

    // Perform a query.
    // result = await qbo.Item.query(`SELECT * from Item WHERE Active=true MAXRESULTS 3`);

    // Create an entity.


    // Update an entity.


    // Delete an entity.


    // Run a report.
    // result = await qbo.CustomerIncomeReport.query({start_date: '2019-01-01', end_date: '2020-04-01'});

    // Error handling
    result = await qbo.Item.create({
      "Name": "Body Armor",
      "Type": "Inventory"
      //This will fail because there are many more fields required...
    });

    console.log(`Result:\n${JSON.stringify(result, null, 2)}`);
  }catch(ex){
    if(ex instanceof ApiError){
      console.error("API error.");
      console.error(ex.message);
      console.error(ex.payload);
      console.error(ex.stack);
    } else {
      console.error("Other error.");
      console.error(ex);
    }
    
  }

})()


