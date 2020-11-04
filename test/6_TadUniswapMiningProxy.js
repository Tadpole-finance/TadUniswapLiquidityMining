const truffleAssert = require('truffle-assertions');
var BN = web3.utils.BN;

const LPTokenTest = artifacts.require('LPTokenTest');
const TadTokenTest = artifacts.require('TadTokenTest');
const TadUniswapMining = artifacts.require('TadUniswapMining');
const TadUniswapMiningProxy = artifacts.require('TadUniswapMiningProxy');

var lpInstance;
var tadInstance;
var miningInstance;
var miningProxyInstance;
var miningImplementationInstance;

const tadPerBlock = new BN("1150000000000000000");
const totalMiningBlockNum = new BN("200");
const maxClaimed = tadPerBlock.mul(totalMiningBlockNum)

contract('TadUniswapMining', (accounts) => {
    it('should deploy new contracts', async ()=>{
        lpInstance = await LPTokenTest.new();
        tadInstance = await TadTokenTest.new();
        miningImplementationInstance = await TadUniswapMining.new();
        miningProxyInstance = await TadUniswapMiningProxy.new(TadUniswapMining.address);
        miningInstance = await TadUniswapMining.at(miningProxyInstance.address);
        await miningInstance.initiate(0, totalMiningBlockNum.toString(), tadPerBlock.toString(), tadInstance.address, lpInstance.address); //block 0

    });

    it('should not be able to initiate twice', async()=>{

        await truffleAssert.reverts(miningInstance.initiate(0, totalMiningBlockNum.toString(), tadPerBlock.toString(), tadInstance.address, lpInstance.address), "contract is already initiated");
    });

    it('proxy contract is initiated', async()=>{
        initiated = await miningInstance.initiated();
        assert.equal(initiated, true, 'contract is not initiated on proxy contract');

    });

    it('implemantation contract is not initiated', async()=>{
        initiated = await miningImplementationInstance.initiated();
        assert.equal(initiated, false, 'contract is initiated on implementation contract');

    });

    it('should be able to change admin', async()=>{
        await miningProxyInstance._setAdmin(accounts[1], {from: accounts[0]});

        admin = await miningProxyInstance.admin();
    

        assert.equal(admin, accounts[1], 'admin is not account1');
        assert.equal(await miningInstance.admin(), admin, 'calling admin() through implementation abi returns different address');
    });

    it('should be able to change admin back', async()=>{
        await miningProxyInstance._setAdmin(accounts[0], {from: accounts[1]});

        admin = await miningProxyInstance.admin();
    

        assert.equal(admin, accounts[0], 'admin is not account1');
        assert.equal(await miningInstance.admin(), admin, 'calling admin() through implementation abi returns different address');
    });

    it('should revert change admin from unauthorized address', async()=>{
        await truffleAssert.reverts(miningProxyInstance._setAdmin(accounts[0], {from: accounts[1]}), "UNAUTHORIZED");
    });

    it('should revert on invalid implementation', async()=>{
        await truffleAssert.reverts(miningProxyInstance._setImplementation("0x0000000000000000000000000000000000000000", {from: accounts[0]}), "");
    });

    it('should revert set implementation as unauthorized address', async()=>{
        await truffleAssert.reverts(miningProxyInstance._setImplementation("0x0000000000000000000000000000000000000000", {from: accounts[1]}), "UNAUTHORIZED");
    });

    it('should be able to change to another implementation without impacting storage', async()=>{

        await tadInstance.mint(miningProxyInstance.address, "100000000000000000000000000", { from: accounts[0] });
        await lpInstance.mint(accounts[0], "10000000000000000000000000", { from: accounts[0] });
        await lpInstance.approve(miningProxyInstance.address, "500000000000000000000000000", { from: accounts[0] });
        await miningInstance.stake("1000000000000000000000", { from: accounts[0] });

        newGenesisImplementation = await TadUniswapMining.new();
        await miningProxyInstance._setImplementation(newGenesisImplementation.address, {from: accounts[0]});
        miningInstance = await TadUniswapMining.at(miningProxyInstance.address);

        assert.equal(await miningProxyInstance.implementation(), newGenesisImplementation.address, 'implementation not changed');

        totalStaked = await miningInstance.totalStaked();
        staked = await miningInstance.stakeHolders(accounts[0]);

        assert.equal(staked, "1000000000000000000000", 'stake is different');
        assert.equal(totalStaked, "1000000000000000000000", 'total staked is different');

    });



});