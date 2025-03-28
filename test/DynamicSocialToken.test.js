const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fromJson } = require("../helpers/file-helper");
const { INTERVAL_CONFIG_PATH } = require("../helpers/constants");

describe("DynamicSocialToken", function () {
    let DynamicSocialToken, dynamicSocialToken, deployer, addr1, novaroClient, socialOracle;
    let intervals;
    const initialExp = 100;
    const tokenId = 2;


    beforeEach(async function () {
        DynamicSocialToken = await ethers.getContractFactory("DynamicSocialToken");
        dynamicSocialToken = await DynamicSocialToken.deploy();
        [deployer, addr1] = await ethers.getSigners();
        intervals = fromJson(INTERVAL_CONFIG_PATH);

        const NovaroClient = await ethers.getContractFactory("NovaroClient");
        novaroClient = await NovaroClient.deploy(dynamicSocialToken.target);
        await dynamicSocialToken.setFeeder(novaroClient.target);
        await novaroClient.setDynamicSocialToken(dynamicSocialToken.target)

        const SocialOracle = await ethers.getContractFactory("SocialOracleMocker");
        socialOracle = await SocialOracle.deploy();
        novaroClient.setSocialOracle(socialOracle.target);

    });

    it("should have the correct name and symbol", async function () {
        expect(await dynamicSocialToken.name()).to.equal("Dynamic Social Token");
        expect(await dynamicSocialToken.symbol()).to.equal("DST");
    });

    it("should locate right metadata as per json file", async function () {
        //mint
        await dynamicSocialToken.readInterval(intervals);
        await dynamicSocialToken.mint(addr1.address, 0);
        const dstData0 = await dynamicSocialToken.getDstData(tokenId);
        verifyDstData(dstData0, 1, 0, intervals[0].url);

        //offChainFeed
        await novaroClient.connect(addr1).offChainFeed();
        const dstData1 = await dynamicSocialToken.getDstData(tokenId);
        verifyDstData(dstData1, 2, 150, intervals[1].url);

        await oneDayPassAndMintNewBlock();

        await novaroClient.connect(addr1).offChainFeed();
        const dstData2 = await dynamicSocialToken.getDstData(tokenId);
        verifyDstData(dstData2, 4, 300, intervals[3].url);

        await oneDayPassAndMintNewBlock();


        await novaroClient.connect(addr1).offChainFeed();
        const dstData3 = await dynamicSocialToken.getDstData(tokenId);
        verifyDstData(dstData3, 5, 450, intervals[4].url);

        await oneDayPassAndMintNewBlock();


        await novaroClient.connect(addr1).offChainFeed();
        const dstData4 = await dynamicSocialToken.getDstData(tokenId);
        verifyDstData(dstData4, 6, 600, intervals[5].url);

        await oneDayPassAndMintNewBlock();

        await novaroClient.connect(addr1).offChainFeed();
        const dstData5 = await dynamicSocialToken.getDstData(tokenId);
        verifyDstData(dstData5, 6, 750, intervals[5].url);
    });

    it("should revert if off-chain data is within 24 hours", async function () {
        //mint
        await dynamicSocialToken.readInterval(intervals);
        await dynamicSocialToken.mint(addr1.address, 0);
        const dstData0 = await dynamicSocialToken.getDstData(tokenId);
        verifyDstData(dstData0, 1, 0, intervals[0].url);

        //offChainFeed
        await novaroClient.connect(addr1).offChainFeed();
        const dstData1 = await dynamicSocialToken.getDstData(tokenId);
        verifyDstData(dstData1, 2, 150, intervals[1].url);

        //feed again within 24 hours
        await expect(
            novaroClient.connect(addr1).offChainFeed()
        ).to.be.revertedWithCustomError(novaroClient, "Within24HourPeriod");
    });

    it("should revert if intervals are not set", async function () {
        await expect(
            dynamicSocialToken.mint(addr1.address, initialExp)
        ).to.be.revertedWithCustomError(dynamicSocialToken, "IntervalNotSet");
    });

    it("should revert if intervals are empty", async function () {
        await expect(
            dynamicSocialToken.readInterval([])
        ).to.be.revertedWithCustomError(dynamicSocialToken, "EmptyInterval");
    });

    it("should revert if not mint", async function () {
        await dynamicSocialToken.readInterval(intervals);
        await expect(
            dynamicSocialToken.getDstData(1)
        ).to.be.revertedWithCustomError(dynamicSocialToken, "TokenNotMinted");
    });

    it("should lv equal to 1 if mint initial experience is 0", async function () {
        await dynamicSocialToken.readInterval(intervals);
        await dynamicSocialToken.mint(addr1.address, 0);
        const [level, exp, url] = await dynamicSocialToken.getDstData(tokenId);
        expect(level).to.equal(1);
        expect(exp).to.equal(0);
        expect(url).to.equal(intervals[0].url);
    });
});

function verifyDstData(dstData, expectedLevel, expectedExp, expectedUrl) {
    const [level, exp, url] = dstData;
    expect(level).to.equal(expectedLevel);
    expect(exp).to.equal(expectedExp);
    expect(url).to.equal(expectedUrl);
}

async function oneDayPassAndMintNewBlock() {
    const oneDayInSeconds = 24 * 60 * 60;
    await ethers.provider.send("evm_increaseTime", [oneDayInSeconds]);
    await ethers.provider.send("evm_mine");
}
