export interface IAppConfig {
    env: {
        name: string;
    };
    contracts: {
        claimContractAddr: string;
        loginContractAddr: string;
        loginContractAbi: string;
        p2pContractAddr: string;
        p2pContractAbi: string;
    	opContractAddr: string; 
    	opContractAbi: string;
        vendorAddr: string;
        vendorPwd: string;
        buyerAddr: string;
        buyerPwd: string;
    };
}

