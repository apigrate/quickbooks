## Authorization Example
To illlustrate how to use Intuit OAuth, a simple Express app is included in this distribution.


This assumes you've set up an application at developer.intuit.com and stored the necessary information in the config file (see config/example.js). Supposing we're in a "development" environment, you'll a development.js file to be placed in the config folder that looks something like this.
```javascript
module.exports={
  auth_file_path: "/Users/Me/Documents/temp/qbo/auth.json",
  client_id: "abc",//Your quickbooks app id
  client_secret: "123"//Your quickbooks app secret
};
```
This will result in OAuth2 credentials being stored locally in the file specified by `auth_file_path`. **This should not be done in a production environment!** The intent here is to show how to build an OAuth2 application flow.

### Run the app.
To run this simple webapp use the following command:
```
NODE_ENV=development DEBUG=qbo* node test/web/bin/www
```

You will be able to access it at http://localhost:3000.
