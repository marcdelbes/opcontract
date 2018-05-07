import { Injectable } from '@angular/core';
import * as Web3 from 'web3';

declare let require: any;
declare let window: any;

//FIXME let tokenAbi = require('./tokenContract.json');

let tokenAbi = '{}';

@Injectable()
export class nodeService {

  _web3: any;

  // all accounts on the node
  private _accounts: string[] = null;

  // fixme: unused yet
  private _tokenContract: any;
  private _tokenContractAddress: string = "0xbc84f3bf7dd607a37f9e5848a6333e6c188d926c"; // FIXME

  constructor() {
    this._web3 = new Web3(new Web3.providers.HttpProvider("http://ec2-34-243-190-121.eu-west-1.compute.amazonaws.com:8080"));
    if(!this._web3.isConnected()) {
	alert("cannot connect to node via web3js !");
	} else {
    	console.log("web3 version " + this._web3.version.api + " " + this._web3.version.node);
    }
  }

  // retrieve all accounts on the node, including the 1st one considered as default, and 
  // populate the _web3 object with this default account for all further operations

  public getAccounts( callback ): Promise<string> {
  if (this._accounts == null) {
     return new Promise<string>((resolve, reject) => {
      this._web3.eth.getAccounts((err, accs) => {
        if (err != null) { console.log('There was an error fetching your accounts.'); reject(); }
        if (accs.length === 0) { console.log( 'Couldn\'t get any accounts! Make sure your client is configured correctly.'); reject(); }
	this._accounts = accs;
    	this._web3.eth.defaultAccount = this._accounts[0];
    	console.log("default account = " + this._accounts[0].toString() );
        resolve( callback ( this._accounts ));
      })
    });
  }
  return Promise.resolve( callback (this._accounts) );
 }

  public getBlockNumber( callback ): Promise<string> {
	return this._web3.eth.getBlockNumber(function(error,result) {
	if (!error) callback(result.toString()); else console.error(error);});
  }

}
  

