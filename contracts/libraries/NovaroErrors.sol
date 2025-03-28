// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library NovaroErrors {
    error InvalidAddress();
    error TransferNotAllowed();
    error EmptyInterval();
    error IntervalNotSet();
    error AddressHasToken();
    error TokenNotMinted();
    error AlreadyBoundDST();
    error AlreadyTransferDST();
    error DSTNotMinted();
    error InvalidTokenId();
    error InvalidDST();
    error InvalidERC6551Registry();
    error InvalidTokenOwner();
    error EmptyTokenBoundAccount();
    error EmptyFeeder();
    error Within24HourPeriod();
    error InvalidSocialOracle();
}
