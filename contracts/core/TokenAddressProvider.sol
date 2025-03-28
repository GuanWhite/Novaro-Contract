// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITokenAddressProvider} from "../interfaces/ITokenAddressProvider.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TokenAddressProvider is ITokenAddressProvider, Ownable(msg.sender) {

    //underlying token symbol => token address
    mapping(string => address) public tokenAddresses;

    function setTokenAddress(string memory _tokenSymbol, address _tokenAddress) external onlyOwner {
        tokenAddresses[_tokenSymbol] = _tokenAddress;
    }

    function getTokenAddress(string memory _tokenSymbol) external view override returns (address) {
        return tokenAddresses[_tokenSymbol];
    }
}
