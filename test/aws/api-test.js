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
require('dotenv').config();

const {QboConnector, ApiError} = require('../../index');
const {AwsStorage} = require('./storage');
let credentialsStorage = new AwsStorage(process.env.AWS_BUCKET, `credentials/intuit/${process.env.NODE_ENV}-credentials.json`);

const connector = new QboConnector({
  client_id: process.env.INTUIT_CLIENT_ID,
  client_secret: process.env.INTUIT_CLIENT_SECRET,
  redirect_uri: process.env.INTUIT_REDIRECT_URI,
  base_url: 'https://sandbox-quickbooks.api.intuit.com/v3', //sandbox!
  credential_initializer: async ()=>{return credentialsStorage.get(); },
  minor_version: 53
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

    reqopts = {minor_version:51, reqid: "1590720357123857182AE"};

    // Get an entity by id
    // result = await qbo.Item.get(19, {minor_version:51, reqid: "d91kjlad1ASDF"});

    // Perform a query.
    // result = await qbo.Item.query(`SELECT * from Item WHERE Active=true MAXRESULTS 3`, reqopts);

    // Create an entity.
    // result = await qbo.Item.create({
    //   Name: "Body Armor",
    //   Type: "NonInventory",
    //   IncomeAccountRef: {
    //     value: 83,
    //     name: "Other Income"
    //   }
    // });

    // Create a transactional entity
    // result = await qbo.Bill.create({
    //   "Line": [
    //     {
    //       "DetailType": "AccountBasedExpenseLineDetail", 
    //       "Amount": 200.0, 
    //       "Id": "1", 
    //       "AccountBasedExpenseLineDetail": {
    //         "AccountRef": {
    //           "value": "7"
    //         }
    //       }
    //     }
    //   ], 
    //   "VendorRef": {
    //     "value": "42"
    //   }
    // }, reqopts);

    // Update an entity.
    // let existing = await qbo.Item.get(19);
    // existing.Item.Name="Rubber Ducky Armor";
    // result = await qbo.Item.update(existing.Item, reqopts);

    // Delete an entity.
    // result = await qbo.Bill.delete({
    //   "Id": 147,
    //   "SyncToken": 0 
    // }, reqopts);

    // Run a report.
    // result = await qbo.CustomerIncomeReport.query({start_date: '2019-01-01', end_date: '2020-04-01'}, reqopts);

    // Error handling
    // result = await qbo.Item.create({
    //   "Name": "Body Armor",
    //   "Type": "Inventory"
    //   //This will fail because there are other fields required...
    // });

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


