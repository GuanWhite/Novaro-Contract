// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITokenAddressProvider {

    function getTokenAddress(string memory symbol) external view returns (address);

}
