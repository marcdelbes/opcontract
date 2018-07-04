var express = require("express");
var http    = require('http');
var bodyParser = require("body-parser");
var jwt = require('jsonwebtoken');
var Tx = require('ethereumjs-tx');      // required to sign transactions
var Buffer = require('buffer').Buffer;
//var bcrypt = require('bcryptjs');
var app = express();

var config = require("./src/assets/config.dev.json");
//var loginContractAbi = require("./src/app/contracts/Login.v2.json");
var loginContractAbi = require("./src/app/" + config.contracts.loginContractAbi);

// server & superuser information
// FIXME avoid hardcoding and in clear !!

var secret = 'supersecret';  // JWT token secret
var superuser = '0xed9d02e382b34818e88b88a309c7fe71e65f419d';	// BC super account
var superkey = 'e6181caaffff94a09d7e332fc8da9884d99902c7874eb74354bdcadf411929f1';  // corresponding key

//
// connect to a specific geth node via web3
//
var Web3 = require('web3');
var web3_node1, web3_node2;

var NODE_PORT = [ 22000, 22003 ];

if (typeof web3_node1 !== 'undefined') { web3_node1 = new Web3(web3.currentProvider); } 
else { web3_node1 = new Web3(new Web3.providers.HttpProvider("http://ec2-34-241-14-11.eu-west-1.compute.amazonaws.com:" + NODE_PORT[0])); }

if (typeof web3_node2 !== 'undefined') { web3_node2 = new Web3(web3.currentProvider); } 
else { web3_node2 = new Web3(new Web3.providers.HttpProvider("http://ec2-34-241-14-11.eu-west-1.compute.amazonaws.com:" + NODE_PORT[1])); }

console.log("config file for " + config.env.name );
console.log("NODE 1 on port " +  NODE_PORT[0]);
console.log("using login contract at address: " + config.contracts.loginContractAddrNode1 );
console.log("web3 version = " + web3_node1.version.api + " " + web3_node1.version.node );
console.log("NODE 2 on port " +  NODE_PORT[1]);
console.log("using login contract at address: " + config.contracts.loginContractAddrNode2 );
console.log("web3 version = " + web3_node2.version.api + " " + web3_node2.version.node );

// retrieve contract
let contract_node1 = web3_node1.eth.contract(loginContractAbi).at(config.contracts.loginContractAddrNode1);
let contract_node2 = web3_node2.eth.contract(loginContractAbi).at(config.contracts.loginContractAddrNode2);

//
// Serve all Angular build directory directly as static
//
var distDir = __dirname + "/dist/";
app.use(bodyParser.json());
app.use(express.static(distDir));

