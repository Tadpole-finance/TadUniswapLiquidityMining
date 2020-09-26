var TenTokenTest = artifacts.require("./TenTokenTest");
var TadTokenTest = artifacts.require("./TadTokenTest");
var TadGenesisMining = artifacts.require("./TadGenesisMining");

module.exports = async function(deployer) {
    await deployer.deploy(TenTokenTest);
    await deployer.deploy(TadTokenTest);

    await deployer.deploy(TadGenesisMining, 0, 200, "1150000000000000000", TadTokenTest.address, TenTokenTest.address);
    
}
