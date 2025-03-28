// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ISocialOracle.sol";

contract SocialOracleMocker is ISocialOracle {

    uint256 public constant SCORE = 150;

    function getSocialScore(address user) external  override view returns (uint256) {
        require(user!= address(0), "Invalid address");
        return SCORE;
    }

    function getMockSocialScore () external view returns (uint256) {
        return SCORE;
    }

}
