const truffleAssert = require('truffle-assertions');
var logReport = '';

var BN = web3.utils.BN;

const wei = new BN("1000000000000000000");

const TenTokenTest = artifacts.require('TenTokenTest');
const TadTokenTest = artifacts.require('TadTokenTest');
const TadGenesisMining = artifacts.require('TadGenesisMining');
const TadGenesisMiningProxy = artifacts.require('TadGenesisMiningProxy');

var tenInstance;
var tadInstance;
var genesisInstance;

const tadPerBlock = new BN("1150000000000000000");
const totalGenesisBlockNum = new BN("1000");
const maxClaimed = tadPerBlock.mul(totalGenesisBlockNum);

contract('TadGenesisMining', async (accounts) => {

    // to run this test, use ganache
    // run this command in a new terminal:
    // ganache-cli -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" -u 0,1,2,3,4,5,6,7,8,9,10 --gasLimit 0x2FEFD800000 -a 100 --defaultBalanceEther 10000 --blockTime 2 -t "2020-09-30T07:00:00+0000" --networkId 55555
    // then in truffle console, execute:
    // test --network ganache test/7_TadGenesisMiningSimultaneous.js

    before("check if we are on ganache", async()=>{
        let netId = await web3.eth.net.getId();
        if(netId != 55555) throw new Error("not on ganache, this error is expected if you run all the tests");
    });


    it('should deploy new contracts on ganache', async ()=>{
        tenInstance = await TenTokenTest.new();
        tadInstance = await TadTokenTest.new();
        genesisProxyInstance = await TadGenesisMiningProxy.new(TadGenesisMining.address);
        genesisInstance = await TadGenesisMining.at(genesisProxyInstance.address);
        await genesisInstance.initiate(0, totalGenesisBlockNum.toString(), tadPerBlock.toString(), tadInstance.address, tenInstance.address); //block 0

    });

    it('should prepare TEN distribution to all accounts', async()=>{
        for(i=0;i<11;i++){ 
            tenInstance.mint(accounts[i], "20000000000000000000000000", {from:(await web3.eth.getAccounts())[0]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });

    it('should prepare TEN allowances to genesis contract', async()=>{
        for(i=0;i<11;i++){ 
            tenInstance.approve(genesisInstance.address, "20000000000000000000000000", {from:(await web3.eth.getAccounts())[i]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });

    it('should prepare TAD supply for genesis contract', async()=>{
        tadInstance.mint(genesisInstance.address, maxClaimed.toString(), {from:(await web3.eth.getAccounts())[0]});

        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });

    //biggest stake get biggest reward
    it('should stake account 10', async()=>{

        genesisInstance.stake(new BN("10000").mul(wei), {from:(await web3.eth.getAccounts())[10]});
    })


    it('should stake', async()=>{

        for(i=0;i<10;i++){ 
            genesisInstance.stake(new BN("1000000000000000000000").mul(new BN(i+1)), {from:(await web3.eth.getAccounts())[i]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });

    it('should be able to unstake 5 accounts', async()=>{
        for(i=0;i<5;i++){
            genesisInstance.unstake(0, {from: (await web3.eth.getAccounts())[i]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });

    it('should be able to claim 5 accounts', async()=>{
        for(i=5;i<10;i++){
            genesisInstance.claimTad({from: (await web3.eth.getAccounts())[i]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });


    it('random 1', async()=>{
        for(i=0;i<5;i++){ 
            amount = new BN(Math.floor(Math.random() * 5000)+"").mul(wei);
            j = i*2+1;
            genesisInstance.stake(amount, {from:(await web3.eth.getAccounts())[j]});
            genesisInstance.claimTad({from: (await web3.eth.getAccounts())[j]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });


    it('random 2', async()=>{
        for(i=0;i<5;i++){ 
            amount = new BN(Math.floor(Math.random() * 5000)+"").mul(wei);
            j = i*2;
            genesisInstance.stake(amount, {from:(await web3.eth.getAccounts())[j]});
        }
        for(i=0;i<5;i++){ 
            j = i*2+1;
            genesisInstance.claimTad({from: (await web3.eth.getAccounts())[j]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });


    it('random 3', async()=>{
        for(i=0;i<5;i++){ 
            amount = new BN(Math.floor(Math.random() * 5000)+"").mul(wei);
            j = i*2+1;
            genesisInstance.stake(amount, {from:(await web3.eth.getAccounts())[j]});
            genesisInstance.unstake(0, {from: (await web3.eth.getAccounts())[j]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });

    //random test to simulate real life
    it("much random, very test, such wow", async()=>{
        for(i=0; i<1000; i++){
            rand100 = Math.floor(Math.random() * 100);
            rand5 = Math.floor(Math.random() * 5);
            j = rand100%10;
            account = (await web3.eth.getAccounts())[j];
            // 0 = stake
            // 1 = unstake
            // 2 = claim
            // 3 & 4 = mine
            switch(rand5) {
                case 0:
                    amount = new BN(rand100).mul(wei);
                    genesisInstance.stake(amount, {from: account});
                    break;
                case 1:
                    balance = await genesisInstance.stakeHolders(account);
                    amount = new BN(rand100).mul(wei).mul(balance).div(new BN("100"));
                    genesisInstance.unstake(amount, {from: account});
                    break;
                case 2:
                    genesisInstance.claimTad({from: account});
                    break;
                default:
                    await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){});
            } 
        }
    });



    it('should not able to stake after 200 blocks', async()=>{
        for(i=0; i<totalGenesisBlockNum.toNumber(); i++){
            await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
        }

        await truffleAssert.reverts(genesisInstance.stake(new BN("100000000000000000000"), {from:(await web3.eth.getAccounts())[0]}), "staking period has ended");

    });

    it('should be able to claim all accounts', async()=>{
        for(i=0;i<11;i++){
            genesisInstance.claimTad({from:(await web3.eth.getAccounts())[i]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });

    it('should be able to unstake all accounts', async()=>{
        for(i=0;i<11;i++){
            genesisInstance.unstake(0, {from:(await web3.eth.getAccounts())[i]});
        }
        //force mine
        await web3.currentProvider.send({ jsonrpc: "2.0",  method: "evm_mine" }, function(){}); 
    });

    it('should have totalClaimed <= maxClaimed', async()=>{

        totalClaimed = new BN(0);

        for(i=0;i<11;i++){
            tadBalance = await tadInstance.balanceOf(accounts[i]);
            totalClaimed = totalClaimed.add(tadBalance);
            addLog("claimed account"+i+": "+web3.utils.fromWei(tadBalance.toString()));
        }

        var totalClaimedCont = await genesisInstance.totalClaimed();

        assert.ok(totalClaimed.lt(maxClaimed), 'totalClaimed > maxClaimed');
        assert.equal(totalClaimedCont.toString(), totalClaimed.toString(), 'manual totalClaimed doesn\'t match totalClaimed() function');
        
        addLog("totalClaimed: "+web3.utils.fromWei(totalClaimed.toString()));

    });

    after( async()=>{
        printLog();
    });

        


});

function addLog(log){
    logReport += log+"\n";
}

function printLog(){
    console.log("\n\n\nReport:\n");
    console.log(logReport);
}
