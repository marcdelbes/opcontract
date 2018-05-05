import { Injectable } from '@angular/core';
import { ActionReducer, Action, Store, State, combineReducers } from '@ngrx/store';
import { ActionReducerMap } from '@ngrx/store';
import { customAction } from './customAction';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Http, Headers, Response } from '@angular/http';

import { PO } from './po.model';
import { AppStore } from './app.store';

const HEADER = { headers: new Headers({ 'Content-Type': 'application/json' }) };
const BASE_URL = '/api/'; // local, redirect in the server

/**
 ** ACTIONS
 **/

export const AccountActionTypes = {
  ACCOUNT_LOAD:  '[AC] loadAll', // payload = string[]
}

export const BlockNumberActionTypes = {
  UPDATE:  '[BK] loadAll', // payload = string
}

export const POActionTypes = {

	PO_LOAD_ALL:		'[PO] loadAll',	// payload = PO[] 
	PO_CREATE:			'[PO] create', 	// payload = PO
	PO_UPDATE:			'[PO] update', 	// payload = { id: string, status: string, qty: number; date: string; }

}

export const MessageActionTypes = {
  UPDATE:     '[Message] Update',  // payload = string
}


/**
 ** REDUCERS
 **/


let initialPOState = [] ;	
let initialAccountsState = [] ;	
let initialMessageState = '';
let initialBlockNumberState = '';

const accountsReducer: ActionReducer<string[]> = (state: string[] = initialAccountsState, action : customAction) => {
  switch (action.type) {
    case AccountActionTypes.ACCOUNT_LOAD: console.log("received accounts action ! " + action.payload ); return action.payload;
    default: return state;
  }
}

const messageReducer: ActionReducer<string> = (state: string = '', action : customAction) => {
  switch (action.type) {
    case MessageActionTypes.UPDATE: return action.payload;
    default: return state;
  }
}

const blockNumberReducer: ActionReducer<string> = (state: string = '', action : customAction) => {
  switch (action.type) {
    case BlockNumberActionTypes.UPDATE: console.log("received blockNumber action ! " + action.payload ); return action.payload;
    default: return state;
  }
}

const poReducer : ActionReducer<PO[]>  = (state: PO[] = initialPOState, action: customAction) => {

switch (action.type) {

    case POActionTypes.PO_LOAD_ALL: 
	    return action.payload ;  

    case POActionTypes.PO_UPDATE: 
	    return state.map( t => { 
				if (t.poID == action.payload.poID) 
					  return Object.assign({},t,action.payload); 
					else 
					  return t; 
				});

    case POActionTypes.PO_CREATE:
      return [ ...state, Object.assign({},action.payload)  ];  
    
    default: 
	return state;
  }

}

/*
const reducers = {
  POs: poReducer,
  Message: messageReducer,
  Accounts: accountsReducer
};

const productionReducer = combineReducers(reducers);

export function reducer(state: any, action: any) {
    return productionReducer(state, action);
}

*/

export const reducer: ActionReducerMap<AppStore> = {
  POs: poReducer,
  Message: messageReducer,
  Accounts: accountsReducer,
  BlockNumber: blockNumberReducer,
};

/*
 * SERVICE
 */
@Injectable()
export class poService {
  
  POs$ : Observable<PO[]>;
  Message$: Observable<string>;
  BlockNumber$: Observable<string>;
  Accounts$: Observable<string[]>;
  
  constructor( private http : Http, private store: Store<AppStore> ) { 
    
	//
	// observable on the raw data
	// We let components filter the result if needed
	//
	this.Accounts$ = this.store.select('Accounts');
	this.POs$ = this.store.select('POs');	
  	this.Message$ = this.store.select('Message');
  	this.BlockNumber$ = this.store.select('BlockNumber');
  }	

  //
  // Load accounts on the node
  //
  loadAccounts() {
    this.http.get(BASE_URL + 'accounts', HEADER)
	   .map( res => res.json() )
	   .subscribe(
	     //pos => {  }
	     pos => { console.log(pos); this.store.dispatch( { type: AccountActionTypes.ACCOUNT_LOAD, payload: pos } ) } 
	   ); 
  }
  
