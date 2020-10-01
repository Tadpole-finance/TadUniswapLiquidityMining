var TenTokenTest = artifacts.require("./TenTokenTest");
var TadTokenTest = artifacts.require("./TadTokenTest");
var TadGenesisMining = artifacts.require("./TadGenesisMining");
var TadGenesisMiningProxy = artifacts.require("./TadGenesisMiningProxy");

module.exports = async function(deployer) {
    await deployer.deploy(TenTokenTest);
    await deployer.deploy(TadTokenTest);

    await deployer.deploy(TadGenesisMining);
    await deployer.deploy(TadGenesisMiningProxy, TadGenesisMining.address);

    TadGenesisMining.at(TadGenesisMiningProxy.address);
    genesisInstance = await TadGenesisMining.deployed();

    await genesisInstance.initiate(0, 200, "1150000000000000000", TadTokenTest.address, TenTokenTest.address);
    
}
