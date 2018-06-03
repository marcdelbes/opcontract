pragma solidity ^0.4.2;

contract Login {

    string constant private ATTEMPT = "attempt";
    string constant private CHALLENGE = "challenge";

    // compare 2 strings. Yeah, I know, that's crazy
    function compareStrings (string a, string b) public pure returns (bool){
       return keccak256(a) == keccak256(b);
    }

    // convert a string to an address. Yeah, I know, etc.
    function stringToAddress(string _address) public pure returns (address) {
     bytes memory tmp = bytes(_address);
     if (tmp.length != 42) return address(0x0); // wrong format anyway
     uint160 iaddr = 0;
     uint160 b1;
     uint160 b2;
     for (uint i=2; i<2+2*20; i+=2){
         iaddr *= 256;
         b1 = uint160(tmp[i]);
         b2 = uint160(tmp[i+1]);
         if ((b1 >= 97)&&(b1 <= 102)) b1 -= 87;
         else if ((b1 >= 48)&&(b1 <= 57)) b1 -= 48;
         if ((b2 >= 97)&&(b2 <= 102)) b2 -= 87;
         else if ((b2 >= 48)&&(b2 <= 57)) b2 -= 48;
         iaddr += (b1*16+b2);
     }
     return address(iaddr);
    }
  
    // store two (mirror) dictionnaries, to link account and emails
    // We will enforce the relationship between account and email to be 1 to 1
    mapping(address => string) private Accnt;
    mapping(string => address) private Email;
    
    // create a new entry to link an account to an email.
    // cleanup previous entries if necessary, so to maintain a 1 to 1 relationship
    function storeAccountAndEmail(address user, string email) public payable {
        
        string memory previousEmail = Accnt[user];
        address previousAddr = Email[email];
        
        // cleanup
        delete Email[previousEmail];
        delete Accnt[previousAddr];
        
        // store new values
        Accnt[user] = email;
        Email[email] = user;
    }
    
    // Helper function to read a value. should not be used here in production
    function checkAccnt(address user) public constant returns (string) {
        return Accnt[user];
    }
    
    // Helper function to read a value. should not be used here in production
    function checkEmail(string email) public constant returns (address) {
        return Email[email];
    }
    
    // given a string, which can be an account or an email, return the
    // corresponding account (if possible)
    function getAccount(string accountOrEmail) public constant returns (address) {
        
        address _a = stringToAddress(accountOrEmail); // convert the string to an address if possible
        bytes memory a = bytes(Accnt[_a]); // convert the account stored at _a to a bytes array for easy testing
        
        // now we check if we can find either the address or the email string    
        if ( a.length != 0) return _a; // we found something in the dictionnary, so it's an account, return it
        if (Email[accountOrEmail] != address(0x0) ) return Email[accountOrEmail]; // found something, it's an email, return corresponding address
        
        // found nothing. return null address
        return address(0x0);
    
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

    // Helper function to read a value. should not be used here in production
    function getEntry(address owner, string key) public constant returns (string) {
        return logons[owner][key];
    }


}

