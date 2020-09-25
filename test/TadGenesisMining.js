const TenTokenTest = artifacts.require('TenTokenTest');
const TadTokenTest = artifacts.require('TadTokenTest');
const TadGenesisMining = artifacts.require('TadGenesisMining');

var tadTokenTestInstance;
var tenTokenTestInstance;

contract('TadGenesisMining', (accounts) => {
    it('should mint 1000000 TAD to Genesis Contract', async () => {
        tadTokenTestInstance = await TadTokenTest.deployed();

        await tadTokenTestInstance.mint(TadGenesisMining.address, "100000000000000000000000000", { from: accounts[0] });

        const balance = await tadTokenTestInstance.balanceOf(TadGenesisMining.address);
        assert.equal(balance, "100000000000000000000000000", 'The balance is not 1000000 TAD');
    });

    it('should mint 100000 TEN to the first account', async () => {
        tenTokenTestInstance = await TenTokenTest.deployed();

        await tenTokenTestInstance.mint(accounts[0], "10000000000000000000000000", { from: accounts[0] });

        const balance = await tenTokenTestInstance.balanceOf(accounts[0]);
        assert.equal(balance, "10000000000000000000000000", 'The balance is not 100000 TEN');
    });

    it('should approve 5000000 TEN to Genesis address', async () => {
        tenTokenTestInstance = await TenTokenTest.deployed();

        await tenTokenTestInstance.approve(TadGenesisMining.address, "500000000000000000000000000", { from: accounts[0] });

        const allowance = await tenTokenTestInstance.allowance(accounts[0], TadGenesisMining.address);
        assert.equal(allowance, "500000000000000000000000000", 'The allowance is not 5000000 TEN');
    });

    it('should stake 1000 TEN', async () => {

        genesisInstance = await TadGenesisMining.deployed();
        

        await genesisInstance.stake("100000000000000000000000", { from: accounts[0] });

        const stake = await genesisInstance.stakeHolders(accounts[0]);
        assert.equal(stake, "100000000000000000000000", 'The stake is not 1000 TEN');


    });

});


// contract('TadTokenTest', (accounts) => {
//     it('should mint 1000000 TAD to the first account', async () => {
//         const tadTokenTestInstance = await TadTokenTest.deployed();

//         await tadTokenTestInstance.mint(accounts[0], "100000000000000000000000000", { from: accounts[0] });

//         const balance = await tadTokenTestInstance.balanceOf(accounts[0]);
//         assert.equal(balance, "100000000000000000000000000", 'The balance is not 1000000 TAD');
//     });
// });

// contract('TadGenesisMining', (accounts) => {
//     it('should put 10000 TEN in the first account', async () => {
//         const tenTokenTestInstance = await TenTokenTest.deployed();
//         // Set value of 89
//         await tenTokenTestInstance.mint(accounts[0], 10000, { from: accounts[0] });
//         // Get stored value
//         const balance = await tenTokenTestInstance.balanceOf(accounts[0]);
//         assert.equal(balance, 10000, 'The balance 10000 was not stored.');
//     });
// });