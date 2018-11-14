# @apigrate/quickbooks

A transparent library for interacting with the QuickBooks Online API. It supports a number of developer-friendly features that other QuickBooks libraries do not, including:
1. automatic OAuth2 token refresh (including an event handler)
3. support for native promises
4. unopinionated error handling

## What's Supported
Almost the entire QuickBooks Online Accounting API...

### Transactional Entities
| Entity | reference | query | create | get by id | update | delete |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Bill | bills | &check; | &check; | &check; | &check; | &check; |
| BillPayment | billpayments | &check; | &check; | &check; | &check; | &check; |
| CreditMemo | creditmemos | &check; | &check; | &check; | &check; | &check; |
| Deposit | deposits | &check; | &check; | &check; | &check; | &check; |
| Estimate | estimates | &check; | &check; | &check; | &check; | &check; |
| Invoice | invoices | &check; | &check; | &check; | &check; | &check; |
| JournalEntry | journalentries | &check; | &check; | &check; | &check; | &check; |
| Payment | payments | &check; | &check; | &check; | &check; | &check; |
| Purchase | purchases | &check; | &check; | &check; | &check; | &check; |
| Purchaseorder | purchaseorders | &check; | &check; | &check; | &check; | &check; |
| RefundReceipt | refundreceipts | &check; | &check; | &check; | &check; | &check; |
| SalesReceipt | salesreceipts | &check; | &check; | &check; | &check; | &check; |
| TimeActivity | timeactivities | &check; | &check; | &check; | &check; | &check; |
| Transfer | transfers | &check; | &check; | &check; | &check; | &check; |
| VendorCredit | vendorcredits | &check; | &check; | &check; | &check; | &check; |

### Named List Entities
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

### Supporting Entities
| Entity | reference | query | create | get by id | update | delete |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Attachable | attachables | &check; | &check; | &check; | &check; | &check; |
| CompanyInfo | companyinfo | &check; | &nbsp; | &check; | &check; | &nbsp; |
| Preferences | preferences | &check; | &nbsp; | &check; | &check; | &nbsp; |


## Usage
```javascript
var {QboConnector, qboConnect, getQuickBooksAuthorizationUrl, getQuickBooksAccessToken} = require('@apigrate/quickbooks');
```
### Instantiation
A shorthand factory method is available to return a fully-configured, initialized instance of the QuickBooks connector.

```javascript
var qbo = qboConnect(
  client_id,
  client_secret,
  access_token,
  refresh_token,
  user, // realm id
  null, // opts (future use)
  function(info){
    console.log('Token was refreshed.');
    /*
      The connector emits a token.refreshed event that can be used after it obtains
      a new access/refresh token. You should persist this information to maintain your QuickBooks Online API connectivity.

      The info object has the following properties:
      info.access_token;
      info.expires; //in seconds
      info.refresh_token;
      info.x_refresh_token_expires_in;
    */
  }
);
```
You can immediately begin using the connector to make API calls.

#### Longhand Instantiation
If you need to separate the initialization process for some reason, you can use the `QboConnector` class directly as follows.
```javascript
var qbo = new QboConnector(
  client_id,
  client_secret,
  access_token,
  refresh_token,
  user, // realm id
  null //opts (future use)
);

qbo.on("token.refreshed", function(info){
  console.log('Token was refreshed.');

  /*
    The class emits a token.refreshed event that can be used after it obtains
    a new access/refresh token. You should this updated information to maintain your QuickBooks Online API connectivity.

    The info object has the following properties:
    info.access_token;
    info.expires; //in seconds
    info.refresh_token;
    info.x_refresh_token_expires_in;

  */
});
```

When using the longhand instantiation approach, before calling any API methods, ***you must invoke the `init()` method***. It registers all of the various API calls as easy-to-understand functions on the `qbo.accounting` object, which wraps the QuickBooks Accounting API.
```javascript
qbo.init();//synchronous
```

