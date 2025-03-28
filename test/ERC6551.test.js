const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC6551 Account", async function () {

  let owner, registry, account, dynamicSocialToken;
  let tokenId, salt, initData;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    tokenId = 1;
    salt = 1;
    initData = '0x';

    // Deploy Registry contract
    const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
    registryFactory = await ERC6551Registry.deploy();

    // Deploy Account contract
    const ERC6551Account = await ethers.getContractFactory("ERC6551Account");
    accountFactory = await ERC6551Account.deploy();

    // Deploy DST but don't read interval data
    DynamicSocialToken = await ethers.getContractFactory("DynamicSocialToken");
    dynamicSocialToken = await DynamicSocialToken.deploy();
  });

  it("Deploy Mock ERC20 and transfer to ERC6551 Account", async function () {
    // Deploy Mock ERC20
    const ERC20Mocker = await ethers.getContractFactory("ERC20Mocker", owner);
    const erc20Mocker = await ERC20Mocker.deploy();
    //Create ERC6551 Account
    const chainId = await hre.network.provider.send('eth_chainId');
    console.log("chainId", chainId);
    const account = await registryFactory.createAccount(accountFactory.target, chainId, dynamicSocialToken.target, tokenId, salt, initData);
    const preComputedAddress = await registryFactory.account(accountFactory.target, chainId, dynamicSocialToken.target, tokenId, salt);
    console.log("preComputedAddress", preComputedAddress);
    //Transfer ERC20 to ERC6551 Account
    const balance_before = await erc20Mocker.balanceOf(preComputedAddress);
    console.log("balance_before", balance_before);
    const amount = 1000n;
    await erc20Mocker.transfer(preComputedAddress, amount);
    const balance_after = await erc20Mocker.balanceOf(preComputedAddress);
    console.log("balance_after", balance_after);
    expect(balance_after).to.equal(balance_before + amount);
  });

  it("Deploy Mock ERC721 and transfer to ERC6551 Account", async function () {
    // Deploy Mock ERC721
    const ERC721Mocker = await ethers.getContractFactory("ERC721Mocker", owner);
    const erc721Mocker = await ERC721Mocker.deploy();
    //Create ERC6551 Account
    const chainId = await hre.network.provider.send('eth_chainId');
    console.log("chainId", chainId);
    const account = await registryFactory.createAccount(accountFactory.target, chainId, dynamicSocialToken.target, tokenId, salt, initData);
    const preComputedAddress = await registryFactory.account(accountFactory.target, chainId, dynamicSocialToken.target, tokenId, salt);
    console.log("owner", owner.address)
    console.log("preComputedAddress", preComputedAddress);
    //Transfer ERC721 to ERC6551 Account
    const balance_before = await erc721Mocker.balanceOf(preComputedAddress);
    const owner_before = await erc721Mocker.ownerOf(tokenId);
    console.log("owner_before", owner_before);
    console.log("balance_before", balance_before);
    await erc721Mocker.transferFrom(owner.address, preComputedAddress, tokenId);
    const balance_after = await erc721Mocker.balanceOf(preComputedAddress);
    const owner_after = await erc721Mocker.ownerOf(tokenId);
    console.log("owner_after", owner_after);
    console.log("balance_after", balance_after);
    expect(balance_after).to.equal(balance_before + 1n);
  });
});