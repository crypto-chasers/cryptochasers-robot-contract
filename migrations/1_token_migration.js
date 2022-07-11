const CCR = artifacts.require("CCR");

module.exports = function (deployer) {
  deployer.deploy(CCR, "ipfs://QmRink7zdEXpRsix4yMwUbydx7HfM1FMNcTxVWpP3eWFVb/");
};