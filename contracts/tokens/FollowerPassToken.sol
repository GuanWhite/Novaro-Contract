// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {NovaroEvents} from "../libraries/NovaroEvents.sol";
import {NovaroErrors} from "../libraries/NovaroErrors.sol";
import {NovaroStorage} from "../libraries/NovaroStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import {ERC6551Account} from "../account/ERC6551Account.sol";

contract FollowerPassToken is ERC20, Ownable(msg.sender){

    string public constant NAME = "FollowerPass Token";

    mapping(address => address) public tokenBoundAccounts;

    constructor(
        string memory name,
        string memory symbol,
        address _owner,
        address _community,
    address _tokenBoundAccount
    ) ERC20(name, symbol) payable {
        _mint(_community, 10 ** 18);
        tokenBoundAccounts[_owner] = _tokenBoundAccount;
    }

    function _msgSender() internal view override returns (address) {
        return msg.sender;
    }

    function sell(address _pool, uint256 _amount)  external {
        if (address(_pool) == address(0)) {
            revert NovaroErrors.InvalidAddress();
        }
        super.transfer((address(_pool)), _amount);
        emit NovaroEvents.SellFollowerPassToken(msg.sender, address(this), _amount);
    }

    function buyForToken(address _pool, uint256 _amount) external payable {
        if (address(_pool) == address(0)) {
            revert NovaroErrors.InvalidAddress();
        }
        bool sent = payable(_pool).send(msg.value);
        require(sent, "Failed to send ether to pool");
        emit NovaroEvents.BuyFollowerPassToken(_pool, msg.sender, _amount);
    }
}
