# @apigrate/quickbooks

> Latest Documentation for Version 3.x

A transparent **one-stop** library for interacting with the QuickBooks Online API. It supports all the features you need to interact with the QuickBooks Online Accounting API, including:
1. automatic OAuth2 token refresh (including an event handler)
3. support for native promises
4. unopinionated error handling
5. convenience method for constructor OAuth URLs
6. and most importantly, **complete coverage of the QuickBooks Online Accounting API**.


## Supported Entities

***Supported Transactional Entities:***
| Entity | query | create | get by id | update | delete |
|---|:---:|:---:|:---:|:---:|:---:|
| Bill |  &check; | &check; | &check; | &check; | &check; |
| BillPayment |  &check; | &check; | &check; | &check; | &check; |
| CreditMemo | &check; | &check; | &check; | &check; | &check; |
| Deposit |  &check; | &check; | &check; | &check; | &check; |
| Estimate |  &check; | &check; | &check; | &check; | &check; |
| Invoice |  &check; | &check; | &check; | &check; | &check; |
| JournalEntry |  &check; | &check; | &check; | &check; | &check; |
| Payment |  &check; | &check; | &check; | &check; | &check; |
| Purchase |  &check; | &check; | &check; | &check; | &check; |
| Purchaseorder  | &check; | &check; | &check; | &check; | &check; |
| RefundReceipt  | &check; | &check; | &check; | &check; | &check; |
| SalesReceipt  | &check; | &check; | &check; | &check; | &check; |
| TimeActivity  | &check; | &check; | &check; | &check; | &check; |
| Transfer  | &check; | &check; | &check; | &check; | &check; |
| VendorCredit  | &check; | &check; | &check; | &check; | &check; |


***Named List Entities:***
| Entity | reference | query | create | get by id | update | delete |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Account | accounts | &check; | &check; | &check; | &check; | &nbsp; |
| Budget | budgets | &check; |  &nbsp; | &check; |  &nbsp; | &nbsp; |
| Class | classes | &check; | &check; | &check; | &check; | &nbsp; |
| CompanyCurrency | companycurrencies | &check; | &check; | &check; | &check; | &nbsp; |
| Customer | customers | &check; | &check; | &check; | &check; | &nbsp; |
| Department | departments | &check; | &check; | &check; | &check; | &nbsp; |
| Employee | employees | &check; | &check; | &check; | &check; | &nbsp; |
| Item | items | &check; | &check; | &check; | &check; | &nbsp; |
| Journalcode | journalcodes | &check; | &check; | &check; | &check; | &nbsp; |
| PaymentMethod | paymentmethods | &check; | &check; | &check; | &check; | &nbsp; |
| TaxAgency | taxagencies | &check; | &check; | &check; | &nbsp; | &nbsp; |
| TaxCode | taxcodes | &check; | &check; | &check; | &nbsp; | &nbsp; |
| TaxRate | taxrates | &check; | &check; | &check; | &nbsp; | &nbsp; |
| TaxService | taxservices | &check; | &check; | &nbsp; | &nbsp; | &nbsp; |
| Term | terms | &check; | &check; | &check; | &check; | &nbsp; |
| Vendor | vendors | &check; | &check; | &check; | &check; | &nbsp; |

***Supporting Entities:***
| Entity | reference | query | create | get by id | update | delete |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Attachable | attachables | &check; | &check; | &check; | &check; | &check; |
| CompanyInfo | companyinfo | &check; | &nbsp; | &check; | &check; | &nbsp; |
| Preferences | preferences | &check; | &nbsp; | &check; | &check; | &nbsp; |

***Reports:***
| Report 
|---|
| AccountListDetailReport
| APAgingDetailReport    
| APAgingSummaryReport   
| ARAgingDetailReport    
| ARAgingSummaryReport   
| BalanceSheetReport     
| CashFlowReport         
| CustomerBalanceReport  
| CustomerBalanceDetailReport
| CustomerIncomeReport   
| GeneralLedgerReport    
| GeneralLedgerReportFR  
| InventoryValuationSummaryReport
| JournalReport          
| ProfitAndLossReport    
| ProfitAndLossDetailReport
| SalesByClassSummaryReport
| SalesByCustomerReport  
| SalesByDepartmentReport
| SalesByProductReport   
| TaxSummaryReport       
| TransactionListReport  
| TrialBalanceReportFR   
| TrialBalanceReport
| VendorBalanceReport
| VendorBalanceDetailReport
| VendorExpensesReport

## Usage

