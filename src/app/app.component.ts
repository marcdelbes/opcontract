import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

import { SuiModule } from 'ng2-semantic-ui';

import { OPC } from './store/opcontract.model';
import { nodeService } from './store/node.service';
import { OPContractService } from './store/opcontract.service';
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

  opContracts		: OPC[];
  opContractsUpdate	: OPC[];
  
  constructor(private nodeService : nodeService, private authService: AuthService, private opcontractService : OPContractService ) { 
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
		//console.log("debug:     After init node");	

    		// retrieve the last block number and then the details
    		this.nodeService.getBlockNumber( res => { 
			this.blockNumber = res; 
			this.nodeService.getBlockDetail( this.blockNumber, res => {
			this.blockDetail = res; 
    			});
    		});
		//console.log("debug:     After get block");	

    		// retrieve all accounts, and store the default one
    		this.nodeService.getAccounts( res => { 
			this.accounts = res; 
			if (res && res.length != 0) this.defaultAccount = res[0]; 
		});

		// Use opcontractService to retreive all the Operational Contracts
		//console.log("debug:     before p2p init");
		this.opcontractService.init(this.nodeService.getNodeCnx());

	        // get All Contracts from smart contract
	        this.opcontractService.getContracts( res => {
	            this.opContracts = res;
	            });

	        // get All Updated Contracts from smart contract
		// only for the customer
		/**************** TO BE REMOVED AFTER TEST OK
		if (this.authService.getRoles() == 'customer'){
	        this.opcontractService.getContractsUpdate( res => {
	            this.opContractsUpdate = res;
	            });
		}
		***********************************************/

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
  
  changeAmount(id:string) {
   this.opcontractService.changeAmount(id);
  }

  update() {
   this.opcontractService.update();
  }

  validate() {
   this.opcontractService.validate();
  }

  basicTest( s : string) {
    this.nodeService.basicTest(s);
    this.nodeService.getBlockNumber( res => {
        this.blockNumber = res;
        });
  }


}


