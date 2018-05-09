import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

import { SuiModule } from 'ng2-semantic-ui';

import { PO } from './store/po.model';
import { poService } from './store/po.service';
import { nodeService } from './store/nodeService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ["../../node_modules/font-awesome/css/font-awesome.min.css",
    './app.component.css',
    '../assets/Semantic-UI-CSS-master/semantic.min.css']
})

export class AppComponent implements OnInit {

  customerPOs$: Observable<PO[]>;
  supplierPOs$: Observable<PO[]>;
  blockchainResponse: Observable<string>;

  blockNumber: string = 'retrieving...';
  blockDetail: string = 'retrieving...';
  defaultAccount: string = 'none';
  accounts: string[] = [];
  
  constructor(private poService : poService, private nodeService : nodeService ) { 

    //this.customerPOs$ = this.poService.getPOs().map( p => p.filter( po => po.BCP == 'Airbus' ) );
    //this.supplierPOs$ = this.poService.getPOs();
    //this.blockchainResponse = this.poService.getMessage();
    //this.poService.loadAllPOs();

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

  }

  ngOnInit() : void {
  }

  createPO() {
    this.poService.createPO();
  }

  supplierAcceptPO(id:string) {
   this.poService.supplierAcceptPO(id);
  }
  
  supplierRejectPO(id:string) {
   this.poService.supplierRejectPO(id);
  }


}