```javascript
let {QboConnector} = require('@apigrate/quickbooks');

let connector = new QboConnector(
  client_id,        
  client_secret,    
  redirect_uri,
  access_token,     
  refresh_token,    
  realm_id,         
  minorversion
);

//Get the accounting API object.
let qbo = await connector.accountingApi();  

//Now you can make API calls!
```
#### Constructor options: 
* **client_id** (*string*, required) Intuit assigned client id for your app.
* **client_secret** (*string*, required) Intuit assigned client secret for your app.
* **redirect_uri** (*string*, required) A valid, registered redirect URI for your app. Note, for production, this must be an SSL link (HTTPS).
* **access_token** (*string*, conditional) Bearer token for use in API call Authorization header. You should obtain this from your own storage.
* **refresh_token** (*string*, conditional)  Token to refresh access_token when it expires. You should obtain thie from your own storage.
* **realm_id** *number* (*string*, conditional) Intuit company identifier, used in API call URLs. You should obtain thie from your own storage.
* **credential_initializer** (*function*, conditional) An asyncronous function that initializes the `access_token`, `refresh_token`, and `realm_id`; it is designed to bbe used in lieu of providing them as constructor arguments. The function you implement must return a credentials object of the form: `{ access_token, refresh_token, realm_id}`. This function is invoked on the first API method invocation automatically. If you omit this function, you'll need to call the `setCredentials` method with an object of the same structure prior to your first API method invocation. 
* **minorversion** (*number*, optional)  specifying the QuickBooks API minor version parameter to be passed through on each API call
* **baseUrl** (*string*, conditional) The Intuit base URL for API calls. When not provided, it defaults to the Intuit production base URL for the API: `https://quickbooks.api.intuit.com/v3`. However for QuickBooks sandbox use, **you must provide it explicitly**: `https://sandbox-quickbooks.api.intuit.com/v3`

