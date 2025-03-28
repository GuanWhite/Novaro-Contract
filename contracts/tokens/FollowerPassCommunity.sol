// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./FollowerPassToken.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {NovaroEvents} from "../libraries/NovaroEvents.sol";
import {NovaroStorage} from "../libraries/NovaroStorage.sol";
import {NovaroDataTypes} from "../libraries/NovaroDataTypes.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {console} from "hardhat/console.sol";
import {NovaroClient} from "../NovaroClient.sol";

contract FollowerPassCommunity is ERC4626 {

    string public constant NAME = "Follower Pass Community";

    uint256 private memberCounter;

    address private treasury;

    uint256 private fee;

    uint256 private exchangeRate;

    IERC20 private followerPassToken;

    address private boundAccount;

    address private admin;

    address private novaroClient;

    mapping(address => bool) public isMember; // Mapping of members to their membership status

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _treasury,
        address _admin,
        address _boundAccount,
        address _novaroClient
    )
        ERC4626(_asset) // Initialize the vault with the asset
        ERC20(_name, _symbol) // Set the custom share token name and symbol
    {
        admin = _admin;
        treasury = _treasury;
        boundAccount = _boundAccount;
        novaroClient = _novaroClient;
    }

    function setConfig(
        uint256 _fee,
        uint256 _exchangeRate
    ) external {
        require(msg.sender == admin, "Only admin can set the config");
        fee = _fee;
        exchangeRate = _exchangeRate;
    }

    function join() external {
        require(IERC20(asset()).balanceOf(msg.sender) >= fee, "You must have some balance to join the community");
        IERC20(asset()).transferFrom(msg.sender, treasury, fee);
        memberCounter++;
        isMember[msg.sender] = true;
        emit NovaroEvents.JoinCommunity(msg.sender, address(this));
    }

    function exit() external {
        memberCounter--;
        isMember[msg.sender] = false;
        emit NovaroEvents.ExitCommunity(msg.sender, address(this));
    }


    function deposit(
        uint256 assets,
        address receiver
    ) public override returns (uint256) {
        require(isMember[msg.sender], "You must join the community to deposit");
        uint256 share = super.deposit(assets, receiver);
        emit NovaroEvents.Deposit(receiver, assets, share);
        return share;
    }

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override returns (uint256) {
        emit NovaroEvents.Redeem(receiver, shares, owner);
        return super.redeem(shares, receiver, owner);
    }

    function createFollowerPassToken(
        string calldata _name,
        string calldata _symbol,
        string calldata _sourceId,
        string calldata _des
    ) external {
        require(msg.sender == admin, "Only admin can create follower pass token");
        FollowerPassToken _followerPassToken = new FollowerPassToken(
            _name,
            _symbol,
            address (msg.sender),
            address (this),
            boundAccount
        );
        followerPassToken = _followerPassToken;
        NovaroDataTypes.FollowerPassTokenData memory tokenData = NovaroDataTypes
            .FollowerPassTokenData({
            deployer: msg.sender,
            boundAccount: boundAccount,
            token: address(followerPassToken),
            name: _name,
            symbol: _symbol,
            sourceId: _sourceId,
            des: _des
        });
        NovaroClient(novaroClient).recordToken(address(this), tokenData);
        emit NovaroEvents.CreateFollowerPassToken(
            msg.sender,
            boundAccount,
            _symbol,
            _name,
            _sourceId,
            _des
        );
    }

    function swap(uint256 amount) external {
        require(address(followerPassToken) != address(0), "No follower pass token found");
        require(isMember[msg.sender], "You must join the community to swap");
        require(balanceOf(msg.sender) >= amount, "You must have some share token to swap");
        uint256 followerPassAmount = amount * exchangeRate / 100;
        IERC20(this).transferFrom(msg.sender, address(this), amount);
        require(followerPassToken.balanceOf(address(this)) >= followerPassAmount, "Not enough follower pass token in the community");
        IERC20(followerPassToken).transfer(msg.sender, followerPassAmount);
        emit NovaroEvents.Swap(boundAccount, msg.sender, followerPassAmount);
    }


    // getters
    function getMemberCount() external view returns (uint256) {
        return memberCounter;
    }

    function getAdmin() external view returns (address) {
        return admin;
    }

    function isMemberOf(address user) external view returns (bool) {
        return isMember[user];
    }

    function getFollowerPassToken() external view returns (address) {
        return address(followerPassToken);
    }

    function getFee() external view returns (uint256) {
        return fee;
    }


}
