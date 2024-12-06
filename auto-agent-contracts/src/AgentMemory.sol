// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract AgentMemory {
    bytes32 public contentHash;

    // CID components
    uint8 public constant VERSION = 1; // CIDv1
    uint8 public constant CODEC = 0x71; // Raw codec
    uint8 public constant HASH_ALGO = 0x1E; // Blake3-256

    // Lookup table for base32 encoding
    bytes constant base32Alphabet = "abcdefghijklmnopqrstuvwxyz234567";

    function setHash(bytes32 _hash) public {
        contentHash = _hash;
    }

    function getFullCID() public view returns (string memory) {
        // Start with "bafkr" which is the base32 encoded prefix for CIDv1 + raw + blake3
        // We hardcode this since it's always the same for this type of CID

        // Convert the bytes32 hash to base32
        bytes memory base32Hash = new bytes(52); // 32 bytes -> 52 base32 chars
        uint8 remainder;
        uint256 hashBits;

        // Convert the bytes32 to a number for bit manipulation
        uint256 value = uint256(contentHash);

        // Process 5 bits at a time for base32
        for (uint256 i = 0; i < 52; i++) {
            if (i == 0) {
                remainder = uint8((value >> 250) & 0x1F);
                base32Hash[i] = base32Alphabet[remainder];
            } else {
                hashBits = (value << (5 * i)) >> 250;
                remainder = uint8(hashBits & 0x1F);
                base32Hash[i] = base32Alphabet[remainder];
            }
        }

        // Combine prefix with encoded hash
        bytes memory fullCID = bytes.concat(bytes("bafkr"), base32Hash);

        return string(fullCID);
    }

    // Helper function to verify a full CID matches our stored hash
    function verifyCID(string calldata fullCID) public view returns (bool) {
        return keccak256(bytes(getFullCID())) == keccak256(bytes(fullCID));
    }
}
