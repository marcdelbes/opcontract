import { Component, Injectable } from '@angular/core';
//import { Http, Headers, Response } from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from './app.config';
import * as W3 from 'web3';

declare let require: any;

let Tx = require('ethereumjs-tx');      // required to sign transactions
import {Buffer} from 'buffer';          // required during tx signature

const HEADER = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class AuthService {

  _pkey : string = '';

  constructor( private http: HttpClient ) {
  }

  // request the node service to attempt a login using the private key of the user  
  // basically the node service will request a challenge from the server, then send a signed transaction
  // with that challenge, to be mined by the blockchain.
  // In response, the server will eventually call the callback URL to pass a JWT token

  public login( userOrEmail: string, pkey : string ) : Promise<string> {

    console.log("attempting a logon for user/email " + userOrEmail + " using privkey " + pkey );
    this._pkey = pkey;

    // call the REST api to retrieve the transaction to sign
    return new Promise<string>( (resolve,reject) => {
              
    var body = { "userOrEmail": userOrEmail };
    this.http.post('/api/challenge/', body, HEADER)
        .subscribe( 
	   res => {
                var nodeIndex = res['nodeIndex'];
                var rawTx = {
                        data: res['rawTx']['data'],
                        from: res['rawTx']['from'],
                        to: res['rawTx']['to'],
                        value: res['rawTx']['value'],
                        gas: res['rawTx']['gas'],
                        nonce: res['rawTx']['nonce']
                	};
                console.log("received node index " + nodeIndex + " and raw tx : " + JSON.stringify(rawTx));
		try {
                  var privkey = new Buffer( pkey, 'hex');
                  var stx = new Tx(rawTx);
                  stx.sign(privkey);
  		} catch(error) {
		  reject("Cannot sign. Invalid key");
  		} 
                var serializedTx = '0x' + stx.serialize().toString('hex');
                console.log("serialized signed tx: " + serializedTx );

                // call the REST api to send the transaction back
                var body = { "signedTx": serializedTx };
                this.http.post('/api/login/' + res['rawTx']['from'] + "/" + nodeIndex , body , HEADER)
                        .subscribe( authRes => {
                                	console.log("authRes : " + JSON.stringify(authRes) )
				  	this.setSession(authRes,nodeIndex);
   				  	resolve("OK");
					},
				    err =>{
				  	console.log("there was an error while logging:" + JSON.stringify(err['error']) );
					var message = err['error']['error']; // not nice... please do some typechecking
				  	reject(message);
                                	} 
                         );

            	} ,
	    err =>{
	  	console.log("there was an error while requesting challenge:" + JSON.stringify(err['error']) );
		var message = err['error']['error']; // not nice... please do some typechecking
	  	reject(message);
              	} 
	);

  });

  }
 

  private setSession(authRes,nodeIndex): void {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify((authRes.expiresIn * 1000) + new Date().getTime());
    console.log("setting session with user " + authRes.user + ", roles = " + authRes.roles + ", token=" + authRes.idToken );
    localStorage.setItem('id_token', authRes.idToken);
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('p2p_user', authRes.user);
    localStorage.setItem('p2p_roles', authRes.roles);
    localStorage.setItem('p2p_nodeIndex', nodeIndex);
  }

  public logout(): void {
    // Remove tokens and expiry time from localStorage
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('p2p_user');
    localStorage.removeItem('p2p_roles');
    localStorage.removeItem('p2p_nodeIndex');
  }

  public isAuthenticated(): boolean {
    var user = localStorage['p2p_user']; 
    // Check whether the current user is set 
    if (user == null || user === undefined || user == 'undefined') return false;
    // Check whether the current time is past the access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  public getRoles(): string {
    return localStorage['p2p_roles']; 
  }

  public getUser(): string {
    return localStorage['p2p_user']; 
  }

  public getNode(): string {
    return localStorage['p2p_nodeIndex']; 
  }

  public getToken(): string {
    return localStorage['id_token']; 
  }

  public getKey(): string {
    return this._pkey; 
  }

}


