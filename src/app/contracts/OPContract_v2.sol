//-------------------------------------------------------------------
// Smart Contract - Proof Of Concept 
// Use case : Logistic Conditions & Operational contract 
// M.Delbes
// Airbus
// June 2018
// Version : 0.2
//-------------------------------------------------------------------

pragma solidity ^0.4.18;

contract OperationalContract {

  /// The buyer's address
  address public owner;

  /// The vendor's address part on this contract
  address public vendorAddr;

  /// Authorization to kill the Contract
  bool okToKill=false;
  
  /// The sequence number of contracts
  uint contractseq;

  /// The Buyer struct  
  struct Buyer {
    address addr;
    string name;

    bool init;
  }

  /// The vendor struct  
  struct Vendor {
    address addr;
    string name;
    string arpId;
    
    bool init;
  }

  /// Operational Contract struct
  struct OpContract {
    string ref;
    string xmlOpContract;
    string xmlOpC_update;
    string status; // "TO BE VALIDATED" or "UPDATE TO BE VALIDATED" or "VALIDATED"
  }

  /// The mapping to store contracts
  /// argument is the contract ref
 // mapping (string => OpContract) _contracts;
  mapping (uint => OpContract) _contracts;

  /// Event triggered for every contract updated
  event ContractUpdated(string ref);

  /// Event triggered for every contract added
  event ContractAdded(string ref);

  /// Event triggered for every contract validated
  event ContractValidated(string ref);

  /// --------------------------------------------
  /// The smart contract's constructor
  /// --------------------------------------------
  function OperationalContract(address _vendorAddr) public payable {
    
    contractseq = 0;
    
    /// The buyer is the contract's owner
    owner = msg.sender;

    vendorAddr = _vendorAddr;
  }
  
  /// --------------------------------------------
  /// get contract from reference
  /// --------------------------------------------
  function getId(string contractref) constant public returns(uint nb) {
     for(uint i = 1; i <= contractseq ; ++i) {
         if (compareString(_contracts[i].ref, contractref)){
            return(i);
         }
     }
     
     return(0);
  }
  
  /// --------------------------------------------
  /// get number of a contract
  /// --------------------------------------------
  function getContractseq() constant public returns(uint nb) {
    
   return(contractseq);
  }
  
  /// --------------------------------------------
  /// get status of a contract
  /// --------------------------------------------
  function getStatus(string contractRef) constant public returns(string status) {
   uint i = getId(contractRef);
   if (i !=0){
       return _contracts[i].status;
   }
   else {
       return("ERROR 0"); // no operational contract in the smart contract
   }  
  }
  
  /// --------------------------------------------
  /// get status of a contract
  /// --------------------------------------------
  function getStatusFromId(uint id) constant public returns(string status) {
   if (id !=0){
       if (id<=contractseq){
        return(_contracts[id].status);
      }
      else {
          return("ERROR 2"); // index out of bounds
      }   
   }
   else {
       return("ERROR 0"); // no operational contract in the smart contract
   }  

  }
  
  /// --------------------------------------------
  /// get refrence of a contract
  /// --------------------------------------------
  function getRefFromId(uint id) constant public returns(string r) {
   if (id !=0){
       if (id<=contractseq){
        return(_contracts[id].ref);
      }
      else {
          return("ERROR 2"); // index out of bounds
      }   
   }
   else {
       return("ERROR 0"); // no operational contract in the smart contract
   }  

  }
  /// --------------------------------------------
  /// add a contract
  /// --------------------------------------------
  function add(string contractRef, string xmlopcont) public payable {
    
    // only the Vendor can add a contract
    require(msg.sender == vendorAddr);
    
    // Increment the contract sequence
    contractseq++;

    _contracts[contractseq] = OpContract(contractRef, "", xmlopcont,"TO BE VALIDATED");
    
    /// Trigger the event
    ContractAdded(contractRef);
  }
  
  /// --------------------------------------------
  /// get contract
  /// --------------------------------------------
  function get(string contractRef) constant public returns(string xmlopcont, string xmlopc_upd) {
      // To Be Done :  should test first that contractRef exist
      
      uint i = getId(contractRef);
      
      if (i !=0){
          if (msg.sender == owner){
              return(_contracts[i].xmlOpContract,_contracts[i].xmlOpC_update);
          }
          else{
            if (compareString(_contracts[i].status, "VALIDATED")){
                return(_contracts[i].xmlOpContract,"");
            }  
            else{
                return("ERROR 1","not validated contract");// not validated contract
            }
          }
      }
      else {
       return("ERROR 0","no operational contract in the smart contract"); // no operational contract in the smart contract
      }  
  }
  
  /// --------------------------------------------
  /// get contract
  /// --------------------------------------------
  function getFromId(uint id) constant public returns(string xmlopcont, string xmlopc_upd) {
      // To Be Done :  should test first that contractRef exist
      if (id<=contractseq){
          if (msg.sender == owner){
            return(_contracts[id].xmlOpContract,_contracts[id].xmlOpC_update);
          }
          else{
              if (compareString(_contracts[id].status, "VALIDATED")){
                    return(_contracts[id].xmlOpContract,"");
                }  
                else{
                    return("ERROR 1","not validated contract");// not validated contract
                }
          }
      }
      else {
          return("ERROR 2","index out of bounds"); // index out of bounds
      }

  }
  
  /// --------------------------------------------
  /// Update a contract
  /// --------------------------------------------
  function update(string contractRef, string xmlopcont) public payable {
    // To Be Done :  should test first that contractRef exist
    
    // only the Vendor can update a contract
    require(msg.sender == vendorAddr);

   uint i = getId(contractRef);
   if (i !=0){
        _contracts[i].xmlOpC_update = xmlopcont;
        _contracts[i].status = "UPDATE TO BE VALIDATED";
        
       /// Trigger the event
       ContractUpdated(contractRef);

   }
   else {
       // Trigger error
   }  
    
  }
  
  /// --------------------------------------------
  /// Validate a contract
  /// --------------------------------------------
  function validate(string contractRef) public payable {
    // To Be Done :  should test first that contractRef exist
    
    // only the Buyer can add a contract
    require(msg.sender == owner);
    
   uint i = getId(contractRef);
       
   if (i !=0){
       _contracts[i].status = "VALIDATED";
       _contracts[i].xmlOpContract = _contracts[i].xmlOpC_update;
       _contracts[i].xmlOpC_update = "";
       
       /// Trigger the event
       ContractValidated(contractRef);

   }
   else {
       // Trigger error
   }  

  }
  
  /// --------------------------------------------
  /// Vendor authorization to Kill the contract
  /// --------------------------------------------
  function killAuthorization() payable public {

    /// only the Vendor can authorize to kill the contract
    require(vendorAddr == msg.sender);

    okToKill = true;
   }

  /// --------------------------------------------
  /// Kill the contract
  /// --------------------------------------------
  function kill() payable public {

    /// only the owner can kill the contract
    require(owner == msg.sender);

    /// Only if buyer has authorized
    require(okToKill == true);
    
    /// Contract can only be killed if the Buyer has authorized
    selfdestruct(owner); //Destruct the contract
   }

  
  /// --------------------------------------------
  /// Check alive deployed contract
  /// --------------------------------------------
  function health() pure public returns (string) {
    return "running";
  }

  /// --------------------------------------------
  /// Util
  /// --------------------------------------------
  
  // compare string
  function compareString(string a, string b) internal returns (bool) {
    if(bytes(a).length != bytes(b).length) {
        return false;
    } else {
        return keccak256(a) == keccak256(b);
    }
  }
  
}
  
