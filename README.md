# @apigrate/quickbooks

A transparent **one-stop** library for interacting with the QuickBooks Online API. It supports all the features you need to interact with the QuickBooks Online Accounting API, including:
1. automatic OAuth2 token refresh (including an event handler)
3. support for native promises
4. unopinionated error handling
5. convenience method for constructor OAuth URLs
6. and most importantly, **complete coverage of the QuickBooks Online Accounting API**.

## Version 4.x Changes

Now uses the Intuit discovery documents, dynamically loading the correct URLs from Intuit OAuth.

Changes:
* added `is_sandbox` boolean to constructor. Use this to specify sandbox vs production environment.
* added `intuit_tid` to returned `accountingApi()`. This contains the last api call's `intuit_tid` value, which is useful for developer support troubleshooting.
* `intuit_tid` property added to ApiErrors and ApiThrottlingErrors.
* Void support added for certain entities. You may use a `.voidTransaction()` operation on Invoices, BillPayments, Payments and SalesTransactions


Breaking Changes:
* `getIntuitAuthorizationUrl` function is now an asynchronous method on the connector instance. 

## Supported Entities

***Supported Transactional Entities:***
| Entity | query | create | get by id | update | delete | void |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Bill |  &check; | &check; | &check; | &check; | &check; |
| BillPayment |  &check; | &check; | &check; | &check; | &check; | &check; |
| CreditMemo | &check; | &check; | &check; | &check; | &check; |
| Deposit |  &check; | &check; | &check; | &check; | &check; |
| Estimate |  &check; | &check; | &check; | &check; | &check; |
| Invoice |  &check; | &check; | &check; | &check; | &check; |  &check; |
| JournalEntry |  &check; | &check; | &check; | &check; | &check; |
| Payment |  &check; | &check; | &check; | &check; | &check; |  &check; |
| Purchase |  &check; | &check; | &check; | &check; | &check; |
| Purchaseorder  | &check; | &check; | &check; | &check; | &check; |
| RefundReceipt  | &check; | &check; | &check; | &check; | &check; |
| SalesReceipt  | &check; | &check; | &check; | &check; | &check; |  &check; |
| TimeActivity  | &check; | &check; | &check; | &check; | &check; |
| Transfer  | &check; | &check; | &check; | &check; | &check; |
| VendorCredit  | &check; | &check; | &check; | &check; | &check; |


***Named List Entities:***
| Entity | reference | query | create | get by id | update | delete |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Account | account | &check; | &check; | &check; | &check; | &nbsp; |
| Budget | budget | &check; |  &nbsp; | &check; |  &nbsp; | &nbsp; |
| Class | class | &check; | &check; | &check; | &check; | &nbsp; |
| CompanyCurrency | companycurrency | &check; | &check; | &check; | &check; | &nbsp; |
| Customer | customer | &check; | &check; | &check; | &check; | &nbsp; |
| Department | department | &check; | &check; | &check; | &check; | &nbsp; |
| Employee | employee | &check; | &check; | &check; | &check; | &nbsp; |
| Item | item | &check; | &check; | &check; | &check; | &nbsp; |
| Journalcode | journalcode | &check; | &check; | &check; | &check; | &nbsp; |
| PaymentMethod | paymentmethod | &check; | &check; | &check; | &check; | &nbsp; |
| TaxAgency | taxagency | &check; | &check; | &check; | &nbsp; | &nbsp; |
| TaxCode | taxcode | &check; | &check; | &check; | &nbsp; | &nbsp; |
| TaxRate | taxrate | &check; | &check; | &check; | &nbsp; | &nbsp; |
| TaxService | taxservice/taxcode | &check; | &check; | &nbsp; | &nbsp; | &nbsp; |
| Term | term | &check; | &check; | &check; | &check; | &nbsp; |
| Vendor | vendor | &check; | &check; | &check; | &check; | &nbsp; |

***Supporting Entities:***
| Entity | reference | query | create | get by id | update | delete |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Attachable | attachable | &check; | &check; | &check; | &check; | &check; |
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
* **refresh_token** (*string*, conditional)  Token to refresh access_token when it expires. You should obtain this from your own storage.
* **realm_id** *number* (*string*, conditional) Intuit company identifier, used in API call URLs. You should obtain this from your own storage.
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

