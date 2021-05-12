var pg = require('pg');
//or native libpq bindings
//var pg = require('pg').native
require("dotenv").config();

var conString = process.env['ESQL'];
var client = new pg.Client(conString);
client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
});

module.exports = client;