var express = require("express");
var http    = require('http');
var bodyParser = require("body-parser");
var app = express();

var Web3 = require('web3');
var web3;

if (typeof web3 !== 'undefined') { web3 = new Web3(web3.currentProvider); } 
else { web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:22000")); }

console.log("web3 version = " + web3.version.api);

// Create link to Angular build directory
var distDir = __dirname + "/dist/";
app.use(bodyParser.json());
app.use(express.static(distDir));

// Initialize the app.
var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
};

app.get("/api/accounts", function(req,res) {
    res.send(JSON.stringify(web3.eth.accounts));
  }
);

app.get("/api/blockNumber", function(req,res) {
    res.send(JSON.stringify(web3.eth.blockNumber));
  }
);


