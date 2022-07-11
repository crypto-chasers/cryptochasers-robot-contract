const { Wallet, providers, Contract, utils } = require("ethers");
require('dotenv').config()
const ccrABI = require('../build/contracts/CCR.json').abi
const airdropList = require('./airdrop.json')
const whiteList = require('./whitelist.json')

async function main() {
  const isMainnet = true

  let wallet = new Wallet.fromMnemonic(process.env.MNEMONIC)
  // change flashbots rpc on mainnet
  const provider = new providers.InfuraProvider(isMainnet ? 1 : 4, process.env.INFURA_API_KEY || '');
  wallet = wallet.connect(provider)
  // rinkeby
  const ccrAddress = isMainnet ?
    '0x81Ca1F6608747285c9c001ba4f5ff6ff2b5f36F8' : '0xBE797b1Caf898D0161dD1C665Df7253F86D28807'
  const ccrContract = new Contract(ccrAddress, ccrABI, provider);

  // admin address
  // const adminAddress = wallet.address
  // console.log('adminAddress: ', adminAddress)

  // remainAmount
  // const remainAmount = (await ccrContract.getRemainingSupply()).toNumber()
  // console.log('remainAmount', remainAmount);

  // mintedCount
  // const mintedCount = (await ccrContract.getMintedCount(adminAddress)).toNumber()

  // add whitelist
  // const tx = await ccrContract.connect(wallet).addToWhitelist(['0xa8a99B91a190c62d1a63d5A0cf7f19982D016697'], { gasLimit: 150_000 }) // 13w gas per account
  // await tx.wait();
  // console.log(`https://${isMainnet ? '' : 'rinkeby.'}etherscan.io/tx/` + tx.hash);

  // airdrop
  // const airdropAddresses = airdropList.map(v => v.address)
  // const tx = await ccrContract.connect(wallet).mintByAdmin(
  //   airdropAddresses, {
  //   gasPrice: utils.parseUnits('100', 'gwei'),
  //   gasLimit: 10_000_000
  // }
  // ) // 10M gas
  // await tx.wait();
  // console.log(`https://${isMainnet ? '' : 'rinkeby.'}etherscan.io/tx/` + tx.hash);

  // withdrawAll
  // const tx = await ccrContract.connect(wallet).withdrawAll() // 10M gas
  // await tx.wait();
  // console.log(`https://${isMainnet ? '' : 'rinkeby.'}etherscan.io/tx/` + tx.hash);

  // setBaseTokenURI
  const setUriTX = await ccrContract.connect(wallet).setBaseTokenURI('ipfs://QmRkLLAJeUsN9c2kLx5Qk4BvQmNmsHcy6C4CPkjVc328sV/', { gasLimit: 150_000 })
  await setUriTX.wait()
  console.log(`https://${isMainnet ? '' : 'rinkeby.'}etherscan.io/tx/` + setUriTX.hash)
}
main()
