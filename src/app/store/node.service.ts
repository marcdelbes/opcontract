import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import * as W3 from 'web3';

import { AppConfig } from '../app.config';

const Web3 = require('web3'); 		// tslint:disable-line
let Tx = require('ethereumjs-tx');	// required to sign transactions
import {Buffer} from 'buffer';		// required during tx signature

declare let require: any;

const HEADER = { headers: new Headers({ 'cache': 'false', 'Content-Type': 'application/json' }) };

@Injectable()
export class nodeService {

  web3: any;

  isSigned = false;
  txHash = '';

  _loginContractAddr = AppConfig.settings.contracts.loginContractAddr;
  _loginContractAbi = require('../contracts/Login.json'); 

  _claimContractAddr = AppConfig.settings.contracts.claimContractAddr; 
  _claimContractAbi = require('../contracts/ownerclaimsContract.json');

  // all accounts on the node
  private _accounts: string[] = null;

  constructor( private http : Http ) {

    this.web3 = new Web3(new Web3.providers.HttpProvider("http://ec2-34-243-190-121.eu-west-1.compute.amazonaws.com:8080"));
    console.log("login contract addr: " + this._loginContractAddr);
    console.log("claim contract addr: " + this._claimContractAddr);

    // test login procedure
    this.login("0xed9d02e382b34818e88b88a309c7fe71e65f419d","e6181caaffff94a09d7e332fc8da9884d99902c7874eb74354bdcadf411929f1");

  }

  // Perform a login request to the server. This consists in:
  // 1. calling the REST api to retrieve the raw transaction to sign from the server
  // 2. signing the transaction with the privkey 
  // 3. calling the REST api to forward that transaction to the BC
  // Upon successfull completion, the server should return a JWT token. 
  // The function return that token to the caller (or null otherwise)

  public login( user: string, pkey : string ) : any {

    console.log("attempting a logon for user " + user + " using privkey " + pkey );

    // call the REST api to retrieve the transaction to sign
    this.http.get('/api/challenge/' + user, HEADER)
	.map( res => { return res.json(); } )
	.subscribe( tx => { 
		var rawTx = {
			data: tx.data,
			from: tx.from,
			to: tx.to,
			value: tx.value,
			gas: tx.gas,
			nonce: tx.nonce
            	}; 
		console.log("received raw tx : " + JSON.stringify(rawTx));	
    		var privkey = new Buffer( pkey, 'hex');
    		var tx = new Tx(rawTx); 
    		tx.sign(privkey);
    		var serializedTx = '0x' + tx.serialize().toString('hex');
    		console.log("serialized signed tx: " + serializedTx );
		
		// call the REST api to send the transaction back
		var body = { "signedTx": serializedTx };
    		this.http.post('/api/login/' + user, body , HEADER)
			.map( res => { return res.json(); } )
			.subscribe( token => { console.log("token : " + token )
            				} ); 
		
            } ); 
    
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
    var privkey = new Buffer('e6181caaffff94a09d7e332fc8da9884d99902c7874eb74354bdcadf411929f1', 'hex'); // UGLY, never do that

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
				    this.txHash = result;
                                    console.log("tx hash = " + this.txHash);
   				    for (let i = 0; i < 10 && !this.isSigned ; i++) { 
    				      	console.log("Looking for transaction " + this.txHash + ", tentative " + i);
    					var block = this.web3.eth.getTransaction( this.txHash ).blockNumber;
    					// var block = this.getTx( this.txHash );
    					if (block != null) {
						console.log("Found the transaction " + this.txHash + " in block " + block + " !");
						this.isSigned = true;
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
  

