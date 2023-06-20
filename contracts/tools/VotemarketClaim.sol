// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@tetu_io/tetu-contracts/contracts/openzeppelin/SafeERC20.sol";
import "../third_party/stakedao/IPlatformVotemarket.sol";

contract VotemarketClaim {
  using SafeERC20 for IERC20;

//  IERC20 internal constant BALANCER_BAL_WETH = IERC20(0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56);
  IPlatformVotemarket public constant PLATFORM = IPlatformVotemarket(0x00000008eF298e2B6dc47E88D72eeB1Fc2b1CA7f);
  address public constant RECIPIENT = 0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce;
  uint public constant DEPTH = 50;

  address immutable public owner;
  uint public maxGas;
  uint public lastCall;

  constructor() {
    owner = msg.sender;
    maxGas = 20 gwei;
  }

  function setMaxGas(uint _maxGas) external {
    require(msg.sender == owner, "NOT_OWNER");
    maxGas = _maxGas;
  }

  function claim(uint[] calldata ids) external {
    PLATFORM.claimAllFor(RECIPIENT, ids);
  }

  function maxGasAdjusted() public view returns (uint) {
    uint _maxGas = maxGas;

    uint diff = block.timestamp - lastCall;
    // 7 days gap
    if (diff < 7 days) {
      return _maxGas;
    } else {
      diff -= 7 days;
    }
    uint multiplier = diff * 100 / 1 days;
    return _maxGas + _maxGas * multiplier / 100;
  }

  function isReadyToClaim() external view returns (bool canExec, bytes memory execPayload) {
    if (tx.gasprice > maxGasAdjusted()) {
      return (false, abi.encodePacked("Too high gas: ", _toString(tx.gasprice / 1e9)));
    }

    uint maxBountyId = PLATFORM.nextID();
    uint[] memory ids = new uint[](DEPTH + 1);

    uint startId = 0;
    // use last 100 ids assuming it is enough to find actual
    if (maxBountyId > DEPTH) {
      startId = maxBountyId - DEPTH;
    }

    uint idsCount = 0;
    for (uint i = startId; i < maxBountyId + 1; ++i) {
      uint claimable = PLATFORM.claimable(RECIPIENT, i);
      if (claimable > 0) {
        ids[idsCount] = i;
        idsCount++;
      }
    }

    if (idsCount > 0) {
      // cut the array
      uint[] memory idsForClaim = new uint[](idsCount);
      for (uint i; i < idsCount; ++i) {
        idsForClaim[i] = ids[i];
      }

      return (true, abi.encodeWithSelector(VotemarketClaim.claim.selector, (idsForClaim)));
    } else {
      return (false, "Nothing to claim");
    }
  }

  function _toString(uint value) internal pure returns (string memory) {
    if (value == 0) {
      return "0";
    }
    uint temp = value;
    uint digits;
    while (temp != 0) {
      digits++;
      temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
      digits -= 1;
      buffer[digits] = bytes1(uint8(48 + uint(value % 10)));
      value /= 10;
    }
    return string(buffer);
  }

}
