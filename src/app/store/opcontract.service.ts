import { Injectable } from '@angular/core';
import { OPC } from '../store/opcontract.model';
import * as Web3 from 'web3';
import {Buffer} from 'buffer';          // required during tx signature
import { AppConfig } from '../app.config';



declare let require: any;
declare let window: any;

let opcAbi = require('../contracts/OPContract_v2.json');

@Injectable()
export class OPContractService {


  _web3: any;
  private _tokenContract: any;
  private _tokenContractAddress: string = AppConfig.settings.contracts.opContractAddr;
  private _vendorAddress: string = AppConfig.settings.contracts.vendorAddr; 
  private _vendorPwd: string = AppConfig.settings.contracts.vendorPwd; 
  private _buyerAddress: string = AppConfig.settings.contracts.buyerAddr; 
  private _buyerPwd: string = AppConfig.settings.contracts.buyerPwd; 
  private _orderEvent: any;
  private _xml: string;
  private _xml_upd: string;
  private _s_xml: string;
  private _s_xml_upd: string;

  private _table 	: OPC[] = []; // contains Op Contract data + the updated data when Supplier has updated the contract
/*** TO BE REMOVED AFTER TESTS OK
  private _table_upd 	: OPC[] = []; // contains the updated data when Supplier has updated the contract
***/

//---------------------------
//
//---------------------------
constructor() {

  }

//---------------------------
//
//---------------------------
public init( web3 : any)
{
    this._web3 = web3; // keep the connection to the node

    if(!this._web3.isConnected()) {
        alert("** ALERT ** cannot connect to node via web3js !");
        } else {
        console.log("web3 version " + this._web3.version.api + " " + this._web3.version.node);
    }

  // Connect to the smart contract
  console.log("OP contract address =  " + this._tokenContractAddress);
  this._tokenContract = this._web3.eth.contract(opcAbi).at(this._tokenContractAddress);
  console.log("Operarional contract status =  " + this._tokenContract.health());
  console.log("Operarional contract nb  =  " + this._tokenContract.getContractseq());

}

//---------------------------
//
//---------------------------
public getStatus(nbContract : any): string {
  var i = parseInt(nbContract);
  var status = this._tokenContract.getStatusFromId(i)+"";
  console.log("getStatus  = " + status);
  return status;
}

//---------------------------
//
//---------------------------
public getContracts(callback){

var nbOPC = this._tokenContract.getContractseq();
console.log("Nb Contracts  = " + nbOPC);

var status : string;

for (var _i = 1; _i <= nbOPC; _i++) {

//initialize the OPerational Contract in OPCPO[]
if (this._table.length == _i-1){
	this._table.push({agreement:"TheID",
                          agreementDate :"no value",
                          validityStart:"no value",
                          validityEnd:"no value",
                          status:"no value",
                          paymentTerm:"3010",
                          currency:"no value",
                          incoterms:"DAP",
                          agreementItem:"no value",
                          material:"no value",
                          materialGroup:"no value",
                          description:"no value",
                          validFrom:"no value",
                          validTo:"no value",
                          amount:0,
                          orderUnit:"no value",
                          orderPriceUnit:"no value",

			  // Updated values by the Supplier
			  upd_agreement:"TheID",
                          upd_agreementDate :"no value",
                          upd_validityStart:"no value",
                          upd_validityEnd:"no value",
                          upd_status:"no value",
                          upd_paymentTerm:"3010",
                          upd_currency:"no value",
                          upd_incoterms:"DAP",
                          upd_agreementItem:"no value",
                          upd_material:"no value",
                          upd_materialGroup:"no value",
                          upd_description:"no value",
                          upd_validFrom:"no value",
                          upd_validTo:"no value",
                          upd_amount:0,
                          upd_orderUnit:"no value",
                          upd_orderPriceUnit:"no value",
			});
}

status = this._tokenContract.getStatusFromId(_i);
this._table[_i-1].status = status;
// When last OpContract_v2.sol is deployed
//this._table[_i-1].agreement = this._tokenContract.getRefFromId(_i);

var result : any;
result = this._tokenContract.getFromId(_i);

console.log("Raw result = " + result);

var xml = result[0];
var xml_upd = result[1];
console.log("result = " + xml);

this._s_xml = result[0];
this._s_xml_upd = result[1];

var fastXmlParser = require('fast-xml-parser');

  switch(result[0]) {
	case "": // not validated contract, customer can see values
	  console.log("Info = result is empty, contract not validated");
	  //header
	  this._xml_upd = fastXmlParser.parse(xml_upd);
	  this._table[_i-1].agreement      = this._xml_upd['OPCONTRACT']['HEADER']['REF'];
          this._table[_i-1].agreementDate  = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table[_i-1].validityStart  = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table[_i-1].validityEnd    = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_END_DATE'];
          this._table[_i-1].currency       = this._xml_upd['OPCONTRACT']['HEADER']['CURRENCY'];
	  // Items
          this._table[_i-1].upd_agreementItem  = this._xml_upd['OPCONTRACT']['ITEM']['REF_ITEM'];
          this._table[_i-1].upd_material       = this._xml_upd['OPCONTRACT']['ITEM']['VENDOR_MAT_NB'];
          this._table[_i-1].upd_amount         = this._xml_upd['OPCONTRACT']['ITEM']['NET_ORDER_PRICE'];
          this._table[_i-1].upd_orderUnit      = this._xml_upd['OPCONTRACT']['ITEM']['ORDER_UNIT'];
          this._table[_i-1].upd_orderPriceUnit = this._xml_upd['OPCONTRACT']['ITEM']['ORDER_PRICE_UNIT'];
          this._table[_i-1].upd_validFrom      = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table[_i-1].upd_validTo        = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_END_DATE'];
          this._table[_i-1].upd_currency       = this._xml_upd['OPCONTRACT']['HEADER']['CURRENCY'];
          // To be added in the XML file
          // this._table[_i-1].upd_paymentTerm = this._xml_upd['OPCONTRACT']['HEADER'];
          // this._table[_i-1].upd_paymentTerm = this._xml_upd['OPCONTRACT']['HEADER'];
          // this._table[_i-1].upd_incoterms   = this._xml_upd['OPCONTRACT']['ITEM'];
          // this._table[_i-1].upd_materialGroup = this._xml_upd['OPCONTRACT']['ITEM'];

	break;

	case "ERROR 1": // not validated contract, supplier cannot see values
	  console.log("Info = " + result[1]);
	break;

	case "ERROR 2": //  _i is out of bound 
	  console.log("Error = " + result[1]);
	break;

	default:
          this._xml = fastXmlParser.parse(xml);
          console.log(" _i = " + _i);
          console.log("XML (" + _i + ") = " + this._xml['OPCONTRACT']['HEADER']['REF']);
	  // Header
          this._table[_i-1].agreement      = this._xml['OPCONTRACT']['HEADER']['REF'];
          this._table[_i-1].agreementDate  = this._xml['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table[_i-1].validityStart  = this._xml['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table[_i-1].validityEnd    = this._xml['OPCONTRACT']['HEADER']['VALIDITY_END_DATE'];
          this._table[_i-1].currency       = this._xml['OPCONTRACT']['HEADER']['CURRENCY'];
	  // Items
          this._table[_i-1].agreementItem  = this._xml['OPCONTRACT']['ITEM']['REF_ITEM'];
          this._table[_i-1].material       = this._xml['OPCONTRACT']['ITEM']['VENDOR_MAT_NB'];
          this._table[_i-1].amount         = this._xml['OPCONTRACT']['ITEM']['NET_ORDER_PRICE'];
          this._table[_i-1].orderUnit      = this._xml['OPCONTRACT']['ITEM']['ORDER_UNIT'];
          this._table[_i-1].orderPriceUnit = this._xml['OPCONTRACT']['ITEM']['ORDER_PRICE_UNIT'];
          this._table[_i-1].validFrom      = this._xml['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table[_i-1].validTo        = this._xml['OPCONTRACT']['HEADER']['VALIDITY_END_DATE'];
          this._table[_i-1].currency       = this._xml['OPCONTRACT']['HEADER']['CURRENCY'];
          // To be added in the XML file
          // this._table[_i-1].paymentTerm = this._xml['OPCONTRACT']['HEADER'];
          // this._table[_i-1].paymentTerm = this._xml['OPCONTRACT']['HEADER'];
          // this._table[_i-1].incoterms   = this._xml['OPCONTRACT']['ITEM'];
          // this._table[_i-1].materialGroup  = this._xml['OPCONTRACT']['ITEM'];

          if (this._s_xml_upd != ""){
            this._xml_upd = fastXmlParser.parse(xml_upd);
            // Updated Header 
            this._table[_i-1].upd_agreement      = this._xml_upd['OPCONTRACT']['HEADER']['REF'];
            this._table[_i-1].upd_agreementDate  = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
            this._table[_i-1].upd_validityStart  = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
            this._table[_i-1].upd_validityEnd    = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_END_DATE'];
            this._table[_i-1].upd_currency       = this._xml_upd['OPCONTRACT']['HEADER']['CURRENCY'];
            // Updated Items
            this._table[_i-1].upd_agreementItem  = this._xml_upd['OPCONTRACT']['ITEM']['REF_ITEM'];
            this._table[_i-1].upd_material       = this._xml_upd['OPCONTRACT']['ITEM']['VENDOR_MAT_NB'];
            this._table[_i-1].upd_amount         = this._xml_upd['OPCONTRACT']['ITEM']['NET_ORDER_PRICE'];
            this._table[_i-1].upd_orderUnit      = this._xml_upd['OPCONTRACT']['ITEM']['ORDER_UNIT'];
            this._table[_i-1].upd_orderPriceUnit = this._xml_upd['OPCONTRACT']['ITEM']['ORDER_PRICE_UNIT'];
            this._table[_i-1].upd_validFrom      = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
            this._table[_i-1].upd_validTo        = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_END_DATE'];
            this._table[_i-1].upd_currency       = this._xml_upd['OPCONTRACT']['HEADER']['CURRENCY'];
            // To be added in the XML file
            // this._table[_i-1].upd_paymentTerm = this._xml_upd['OPCONTRACT']['HEADER'];
            // this._table[_i-1].upd_paymentTerm = this._xml_upd['OPCONTRACT']['HEADER'];
            // this._table[_i-1].upd_incoterms   = this._xml_upd['OPCONTRACT']['ITEM'];
            // this._table[_i-1].upd_materialGroup = this._xml_upd['OPCONTRACT']['ITEM'];
	  }

  }

   callback(this._table);
}
}


//---------------------------
// only for the customer
//---------------------------
public getContractsUpdate(callback){

/****************** TO BE DELETED AFTER TEST OK
var nbOPC = this._tokenContract.getContractseq();
console.log("Nb Contracts  = " + nbOPC);
var status : string;

for (var _i = 1; _i <= nbOPC; _i++) {
//initialize the OPerational Contract in OPCPO[]
if (this._table_upd.length == _i-1){
   this._table_upd.push({agreement:"TheID",agreementDate :"no value",validityStart:"no value",validityEnd:"no value",status:"no value",paymentTerm:"3010",currency:"no value",incoterms:"DAP",agreementItem:"no value",material:"no value",materialGroup:"no value",description:"no value",validFrom:"no value",validTo:"no value",amount:148,orderUnit:"no value",orderPriceUnit:"no value"});
}
status = this._tokenContract.getStatusFromId(_i);
this._table[_i-1].status = status;
// When last OpContract_v2.sol is deployed
//this._table[_i-1].agreement = this._tokenContract.getRefFromId(_i);

var result : any;
result = this._tokenContract.getFromId(_i);
console.log("Raw result = " + result);
var xml_upd = result[1];
this._s_xml_upd = result[1];

var fastXmlParser = require('fast-xml-parser');

  if (this._s_xml_upd != ""){
          this._xml_upd = fastXmlParser.parse(xml_upd);
          console.log(" _i = " + _i);
          console.log("XML (" + _i + ") = " + this._xml_upd['OPCONTRACT']['HEADER']['REF']);
          this._table_upd[_i-1].agreement    = this._xml_upd['OPCONTRACT']['HEADER']['REF'];
          this._table_upd[_i-1].agreementDate  = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table_upd[_i-1].validityStart  = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table_upd[_i-1].validityEnd    = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_END_DATE'];
          this._table_upd[_i-1].currency    = this._xml_upd['OPCONTRACT']['HEADER']['CURRENCY'];
          this._table_upd[_i-1].agreementItem  = this._xml_upd['OPCONTRACT']['ITEM']['REF_ITEM'];
          this._table_upd[_i-1].material  = this._xml_upd['OPCONTRACT']['ITEM']['VENDOR_MAT_NB'];
          this._table_upd[_i-1].amount  = this._xml_upd['OPCONTRACT']['ITEM']['NET_ORDER_PRICE'];
          this._table_upd[_i-1].orderUnit  = this._xml_upd['OPCONTRACT']['ITEM']['ORDER_UNIT'];
          this._table_upd[_i-1].orderPriceUnit  = this._xml_upd['OPCONTRACT']['ITEM']['ORDER_PRICE_UNIT'];
          this._table_upd[_i-1].validFrom  = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_START_DATE'];
          this._table_upd[_i-1].validTo  = this._xml_upd['OPCONTRACT']['HEADER']['VALIDITY_END_DATE'];
          this._table_upd[_i-1].currency  = this._xml_upd['OPCONTRACT']['HEADER']['CURRENCY'];
          // To be added in the XML file
          // this._table_upd[_i-1].paymentTerm    = this._xml_upd['OPCONTRACT']['HEADER'];
          // this._table_upd[_i-1].paymentTerm    = this._xml_upd['OPCONTRACT']['HEADER'];
          // this._table_upd[_i-1].incoterms    = this._xml_upd['OPCONTRACT']['ITEM'];
          // this._table_upd[_i-1].materialGroup    = this._xml_upd['OPCONTRACT']['ITEM'];
  }
}
**************************************************/

   // callback
   callback("empty");
}

//-----------------------------------------
// Supplier changes the amount of one item
//-----------------------------------------
public changeAmount(amount: string){
console.log(" ==> Amount changed = " + amount);
console.log(" ==> xml price before change = " + this._xml['OPCONTRACT']['ITEM']['NET_ORDER_PRICE']);
//this._xml['OPCONTRACT']['ITEM']['NET_ORDER_PRICE'] = amount;
var oldAmount = this._xml['OPCONTRACT']['ITEM']['NET_ORDER_PRICE'] + "";
var newxml = this._s_xml.replace("<NET_ORDER_PRICE>"+oldAmount,"<NET_ORDER_PRICE>"+amount);
this._s_xml = newxml +"";
console.log(" ==> xml after change = " + this._s_xml);
}

//-----------------------------------------
// Supplier update
//-----------------------------------------
// The operationnal contract is VALIDATED so that Supplier can update
// Note: work only if there is one op contract
// if more lines, id has to be retrieved to get the ref of the contract
public update(): Promise<boolean> {
    console.log(" ==> Update");

    return new Promise<boolean>( (resolve,reject) => {

       var ref = this._xml['OPCONTRACT']['HEADER']['REF'] + "";
       console.log(" ref = " + ref);
       console.log(" new price = " + this._s_xml);
    
       this._web3.personal.unlockAccount(this._vendorAddress, this._vendorPwd, 300,(error, result) => {
         if (error) {
                console.log("UnlockAccout ERROR : "+error);
		resolve(false);
         }else{
              console.log("UnlockAccout RESULT : "+result);
              this._tokenContract.update(ref,this._s_xml,{gas : 10000000, from : this._vendorAddress}, (error, result) => {
                if (error){
                   console.log("validate ERROR : "+error);
		   resolve(false);
                }else{
		   // Note : 1 to be replaced by the selected contract id when implemented
		   // Status to be retreived from the XML file
		   this._table[0].status="VALIDATED";
                   console.log("update RESULT : "+result);
		   resolve(true);
                }
              });
         };
       });
    });
}

//-----------------------------------------
// Customer validate
//-----------------------------------------
// Note: work only if there is one op contract
// if more lines, id has to be retrieved to get the ref of the contract
public validate(){
    console.log(" ==> Validate");
    var ref = this._xml_upd['OPCONTRACT']['HEADER']['REF'] + "";
    console.log(" ref = " + ref);
    this._web3.personal.unlockAccount(this._buyerAddress, this._buyerPwd, 300,(error, result) => {
         if (error) {
		console.log("UnlockAccout ERROR : "+error);
         }else{
              console.log("UnlockAccout RESULT : "+result);
    	      this._tokenContract.validate(ref,{gas : 10000000, from : this._buyerAddress},function (error, result){ 
		if (error){
		   console.log("validate ERROR : "+error);
		}else{
		   console.log("validate RESULT : "+result);
	        }
              })
         }
    })
}

/*****************

//-----------------------------
// Supplier Accept PO
//-----------------------------
public supplierAcceptPO(id: string) { 

    //this._web3.personal.unlockAccount("0x57742e3894c300344c4aee79bcd395109fbf6094", "password", 300,
    this._web3.personal.unlockAccount(this._vendorAddress, this._vendorPwd, 300,
	 (error, result) => { if (error) {console.log("UnlockAccout ERROR : "+error);}
		else{
		console.log("UnlockAccout RESULT : "+result);
        var sid = id + "";
        console.log(" ==> acceptOrder() id = " + sid);
       this._tokenContract.acceptOrder(sid ,"",{gas : 10000000, from : this._vendorAddress},function (error, result
){ if (error){console.log("acceptOrder ERROR : "+error);}else{console.log("acceptOrder RESULT : "+result);}})

		}}); 


  // Watch the event
  this._orderEvent = this._tokenContract.OrderSent({}, {fromBlock: 0, toBlock: 'latest'});
  this._orderEvent.watch((error, result) => {
    if(!error) {
        // do what you want to do with the event data
	if (id == result.args.po_id){
	console.log("BINGO PO id = " + result.args.po_id + " Num Order = " + result.args.orderno);
	var no = result.args.orderno + 0;
        this._table[no].status="OPEN";
	}	
        console.log("RESULT: PO id = " + result.args.po_id + " Num Order = " + result.args.orderno)
    } 
   });

    console.log("Accept Button Clicked !! id = " + id);

}
****************************/

}

