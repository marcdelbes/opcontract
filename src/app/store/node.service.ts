import { Injectable } from '@angular/core';
import * as W3 from 'web3';

import { AppConfig } from '../app.config';
import { AuthService } from '../auth.service';

const Web3 = require('web3'); 		// tslint:disable-line
let Tx = require('ethereumjs-tx');	// required to sign transactions
import {Buffer} from 'buffer';		// required during tx signature

var HttpHeaderProvider = require('httpheaderprovider');

declare let require: any;

@Injectable()
export class nodeService {

  web3: any;

  _claimContractAddr = AppConfig.settings.contracts.claimContractAddr; 
  _claimContractAbi = require('../contracts/ownerclaimsContract.json');

  // all accounts on the node
  private _accounts: string[] = null;

  constructor( private authService: AuthService ) {
  }

  // This function is called when authentication is done, and must be called prior to any access to Web3.js
  public init() : Promise<string> {

    // prepare appropriate HTTP header with authorization token and node port
    var headers = {
  	"Authorization":  "Bearer " + this.authService.getToken(),
  	"x-quorum-port":  this.authService.getNode(),
	};

    return new Promise<string>( (resolve,reject) => {
      var provider = new HttpHeaderProvider('http://ec2-34-241-14-11.eu-west-1.compute.amazonaws.com:8080', headers);
      this.web3 = new Web3(provider);
      console.log("connected to node " + this.authService.getNode() + " via web3");
      console.log("claim contract addr: " + this._claimContractAddr);
      resolve("");
    });

  }

  // Get web3
  public getNodeCnx() : any
  {
	return this.web3
  }

  // Basic test: Send a signed transaction and check that contract method has been executed by writing a new string
  public basicTest( s : string ) {

    var acc = this._accounts[0]; 
    console.log("using account '" + acc + "'");

    // retrieve contract
    var contract = this.web3.eth.contract(this._claimContractAbi).at(this._claimContractAddr); 
    console.log("testing contract at address '" + this._claimContractAddr + "'");

    // simple contract method call, to test the web3js api 
    contract.getDefaultClaim.call( acc , { from: acc }, function(err, receipt){console.log("1st getDefaultClaim call, result = '" + receipt + "'")}); 

    // now call the same function but with signed tx
    var data = contract.setDefaultClaim.getData(s);
    var privkey = new Buffer( this.authService.getKey(), 'hex'); 

    var rawTx = {
	 data : data,
         from : acc,
 	 gas: 1000000,
	 value: 0,
	 to: this._claimContractAddr,
	 nonce: this.web3.toHex(this.web3.eth.getTransactionCount(acc)),
	} 

    var tx = new Tx(rawTx);
    console.log("signing tx");
    tx.sign(privkey);
    var serializedTx = tx.serialize();
    console.log("sending signed tx. Wait for console.log");
    this.web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex') , (error, result) => {
                                if(!error) {
				    var found = false;
                                    console.log("tx hash = " + result);
   				    for (let i = 0; i < 10 && !found ; i++) { 
    				      	console.log("Looking for transaction " + result + ", tentative " + i);
    					var block = this.web3.eth.getTransaction( result ).blockNumber;
    					if (block != null) {
						console.log("Found the transaction " + result + " in block " + block + " !");
						found = true;
      					} 
    				  	// Wait 1 second, and retest 
    					setTimeout(() => {}, 1000);
    					}
                                } else {
                                   console.log(error);
                                }
                            })

   }


  // retrieve all accounts on the node, including the 1st one considered as default, and 
  // populate the web3 object with this default account for all further operations

  public getAccounts( callback ): Promise<string> {
  if (this._accounts == null) {
     return new Promise<string>((resolve, reject) => {
      this.web3.eth.getAccounts((err, accs) => {
        if (err != null) { console.log('There was an error fetching your accounts.'); reject(); }
        if (accs.length === 0) { console.log( 'Couldn\'t get any accounts! Make sure your client is configured correctly.'); reject(); }
	this._accounts = accs;
    	this.web3.eth.defaultAccount = this._accounts[0];
    	console.log("default account = " + this._accounts[0].toString() );
        resolve( callback ( this._accounts ));
      })
    });
  }
  return Promise.resolve( callback (this._accounts) );
 }

  public getBlockNumber( callback ): Promise<string> {
	return this.web3.eth.getBlockNumber(function(error,result) {
	if (!error) callback(result.toString()); else console.error(error);});
  }

  public getBlockDetail( number, callback ): Promise<string> {
	// unused, issue with web3js and formatters with Numbers 
	// return this.web3.eth.getBlock( parseInt(number)).then(console.log);
	return Promise.resolve( callback( "<not implemented>" ) );
  }

  public getTx( txHash ) : any {
      return this.web3.eth.getTransaction( txHash ).blockNumber;
  }

}
  

