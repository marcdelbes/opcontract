import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

import { SuiModule } from 'ng2-semantic-ui';

import { PO } from './store/po.model';
import { poService } from './store/po.service';
import { nodeService } from './store/node.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ["../../node_modules/font-awesome/css/font-awesome.min.css",
    './app.component.css',
    '../assets/Semantic-UI-CSS-master/semantic.min.css']
})

export class AppComponent implements OnInit {

  blockNumber: string = 'retrieving...';
  blockDetail: string = 'retrieving...';
  defaultAccount: string = 'none';
  loginStatus = '';
  isLoading = null;
  accounts: string[] = [];
  
  constructor(private poService : poService, private nodeService : nodeService, private authService: AuthService ) { 
  }

  ngOnInit() : void {
  }

  login( account: string, key: string ) {

    this.loginStatus = '';
    this.isLoading = true;

    this.authService.login( account, key ).then( 
	logged => {

		// initialize the connection to the node prior to anything else !!
    		this.nodeService.init();

    		// retrieve the last block number and then the details
    		this.nodeService.getBlockNumber( res => { 
			this.blockNumber = res; 
			this.nodeService.getBlockDetail( this.blockNumber, res => {
			this.blockDetail = res; 
    			});
    		});

    		// retrieve all accounts, and store the default one
    		this.nodeService.getAccounts( res => { 
			this.accounts = res; 
			if (res && res.length != 0) this.defaultAccount = res[0]; 
		});

  	},

	error => {

		// cannot connect. Say why
		this.loginStatus = error;

  	}

	);

    this.isLoading = null;

  }
 
  logout() {
    this.authService.logout();
    this.loginStatus = '';
  }
  
  basicTest( s : string) {
    this.nodeService.basicTest(s);
    this.nodeService.getBlockNumber( res => {
        this.blockNumber = res;
        });
  }


}


