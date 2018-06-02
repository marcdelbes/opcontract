var express = require("express");
var http    = require('http');
var bodyParser = require("body-parser");
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var app = express();

var config = require("./src/assets/config.dev.json");
var loginContractAbi = require("./src/app/contracts/Login.json");

var secret = 'supersecret';

//
// connect to a specific geth node via web3
//
var Web3 = require('web3');
var web3;

if (typeof web3 !== 'undefined') { web3 = new Web3(web3.currentProvider); } 
else { web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:22000")); }

console.log("config file for " + config.env.name );
console.log("using login contract at address: " + config.contracts.loginContractAddr );
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


// GET  /api/challenge/:user	send a prepared transaction to the requestor, for the given user
app.get("/api/challenge/:user", function(req,res) {

    let user = req.params.user;
    console.log("receiving challenge request for user " + user );

    // define challenge
    let challenge = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log("Setting challenge phrase to : '" + challenge + "'");

    // retrieve contract
    let contract = web3.eth.contract(loginContractAbi).at(config.contracts.loginContractAddr);
    let data = contract.loginAttempt.getData( challenge );

    // store this challenge
    // FIXME: this should be done with a kind of superuser, not the user itself ! But for the moment I have only 1 user !
    web3.personal.unlockAccount(user,"",1);
    contract.setChallenge( user, challenge, { from: user, gas: 1000000 } );

    // return a prepared transaction
    var rawTx = {
         data : data,
         from : user,
         gas: 1000000,
         value: 0,
         to: config.contracts.loginContractAddr,
         nonce: web3.eth.getTransactionCount(user),
        }

    console.log("Responding with the following tx: " + JSON.stringify(rawTx));

    res.send(JSON.stringify( rawTx ));

  }
);

// GET  /api/testToken		basic test of the incoming token
app.get("/api/testToken", function(req,res) {
  console.log("someone is testing me ...");
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, secret, function(err, decoded) {      
      if (err) {
        console.log('Failed to authenticate token.');    
      } else {
        console.log('Token OK !');    
      }
     });

  } else {
        console.log('NO TOKEN FOUND!');    
  }
});

 
// POST /api/login/:user	forward to the BC a signed raw transaction as authentication method for the given user
//				then check for the transaction to be properly mined, and check the challenge
//				if OK, return a JWT token
app.post("/api/login/:user", function(req,res) {

    let user = req.params.user;

    var serializedTx = req.body;
    console.log("received signed transaction for user " + user + " : " + JSON.stringify(serializedTx) );
    console.log("Forwarding it to the BC. keep calm.");

    web3.eth.sendRawTransaction(serializedTx.signedTx, function(error, result) {
                                if(!error) {
                                    console.log("tx hash = " + result);
				    let found = false;
                                    for (let i = 0; i < 5 && !found ; i++) {
                                        console.log("Looking for transaction " + result + ", tentative " + i);
                                        var block = web3.eth.getTransaction( result ).blockNumber;
                                        if (block != null) {
                                                console.log("Found the transaction " + result + " in block " + block + " !");
                                                found = true;
                                        }
                                        // Wait 1 second, and retest
                                        setTimeout(() => {}, 1000);
                                        }

				    if (!found) {
						// refuse access
						res.status(403).send("Connection refused. Transaction not mined.");
                                	} else  {
						// check that the challenge and attempt values are the same
    						let contract = web3.eth.contract(loginContractAbi).at(config.contracts.loginContractAddr);
						if (contract.isMatching( user )) {
							console.log("Challenge & attempt are identical. OK to generate JWT token");
                                			// create a token, send it back
    							var token = jwt.sign({ "sub": user }, secret, {
      									expiresIn: 3600 // expires in 1 hour
    							});
							//const token = jwt.sign({}, secret, {
                					//	algorithm: 'RS256',
                					//	expiresIn: 120,
                					//	subject: user
            						//});

							res.status(200).send({ auth: true, idToken: token, expiresIn: 120, user: user });
						} else {
							console.log("KO: Challenge & attempt are different ! ");
							res.status(403).send("Connection refused. Wrong challenge.");
                                		}
                                	}

                                } else {
                                   console.log(error);
				   res.status(403).send("Connection refused. Error sending transaction to the BC.");
                                }

  			}
	);

 });
 
