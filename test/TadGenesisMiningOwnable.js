
const truffleAssert = require('truffle-assertions');

const TadGenesisMining = artifacts.require('TadGenesisMining');
const TadTokenTest = artifacts.require('TadTokenTest');

contract('TadGenesisMining', (accounts) => {
    it('should be pausable by admin', async () => {
        genesisInstance = await TadGenesisMining.deployed();
    
        await genesisInstance.pause({from: accounts[0]});

        var isPaused = await genesisInstance.paused();

        assert.equal(isPaused, true, 'contract is not paused');
        
    });

    it('should be unpausable by admin', async () => {
        genesisInstance = await TadGenesisMining.deployed();
    
        await genesisInstance.unpause({from: accounts[0]});

        var isPaused = await genesisInstance.paused();

        assert.equal(isPaused, false, 'contract is still paused');
        
    });

    it('should be able to sendTad by admin', async () => {
        genesisInstance = await TadGenesisMining.deployed();
        tadInstance = await TadTokenTest.deployed();
    
        await tadInstance.mint(TadGenesisMining.address, 1234567890, {from: accounts[0]})
        await genesisInstance.sendTad(accounts[0], 1234567890, {from: accounts[0]});
        balance = await tadInstance.balanceOf(TadGenesisMining.address);

        console.log(balance_before, balance_after);

        assert.equal(balance_after, 0, 'TAD balance is different');
        
    });

    it('should revert pause if caller is not the owner', async () => {
        genesisInstance = await TadGenesisMining.deployed();

        await truffleAssert.reverts(genesisInstance.pause({from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    it('should revert unpause if caller is not the owner', async () => {
        genesisInstance = await TadGenesisMining.deployed();

        await truffleAssert.reverts(genesisInstance.unpause({from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    it('should revert sendTad if caller is not the owner', async () => {
        genesisInstance = await TadGenesisMining.deployed();

        await truffleAssert.reverts(genesisInstance.sendTad(accounts[1], 1, {from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    

    

});