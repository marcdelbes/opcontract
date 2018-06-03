export interface IAppConfig {
    env: {
        name: string;
    };
    contracts: {
        claimContractAddr: string;
        loginContractAddr: string;
        loginContractAbi: string;
    };
}

