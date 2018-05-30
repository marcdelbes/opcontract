var express = require("express");
var http    = require('http');
var bodyParser = require("body-parser");
var app = express();

//
// connect to a specific geth node via web3
//
var Web3 = require('web3');
var web3;

if (typeof web3 !== 'undefined') { web3 = new Web3(web3.currentProvider); } 
else { web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:22000")); }

console.log("web3 version = " + web3.version.api + " " + web3.version.node );

//
// Serve all Angular build directory directly as static
//
var distDir = __dirname + "/dist/";
app.use(bodyParser.json());
app.use(express.static(distDir));

//
// Initialize the app
//
var server = app.listen(process.env.PORT || 4200, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });

//
// Generic error handler used by all endpoints.
//
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
};

//
// REST API below
//

// GET /api/accounts		retrieve all accounts on the node
app.get("/api/accounts", function(req,res) {
    res.send(JSON.stringify(web3.eth.accounts));
  }
);

// GET /api/blockNumber		retrieve the current block number
app.get("/api/blockNumber", function(req,res) {
    res.send(JSON.stringify(web3.eth.blockNumber));
  }
);

// POST /api/login		send a signed raw transaction as authentication method for the user
app.post("/api/login", function(req,res) {
    var serializedTx = req.body.toString('hex');
    console.log("received login attempt: " + serializedTx );
    res.send(JSON.stringify( web3.eth.sendRawTransaction('0x' + serializedTx)));
  }
);

