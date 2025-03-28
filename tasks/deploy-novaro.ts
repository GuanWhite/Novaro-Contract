import { task } from "hardhat/config";
import { ethers } from "hardhat";
import { fromJson,toJson } from "../helpers/file-helper";
import { INTERVAL_CONFIG_PATH, DEPLOYMENT_ADDRESSES_PATH } from "../helpers/constants";
task("deploy-novaro")
  .setAction(async (taskArgs, hre) => {
    //compile contracts
    await hre.run("compile");
    const { ethers, network } = hre;
    //print information
    const [deployer] = await ethers.getSigners();
    console.log("Deploying to network:", network.name);
    console.log("Deployer account:", deployer.address);

    //deploy DynamicSocialToken
    const dynamicSocialTokenFactory = await ethers.getContractFactory(
      "DynamicSocialToken",
      deployer
    );
    const dynamicSocialToken = await dynamicSocialTokenFactory.deploy();
    console.log("DynamicSocialToken deployed to:", dynamicSocialToken.target);

    //Deploy Account Contract
    const AccountFactory = await ethers.getContractFactory(
      "ERC6551Account",
      deployer
    );
    const accountFactory = await AccountFactory.deploy();
    console.log("AccountFactory deployed to:", accountFactory.target);

    //Deploy Registry
    const AccountRegistry = await ethers.getContractFactory(
      "ERC6551Registry",
      deployer
    );
    const accountRegistry = await AccountRegistry.deploy();
    console.log("AccountRegistry deployed to:", accountRegistry.target);

    //read interval for DynamicSocialToken
    await hre.run("read-dst-interval", {
      dstAddress: dynamicSocialToken.target
    });

    //deploy mock social oracle
    const MockSocialOracle = await ethers.getContractFactory(
      "SocialOracleMocker",
      deployer
    );
    const mockSocialOracle = await MockSocialOracle.deploy();
    console.log("MockSocialOracle deployed to:", mockSocialOracle.target);
     //deploy mock liquidity pool
     const MockLiquidityPool = await ethers.getContractFactory(
     "PoolMocker",
          deployer
     );
     const mockLiquidityPool = await MockLiquidityPool.deploy();

    // deploy NovaroClient
    const NovaroClient = await ethers.getContractFactory(
      "NovaroClient",
      deployer
    );
    console.log("Mock LiquidityPool deployed to:", mockLiquidityPool.target)
    const novaroClient = await NovaroClient.deploy(mockLiquidityPool.target);
    console.log("NovaroClient deployed to:", novaroClient.target);

    //deploy TokenAddressProvider
    const TokenAddressProvider = await ethers.getContractFactory(
      "TokenAddressProvider",
      deployer
    );
    const tokenAddressProvider = await TokenAddressProvider.deploy();
    console.log("TokenAddressProvider deployed to:", tokenAddressProvider.target);

    // set feeder address for DynamicSocialToken
    await dynamicSocialToken.setFeeder(novaroClient.target);
    console.log("Feeder address set for DynamicSocialToken");

    //set dst address for client
    await novaroClient.setDynamicSocialToken(dynamicSocialToken.target);

    //set registry address for client
    await novaroClient.setRegistry(accountRegistry.target)

    //set social oracle address for client
    await novaroClient.setSocialOracle(mockSocialOracle.target)

    //set token address provider for client
    await novaroClient.setTokenAddressProvider(tokenAddressProvider.target)

    // save contract addresses to file
    const addresses = {
      network: network.name,
      feeder: novaroClient.target,
      contracts: {
        MockLiquidityPool: mockLiquidityPool.target,
        MockSocialOracle: mockSocialOracle.target,
        DynamicSocialToken: dynamicSocialToken.target,
        NovaroClient: novaroClient.target,
        TokenAddressProvider: tokenAddressProvider.target,
        AccountFactory: accountFactory.target,
        AccountRegistry: accountRegistry.target,
      },
    };
    const filePath = DEPLOYMENT_ADDRESSES_PATH + network.name + "_addresses.json";
    toJson(filePath, addresses);
    console.log(`Contract addresses saved to ${filePath}`);
  });

task("read-dst-interval", "Configures intervals for DynamicSocialToken")
  .addParam("dstAddress", "The address of the DynamicSocialToken contract")
  .setAction(async (taskArgs, hre) => {
    const { dstAddress, mappingName } = taskArgs;

    const [deployer] = await hre.ethers.getSigners();
    console.log("Using deployer account:", deployer.address);

    const DynamicSocialToken = await hre.ethers.getContractFactory(
      "DynamicSocialToken"
    );
    const dynamicSocialToken = DynamicSocialToken.attach(dstAddress);

    try {
      const intervals = fromJson(INTERVAL_CONFIG_PATH);
      await dynamicSocialToken.readInterval(intervals);
    } catch (error) {
      console.error("Error calling readInterval:", error);
    }
    console.log("Interval configuration complete");
  });

// Example usage:
//npx hardhat deploy-novaro --network hardhat
