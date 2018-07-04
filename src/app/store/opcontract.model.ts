
export interface OPC {

 // Header
 agreement: string;	// contract reference 
 agreementDate : string;
 validityStart : string;
 validityEnd: string;
 status: string;	// among "TO BE VALIDATED" or "UPDATE TO BE VALIDATED" or "VALIDATED"
 paymentTerm: string;
 currency: string;
 incoterms: string;

 // Items
 agreementItem: string;
 material : string;
 materialGroup : string;
 description: string;
 validFrom: string;
 validTo: string;
 amount: number;
 orderUnit: string;
 orderPriceUnit: string;

 // Updated Header
 upd_agreement: string;     // contract reference
 upd_agreementDate : string;
 upd_validityStart : string;
 upd_validityEnd: string;
 upd_status: string;        // among "TO BE VALIDATED" or "UPDATE TO BE VALIDATED" 
 upd_paymentTerm: string;
 upd_currency: string;
 upd_incoterms: string;

// Updated Items
 upd_agreementItem: string;
 upd_material : string;
 upd_materialGroup : string;
 upd_description: string;
 upd_validFrom: string;
 upd_validTo: string;
 upd_amount: number;
 upd_orderUnit: string;
 upd_orderPriceUnit: string;
}

/************************
export interface OPC_ITEMS {
 
 Id: number;    // key used to link with OPC header
 
 // Items
 AgreementItem: string;
 Material : string;      
 MaterialGroup : string;
 Description: string;   
 ValidFrom: string;
 ValidTo: string;   
 Amount: number;     
 Currency: string;
 Order Unit: string;
 Order Price Unit: string;

}
***************************/
