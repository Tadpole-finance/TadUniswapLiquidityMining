var LPTokenTest = artifacts.require("./LPTokenTest");
var TadTokenTest = artifacts.require("./TadTokenTest");
var TadUniswapMining = artifacts.require("./TadUniswapMining");
var TadUniswapMiningProxy = artifacts.require("./TadUniswapMiningProxy");

module.exports = async function(deployer) {
    await deployer.deploy(LPTokenTest);
    await deployer.deploy(TadTokenTest);

    await deployer.deploy(TadUniswapMining);
    await deployer.deploy(TadUniswapMiningProxy, TadUniswapMining.address);

    TadUniswapMining.at(TadUniswapMiningProxy.address);
    miningInstance = await TadUniswapMining.deployed();

    await miningInstance.initiate(0, 200, "1150000000000000000", TadTokenTest.address, LPTokenTest.address);
    
}
