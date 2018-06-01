import { Component, Injectable } from '@angular/core';
//import { Http, Headers, Response } from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { nodeService } from './store/node.service';
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

  _loginContractAddr = AppConfig.settings.contracts.loginContractAddr;
  _loginContractAbi = require('./contracts/Login.json');

  constructor( private http: HttpClient ) {
 	console.log("login contract addr: " + this._loginContractAddr);
	this.logout(); // we reset all token information at boostrap	
  }

  // request the node service to attempt a login using the private key of the user  
  // basically the node service will request a challenge from the server, then send a signed transaction
  // with that challenge, to be mined by the blockchain.
  // In response, the server will eventually call the callback URL to pass a JWT token

  public login( user: string, pkey : string ) : any {

    console.log("attempting a logon for user " + user + " using privkey " + pkey );

    // call the REST api to retrieve the transaction to sign
    this.http.get('/api/challenge/' + user)
        //.map( res => { return res.json(); } )
        .subscribe( tx => {
                var rawTx = {
                        data: tx['data'],
                        from: tx['from'],
                        to: tx['to'],
                        value: tx['value'],
                        gas: tx['gas'],
                        nonce: tx['nonce']
                };
                console.log("received raw tx : " + JSON.stringify(rawTx));
                var privkey = new Buffer( pkey, 'hex');
                var stx = new Tx(rawTx);
                stx.sign(privkey);
                var serializedTx = '0x' + stx.serialize().toString('hex');
                console.log("serialized signed tx: " + serializedTx );

                // call the REST api to send the transaction back
                var body = { "signedTx": serializedTx };
                this.http.post('/api/login/' + user, body , HEADER)
                        //.map( res => { return res.json(); } )
                        .subscribe( authRes => {
                                console.log("authRes : " + JSON.stringify(authRes) )
				this.setSession(authRes);
				this.testToken();
                                } );

            } );

  }

  // basic test : call the server that will check that the token is OK
  private testToken() {
    this.http.get('/api/testToken/' , HEADER)
        //.map( res => { return res.json(); } )
        .subscribe();
  }

  private setSession(authRes): void {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify((authRes.expiresIn * 1000) + new Date().getTime());
    console.log("setting session with user " + authRes.user );
    localStorage.setItem('id_token', authRes.idToken);
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('p2p_user', authRes.user);
  }

  public logout(): void {
    // Remove tokens and expiry time from localStorage
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('p2p_user');
  }

  public isAuthenticated(): boolean {
    var user = localStorage['p2p_user']; 
    // Check whether the current user is set 
    if (user == null || user === undefined || user == 'undefined') return false;
    // Check whether the current time is past the access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  public getUser(): string {
    return localStorage['p2p_user']; 
  }

}

