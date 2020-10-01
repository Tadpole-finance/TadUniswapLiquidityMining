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

        //block 1-100
        for(i=0; i<100; i++){
            await genesisInstance.doNothing();
        }
        

    });

    it('should prepare TEN distribution to all accounts', async()=>{
        for(i=0;i<10;i++){ //block 101-110
            await tenInstance.mint(accounts[i], "1000000000000000000000000", {from: accounts[0]});

            var balance = await tenInstance.balanceOf(accounts[i]);
            assert.equal(balance, "1000000000000000000000000", 'TEN != 1000000 for account '+i);
        }
    });

    it('should prepare TEN allowances to genesis contract', async()=>{
        for(i=0;i<10;i++){ //block 111-120
            await tenInstance.approve(genesisInstance.address, "1000000000000000000000000", {from: accounts[i]});

            var allowance = await tenInstance.allowance(accounts[i], genesisInstance.address);
            assert.equal(allowance, "1000000000000000000000000", 'allowance != 1000000 TEN for account '+i);
        }
    });

    it('should prepare TAD supply for genesis contract', async()=>{
        //230 TAD, block 121
        await tadInstance.mint(genesisInstance.address, "2300000000000000000000", {from: accounts[0]});

        var balance = await tadInstance.balanceOf(genesisInstance.address);
        assert.equal(balance, "2300000000000000000000", 'TAD != 230');
    });

    it('should stake', async()=>{
        for(i=0;i<10;i++){ //block 122-131
            await genesisInstance.stake(new BN("1000000000000000000000").mul(new BN(i+1)), {from: accounts[i]});

            var stake = await genesisInstance.stakeHolders(accounts[i]);
            assert.equal(stake.toString(), new BN("1000000000000000000000").mul(new BN(i+1)).toString(), 'invalid stake for account '+i);
        }
    });

    it('should stake until block 200', async()=>{
        for(i=0;i<68;i++){ //block 132-199
            j = i%10;
            await genesisInstance.stake(new BN("100000000000000000000").mul(new BN(i+1)), {from: accounts[j]});
        }
    });

    it('should not able to stake after 200 blocks', async()=>{

        await truffleAssert.reverts(genesisInstance.stake(new BN("100000000000000000000"), {from: accounts[0]}), "staking period has ended");

    });

    it('should be able to claim all accounts', async()=>{
        for(i=0;i<10;i++){
            await genesisInstance.claimTad({from: accounts[i]});
        }
    });

    it('should be able to unstake all accounts', async()=>{
        for(i=0;i<10;i++){
            await genesisInstance.unstake(0, {from: accounts[i]});
        }
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