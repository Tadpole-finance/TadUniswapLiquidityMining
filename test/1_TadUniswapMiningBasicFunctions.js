var BN = web3.utils.BN;

const LPTokenTest = artifacts.require('LPTokenTest');
const TadTokenTest = artifacts.require('TadTokenTest');
const TadUniswapMining = artifacts.require('TadUniswapMining');

var tadTokenTestInstance;
var lpTokenTestInstance;

contract('TadUniswapMining', (accounts) => {


    it('should mint 1000000 TAD to Mining Contract', async () => {
        tadTokenTestInstance = await TadTokenTest.deployed();

        //block 1
        await tadTokenTestInstance.mint(TadUniswapMining.address, "100000000000000000000000000", { from: accounts[0] });

        const balance = await tadTokenTestInstance.balanceOf(TadUniswapMining.address);
        assert.equal(balance, "100000000000000000000000000", 'The balance is not 1000000 TAD');
    });

    it('should mint 100000 LP Token to the first account', async () => {
        lpTokenTestInstance = await LPTokenTest.deployed();

        //block 2
        await lpTokenTestInstance.mint(accounts[0], "10000000000000000000000000", { from: accounts[0] });

        const balance = await lpTokenTestInstance.balanceOf(accounts[0]);
        assert.equal(balance, "10000000000000000000000000", 'The balance is not 100000 LP Token');
    });

    it('should approve 5000000 LP Token to Mining address', async () => {
        lpTokenTestInstance = await LPTokenTest.deployed();

        //block 3
        await lpTokenTestInstance.approve(TadUniswapMining.address, "500000000000000000000000000", { from: accounts[0] });

        const allowance = await lpTokenTestInstance.allowance(accounts[0], TadUniswapMining.address);
        assert.equal(allowance, "500000000000000000000000000", 'The allowance is not 5000000 LP Token');
    });

    it('should stake 1000 LP Token', async () => {

        miningInstance = await TadUniswapMining.deployed();
        
        //block 4
        await miningInstance.stake("1000000000000000000000", { from: accounts[0] });

        const stake = await miningInstance.stakeHolders(accounts[0]);
        assert.equal(stake, "1000000000000000000000", 'The stake is not 1000 LP Token');

    });

    //after 5 blocks should claim 5*1.15 TAD
    it('should claim 5.75 TAD', async () =>{
        miningInstance = await TadUniswapMining.deployed();

        //block 5
        await miningInstance.claimTad({ from: accounts[0] });
        balance = await tadTokenTestInstance.balanceOf(accounts[0]);
        assert.equal(balance.toString(), "5750000000000000000", 'Didnt claim 5.75 LP Token');
    });

    it('should claim 115 TAD after 100 blocks', async () =>{

        miningInstance = await TadUniswapMining.deployed();
        
        //block 6
        await lpTokenTestInstance.mint(accounts[1], "10000000000000000000000000", { from: accounts[0] });

        for(i=0; i<93; i++){ //block 7-99
            await miningInstance.doNothing({ from: accounts[0] });
        }

        //block 100
        await miningInstance.claimTad({ from: accounts[0] });
        balance = await tadTokenTestInstance.balanceOf(accounts[0]);

        assert.equal(balance, "115000000000000000000", 'Didnt claim 115 TAD');
    });

    it('should claim 0.23 TAD for account1 after stake 250 LP Token', async () =>{

        miningInstance = await TadUniswapMining.deployed();

        //block 101
        await lpTokenTestInstance.approve(TadUniswapMining.address, "500000000000000000000000000", { from: accounts[1] });
        
        //stake 250 LP Token for account 1
        //block 102
        await miningInstance.stake("250000000000000000000", { from: accounts[1] }); 

        //block 103
        await miningInstance.claimTad({ from: accounts[1] });
        
        balance = await tadTokenTestInstance.balanceOf(accounts[1]);

        //(1.15)/1250*250
        assert.equal(balance, "230000000000000000", 'Didnt claim 0.23 TAD');
    });

    it('should claim more 1.15 TAD for account1 after 5 blocks', async () =>{

        miningInstance = await TadUniswapMining.deployed();

        for(i=0; i<4; i++){ //block 104-107
            await miningInstance.doNothing({ from: accounts[1] });
        }

        //block 108
        await miningInstance.claimTad({ from: accounts[1] });
        
        balance = await tadTokenTestInstance.balanceOf(accounts[1]);

        //(1.15)/1250*250*5+0.23
        assert.equal(balance, "1380000000000000000", 'Not claming extra 1.15 TAD');
    });


    it('should have 123.74 TAD for account0', async () =>{

        miningInstance = await TadUniswapMining.deployed();

        //block 109
        await miningInstance.claimTad({ from: accounts[0] });
        
        balance = await tadTokenTestInstance.balanceOf(accounts[0]);

        //1.15/1250*1000 * (109-102) + 1.15/1000*1000 * (102-100) + 115
        assert.equal(balance.toString(), "123740000000000000000", 'Did not claim 123.74 TAD');
    });

    it('should accept stake of 1250 LP Token from account2', async() => {

        miningInstance = await TadUniswapMining.deployed();

        //block 110
        await lpTokenTestInstance.mint(accounts[2], "100000000000000000000000", { from: accounts[0] });

        //block 111
        await lpTokenTestInstance.approve(TadUniswapMining.address, "500000000000000000000000000", { from: accounts[2] });
        
        //block 112
        await miningInstance.stake("1250000000000000000000", { from: accounts[2] }); 

        stake = await miningInstance.stakeHolders(accounts[2]);
        assert.equal(stake, "1250000000000000000000", 'Stake account2 != 1250 LP Token');

    });

    it('should be able to unstake 500 LP Token from account2', async()=>{
        miningInstance = await TadUniswapMining.deployed();

        //block 113
        await miningInstance.unstake("500000000000000000000", { from: accounts[2] }); 

        stake = await miningInstance.stakeHolders(accounts[2]);
        assert.equal(stake, "750000000000000000000", 'Stake account2 != 750 LP Token');
    });

    it('should give correct claim balances after current block exceeds endMiningBlockNum', async()=>{

        miningInstance = await TadUniswapMining.deployed();
        
        for(i=0; i<100; i++){ //block 114-213
            await miningInstance.doNothing({ from: accounts[0] });
        }

        await miningInstance.claimTad({ from: accounts[0] });
        await miningInstance.claimTad({ from: accounts[1] });
        await miningInstance.claimTad({ from: accounts[2] });

        balance0 = await tadTokenTestInstance.balanceOf(accounts[0]);
        balance1 = await tadTokenTestInstance.balanceOf(accounts[1]);
        balance2 = await tadTokenTestInstance.balanceOf(accounts[2]);

        // 123.74+ (112−109)÷1250×1000×1.15 + (113−112)÷2500×1000×1.15 + (200−113)÷2000×1000×1.15 = 176.985
        assert.equal(balance0.toString(), "176985000000000000000", 'balance account0 != 175.145 TAD');
        
        // (112−102)÷1250×250×1.15 + (113−112)÷2500×250×1.15 + (200−113)÷2000×250×1.15
        assert.equal(balance1.toString(), "14921250000000000000", 'balance account1 != 14.92125 TAD');
        
        // 0+(1.15÷2000×750)×(200−113)+(1.15÷2500×1250)×(113−112) = 38.09375
        assert.equal(balance2.toString(), "38093750000000000000", 'balance account2 != 38.09375 TAD');

    });

    it("should return correct LP Token value when unstake", async()=>{

        miningInstance = await TadUniswapMining.deployed();

        balance0_before = await lpTokenTestInstance.balanceOf(accounts[0]);
        balance1_before = await lpTokenTestInstance.balanceOf(accounts[1]);
        balance2_before = await lpTokenTestInstance.balanceOf(accounts[2]);

        await miningInstance.unstake(0, { from: accounts[0] });
        await miningInstance.unstake(0, { from: accounts[1] });
        await miningInstance.unstake(0, { from: accounts[2] });

        balance0_after = await lpTokenTestInstance.balanceOf(accounts[0]);
        balance1_after = await lpTokenTestInstance.balanceOf(accounts[1]);
        balance2_after = await lpTokenTestInstance.balanceOf(accounts[2]);

        assert.equal(new BN(balance0_after).sub(new BN(balance0_before)), "1000000000000000000000", 'unstake account0 != 1000 LP Token');
        assert.equal(new BN(balance1_after).sub(new BN(balance1_before)), "250000000000000000000", 'unstake account0 != 250 LP Token');
        assert.equal(new BN(balance2_after).sub(new BN(balance2_before)), "750000000000000000000", 'unstake account0 != 1250 LP Token');

    });

    it("should hold 0 LP Token", async()=>{
        
        miningInstance = await TadUniswapMining.deployed();

        lpBalanceMining = await lpTokenTestInstance.balanceOf(TadUniswapMining.address);
        totalStaked = await miningInstance.totalStaked();


        assert.equal(lpBalanceMining, "0", 'LP Token balance in mining contract is supposed to be 0');
        assert.equal(totalStaked, "0", 'total stake is supposed to be 0');
        
    });

    

    

});