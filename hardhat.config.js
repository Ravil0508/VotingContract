require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require('solidity-coverage');
require('dotenv').config();
require('./tasks');
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 8000000000
    },
    hardhat: {}

  }
};
