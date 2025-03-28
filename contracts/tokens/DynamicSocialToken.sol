// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NovaroErrors} from "../libraries/NovaroErrors.sol";
import {NovaroDataTypes} from "../libraries/NovaroDataTypes.sol";
import {NovaroEvents} from "../libraries/NovaroEvents.sol";
import {IDynamicSocialToken} from "../interfaces/IDynamicSocialToken.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title DynamicSocialToken
 * @dev This contract allows users to mint a DST when they bind their wallet.
 */
contract DynamicSocialToken is
    IDynamicSocialToken,
    ERC721URIStorage,
    Ownable(msg.sender)
{
    string public constant NAME = "Dynamic Social Token";

    address private _feeder;

    uint256 internal _tokenIdCounter = 1;

    //user only have one DST
    mapping(address => uint256) internal tokenIds;

    //Mapping information for the DST
    mapping(uint256 => NovaroDataTypes.DstData) internal _dstData;

    //Intervals for DST levels and urls
    NovaroDataTypes.DstInterval[] internal _dstIntervals;

    constructor() ERC721("Dynamic Social Token", "DST") {}

    function setFeeder(address feeder) external onlyOwner override {
        _feeder = feeder;
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address previousOwner) {
        previousOwner = super._update(to, tokenId, auth);
        _afterTokenTransfer(previousOwner, to, tokenId);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal pure {
        //        if (from != address(0) && to != address(0)) {
        //            revert NovaroErrors.TransferNotAllowed();
        //        }
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return _dstData[tokenId].url;
    }

    // Mints a DST token to the specified user address and assigns an initial experience value
    // based on the user's social media presence, representing their social influence in Web2.
    //
    // @param to The address to which the DST token will be minted.
    // @param initialExp The initial experience value reflecting the user's Web2 social influence.
    // @return uint256 The newly minted DST token ID.
    function mint(
        address to,
        uint256 initialExp
    ) external override returns (uint256) {
        if (to == address(0)) {
            revert NovaroErrors.InvalidAddress();
        }
        if (balanceOf(to) > 0) {
            revert NovaroErrors.AddressHasToken();
        }
        unchecked {
            _tokenIdCounter++;
            _safeMint(to, _tokenIdCounter);
            tokenIds[to] = _tokenIdCounter;
            _feedDst(_tokenIdCounter, initialExp);
            return _tokenIdCounter;
        }
    }

    // Updates the DST level and experience interval mappings with new data.
    //
    // @param intervals An array of DstInterval structs containing the new level and experience ranges.
    // @dev Clears the existing interval data and replaces it with the provided intervals.
    // @dev Reverts with an error if the provided intervals array is empty.
    function readInterval(
        NovaroDataTypes.DstInterval[] memory intervals
    ) external onlyOwner {
        delete _dstIntervals;
        uint256 length = intervals.length;
        if (length == 0) {
            revert NovaroErrors.EmptyInterval();
        }
        for (uint256 i = 0; i < length; i++) {
            _dstIntervals.push(intervals[i]);
        }
        emit NovaroEvents.ReadInterval(length);
    }

    // Determines the appropriate level and metadata URL for a DST based on the user's experience points.
    //
    // @param tokenId The ID of the DST token for which to locate the metadata.
    // @return lv The level corresponding to the user's experience points.
    // @return url The metadata URL associated with the determined level.
    // @dev Reverts if the experience intervals have not been set. Iterates through the defined intervals
    //      to find the appropriate level and URL based on the user's experience points.
    function _locateMetadata(
        uint256 tokenId
    ) internal view returns (uint256 lv, string memory url) {
        uint256 length = _dstIntervals.length;
        if (length == 0) {
            revert NovaroErrors.IntervalNotSet();
        }
        uint256 exp = _dstData[tokenId].exp;
        for (uint256 i = 0; i < length - 1; i++) {
            NovaroDataTypes.DstInterval memory interval = _dstIntervals[i];
            if (exp >= interval.left && exp < interval.right) {
                return (interval.lv, interval.url);
            }
        }
        return (_dstIntervals[length - 1].lv, _dstIntervals[length - 1].url);
    }

    function offChainFeed(address _owner, uint256 amount) external override {
        if (_feeder == address(0) || msg.sender != _feeder) {
            revert NovaroErrors.EmptyFeeder();
        }
        uint256 tokenId = tokenIds[_owner];
        if (tokenId <= 1) {
            revert NovaroErrors.InvalidTokenId();
        }
        _feedDst(tokenId, amount);
        emit NovaroEvents.OffChainFeed(tokenId, amount);
    }

    // Finds the appropriate DST level and metadata URL based on the user's updated experience points,
    // and updates the token's URI accordingly.
    //
    // @param tokenId The ID of the DST token to update.
    // @param amount The amount of experience points to add to the token's current total.
    // @dev Increases the experience points for the specified DST token, determines the new level and
    //      associated metadata URL, and updates the token's URI to reflect these changes.
    function _feedDst(uint256 tokenId, uint256 amount) internal {
        NovaroDataTypes.DstData storage dstData = _dstData[tokenId];
        dstData.exp += amount;
        (dstData.lv, dstData.url) = _locateMetadata(tokenId);
        _setTokenURI(tokenId, dstData.url);
    }

    //=================getter functions=================
    function getDstData(
        uint256 tokenId
    ) external view returns (uint256 lv, uint256 exp, string memory url) {
        NovaroDataTypes.DstData storage dstData = _dstData[tokenId];
        if (dstData.lv == 0) {
            revert NovaroErrors.TokenNotMinted();
        }
        return (dstData.lv, dstData.exp, dstData.url);
    }

    function getDstIntervals(
        uint256 index
    )
        external
        view
        returns (uint256 lv, uint256 left, uint256 right, string memory url)
    {
        NovaroDataTypes.DstInterval storage interval = _dstIntervals[index];
        return (interval.lv, interval.left, interval.right, interval.url);
    }

    function getDstIntervalLength() external view returns (uint256) {
        return _dstIntervals.length;
    }

    function getDstTokenId(address user) external view returns (uint256) {
        return tokenIds[user];
    }

    function getFeeder() external view returns (address) {
        return _feeder;
    }
}
