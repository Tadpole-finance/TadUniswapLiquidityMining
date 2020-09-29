
const truffleAssert = require('truffle-assertions');

const TadGenesisMining = artifacts.require('TadGenesisMining');

contract('TadGenesisMining', (accounts) => {

    it('should revert all public functions if it is paused', async () => {
        genesisInstance = await TadGenesisMining.deployed();

        await genesisInstance.pause({from: accounts[0]});

        await truffleAssert.reverts(genesisInstance.stake(1, {from: accounts[0]}), "Pausable: paused");
        await truffleAssert.reverts(genesisInstance.unstake(1, {from: accounts[0]}), "Pausable: paused");
        await truffleAssert.reverts(genesisInstance.claimTad({from: accounts[0]}), "Pausable: paused");
        
    });

    

    

});