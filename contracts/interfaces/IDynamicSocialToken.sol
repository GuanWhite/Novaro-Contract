// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title IDynamicSocialToken.sol
 * @dev Interface for the Dynamic Social Token (DST) contract, representing the user's social profile.
 */
interface IDynamicSocialToken {
    /**
     * @dev Mints a DST token to the specified address, initializing it with an experience value based on
     * the user's social metrics (e.g., Twitter followers). This function can only be called by authorized
     * contracts or addresses.
     *
     * @param to The address to which the DST token will be minted.
     * @param initialExp The initial experience value assigned to the DST token.
     */
    function mint(address to, uint256 initialExp) external returns (uint256);

    /**
     * @dev Feeds off-chain data to a specific DST token to enhance its experience value.
     * This can include data sourced from social media interactions, off-chain events, or other
     * off-chain metrics.
     * @param _owner The address of the DST token owner.
     * @param amount The amount by which the experience value will be increased.
     */
    function offChainFeed(address _owner, uint256 amount) external;

    function setFeeder(address _feeder) external;
}
