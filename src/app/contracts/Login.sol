pragma solidity ^0.4.2;

contract Login {

    string constant private ATTEMPT = "attempt";
    string constant private CHALLENGE = "challenge";

    function compareStrings (string a, string b) public pure returns (bool){
       return keccak256(a) == keccak256(b);
    }
   
    // For each account, store a mapping of string values
    // in this version we manage 2 kinds of value
    // - CHALLENGE, set by the server upon application request
    // - ATTEMPT, set by the application to prove identity
    // A successful logon requires that CHALLENGE and ATTEMPT are identical
    mapping(address => mapping(string => string)) private logons;
 
    // called by the server to setup a new challenge for a given user
    // FIXME we should limit this function to an 'admin' account only
    function setChallenge(address user, string value) public payable {
        logons[user][CHALLENGE] = value;
    }

    // Called by the application (via a signed transaction) with the challenge 
    // provided by the server
    function loginAttempt(string challenge) public payable {
        logons[msg.sender][ATTEMPT] = challenge;
    }

    // Check if the logon information is matching
    // FIXME we should limit this function to an 'admin' account only
    function isMatching(address user) public constant returns (bool) {
        return compareStrings(logons[user][ATTEMPT],logons[user][CHALLENGE]);
    }
    
    // Helper function to read a value. should not be used in real world 
    function getEntry(address owner, string key) public constant returns (string) {
        return logons[owner][key];
    }


}