//
// Initialize the app
//
//var server = app.listen(process.env.PORT || 4200, function () {
var server = app.listen(process.env.PORT || 8080, function () {
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
//app.get("/api/accounts", function(req,res) {
//    res.send(JSON.stringify(web3.eth.accounts));
//  }
//);

// GET /api/blockNumber		retrieve the current block number
//app.get("/api/blockNumber", function(req,res) {
//    res.send(JSON.stringify(web3.eth.blockNumber));
//  }
//);


// POST  /api/challenge		send a prepared transaction to the requestor, for the given user or email given in the body
app.post("/api/challenge", function(req,res) {

    let user = req.body.userOrEmail;
    if (user == null || user == "") res.status(403).send({ auth: false, error: "Sorry, malformed request..."});

    console.log("receiving challenge request for user " + user );

    // define challenge
    let challenge = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log("Setting challenge phrase to : '" + challenge + "'");


    // check if user or email exists
    //for (i=0;i<web3.eth.accounts.length;i++) if (web3.eth.accounts[ i ]== user) found = true;
    var found = 0;
    var contract, web3, port, contractAddr;

    var addr = contract_node1.getAccount(user);
    console.log("node 1: following address was returned for this user:" + addr ); 
    if (addr != "0x0000000000000000000000000000000000000000") { 
	contract = contract_node1;
	found = 1;
	port = NODE_PORT[0];
	web3 = web3_node1;
	contractAddr = config.contracts.loginContractAddrNode1;
	console.log("Found the user on Node 1");
    } else { 
    	addr = contract_node2.getAccount(user);
    	console.log("node 2: following address was returned for this user:" + addr ); 
    	if (addr != "0x0000000000000000000000000000000000000000") { 
		contract = contract_node2;
		found = 2;
		port = NODE_PORT[1];
		web3 = web3_node2;
		contractAddr = config.contracts.loginContractAddrNode2;
		console.log("Found the user on Node 2");
    	}
    }

    if (found == 0) { 
      res.status(403).send({ auth: false, error: "Sorry, invalid account or email..."});
      return;
    }

    // From here, addr, contractAddr, web3 and contract are set properly
    
    // store this challenge using the superuser account
    // here we use a signed tx instead of doing an unsecure call:
    //    web3.personal.unlockAccount(user,"",1);
    //    contract.setChallenge( user, challenge, { from: user, gas: 1000000 } );
    let cdata = contract.setChallenge.getData( addr, challenge );
    var cTx = {
         data : cdata,
         from : superuser,
         gas: 1000000,
         value: 0,
         to: contractAddr,
         nonce: web3.eth.getTransactionCount(superuser),
        }

    var ctx = new Tx(cTx);
    var skey = new Buffer( superkey, 'hex');
    ctx.sign(skey);
    var cserializedTx = ctx.serialize();
    console.log("sending signed tx for challenge");
    web3.eth.sendRawTransaction('0x' + cserializedTx.toString('hex')); 

    // return a prepared transaction to the caller, without executing it for the moment
    let data = contract.loginAttempt.getData( challenge );
    var rawTx = {
         data : data,
         from : addr,
         gas: 1000000,
         value: 0,
         to: contractAddr,
         nonce: web3.eth.getTransactionCount(addr),
        }


    var fullResponse = { 
	"nodeIndex": NODE_PORT[ found - 1 ],
	"rawTx": rawTx
        }

    console.log("Responding with : " + JSON.stringify(fullResponse));

    res.send(JSON.stringify( fullResponse ));

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

 
// POST /api/login/:user/:node	forward to the BC a signed raw transaction as authentication method for the given user
//				then check for the transaction to be properly mined, and check the challenge
//				if OK, return a JWT token
app.post("/api/login/:user/:node", function(req,res) {

    let user = req.params.user;
    let node = req.params.node;

    var serializedTx = req.body;
    console.log("received signed transaction for user " + user + " : " + JSON.stringify(serializedTx) );
    console.log("Forwarding it to the BC. keep calm.");

   // select the right node based on parameter... probably should do some check before !
   var web3, contract;
   if (NODE_PORT[0] == node) { 
	web3 = web3_node1;
   	contract = web3_node1.eth.contract(loginContractAbi).at(config.contracts.loginContractAddrNode1);
   } else if (NODE_PORT[1] == node) {
	web3 = web3_node2;
   	contract = web3_node2.eth.contract(loginContractAbi).at(config.contracts.loginContractAddrNode2); 
   } else {
	res.status(403).send({ auth: false, error: "Invalid node. Are you sure you got this value here ?"});
	return;
   }

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
						res.status(403).send({ auth: false, error: "Connection refused. Transaction not mined."});
                                	} else  {
						// check that the challenge and attempt values are the same
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

							// retrieve the user roles
							var roles = contract.getRoles( user );

							console.log("token: " + token );
							console.log("user roles: " + roles );

							res.status(200).send({ auth: true, idToken: token, expiresIn: 3600, user: user, roles: roles });
						} else {
							console.log("KO: Challenge & attempt are different ! ");
							res.status(403).send({ auth: false, error: "Connection refused. Wrong challenge."});
                                		}
                                	}

                                } else {
                                   console.log(error);
				   res.status(403).send({ auth: false, error: "Connection refused. Internal error sending transaction to the BC."});
                                }

  			}
	);

 });
 