### Making API Calls
Now you can make QuickBooks Accounting API calls by using the `qbo.accounting` entity, which wraps the [QuickBooks Online Accounting API](https://developer.intuit.com/docs/api/accounting).

#### Query
```javascript

qbo.accounting.items.query(`select * from Item where Active=true and Type='Inventory'`)
.then(function(result){

  /*
  result -->
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

  */
})
.catch(function(err){
	console.error(err);
});
```
#### Get By ID
All you need is an entity ID and you can retrieve the full entity details.
```javascript

qbo.accounting.items.get(11)
.then(function(result){

  /*
  result -->
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
  */
})
.catch(function(err){
	console.error(err);
});
```

#### Create and Update
There are `.create()` and `.update()` methods for entities that support them. Sparse updates are supported where applicable, but keep in mind that for most QuickBooks entities, you'll need to send in the full list of writeable fields on update.

The returned data is the same for both `.create()` and `.update()`.
```javascript

qbo.accounting.items.create({
  "Name": 'Widget',
  "Type": 'Inventory',
  "IncomeAccountRef": {
      "value": "79",
      "name": "Sales of Product Income"
  }
})
.then(function(result){

  /*
    result (also the same form for an update response) -->
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
  */
});
```

#### Delete
Most transactional entities support deletion, but only a few named entities support a true delete. For those, you'll be "soft-deleting" entities by setting `Active=false` using the `update()` method.
```javascript

qbo.accounting.invoices.delete({
  "Id": 153,
  "SyncToken": 0 //this is also required
})
.then(function(result){

  /*
    result -->
    {
      "Invoice": {
        "domain": "QBO",
        "status": "Deleted",
        "Id": "153"
      },
      "time": "2018-11-13T15:18:40.109-08:00"
    }
  */
});
```

#### Error Handling

You'll want to implement error handling similar to this:
```javascript
return qbo.accounting.items.create({
  "Name": "Body Armor",
  "Type": "Inventory"
  //This will fail because there are many more fields required...
})
.then(function(result){
  //...
})
.catch(function(err){
  //The err has an error object set on it.
  console.error(JSON.stringify(err.error,null,2))
});
```
In the case above, the `err` object is what's returned from Intuit. It contains the full error object, including a `request`, `response`, `options` and other properties.

However most of the time, you'll only really care about the `err.error` property. It is an object having the form:
```javascript
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
Note that `Fault.Error` is an array, although most of the time there is just one error. For each error, the `Message` is the high-level explanation of the error.


## OAuth Convenience Methods
This library also provides two convenience methods for interacting with Intuit's OAuth2 endpoints.

### getQuickBooksAuthorizationUrl = function(client_id, redirect_uri, state)
This synchronous function is used to construct a **client-to-Intuit** URL that initiates the user OAuth2 authorization process.

Parameters:
1. **client_id** (string) your app's client id as defined at developer.intuit.com
1. **redirect_uri** (string) Determines where the response is sent. The value of this parameter must exactly match one of the values listed for this app in the developer.intuit.com app settings.
1. **state** (string) Provides any state that might be useful to your application upon receipt of the response. The Intuit Authorization Server roundtrips this parameter, so your application receives the same value it sent. Including a CSRF token in the state is recommended.

Returns an authorization URL string with all parameters set and encoded. **You use this to make your own call, typically on a UI component.** Note, when the redirectUri is invoked after the user has authenticated, it will contain the following query parameters:
1. **code** (this is what you exchange for an access token and refresh token)
2. **realmId** - this identifies the QBO company. Per Intuit's instructions it should be stored securely.

### getQuickBooksAccessToken = function(client_id, client_secret, code, redirect_uri)
This asynchronous function is used to issue a **server-to-Intuit** POST request to obtain an access token, once a code has been granted from the user authorization step (see [getQuickBooksAuthorizationUrl](#getQuickBooksAuthorizationUrl).

Parameters:
1. **client_id** (string) your app's client id as defined at developer.intuit.com
1. **client_secret** (string) your app's client secret as defined at developer.intuit.com
1. **code** (string) Code returned by Intuit from the first leg of authorization.
1. **redirect_uri** (string) Determines where the response is sent. The value of this parameter must exactly match one of the values listed for this app in the developer.intuit.com app settings.