**Entity.query(statement, opts)**
* `statement` (**string**) a query statement ([see Data queries](https://developer.intuit.com/app/developer/qbo/docs/develop/explore-the-quickbooks-online-api/data-queries)) for the entity you are working with
* `opts` (**object**, optional)
  * `reqid` (**string**, optional) unique request id that Intuit uses to "replay" transaction in case of errors. Sending a request id is not required, but it is considered a best-practice.
  * `minor_version` (**number**, optional) an API request-specific minor version to use for the request. Overrides the `minor_version` constructor argument, if one was provided.

```javascript
let result = await qbo.Item.query(
  `select * from Item where Active=true and Type='Inventory'`
  );
```
The `result` is:
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

**Entity.get(id, opts)**
* `id` (**number**) the id for the entity you want to retrieve
* `opts` (**object**, optional)
  * `reqid` (**string**, optional) unique request id that Intuit uses to "replay" transaction in case of errors. Sending a request id is not required, but it is considered a best-practice.
  * `minor_version` (**number**, optional) an API request-specific minor version to use for the request. Overrides the `minor_version` constructor argument, if one was provided.

**Example: get an Item:**
```javascript
let result = await qbo.Item.get(11);
```
The `result` is:
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

### Create
The  `.create()` method is used to create entities. Keep in mind, some fields can be conditionally required depending on the type of entity you are creating.

**Entity.create(payload, opts)**
* `payload` (**object**) an object payload containing all the writeable fields of the object you want to create. 
* `opts` (**object**, optional)
  * `reqid` (**string**, optional) unique request id that Intuit uses to "replay" transaction in case of errors. Sending a request id is not required, but it is considered a best-practice.
  * `minor_version` (**number**, optional) an API request-specific minor version to use for the request. Overrides the `minor_version` constructor argument, if one was provided.

**Example: Creating an Item**
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
The `result` is:
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

**Example: Create a Bill**
```javascript
let result = await qbo.Bill.create({
  "Line": [
    {
      "DetailType": "AccountBasedExpenseLineDetail", 
      "Amount": 200.0, 
      "Id": "1", 
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {
          "value": "7"
        }
      }
    }
  ], 
  "VendorRef": {
    "value": "42"
  }
});
```
The `result` is:
```json
{
  "Bill": {
    "DueDate": "2020-08-25",
    "Balance": 200,
    "domain": "QBO",
    "sparse": false,
    "Id": "145",
    "SyncToken": "0",
    "MetaData": {
      "CreateTime": "2020-08-25T06:27:05-07:00",
      "LastUpdatedTime": "2020-08-25T06:27:05-07:00"
    },
    "TxnDate": "2020-08-25",
    "CurrencyRef": {
      "value": "USD",
      "name": "United States Dollar"
    },
    "Line": [
      {
        "Id": "1",
        "LineNum": 1,
        "Amount": 200,
        "LinkedTxn": [],
        "DetailType": "AccountBasedExpenseLineDetail",
        "AccountBasedExpenseLineDetail": {
          "AccountRef": {
            "value": "7",
            "name": "Advertising"
          },
          "BillableStatus": "NotBillable",
          "TaxCodeRef": {
            "value": "NON"
          }
        }
      }
    ],
    "VendorRef": {
      "value": "42",
      "name": "Lee Advertising"
    },
    "APAccountRef": {
      "value": "33",
      "name": "Accounts Payable (A/P)"
    },
    "TotalAmt": 200
  },
  "time": "2020-08-25T06:27:05.412-07:00"
}
```

### Update
The  and `.update()` method is used to update an API entity. When updating entities, most entities support a "full update" mode, where you are expected to send the entire set of fields to be updated (anything missing is set to to null). Therefore, it is recommended you:
1. fetch the full entity first, 
1. modify the fields you want to changes, 
1. send the full object back as part of the update operation.  
See the [Intuit QuickBooks Online API Documentation](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities) to find out more for further details on the entity you are working with.

**Entity.update(payload, opts)**
* `payload` (**object**) an object payload containing all the writeable fields of the object you want to update. 
* `opts` (**object**, optional)
  * `reqid` (**string**, optional) unique request id that Intuit uses to "replay" transaction in case of errors. Sending a request id is not required, but it is considered a best-practice.
  * `minor_version` (**number**, optional) an API request-specific minor version to use for the request. Overrides the `minor_version` constructor argument, if one was provided.

**Example: Update an Item**
```javascript
let existing = await qbo.Item.get(19);
existing.Item.Name="Rubber Ducky";
let result = await qbo.Item.update(existing.Item);
```
The `result` is:
```json
{
  "Item": {
    "Name": "Rubber Ducky",
    "Active": true,
    "FullyQualifiedName": "Rubber Ducky",
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
    "SyncToken": "1",
    "MetaData": {
      "CreateTime": "2018-11-13T14:41:34-08:00",
      "LastUpdatedTime": "2019-08-28T12:05:02-08:00"
    }
  },
  "time": "2019-08-28T12:05:02.148-08:00"
}
```

### Delete
Most transactional entities support deletion, but only a few named-list entities do. When deleting, you'll need both the `Id` and the `SyncToken`. Similar to `update()` method, it is usually best to retrieve an entity immediately before you delete it to obtain the latest `SyncToken`. 

>You can think of `SyncToken` as a "version number" of the entity  you're working with. It is a mechanism to prevent two people from simultaneously making changes to the same entity at the same time. 

**Entity.delete(payload, opts)**
* `payload` (**object**) an object payload containing both the `Id` and the `SyncToken` properties of the object you want to delete.
* `opts` (**object**, optional)
  * `reqid` (**string**, optional) unique request id that Intuit uses to "replay" transaction in case of errors. Sending a request id is not required, but it is considered a best-practice.
  * `minor_version` (**number**, optional) an API request-specific minor version to use for the request. Overrides the `minor_version` constructor argument, if one was provided.

**Example: Delete a Bill**
```javascript
let result = await qbo.Bill.delete({
  "Id": 145,
  "SyncToken": 0 
});
```
The `result` is:
```json
{
  "Bill": {
    "domain": "QBO",
    "status": "Deleted",
    "Id": "145"
  },
  "time": "2020-08-25T06:48:57.291-07:00"
}
```

> For entites not supporting a "hard delete", usually there's a way to "soft-delete" them by setting `Active=false` using the `update()` method, or something similar.

### Voids
Voids are supported for certain Intuit entities (BillPayment, Invoice, Payment, SalesReceipt). These are similar to updates, but you must use  `.voidTransaction()` method to perform voids. 

**Entity.voidTransaction(payload, opts)**
* `payload` (**object**) an object payload containing the void payload fields of the object. Typically you will need to provide a payload like: `{Id: 192, SyncToken: 0}`. Note, this implies you should retrieve the entity prior to voiding it, because you should use the sync token from the current entity.
* `opts` (**object**, optional)
  * `reqid` (**string**, optional) unique request id that Intuit uses to "replay" transaction in case of errors. Sending a request id is not required, but it is considered a best-practice.
  * `minor_version` (**number**, optional) an API request-specific minor version to use for the request. Overrides the `minor_version` constructor argument, if one was provided.


### Batch Requests
Batch requests (submitting multiple operations with one request) ARE supported! Here is a code example. This deletes multiple time activities, but you can mix your own types of transactions. They do not need to be the same type of entity or operation.

**Entity.batch(payload, opts)**
* `payload` (**object**) an object payload containing the batch request. (See the [Intuit documentation](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/batch) for details about how to perform batch operations).
* `opts` (**object**, optional)
  * `reqid` (**string**, optional) unique request id that Intuit uses to "replay" transaction in case of errors. Sending a request id is not required, but it is considered a best-practice.
  * `minor_version` (**number**, optional) an API request-specific minor version to use for the request. Overrides the `minor_version` constructor argument, if one was provided.


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

### Run a Report
Run any report simply by using the `query` method on each Report entity, providing report input parameters on the argument as a hash. 

**ReportEntity.query(parms, opts)**
* `parms` (**object**) an object whose properties will be used as the request parameters for the report.
* `opts` (**object**, optional)
  * `reqid` (**string**, optional) unique request id that Intuit uses to "replay" transaction in case of errors. Sending a request id is not required, but it is considered a best-practice.
  * `minor_version` (**number**, optional) an API request-specific minor version to use for the request. Overrides the `minor_version` constructor argument, if one was provided.

**Example: Run the Customer Income Report**
```javascript
let result = await qbo.CustomerIncomeReport.query(
  {
    start_date: '2019-01-01', 
    end_date: '2020-04-01'
  }
);
```
The `result` is:
```json
{
  "Header": {
    "Time": "2020-08-21T15:04:49-07:00",
    "ReportName": "CustomerIncome",
    "ReportBasis": "Accrual",
    "StartPeriod": "2019-01-01",
    "EndPeriod": "2020-04-01",
    "Currency": "USD",
    "Option": [
      {
        "Name": "NoReportData",
        "Value": "false"
      }
    ]
  },
  "Columns": {
    ...etc
  },
  "Rows": {
    ...etc
  }
}
```
> (Some detail removed for length)

### Error Handling

API-specific errors (typically HTTP-4xx) responses, are trapped and thrown with the `ApiError` class. An `ApiThrottlingError` is also available. It is a subclass of `ApiError` and is thrown when HTTP-429 responses are encountered, indicating the API request limits were reached. 

**Example: Attempted create that fails because of missing fields**

```javascript
const {ApiError} = require('@apigrate/quickbooks');
try{
  let result = qbo.Item.create({
    "Name": "Body Armor",
    "Type": "Inventory"
    //This will fail because there are other fields required...
  });

} catch (err){
  if(err instanceof ApiError){
    err.message; //contains a readable, parsed error message,
    err.payload; //the object payload of the error, if one was returned
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

## OAuth getIntuitAuthorizationUrl = function(state)
The connector also provides a instance method for constructing a **client-to-Intuit** URL that initiates the user OAuth2 authorization process.

Parameters:
1. **state** (string) Provides any state that might be useful to your application upon receipt of the response. The Intuit Authorization Server roundtrips this parameter, so your application receives the same value it sent. Including a CSRF token in the state is recommended.

Returns an authorization URL string with all parameters set and encoded. **You use this to make your own call, typically on a UI component.** Note, when the redirect_uri is invoked after the user has authenticated, it will contain the following query parameters:
1. `code` (this is what you exchange for an access token and refresh token)
2. `realmId` - this identifies the QBO company. Per Intuit's instructions it should be stored securely.
