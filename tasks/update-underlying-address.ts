import { task } from "hardhat/config";
import { ethers } from "hardhat";
import { fromJson } from "../helpers/file-helper";
import { UNDERLYING_ADDRESSES_PATH } from "../helpers/constants";

task(
  "updateTokenAddress",
  "set the underlying token address from json file in the TokenAddressProvider contract"
)
  .addParam("providerAddress", "address of the TokenAddressProvider contract")
  .setAction(async (taskArgs, hre) => {
    //compile contracts
    await hre.run("compile");
    const { ethers, network } = hre;
    const [deployer] = await ethers.getSigners();
    console.log("Deploying to network:", network.name);
    console.log("Deployer account:", deployer.address);
    const currentChainId = hre.network.config.chainId;
    console.log(`Current Network ChainId: ${currentChainId}`);
    const json = fromJson(UNDERLYING_ADDRESSES_PATH);
    let networkFound = false;
    for (const network in json) {
      if (json[network].chainid === currentChainId) {
        networkFound = true;
        const tokens = json[network].tokens;
        const providerAddress = taskArgs.providerAddress;
        const tokenAddressProvider = await hre.ethers.getContractFactory(
          "TokenAddressProvider"
        );
        const provider = tokenAddressProvider.attach(providerAddress);
        for (const token of tokens) {
          console.log(
            `Preparing to update ${token.symbol} with address ${token.address}`
          );
          await provider.setTokenAddress(token.symbol, token.address);
          console.log(`Transaction sent for updating ${token.symbol}...`);
        }
        break;
      }
    }
    if (!networkFound) {
      console.log(`No matching network found with chainId ${currentChainId}`);
    }
  });

//usage: npx hardhat updateTokenAddress --provider-address 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 --network localhost

//0x7d0Df688096e700177950A54C7B00C98ed728345