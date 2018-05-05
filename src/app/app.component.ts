import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

import { PO } from './store/po.model';
import { poService } from './store/po.service';
import { ContractService } from './store/contractService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ["../../node_modules/font-awesome/css/font-awesome.min.css",
    './app.component.css',
    '../assets/Semantic-UI-CSS-master/semantic.min.css'],
})

export class AppComponent implements OnInit {

  customerPOs$: Observable<PO[]>;
  supplierPOs$: Observable<PO[]>;
  accounts$: Observable<string[]>;
  blockchainResponse: Observable<string>;

  blockNumber: string = 'retrieving...';
  defaultAccount: string = 'retrieving...';
  //defaultAccount: Promise<string>;
  
  constructor(private poService : poService, private contractService : ContractService ) { 

    //this.customerPOs$ = this.poService.getPOs().map( p => p.filter( po => po.BCP == 'Airbus' ) );
    //this.supplierPOs$ = this.poService.getPOs();
    //this.accounts$ = this.poService.getAccounts();
    //this.blockchainResponse = this.poService.getMessage();
    //this.poService.loadAllPOs();
    //this.poService.loadAccounts();
    //this.poService.loadBlockNumber();

    this.contractService.getBlockNumber( res => { this.blockNumber = res; });

    //this.defaultAccount = this.contractService.getAccount();
    this.contractService.getAccount( res => { this.defaultAccount = res; });

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


