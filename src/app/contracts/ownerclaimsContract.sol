pragma solidity ^0.4.2;

contract OwnerClaims {

    string constant public defaultKey = "default";

    mapping(address => mapping(string => string)) private owners;
 
    function setClaim(string key, string value) public payable {
        owners[msg.sender][key] = value;
    }

    function getClaim(address owner, string key) public constant returns (string) {
        return owners[owner][key];
    }

    function setDefaultClaim(string value) public payable {
        setClaim(defaultKey, value);
    }

    function getDefaultClaim(address owner) public constant returns (string) {
        return getClaim(owner, defaultKey);
    }

}

