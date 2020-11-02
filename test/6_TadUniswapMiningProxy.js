const truffleAssert = require('truffle-assertions');
var BN = web3.utils.BN;

const TenTokenTest = artifacts.require('TenTokenTest');
const TadTokenTest = artifacts.require('TadTokenTest');
const TadGenesisMining = artifacts.require('TadGenesisMining');
const TadGenesisMiningProxy = artifacts.require('TadGenesisMiningProxy');

var tenInstance;
var tadInstance;
var genesisInstance;
var genesisProxyInstance;
var genesisImplementationInstance;

const tadPerBlock = new BN("1150000000000000000");
const totalGenesisBlockNum = new BN("200");
const maxClaimed = tadPerBlock.mul(totalGenesisBlockNum)

contract('TadGenesisMining', (accounts) => {
    it('should deploy new contracts', async ()=>{
        tenInstance = await TenTokenTest.new();
        tadInstance = await TadTokenTest.new();
        genesisImplementationInstance = await TadGenesisMining.new();
        genesisProxyInstance = await TadGenesisMiningProxy.new(TadGenesisMining.address);
        genesisInstance = await TadGenesisMining.at(genesisProxyInstance.address);
        await genesisInstance.initiate(0, totalGenesisBlockNum.toString(), tadPerBlock.toString(), tadInstance.address, tenInstance.address); //block 0

    });

    it('should not be able to initiate twice', async()=>{

        await truffleAssert.reverts(genesisInstance.initiate(0, totalGenesisBlockNum.toString(), tadPerBlock.toString(), tadInstance.address, tenInstance.address), "contract is already initiated");
    });

    it('proxy contract is initiated', async()=>{
        initiated = await genesisInstance.initiated();
        assert.equal(initiated, true, 'contract is not initiated on proxy contract');

    });

    it('implemantation contract is not initiated', async()=>{
        initiated = await genesisImplementationInstance.initiated();
        assert.equal(initiated, false, 'contract is initiated on implementation contract');

    });

    it('should be able to change admin', async()=>{
        await genesisProxyInstance._setAdmin(accounts[1], {from: accounts[0]});

        admin = await genesisProxyInstance.admin();
    

        assert.equal(admin, accounts[1], 'admin is not account1');
        assert.equal(await genesisInstance.admin(), admin, 'calling admin() through implementation abi returns different address');
    });

    it('should be able to change admin back', async()=>{
        await genesisProxyInstance._setAdmin(accounts[0], {from: accounts[1]});

        admin = await genesisProxyInstance.admin();
    

        assert.equal(admin, accounts[0], 'admin is not account1');
        assert.equal(await genesisInstance.admin(), admin, 'calling admin() through implementation abi returns different address');
    });

    it('should revert change admin from unauthorized address', async()=>{
        await truffleAssert.reverts(genesisProxyInstance._setAdmin(accounts[0], {from: accounts[1]}), "UNAUTHORIZED");
    });

    it('should revert on invalid implementation', async()=>{
        await truffleAssert.reverts(genesisProxyInstance._setImplementation("0x0000000000000000000000000000000000000000", {from: accounts[0]}), "");
    });

    it('should revert set implementation as unauthorized address', async()=>{
        await truffleAssert.reverts(genesisProxyInstance._setImplementation("0x0000000000000000000000000000000000000000", {from: accounts[1]}), "UNAUTHORIZED");
    });

    it('should be able to change to another implementation without impacting storage', async()=>{

        await tadInstance.mint(genesisProxyInstance.address, "100000000000000000000000000", { from: accounts[0] });
        await tenInstance.mint(accounts[0], "10000000000000000000000000", { from: accounts[0] });
        await tenInstance.approve(genesisProxyInstance.address, "500000000000000000000000000", { from: accounts[0] });
        await genesisInstance.stake("1000000000000000000000", { from: accounts[0] });

        newGenesisImplementation = await TadGenesisMining.new();
        await genesisProxyInstance._setImplementation(newGenesisImplementation.address, {from: accounts[0]});
        genesisInstance = await TadGenesisMining.at(genesisProxyInstance.address);

        assert.equal(await genesisProxyInstance.implementation(), newGenesisImplementation.address, 'implementation not changed');

        totalStaked = await genesisInstance.totalStaked();
        staked = await genesisInstance.stakeHolders(accounts[0]);

        assert.equal(staked, "1000000000000000000000", 'stake is different');
        assert.equal(totalStaked, "1000000000000000000000", 'total staked is different');

    });



});