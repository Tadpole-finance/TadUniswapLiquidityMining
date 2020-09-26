const TenTokenTest = artifacts.require('TenTokenTest');
const TadTokenTest = artifacts.require('TadTokenTest');
const TadGenesisMining = artifacts.require('TadGenesisMining');

var tadTokenTestInstance;
var tenTokenTestInstance;

contract('TadGenesisMining', (accounts) => {
    it('should mint 1000000 TAD to Genesis Contract', async () => {
        tadTokenTestInstance = await TadTokenTest.deployed();

        //block 1
        await tadTokenTestInstance.mint(TadGenesisMining.address, "100000000000000000000000000", { from: accounts[0] });

        const balance = await tadTokenTestInstance.balanceOf(TadGenesisMining.address);
        assert.equal(balance, "100000000000000000000000000", 'The balance is not 1000000 TAD');
    });

    it('should mint 100000 TEN to the first account', async () => {
        tenTokenTestInstance = await TenTokenTest.deployed();

        //block 2
        await tenTokenTestInstance.mint(accounts[0], "10000000000000000000000000", { from: accounts[0] });

        const balance = await tenTokenTestInstance.balanceOf(accounts[0]);
        assert.equal(balance, "10000000000000000000000000", 'The balance is not 100000 TEN');
    });

    it('should approve 5000000 TEN to Genesis address', async () => {
        tenTokenTestInstance = await TenTokenTest.deployed();

        //block 3
        await tenTokenTestInstance.approve(TadGenesisMining.address, "500000000000000000000000000", { from: accounts[0] });

        const allowance = await tenTokenTestInstance.allowance(accounts[0], TadGenesisMining.address);
        assert.equal(allowance, "500000000000000000000000000", 'The allowance is not 5000000 TEN');
    });

    it('should stake 1000 TEN', async () => {

        genesisInstance = await TadGenesisMining.deployed();
        
        //block 4
        await genesisInstance.stake("1000000000000000000000", { from: accounts[0] });

        const stake = await genesisInstance.stakeHolders(accounts[0]);
        assert.equal(stake, "1000000000000000000000", 'The stake is not 1000 TEN');

    });

    //after 5 blocks should claim 5*1.15 TAD
    it('should claim 5.75 TAD', async () =>{
        genesisInstance = await TadGenesisMining.deployed();

        //block 5
        await genesisInstance.claimTad({ from: accounts[0] });
        balance = await tadTokenTestInstance.balanceOf(accounts[0]);
        assert.equal(balance, "5750000000000000000", 'Didnt claim 5.75 TEN');
    });

    it('should claim 115 TAD after 100 blocks', async () =>{
        for(i=0; i<94; i++){ //block 6-99
            await tenTokenTestInstance.mint(accounts[1], "100000000000000000000000", { from: accounts[0] });
        }

        genesisInstance = await TadGenesisMining.deployed();

        //block 100
        await genesisInstance.claimTad({ from: accounts[0] });
        balance = await tadTokenTestInstance.balanceOf(accounts[0]);

        assert.equal(balance, "115000000000000000000", 'Didnt claim 115 TAD');
    });

    it('should claim 0.23 TAD for account1 after stake 250 TEN', async () =>{

        genesisInstance = await TadGenesisMining.deployed();

        //block 101
        await tenTokenTestInstance.approve(TadGenesisMining.address, "500000000000000000000000000", { from: accounts[1] });
        
        //stake 250 TEN for account 1
        //block 102
        await genesisInstance.stake("250000000000000000000", { from: accounts[1] }); 

        //block 103
        await genesisInstance.claimTad({ from: accounts[1] });
        
        balance = await tadTokenTestInstance.balanceOf(accounts[1]);

        //(1.15)/1250*250
        assert.equal(balance, "230000000000000000", 'Didnt claim 0.23 TAD');
    });

    it('should claim more 1.15 TAD for account1 after 5 blocks', async () =>{

        genesisInstance = await TadGenesisMining.deployed();

        for(i=0; i<4; i++){ //block 104-107
            await tenTokenTestInstance.mint(accounts[1], "100000000000000000000000", { from: accounts[0] });
        }

        //block 108
        await genesisInstance.claimTad({ from: accounts[1] });
        
        balance = await tadTokenTestInstance.balanceOf(accounts[1]);

        //(1.15)/1250*250*5+0.23
        assert.equal(balance, "1380000000000000000", 'Not claming extra 1.15 TAD');
    });


    it('should claim 8.28 TAD for account0 after 9 blocks since last claim', async () =>{

        genesisInstance = await TadGenesisMining.deployed();

        //block 109
        await genesisInstance.claimTad({ from: accounts[0] });
        
        balance = await tadTokenTestInstance.balanceOf(accounts[0]);

        //1.15/1250*1000 * 9 + 115
        assert.equal(balance, "123280000000000000000", 'Did not claim 8.28 TAD');
    });

    

    

});