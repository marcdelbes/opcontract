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


/* 
app.all("/api*", function(request, response) {
  console.log('called with url ' + request.url);
  var options = {
        host: '148.100.98.79',
        port: 3000,
        path: request.url,
        method: request.method,
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
        protocol: 'http:'
    };

    var resBody = '';

console.log(options.host);
console.log(options.port);
console.log(options.path);
console.log(options.method);
console.log(options.headers);
console.log(options.protocol);

    if (request.method == 'GET') { 
    http.request(options, function(responseFromRemoteApi) {
        responseFromRemoteApi.on('data', function(chunk) {
            // When this event fires we append chunks of 
            // response to a variable
            resBody += chunk;
        });
        responseFromRemoteApi.on('end', function() {
            // We have the complete response from Server B (stackoverflow.com)
            // Send that as response to client
            var rb = JSON.parse(resBody);
            var status = (rb.error && rb.error.statusCode) || 200;
            console.log("preparing to respond with status code:" + status );
            var finalRes = '{ "status": ' + status + ', "body": ' + resBody + '}';
            console.log(finalRes);
            response.writeHead(200, { 'Content-type': 'application/json' });
            response.write(finalRes);

            response.end();
        });
    }).on('error', function(e) {
        console.log('Error when calling remote API: ' + e.message);
            response.writeHead(300, { 'Content-type': 'application/json' });
            response.write('{'+e.message+'}');
            response.end();
    }).end();
    
    }
    
    if (request.method == 'POST') {
    var post = http.request(options, function(responseFromRemoteApi) {
        responseFromRemoteApi.on('data', function(chunk) {
            // When this event fires we append chunks of 
            // response to a variable
            resBody += chunk;
        });
        responseFromRemoteApi.on('end', function() {
            // We have the complete response from Server B (stackoverflow.com)
            // Send that as response to client
            var rb = JSON.parse(resBody);
            var status = (rb.error && rb.error.statusCode) || 200;
            console.log("preparing to respond with status code:" + status );
            var finalRes = '{ "status": ' + status + ', "body": ' + resBody + '}';
            console.log(finalRes);
            response.writeHead(200, { 'Content-type': 'application/json' });
            response.write(finalRes);

            response.end();
        });
    }).on('error', function(e) {
        console.log('Error when calling remote API: ' + e.message);
            response.writeHead(300, { 'Content-type': 'application/json' });
            response.write('{'+e.message+'}');
            response.end();
    })
    
    post.write(JSON.stringify(request.body));
    post.end();
    
    }
    
    
} );

*/

