
const truffleAssert = require('truffle-assertions');

const TadUniswapMining = artifacts.require('TadUniswapMining');
const TadTokenTest = artifacts.require('TadTokenTest');

contract('TadUniswapMining', (accounts) => {
    it('should be pausable by admin', async () => {
        miningInstance = await TadUniswapMining.deployed();
    
        await miningInstance.pause({from: accounts[0]});

        var isPaused = await miningInstance.paused();

        assert.equal(isPaused, true, 'contract is not paused');
        
    });

    it('should be unpausable by admin', async () => {
        miningInstance = await TadUniswapMining.deployed();
    
        await miningInstance.unpause({from: accounts[0]});

        var isPaused = await miningInstance.paused();

        assert.equal(isPaused, false, 'contract is still paused');
        
    });

    it('should be able to sendTad by admin', async () => {
        miningInstance = await TadUniswapMining.deployed();
        tadInstance = await TadTokenTest.deployed();
    
        await tadInstance.mint(TadUniswapMining.address, 1234567890, {from: accounts[0]})
        await miningInstance.sendTad(accounts[0], 1234567890, {from: accounts[0]});
        balance = await tadInstance.balanceOf(TadUniswapMining.address);

        assert.equal(balance, 0, 'TAD balance is different');
        
    });

    it('should revert pause if caller is not the owner', async () => {
        miningInstance = await TadUniswapMining.deployed();

        await truffleAssert.reverts(miningInstance.pause({from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    it('should revert unpause if caller is not the owner', async () => {
        miningInstance = await TadUniswapMining.deployed();

        await truffleAssert.reverts(miningInstance.unpause({from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    it('should revert sendTad if caller is not the owner', async () => {
        miningInstance = await TadUniswapMining.deployed();

        await truffleAssert.reverts(miningInstance.sendTad(accounts[1], 1, {from: accounts[1]}), "Ownable: caller is not the owner");
        
    });

    

    

});