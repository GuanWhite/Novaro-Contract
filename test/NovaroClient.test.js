const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fromJson } = require("../helpers/file-helper");
const { INTERVAL_CONFIG_PATH } = require("../helpers/constants");


describe("NovaroClient", function () {
  let novaroClient, owner, addr1, dst;
  let tokenId, salt, initData, chainId;
  let registryFactory, accountFactory;
  let preComputedAddress;
  let tokenAddressProvider;
  let intervals;
  let poolMocker;
  let initialExp = 0;
  let usdtAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy the DynamicSocialToken (DST) contract
    const DynamicSocialToken = await ethers.getContractFactory("DynamicSocialToken");
    dst = await DynamicSocialToken.deploy();
    intervals = fromJson(INTERVAL_CONFIG_PATH);
    await dst.readInterval(intervals);
    await dst.mint(addr1.address, initialExp);

    //deploy the pool mocker
    const PoolMocker = await ethers.getContractFactory("PoolMocker");
    poolMocker = await PoolMocker.deploy();

    // Deploy the NovaroClient contract with the deployed DST
    const NovaroClient = await ethers.getContractFactory("NovaroClient");
    novaroClient = await NovaroClient.deploy(poolMocker.target);

    tokenId = 2;
    salt = 1;
    initData = '0x';

    // Deploy Registry contract
    const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
    registryFactory = await ERC6551Registry.deploy();

    await novaroClient.setRegistry(registryFactory.target);
    await novaroClient.setDynamicSocialToken(dst.target);

    // Deploy Account contract
    const ERC6551Account = await ethers.getContractFactory("ERC6551Account");
    accountFactory = await ERC6551Account.deploy();
    chainId = await hre.network.provider.send('eth_chainId');
    // Compute the pre-computed address of the account with Create2
    preComputedAddress = await registryFactory.account(accountFactory.target, chainId, dst.target, tokenId, salt);
    // Create an account
    await novaroClient.connect(addr1).createOrFetchAccount(accountFactory.target, chainId, dst.target, tokenId, salt, initData);
    const boundAccount = await novaroClient.getBoundAccount(addr1);
    expect(boundAccount).to.equal(preComputedAddress);

    //deploy the token address provider and set the USDT address
    const TokenAddressProvider = await ethers.getContractFactory("TokenAddressProvider");
    tokenAddressProvider = await TokenAddressProvider.deploy();
    await tokenAddressProvider.setTokenAddress("USDT", usdtAddress);
    await novaroClient.setTokenAddressProvider(tokenAddressProvider.target);
  });

  it("should deploy a community token successfully", async function () {
    const underlyingAssetSymbol = "USDT";
    const shareTokenName = "Share Token";
    const shareTokenSymbol = "STKN";
    const communityName = "Test Community";
    const communityDescription = "A test community description";
    const communitySourceId = "source123";

    await novaroClient.deployCommunityToken(
      chainId,
      underlyingAssetSymbol,
      shareTokenName,
      shareTokenSymbol,
      communityName,
      communityDescription,
      communitySourceId
    );

    const communities = await novaroClient.getCommunities();
    expect(communities.length).to.equal(1);
    const community = communities[0];
    expect(community.admin).to.equal(owner.address);
    expect(community.chainId).to.equal(chainId);
    expect(community.underlying_token_address).to.equal(usdtAddress);
    expect(community.community_name).to.equal(communityName);

    const communityToken = community.community_token;
    console.log(communityToken);

  });
});