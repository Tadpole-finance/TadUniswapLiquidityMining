
const truffleAssert = require('truffle-assertions');

const TadUniswapMining = artifacts.require('TadUniswapMining');

contract('TadUniswapMining', (accounts) => {

    it('should revert all public functions if it is paused', async () => {
        miningInstance = await TadUniswapMining.deployed();

        await miningInstance.pause({from: accounts[0]});

        await truffleAssert.reverts(miningInstance.stake(1, 0, {from: accounts[0]}), "Pausable: paused");
        await truffleAssert.reverts(miningInstance.unstake(0, {from: accounts[0]}), "Pausable: paused");
        await truffleAssert.reverts(miningInstance.claimTad({from: accounts[0]}), "Pausable: paused");
        
    });

    

    

});