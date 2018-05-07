import { Injectable } from '@angular/core';
import * as Web3 from 'web3';

declare let require: any;
declare let window: any;

//FIXME let tokenAbi = require('./tokenContract.json');

let tokenAbi = '{}';

@Injectable()
export class ContractService {

  private _account: string = null;
  private _web3: any;

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

  public getAccount( callback ): Promise<string> {
  if (this._account == null) {
     return new Promise<string>((resolve, reject) => {
      this._web3.eth.getAccounts((err, accs) => {
        if (err != null) { console.log('There was an error fetching your accounts.'); reject(); }
        if (accs.length === 0) { console.log( 'Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.'); reject(); }
	this._account = accs[0];
        resolve( callback ( this._account ));
      })
    });
    //this._web3.eth.defaultAccount = this._account;
    //alert("default account = " + this._account.toString() );
  }
  return Promise.resolve( callback (this._account) );
 }

  public getBlockNumber( callback ): Promise<string> {
	return this._web3.eth.getBlockNumber(function(error,result) {
	if (!error) callback(result.toString()); else console.error(error);});
  }

}
  