The connector will automatically use any provided credentials to renew the access_token when it expires. The connector emits a `token.refreshed` event internally when it does this. Implement your own listener function to store credentials.
```javascript

//Event hook to handle a token refresh.
connector.on('token.refreshed', function(credentials){
  console.log('Token was refreshed.');
  
  //Use this function to store/update your OAuth data

  //The credentials object may have the following properties:
  credentials.access_token; //Bearer token for API calls.
  credentials.expires_in; //how long before access token expires, in s
  credentials.refresh_token; //for getting another access token
  credentials.x_refresh_token_expires_in; //how long before refresh_token expires, in s
  credentials.realm_id; //the qbo company id
  
});

```
### Making API Calls
You make QuickBooks Accounting API calls by using the object returned from the `connector.accountingApi()` method (referred hereafter in examples as `qbo`). This entity wraps the [QuickBooks Online Accounting API](https://developer.intuit.com/docs/api/accounting).

### Query
Query any kind of object using the Intuit query syntax. 
```javascript
let result = await qbo.Item.query(
  `select * from Item where Active=true and Type='Inventory'`
  );
```
`result`:
```json
{
  "QueryResponse": {
    "Item": [
      {
        "Name": "Pump",
        "Description": "Fountain Pump",
        "Active": true,
        "FullyQualifiedName": "Pump",
        "Taxable": true,
        "UnitPrice": 15,
        "Type": "Inventory",
        "IncomeAccountRef": {
          "value": "79",
          "name": "Sales of Product Income"
        },
        "PurchaseDesc": "Fountain Pump",
        "PurchaseCost": 10,
        "ExpenseAccountRef": {
          "value": "80",
          "name": "Cost of Goods Sold"
        },
        "AssetAccountRef": {
          "value": "81",
          "name": "Inventory Asset"
        },
        "TrackQtyOnHand": true,
        "QtyOnHand": 25,
        "InvStartDate": "2018-03-29",
        "domain": "QBO",
        "sparse": false,
        "Id": "11",
        "SyncToken": "3",
        "MetaData": {
          "CreateTime": "2018-03-26T10:46:45-07:00",
          "LastUpdatedTime": "2018-03-29T13:16:17-07:00"
        }
      }
    ]
  }
}
```

> Note that while the Intuit query API endpoint is generic across all entities, the connector will provide some additional safeguard validation if you use the query method on the appropriate entity endpoint. For example, we recommend using `qbo.Items.query` instead of `qbo.query` for clarity in your code.


### Get By ID
All you need is an entity ID and you can retrieve the full entity details.
```javascript
let result = await qbo.Item.get(11);
```
`result`:
```json
{
  "Item": {
    "Name": "Widget",
    "Active": true,
    "FullyQualifiedName": "Widget",
    "Taxable": false,
    "UnitPrice": 0,
    "Type": "Service",
    "IncomeAccountRef": {
      "value": "79",
      "name": "Sales of Product Income"
    },
    "PurchaseCost": 0,
    "TrackQtyOnHand": false,
    "domain": "QBO",
    "sparse": false,
    "Id": "21",
    "SyncToken": "0",
    "MetaData": {
      "CreateTime": "2018-11-13T14:41:34-08:00",
      "LastUpdatedTime": "2018-11-13T14:41:34-08:00"
    }
  },
  "time": "2018-11-13T15:08:40.458-08:00"
}
```

### Create and Update
There are `.create()` and `.update()` methods for entities that support them. Sparse updates are supported where applicable, but keep in mind that for most QuickBooks entities, you'll need to send in the full list of writeable fields on update.

The returned data is the same for both `.create()` and `.update()`.
```javascript
let result = await qbo.Item.create({
  "Name": 'Widget',
  "Type": 'Inventory',
  "IncomeAccountRef": {
      "value": "79",
      "name": "Sales of Product Income"
  }
});
```
`result`:
```json
{
  "Item": {
    "Name": "Widget",
    "Active": true,
    "FullyQualifiedName": "Widget",
    "Taxable": false,
    "UnitPrice": 0,
    "Type": "Service",
    "IncomeAccountRef": {
      "value": "79",
      "name": "Sales of Product Income"
    },
    "PurchaseCost": 0,
    "TrackQtyOnHand": false,
    "domain": "QBO",
    "sparse": false,
    "Id": "21",
    "SyncToken": "0",
    "MetaData": {
      "CreateTime": "2018-11-13T14:41:34-08:00",
      "LastUpdatedTime": "2018-11-13T14:41:34-08:00"
    }
  },
  "time": "2018-11-13T14:41:34.885-08:00"
}
```

### Delete
Most transactional entities support deletion, but only a few named-list entities do.

```javascript
let result = qbo.Invoice.delete({
  "Id": 153,
  "SyncToken": 0 //this is also required
});
```
`result`:
```json
{
  "Invoice": {
    "domain": "QBO",
    "status": "Deleted",
    "Id": "153"
  },
  "time": "2018-11-13T15:18:40.109-08:00"
}
```

> For entites not supporting a "hard delete", usually there's a way to "soft-delete" them by setting `Active=false` using the `update()` method, or something similar.

### Batch Requests
Batch requests (submitting multiple operations with one request) ARE supported! Here is a code example. This deletes multiple time activities, but you can mix your own types of transactions. They do not need to be the same type of entity or operation.

```javascript
try{
  let activities = [
    {Id: 123489, SyncToken: 0},
    {Id: 178275, SyncToken: 0},
    {Id: 189085, SyncToken: 0},
    ///...
    {Id: 190239, SyncToken: 0},
  ];//Only Id and SyncToken are needed on each for delete


  let batch = {
    BatchItemRequest: []
  }

  for(let i=0; i<activities.length; i++){
    let activityToDelete = activities[i];

    batch.BatchItemRequest.push({
      bId: i,
      operation: "delete",
      TimeActivity: {
        Id: activityToDelete.Id,
        SyncToken: activityToDelete.SyncToken
      }
    });
  }

  //Invoke Batch API
  await qbo.batch(batch);

} catch (err) {
  //...
}
```
Note that since you can mix the type of entity on batch requests, this method is not namespaced on entities (it is available directly on the `qbo` object).

### Error Handling

API-specific errors (typically HTTP-4xx) responses, are trapped and thrown with the `ApiError` class. Here's an example:

```javascript
const {ApiError} = require('@apigrate/quickbooks');
try{
  let result = qbo.Item.create({
    "Name": "Body Armor",
    "Type": "Inventory"
    //This will fail because there are many more fields required...
  });

} catch (err){
  if(err instanceof ApiError){
    err.message; //containsa parsed error message,
    err.payload; //contains error payload, if one was returned
  }

}
```
`err.payload` example:
```json
{
  "Fault": {
    "Error": [
      {
        "Message": "Object Not Found",
        "Detail": "Object Not Found : Something you're trying to use has been made inactive. Check the fields with accounts, customers, items, vendors or employees.",
        "code": "610",
        "element": ""
      }
    ],
    "type": "ValidationFault"
  },
  "time": "2018-11-13T15:21:29.433-08:00"
}
```

>Note that `Fault.Error` is an *array*, although most of the time there is just one error. For each error, the `Message` is the high-level explanation of the error.

## OAuth getIntuitAuthorizationUrl = function(client_id, redirect_uri, state)
The connector also provides a convenience methods for constructing a **client-to-Intuit** URL that initiates the user OAuth2 authorization process.

Parameters:
1. **client_id** (string) your app's client id as defined at developer.intuit.com
1. **redirect_uri** (string) Determines where the response is sent. The value of this parameter must exactly match one of the values listed for this app in the developer.intuit.com app settings.
1. **state** (string) Provides any state that might be useful to your application upon receipt of the response. The Intuit Authorization Server roundtrips this parameter, so your application receives the same value it sent. Including a CSRF token in the state is recommended.

Returns an authorization URL string with all parameters set and encoded. **You use this to make your own call, typically on a UI component.** Note, when the redirect_uri is invoked after the user has authenticated, it will contain the following query parameters:
1. `code` (this is what you exchange for an access token and refresh token)
2. `realmId` - this identifies the QBO company. Per Intuit's instructions it should be stored securely.
