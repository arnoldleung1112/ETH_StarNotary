var starNotary = artifacts.require("StarNotary");
module.exports = function(deployer) {
    deployer.deploy(starNotary, "starNotary deployed");
    // Additional contracts can be deployed here
};