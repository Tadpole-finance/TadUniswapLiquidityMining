const truffleAssert = require('truffle-assertions');
var BN = web3.utils.BN;

const TenTokenTest = artifacts.require('TenTokenTest');
const TadTokenTest = artifacts.require('TadTokenTest');
const TadGenesisMining = artifacts.require('TadGenesisMining');
const TadGenesisMiningProxy = artifacts.require('TadGenesisMiningProxy');

var tenInstance;
var tadInstance;
var genesisInstance;

const tadPerBlock = new BN("1150000000000000000");
const totalGenesisBlockNum = new BN("200");
const maxClaimed = tadPerBlock.mul(totalGenesisBlockNum)

contract('TadGenesisMining', (accounts) => {
    it('should deploy new contracts', async ()=>{
        tenInstance = await TenTokenTest.new();
        tadInstance = await TadTokenTest.new();
        genesisProxyInstance = await TadGenesisMiningProxy.new(TadGenesisMining.address);
        genesisInstance = await TadGenesisMining.at(genesisProxyInstance.address);
        await genesisInstance.initiate(0, totalGenesisBlockNum.toString(), tadPerBlock.toString(), tadInstance.address, tenInstance.address); //block 0

        //block 1-3
        await genesisInstance.doNothing();
        await genesisInstance.doNothing();
        await genesisInstance.doNothing();

    });

    it('should prepare TEN distribution to all accounts', async()=>{
        for(i=0;i<10;i++){ //block 4-13
            await tenInstance.mint(accounts[i], "1000000000000000000000000", {from: accounts[0]});
        }
        for(i=0;i<10;i++){
            var balance = await tenInstance.balanceOf(accounts[i]);
            assert.equal(balance, "1000000000000000000000000", 'TEN != 1000000 for account '+i);
        }
    });

    it('should prepare TEN allowances to genesis contract', async()=>{
        for(i=0;i<10;i++){ //block 14-23
            await tenInstance.approve(genesisInstance.address, "1000000000000000000000000", {from: accounts[i]});
        }
        for(i=0;i<10;i++){
            var allowance = await tenInstance.allowance(accounts[i], genesisInstance.address);
            assert.equal(allowance, "1000000000000000000000000", 'allowance != 1000000 TEN for account '+i);
        }
    });

    it('should prepare TAD supply for genesis contract', async()=>{
        //230 TAD, block 24
        await tadInstance.mint(genesisInstance.address, "2300000000000000000000", {from: accounts[0]});
        var balance = await tadInstance.balanceOf(genesisInstance.address);
        assert.equal(balance, "2300000000000000000000", 'TAD != 230');
    });

    it('should stake', async()=>{
        for(i=0;i<10;i++){ //block 25-34
            await genesisInstance.stake(new BN("1000000000000000000000").mul(new BN(i+1)), {from: accounts[i]});
        }
        for(i=0;i<10;i++){
            var stake = await genesisInstance.stakeHolders(accounts[i]);
            assert.equal(stake.toString(), new BN("1000000000000000000000").mul(new BN(i+1)).toString(), 'invalid stake for account '+i);
        }
    });

    it('should have 55000 TEN', async()=>{
        var balance = await tenInstance.balanceOf(genesisInstance.address);
        var totalStaked = await genesisInstance.totalStaked();

        assert.equal(balance, "55000000000000000000000", 'Balance != 55000 TEN');
        assert.equal(totalStaked, "55000000000000000000000", 'totalStaked != 55000 TEN');

    });

    it('should be able to claim half of the stake for 5 accounts', async()=>{

        totalClaimed = new BN(0);

        for(i=0;i<5;i++){ //block 35-39
            await genesisInstance.unstake(new BN("1000000000000000000000").mul(new BN(i+1)).div(new BN(2)), {from: accounts[i]});
            totalClaimed = totalClaimed.add(await tadInstance.balanceOf(accounts[i]));
        }
        var balance = await tenInstance.balanceOf(genesisInstance.address);
        var totalStaked = await genesisInstance.totalStaked();

        var totalClaimedCont = await genesisInstance.totalClaimed();

        assert.equal(balance, "47500000000000000000000", 'Balance != 47500 TEN');
        assert.equal(totalStaked, "47500000000000000000000", 'totalStaked != 47500 TEN');

        assert.ok(totalClaimed.lt(maxClaimed), 'totalClaimed > maxClaimed');
        assert.equal(totalClaimedCont, totalClaimed.toString(), 'manual totalClaimed doesn\'t match totalClaimed() function');
        
    });

    it('should stake odd accounts only', async()=>{
        for(j=0;j<5;j++){ //block 40-44
            i = j*2+1;

            var balance_before = await genesisInstance.stakeHolders(accounts[i]);

            var toStake = new BN("2500000000000000000000").mul(new BN(i+1));
            await genesisInstance.stake(toStake, {from: accounts[i]});

            var stake = await genesisInstance.stakeHolders(accounts[i]);
            var correctStake = toStake.add(balance_before)
            assert.equal(stake, correctStake.toString(), 'invalid stake for account '+i);
        }

    });

    it('should claim last 5 accounts', async()=>{
        for(i=5;i<10;i++){ //block 45-49
            // await genesisInstance.doNothing();
            await genesisInstance.claimTad({from: accounts[i]});
        }
    });

    it('should have equal totalClaimed', async()=>{

        var totalClaimedCont = new BN(0);

        for(i=0;i<10;i++){
            totalClaimedCont = totalClaimedCont.add(await tadInstance.balanceOf(accounts[i]));
        }

        var totalClaimed = await genesisInstance.totalClaimed();


        assert.equal(totalClaimed, totalClaimedCont.toString(), 'manual totalClaimed calculation is different with totalClaimed()');
    });

    it('should stake until block 200', async()=>{
        for(i=0;i<150;i++){ //block 50-199
            j = i%10;
            // await genesisInstance.doNothing();
            await genesisInstance.stake(new BN("100000000000000000000").mul(new BN(i+1)), {from: accounts[j]});
        }
    });

    it('should have equal totalClaimed', async()=>{

        var totalClaimedCont = new BN(0);

        for(i=0;i<10;i++){
            totalClaimedCont = totalClaimedCont.add(await tadInstance.balanceOf(accounts[i]));
        }

        var totalClaimed = await genesisInstance.totalClaimed();


        assert.equal(totalClaimed, totalClaimedCont.toString(), 'manual totalClaimed calculation is different with totalClaimed()');
    });

    it('should have equal totalStake', async()=>{

        var totalStakeCont = new BN(0);

        for(i=0;i<10;i++){
            totalStakeCont = totalStakeCont.add(await genesisInstance.stakeHolders(accounts[i]));
        }

        var totalStake = await genesisInstance.totalStaked();


        assert.equal(totalStake, totalStakeCont.toString(), 'manual totalStake calculation is different with totalStaked()');
    });

    it('should not able to stake after 200 blocks', async()=>{
        
        //block 200
        await truffleAssert.reverts(genesisInstance.stake(new BN("100000000000000000000"), {from: accounts[0]}), "staking period has ended");

    });

    it('should be able to unstake 5 accounts', async()=>{
        for(i=0;i<5;i++){
            await genesisInstance.unstake(0, {from: accounts[i]});
        }
    });

    it('should be able to claim 5 accounts', async()=>{
        for(i=5;i<10;i++){
            await genesisInstance.claimTad({from: accounts[i]});
        }
    });

    it('should be able to unstake 5 accounts', async()=>{
        for(i=5;i<10;i++){
            await genesisInstance.unstake(0, {from: accounts[i]});
        }
    });


    it('should have equal totalClaimed', async()=>{

        var totalClaimedCont = new BN(0);

        for(i=0;i<10;i++){
            totalClaimedCont = totalClaimedCont.add(await tadInstance.balanceOf(accounts[i]));
        }

        var totalClaimed = await genesisInstance.totalClaimed();


        assert.equal(totalClaimed, totalClaimedCont.toString(), 'manual totalClaimed calculation is different with totalClaimed()');


    });

    it('should have 0 totalStaked', async()=>{
        var totalStake = await genesisInstance.totalStaked();
        assert.equal(totalStake, 0, 'totalStaked() is not 0');

    });

    it('should have totalClaimed <= maxClaimed', async()=>{

        totalClaimed = new BN(0);

        for(i=0;i<10;i++){
            totalClaimed = totalClaimed.add(await tadInstance.balanceOf(accounts[i]));
        }

        var totalClaimedCont = await genesisInstance.totalClaimed();

        assert.ok(totalClaimed.lt(maxClaimed), 'totalClaimed > maxClaimed');
        assert.equal(totalClaimedCont.toString(), totalClaimed.toString(), 'manual totalClaimed doesn\'t match totalClaimed() function');
        
        console.log(totalClaimed.toString());
    });



});