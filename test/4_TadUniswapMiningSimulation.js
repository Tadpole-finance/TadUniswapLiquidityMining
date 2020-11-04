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
        for(i=0;i<10;i++){ //block 25-34
            await miningInstance.stake(new BN("1000000000000000000000").mul(new BN(i+1)), {from: accounts[i]});
        }
        for(i=0;i<10;i++){
            var stake = await miningInstance.stakeHolders(accounts[i]);
            assert.equal(stake.toString(), new BN("1000000000000000000000").mul(new BN(i+1)).toString(), 'invalid stake for account '+i);
        }
    });

    it('should have 55000 LP', async()=>{
        var balance = await lpInstance.balanceOf(miningInstance.address);
        var totalStaked = await miningInstance.totalStaked();

        assert.equal(balance, "55000000000000000000000", 'Balance != 55000 LP');
        assert.equal(totalStaked, "55000000000000000000000", 'totalStaked != 55000 LP');

    });

    it('should be able to claim half of the stake for 5 accounts', async()=>{

        totalClaimed = new BN(0);

        for(i=0;i<5;i++){ //block 35-39
            await miningInstance.unstake(new BN("1000000000000000000000").mul(new BN(i+1)).div(new BN(2)), {from: accounts[i]});
            totalClaimed = totalClaimed.add(await tadInstance.balanceOf(accounts[i]));
        }
        var balance = await lpInstance.balanceOf(miningInstance.address);
        var totalStaked = await miningInstance.totalStaked();

        var totalClaimedCont = await miningInstance.totalClaimed();

        assert.equal(balance, "47500000000000000000000", 'Balance != 47500 LP');
        assert.equal(totalStaked, "47500000000000000000000", 'totalStaked != 47500 LP');

        assert.ok(totalClaimed.lt(maxClaimed), 'totalClaimed > maxClaimed');
        assert.equal(totalClaimedCont, totalClaimed.toString(), 'manual totalClaimed doesn\'t match totalClaimed() function');
        
    });

    it('should stake odd accounts only', async()=>{
        for(j=0;j<5;j++){ //block 40-44
            i = j*2+1;

            var balance_before = await miningInstance.stakeHolders(accounts[i]);

            var toStake = new BN("2500000000000000000000").mul(new BN(i+1));
            await miningInstance.stake(toStake, {from: accounts[i]});

            var stake = await miningInstance.stakeHolders(accounts[i]);
            var correctStake = toStake.add(balance_before)
            assert.equal(stake, correctStake.toString(), 'invalid stake for account '+i);
        }

    });

    it('should claim last 5 accounts', async()=>{
        for(i=5;i<10;i++){ //block 45-49
            // await miningInstance.doNothing();
            await miningInstance.claimTad({from: accounts[i]});
        }
    });

    it('should have equal totalClaimed', async()=>{

        var totalClaimedCont = new BN(0);

        for(i=0;i<10;i++){
            totalClaimedCont = totalClaimedCont.add(await tadInstance.balanceOf(accounts[i]));
        }

        var totalClaimed = await miningInstance.totalClaimed();


        assert.equal(totalClaimed, totalClaimedCont.toString(), 'manual totalClaimed calculation is different with totalClaimed()');
    });

    it('should stake until block 200', async()=>{
        for(i=0;i<150;i++){ //block 50-199
            j = i%10;
            // await miningInstance.doNothing();
            await miningInstance.stake(new BN("100000000000000000000").mul(new BN(i+1)), {from: accounts[j]});
        }
    });

    it('should have equal totalClaimed', async()=>{

        var totalClaimedCont = new BN(0);

        for(i=0;i<10;i++){
            totalClaimedCont = totalClaimedCont.add(await tadInstance.balanceOf(accounts[i]));
        }

        var totalClaimed = await miningInstance.totalClaimed();


        assert.equal(totalClaimed, totalClaimedCont.toString(), 'manual totalClaimed calculation is different with totalClaimed()');
    });

    it('should have equal totalStake', async()=>{

        var totalStakeCont = new BN(0);

        for(i=0;i<10;i++){
            totalStakeCont = totalStakeCont.add(await miningInstance.stakeHolders(accounts[i]));
        }

        var totalStake = await miningInstance.totalStaked();


        assert.equal(totalStake, totalStakeCont.toString(), 'manual totalStake calculation is different with totalStaked()');
    });

    it('should not able to stake after 200 blocks', async()=>{
        
        //block 200
        await truffleAssert.reverts(miningInstance.stake(new BN("100000000000000000000"), {from: accounts[0]}), "staking period has ended");

    });

    it('should be able to unstake 5 accounts', async()=>{
        for(i=0;i<5;i++){
            await miningInstance.unstake(0, {from: accounts[i]});
        }
    });

    it('should be able to claim 5 accounts', async()=>{
        for(i=5;i<10;i++){
            await miningInstance.claimTad({from: accounts[i]});
        }
    });

    it('should be able to unstake 5 accounts', async()=>{
        for(i=5;i<10;i++){
            await miningInstance.unstake(0, {from: accounts[i]});
        }
    });


    it('should have equal totalClaimed', async()=>{

        var totalClaimedCont = new BN(0);

        for(i=0;i<10;i++){
            totalClaimedCont = totalClaimedCont.add(await tadInstance.balanceOf(accounts[i]));
        }

        var totalClaimed = await miningInstance.totalClaimed();


        assert.equal(totalClaimed, totalClaimedCont.toString(), 'manual totalClaimed calculation is different with totalClaimed()');


    });

    it('should have 0 totalStaked', async()=>{
        var totalStake = await miningInstance.totalStaked();
        assert.equal(totalStake, 0, 'totalStaked() is not 0');

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