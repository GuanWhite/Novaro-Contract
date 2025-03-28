// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library NovaroDataTypes {
    // This struct encapsulates the data associated with a Dynamic Social Token (DST),
    // including the token's level and experience points.
    struct DstData {
        uint256 lv;
        uint256 exp;
        string url;
    }

    // This is the mapping structure for DST, where 'lv' represents the level,
    // 'left' denotes the lower bound (exclusive), and 'right' denotes the upper bound (inclusive).
    struct DstInterval {
        uint256 lv;
        uint256 left;
        uint256 right;
        string url;
    }

    struct FollowerPassTokenData {
        address deployer;
        address boundAccount;
        address token;
        string name;
        string symbol;
        string sourceId;
        string des;
    }

    struct CommunityTokenData {
        address admin;
        string  chainId;
        address underlying_token_address;
        string community_name;
        string community_description;
        string community_logo_source_id;
        string community_share_token_name;
        string community_share_token_symbol;
        address community_token;
    }
}
