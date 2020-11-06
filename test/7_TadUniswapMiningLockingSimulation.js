const truffleAssert = require('truffle-assertions');
var BN = web3.utils.BN;

const LPTokenTest = artifacts.require('LPTokenTest');
const TadTokenTest = artifacts.require('TadTokenTest');
const TadUniswapMining = artifacts.require('TadUniswapMining');
const TadUniswapMiningProxy = artifacts.require('TadUniswapMiningProxy');

var lpInstance;
var tadInstance;
var miningInstance;

const tadPerBlock = new BN("1150000000000000000");
const totalMiningBlockNum = new BN("200");
const maxClaimed = tadPerBlock.mul(totalMiningBlockNum)

contract('TadUniswapMining', (accounts) => {
    it('should deploy new contracts', async ()=>{
        lpInstance = await LPTokenTest.new();
        tadInstance = await TadTokenTest.new();
        miningProxyInstance = await TadUniswapMiningProxy.new(TadUniswapMining.address);
        miningInstance = await TadUniswapMining.at(miningProxyInstance.address);
        await miningInstance.initiate(0, totalMiningBlockNum.toString(), tadPerBlock.toString(), tadInstance.address, lpInstance.address); //block 0

        //block 1-3
        await miningInstance.doNothing();
        await miningInstance.doNothing();
        await miningInstance.doNothing();

    });

    it('should prepare LP distribution to all accounts', async()=>{
        for(i=0;i<10;i++){ //block 4-13
            await lpInstance.mint(accounts[i], "1000000000000000000000000", {from: accounts[0]});
        }
        for(i=0;i<10;i++){
            var balance = await lpInstance.balanceOf(accounts[i]);
            assert.equal(balance, "1000000000000000000000000", 'LP != 1000000 for account '+i);
        }
    });

    it('should prepare LP allowances to mining contract', async()=>{
        for(i=0;i<10;i++){ //block 14-23
            await lpInstance.approve(miningInstance.address, "1000000000000000000000000", {from: accounts[i]});
        }
        for(i=0;i<10;i++){
            var allowance = await lpInstance.allowance(accounts[i], miningInstance.address);
            assert.equal(allowance, "1000000000000000000000000", 'allowance != 1000000 LP for account '+i);
        }
    });

    it('should prepare TAD supply for mining contract', async()=>{
        //230 TAD, block 24
        await tadInstance.mint(miningInstance.address, "2300000000000000000000", {from: accounts[0]});
        var balance = await tadInstance.balanceOf(miningInstance.address);
        assert.equal(balance, "2300000000000000000000", 'TAD != 230');
    });

    it('should stake', async()=>{
        //block 25
        await miningInstance.stake(new BN("1000000000000000000000"), 0, {from: accounts[0]});

        //block 26
        await miningInstance.stake(new BN("1000000000000000000000"), 86400*30, {from: accounts[0]});

        //block 27
        await miningInstance.stake(new BN("1000000000000000000000"), 86400*90, {from: accounts[0]});

        //block 28
        await miningInstance.stake(new BN("1000000000000000000000"), 86400*180, {from: accounts[0]});

        //block 29
        await miningInstance.stake(new BN("1000000000000000000000"), 86400*360, {from: accounts[0]});

        //block 30
        await miningInstance.stake(new BN("1000000000000000000000"), 0, {from: accounts[1]});
    });

    it('should have 6000 LP', async()=>{
        var balance = await lpInstance.balanceOf(miningInstance.address);
        var totalStaked = await miningInstance.totalStaked();

        assert.equal(balance, "6000000000000000000000", 'Balance != 6000 LP');
        assert.equal(totalStaked, "6000000000000000000000", 'totalStaked != 6000 LP');

    });

    it('should have correct power value', async()=>{
        var totalStakedPower = await miningInstance.totalStakedPower();
        var stakerPower = await miningInstance.stakerPower(accounts[0]);


        assert.equal(totalStakedPower, "16000000000000000000000", 'totalStakedPower != 16000');
        assert.equal(stakerPower, "15000000000000000000000", 'stakerPower != 15000');

    });

    it('should claim correct TAD', async()=>{
        //block 31
        await miningInstance.unstake(0, "1000000000000000000000", {from: accounts[0]});
        var tadBalance0 = await tadInstance.balanceOf(accounts[0]);

        //1.15*24
        //1.15
        //1.15*1000/3000 + 1.15*2000/3000
        //1.15*1000/6000 + 1.15*2000/6000 + 1.15*3000/6000
        //1.15*1000/10000 + 1.15*2000/10000 + 1.15*3000/10000 + 1.15*4000/10000
        //1.15*1000/15000 + 1.15*2000/15000 + 1.15*3000/15000 + 1.15*4000/15000 + 1.15*5000/15000
        //1.15*1000/16000 + 1.15*2000/16000 + 1.15*3000/16000 + 1.15*4000/16000 + 1.15*5000/16000

        //check lt & gt because decimal not accurate, check for accuration 0.000001%
        assert(tadBalance0.lte(new BN("35578125000000000000")), 'tadBalance1 != 35.578125');
        assert(tadBalance0.gte(((new BN("35578125000000000000")).mul(new BN("99999999")).div(new BN("100000000")))), 'tadBalance1 != 35.578125');

        //block 32
        await miningInstance.unstake(0, "1000000000000000000000", {from: accounts[1]});
        var tadBalance1 = await tadInstance.balanceOf(accounts[1]);

        //1.15*1000/16000 + 1.15*1000/15000
        assert(tadBalance1.lte(new BN("148541666666666666")), 'tadBalance1 != 0.1485416667');
        assert(tadBalance1.gte(((new BN("148541666666666666")).mul(new BN("99999999")).div(new BN("100000000")))), 'tadBalance1 != 0.1485416667');

    });

    it('should revert unlocking locked stakes', async()=>{
        await truffleAssert.reverts(miningInstance.unstake(0, "1000000000000000000000", {from: accounts[0]}), "the stake is still locked");
        await truffleAssert.reverts(miningInstance.unstake(1, "1000000000000000000000", {from: accounts[0]}), "the stake is still locked");
        await truffleAssert.reverts(miningInstance.unstake(2, "1000000000000000000000", {from: accounts[0]}), "the stake is still locked");
        await truffleAssert.reverts(miningInstance.unstake(3, "1000000000000000000000", {from: accounts[0]}), "the stake is still locked");

        await truffleAssert.reverts(miningInstance.unstake(0, "1000000000000000000000", {from: accounts[1]}));
    });

    it('should stake more', async()=>{
        //block 33
        await miningInstance.stake(new BN("10000000000000000000000"), 360*86400, {from: accounts[2]});
    });

    it('should claim correct value after 10 blocks', async()=>{

        for(i=0;i<10;i++){ //block 34-43
         await miningInstance.doNothing();
        }

        //block 44
        await miningInstance.claimTad({from: accounts[2]});

        var tadBalance2 = await tadInstance.balanceOf(accounts[2]);

        //11 * 1.15*50000/64000 
        assert(tadBalance2.lte(new BN("9882812500000000000")), 'tadBalance2 != 9.8828125');
        assert(tadBalance2.gte(((new BN("9882812500000000000")).mul(new BN("99999999")).div(new BN("100000000")))), 'tadBalance2 != 9.8828125');
    });

    it('should revert unlocking locked stakes', async()=>{
        await truffleAssert.reverts(miningInstance.unstake(0, "10000000000000000000000", {from: accounts[2]}), "the stake is still locked");
    });




});