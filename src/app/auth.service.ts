import { Component, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { nodeService } from './store/node.service';

@Injectable()
export class AuthService {

  constructor( public router: Router, private nodeService : nodeService ) {}

  // request the node service to attempt a login using the private key of the user  
  // basically the node service will request a challenge from the server, then send a signed transaction
  // with that challenge, to be mined by the blockchain.
  // In response, the server will eventually call the callback URL to pass a JWT token

  public login( user: string, privkey : string ): void {
	this.nodeService.login( user, privkey );
  }

  public handleAuthentication( callback? ): void {
    //this.auth0.parseHash((err, authResult) => {
    //  if (authResult && authResult.accessToken && authResult.idToken) {
    //    window.location.hash = '';
    //    this.setSession(authResult);
    //    this.router.navigate(['/']);
    //	console.log("calling callback...");
    //	if (callback) callback();
    //  } else if (err) {
    //     this.router.navigate(['/']);
    //    console.log(err);
    //  }
    // });
  }

  private setSession(authResult): void {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    console.log("setting session with email " + authResult.idTokenPayload.email );
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('auth0_expires_at', expiresAt);
    localStorage.setItem('auth0_email', authResult.idTokenPayload.email);
  }

  public logout(): void {
    // Remove tokens and expiry time from localStorage
    // localStorage.removeItem('access_token');
    // localStorage.removeItem('id_token');
    // localStorage.removeItem('auth0_expires_at');
    // localStorage.removeItem('auth0_email');
    // Go back to the home route
    this.router.navigate(['/']);
  }

  public isAuthenticated(): boolean {
    var email = localStorage['auth0_email']; 
    // Check whether the current email is set 
    if (email == null || email === undefined || email == 'undefined') return false;
    // Check whether the current time is past the access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('auth0_expires_at'));
    //return new Date().getTime() < expiresAt;
  }

  public getUserEmail(): string {
    return localStorage['auth0_email']; 
  }

}


