/*
  Typically you need to provide a development.json and production.json file
  in this directory that contain environment-specifc settings.
*/
module.exports = require('./' + (process.env.NODE_ENV || 'development') + '.js');