  //
  // Load current block number on the node
  //
  loadBlockNumber() {
    this.http.get(BASE_URL + 'blockNumber', HEADER)
	   .map( res => res.json() )
	   .subscribe(
	     pos => { console.log(pos); this.store.dispatch( { type: BlockNumberActionTypes.UPDATE, payload: pos } ) } 
	   ); 
  }
  
  //
  // Initial PO load
  //
  loadAllPOs() {
    this.http.get(BASE_URL + 'org.acme.sample.PO', HEADER)
	   .map( res => res.json() )
	   .subscribe( pos => { if (pos.status == 200) this.store.dispatch( { type: POActionTypes.PO_LOAD_ALL, payload: pos.body } ) } ); 
  }

  supplierAcceptPO(id: string) {
    this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: 'waiting blockchain...' } );
    const body =
       { "$class": "org.acme.sample.SupplierAccept", "po": `${id}` }
       //"transactionId": "",
       //"timestamp": "" 
    var res ;
    console.log(body);
    this.http.post(BASE_URL + 'org.acme.sample.SupplierAccept', body, HEADER)
	   .map( res => res.json() )
	   .subscribe( pos => {  
	                        if (pos.status == 200) {
	                            this.store.dispatch( { type: POActionTypes.PO_UPDATE, payload: { poID: id, status: 'OPEN' } } );
	                            this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: "OK with transaction: " + pos.body.transactionId } );
	                        }
	                        else this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: pos.body.error.message } );
	                        } ); 
    
  }

  supplierRejectPO(id: string) {
    this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: 'waiting blockchain...' } );
    const body =
       { "$class": "org.acme.sample.SupplierReject", "po": `${id}` }
       //"transactionId": "",
       //"timestamp": "" 
    var res ;
    console.log(body);
    this.http.post(BASE_URL + 'org.acme.sample.SupplierReject', body, HEADER)
	   .map( res => res.json() )
	   .subscribe( pos => {  
	                        if (pos.status == 200) {
	                            this.store.dispatch( { type: POActionTypes.PO_UPDATE, payload: { poID: id, status: 'REJECTED' } } );
	                            this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: "OK with transaction: " + pos.body.transactionId } );
	                        }
	                        else this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: pos.body.error.message } );
	                        } ); 
    
  }

 createPO() {
   this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: 'waiting blockchain...' } );
   var aYearFromNow = new Date();
   aYearFromNow.setFullYear(aYearFromNow.getFullYear() + 1);
   var newId = 'PO' + Math.floor(Math.random() * 1000000) + 1
   const newPO = {
          "poID": newId, "BCP": "Airbus", "SCP": "PAG", "status": "NOP",
          "reqQty": Math.floor(Math.random() * 1000) + 1, "reqDate": aYearFromNow.toString(), "GR": 0,
          "material": "PN" + Math.floor(Math.random() * 1000) + 1, "price": Math.floor(Math.random() * 1000) + 1
    };
   const body = { 
          "$class": "org.acme.sample.PO", "poID": newPO.poID, "BCP": newPO.BCP, "SCP": newPO.SCP, "status": newPO.status,
          "reqQty": newPO.reqQty, "reqDate": newPO.reqDate, "GR": newPO.GR, "material": newPO.material, "price": newPO.price
       };
    var res ;
    console.log(body);
    this.http.post(BASE_URL + 'org.acme.sample.PO', body, HEADER)
	   .map( res => res.json() )
	   .subscribe( pos => {  
	                        if (pos.status == 200) {
	                          this.store.dispatch( { type: POActionTypes.PO_CREATE, payload: newPO } );
	                          this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: "OK" } );
	                        }
	                        else this.store.dispatch( { type: MessageActionTypes.UPDATE, payload: pos.body.error.message } );
	                        } ); 
   
 }
 
  //
  // expose Observables to components
  //
  getPOs() : Observable<PO[]> { return this.POs$; }
  getMessage() : Observable<string> { return this.Message$; }
  getBlockNumber() : Observable<string> { return this.BlockNumber$; }
  getAccounts() : Observable<string[]> { return this.Accounts$; }
  
}

