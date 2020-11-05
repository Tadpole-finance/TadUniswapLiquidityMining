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

        //block 1-100
        for(i=0; i<100; i++){
            await miningInstance.doNothing();
        }
        

    });

    it('should prepare LP distribution to all accounts', async()=>{
        for(i=0;i<10;i++){ //block 101-110
            await lpInstance.mint(accounts[i], "1000000000000000000000000", {from: accounts[0]});

            var balance = await lpInstance.balanceOf(accounts[i]);
            assert.equal(balance, "1000000000000000000000000", 'LP != 1000000 for account '+i);
        }
    });

    it('should prepare LP allowances to mining contract', async()=>{
        for(i=0;i<10;i++){ //block 111-120
            await lpInstance.approve(miningInstance.address, "1000000000000000000000000", {from: accounts[i]});

            var allowance = await lpInstance.allowance(accounts[i], miningInstance.address);
            assert.equal(allowance, "1000000000000000000000000", 'allowance != 1000000 LP for account '+i);
        }
    });

    it('should prepare TAD supply for mining contract', async()=>{
        //230 TAD, block 121
        await tadInstance.mint(miningInstance.address, "2300000000000000000000", {from: accounts[0]});

        var balance = await tadInstance.balanceOf(miningInstance.address);
        assert.equal(balance, "2300000000000000000000", 'TAD != 230');
    });

    it('should stake', async()=>{
        for(i=0;i<10;i++){ //block 122-131
            await miningInstance.stake(new BN("1000000000000000000000").mul(new BN(i+1)), 0, {from: accounts[i]});

            var stake = await miningInstance.stakeHolders(accounts[i]);
            assert.equal(stake.toString(), new BN("1000000000000000000000").mul(new BN(i+1)).toString(), 'invalid stake for account '+i);
        }
    });

    it('should stake until block 200', async()=>{
        for(i=0;i<68;i++){ //block 132-199
            j = i%10;
            await miningInstance.stake(new BN("100000000000000000000").mul(new BN(i+1)), 0, {from: accounts[j]});
        }
    });

    it('should not be able to stake after 200 blocks', async()=>{

        await truffleAssert.reverts(miningInstance.stake(new BN("100000000000000000000"), 0, {from: accounts[0]}), "staking period has ended");

    });

    it('should be able to claim all accounts', async()=>{
        for(i=0;i<10;i++){
            await miningInstance.claimTad({from: accounts[i]});
        }
    });

    it('should be able to unstake all accounts', async()=>{
        for(i=0;i<10;i++){
            stakeCount = await miningInstance.stakeCount(accounts[i]);
            for(j=0;j<stakeCount.toNumber();j++){
                await miningInstance.unstake(0, {from: accounts[i]});
            }
        }
    });

    it('should have totalClaimed <= maxClaimed', async()=>{

        totalClaimed = new BN(0);

        for(i=0;i<10;i++){
            totalClaimed = totalClaimed.add(await tadInstance.balanceOf(accounts[i]));
        }

        var totalClaimedCont = await miningInstance.totalClaimed();

        assert.ok(totalClaimed.lt(maxClaimed), 'totalClaimed > maxClaimed');
        assert.equal(totalClaimedCont.toString(), totalClaimed.toString(), 'manual totalClaimed doesn\'t match totalClaimed() function');
        
        console.log(totalClaimed.toString());
    });



});