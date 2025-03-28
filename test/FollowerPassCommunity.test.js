const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fromJson } = require("../helpers/file-helper");
const { INTERVAL_CONFIG_PATH } = require("../helpers/constants");

describe("FollowerPassCommunity Tests", function () {
    let deployer, admin, user, treasury, boundAccount;
    let  dst , intervals, poolMocker, novaroClient, registryFactory, accountFactory, preComputedAddress, tokenId, salt, initData;
    let usdt, followerPassCommunity, followerPassToken;
    let fee;
    const initialExp = 0n;

    beforeEach(async function () {
        [deployer, admin, user, treasury] = await ethers.getSigners();

        // Deploy the DynamicSocialToken (DST) contract
        const DynamicSocialToken = await ethers.getContractFactory("DynamicSocialToken");
        dst = await DynamicSocialToken.deploy();
        intervals = fromJson(INTERVAL_CONFIG_PATH);
        await dst.readInterval(intervals);
        await dst.mint(user.address, initialExp);

        //deploy the pool mocker
        const PoolMocker = await ethers.getContractFactory("PoolMocker");
        poolMocker = await PoolMocker.deploy();

        // Deploy the NovaroClient contract with the deployed DST
        const NovaroClient = await ethers.getContractFactory("NovaroClient");
        novaroClient = await NovaroClient.deploy(poolMocker.target);

        // Deploy Registry contract
        const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
        registryFactory = await ERC6551Registry.deploy();

        await novaroClient.setRegistry(registryFactory.target);
        await novaroClient.setDynamicSocialToken(dst.target);

        tokenId = 2;
        salt = 1;
        initData = '0x';

        // Deploy Account contract
        const ERC6551Account = await ethers.getContractFactory("ERC6551Account");
        accountFactory = await ERC6551Account.deploy();
        const chainId = await hre.network.provider.send('eth_chainId');
        // Compute the pre-computed address of the account with Create2
        preComputedAddress = await registryFactory.account(accountFactory.target, chainId, dst.target, tokenId, salt);
        // Create an account
        await novaroClient.connect(user).createOrFetchAccount(accountFactory.target, chainId, dst.target, tokenId, salt, initData);
        const boundAccount = await novaroClient.getBoundAccount(user.address);
        expect(boundAccount).to.equal(preComputedAddress);

        const USDT = await ethers.getContractFactory("ERC20Mocker");
        usdt = await USDT.deploy();

        await usdt.mint(user.address, 1000n);

        const FollowerPassCommunity = await ethers.getContractFactory("FollowerPassCommunity", admin);
        followerPassCommunity = await FollowerPassCommunity.deploy(
            usdt.target,
            "FollowerPass Community Share",
            "FPCS",
            treasury.address,
            admin.address,
            preComputedAddress,
            novaroClient.target,
        );

        await followerPassCommunity.connect(admin).setConfig(
            1,
            60
        );
    });

    it("Should allow a user to join the community", async function () {
        const fee = await followerPassCommunity.getFee();

        await usdt.connect(user).approve(followerPassCommunity.target, fee);

        await followerPassCommunity.connect(user).join();

        expect(await followerPassCommunity.isMemberOf(user.address)).to.be.true;

        const memberCount = await followerPassCommunity.getMemberCount();
        expect(memberCount).to.equal(1);
    });

    it("Should allow deposit and mint share tokens", async function () {
        //join the community
        const fee = await followerPassCommunity.getFee();
        await usdt.connect(user).approve(followerPassCommunity.target, fee);
        await followerPassCommunity.connect(user).join();
        //deposit
        const depositAmount = 100n;
        await usdt.connect(user).approve(followerPassCommunity.target, depositAmount);
        await followerPassCommunity.connect(user).deposit(depositAmount, user.address);

        const shareBalance = await followerPassCommunity.balanceOf(user.address);
        expect(shareBalance).to.equal(depositAmount);
    });

    it("Should create a follower pass token", async function () {
        await followerPassCommunity.connect(admin).createFollowerPassToken(
            "Follower Pass",
            "FP",
            "SourceID123",
            "A description for Follower Pass"
        );

        const followerPassTokenAddress = await followerPassCommunity.getFollowerPassToken();
        followerPassToken = await ethers.getContractAt("FollowerPassToken", followerPassTokenAddress);

        expect(await followerPassToken.name()).to.equal("Follower Pass");
        expect(await followerPassToken.symbol()).to.equal("FP");
//        expect(await followerPassToken.balanceOf(preComputedAddress)).to.equal(ethers.parseUnits("1", 18));
    });

    it("Should allow share token to be swapped for follower pass tokens", async function () {
        //join the community
         fee = await followerPassCommunity.getFee();
        await usdt.connect(user).approve(followerPassCommunity.target, fee);
        await followerPassCommunity.connect(user).join();
        //deposit
        const depositAmount = 100n;
        await usdt.connect(user).approve(followerPassCommunity.target, depositAmount);
        const balanc = await usdt.balanceOf(user.address);
        console.log("User USDT Balance:", balanc.toString());
        await followerPassCommunity.connect(user).deposit(depositAmount, user.address);
        //share balance after deposit
        const shareBalance = await followerPassCommunity.balanceOf(user.address);
        console.log("User Share Token Balance:", shareBalance.toString());
        //create follower pass token after deposit
        await followerPassCommunity.connect(admin).createFollowerPassToken(
            "Follower Pass",
            "FP",
            "SourceID123",
            "A description for Follower Pass"
        );
        const followerPassTokenAddress = await followerPassCommunity.getFollowerPassToken();
        followerPassToken = await ethers.getContractAt("FollowerPassToken", followerPassTokenAddress);
        await usdt.connect(user).approve(followerPassCommunity.target, fee)
        let bal = await usdt.balanceOf(followerPassCommunity.target);
        console.log("Follower Pass Community USDT Balance:", bal.toString());
        await followerPassCommunity.connect(user).approve(followerPassCommunity.target, 100n);
        await followerPassCommunity.connect(user).swap(100n);
        const userBalance = await followerPassToken.balanceOf(user.address);
        expect(userBalance).to.equal(shareBalance * 60n / 100n);
    });
});