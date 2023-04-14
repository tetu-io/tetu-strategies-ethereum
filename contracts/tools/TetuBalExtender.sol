// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "../strategies/balancer/IBalLocker.sol";
import "@tetu_io/tetu-contracts/contracts/openzeppelin/SafeERC20.sol";
import "../third_party/curve/IVotingEscrow.sol";

contract TetuBalExtender {
  using SafeERC20 for IERC20;

  IERC20 internal constant BALANCER_BAL_WETH = IERC20(0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56);
  IBalLocker internal constant BAL_LOCKER = IBalLocker(0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce);
  IVotingEscrow public constant VE_BAL = IVotingEscrow(0xC128a9954e6c874eA3d62ce62B468bA073093F25);
  uint256 private constant _MAX_LOCK = 365 * 86400;
  uint256 private constant _WEEK = 7 * 86400;

  address immutable public owner;
  address public operator;
  uint public maxGas;
  uint public lastCall;

  constructor() {
    owner = msg.sender;
  }

  function setOperator(address _operator) external {
    require(msg.sender == owner, "NOT_OWNER");
    operator = _operator;
  }

  function setMaxGas(uint _maxGas) external {
    require(msg.sender == owner, "NOT_OWNER");
    maxGas = _maxGas;
  }

  function extend(uint amount) external {
    require(msg.sender == operator, "NOT_OPERATOR");
    BALANCER_BAL_WETH.safeTransfer(address(BAL_LOCKER), amount);
    BAL_LOCKER.depositVe(amount);
    lastCall = block.timestamp;
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

  function isReadyToExtend() external view returns (bool canExec, bytes memory execPayload) {
    if (tx.gasprice > maxGasAdjusted()) {
      return (false, abi.encodePacked("Too high gas: ", _toString(tx.gasprice / 1e9)));
    }

    (,uint unlockTime) = VE_BAL.locked(address(BAL_LOCKER));

    uint256 unlockAt = block.timestamp + _MAX_LOCK;
    uint256 unlockInWeeks = (unlockAt / _WEEK) * _WEEK;

    if (unlockInWeeks > unlockTime && unlockInWeeks - unlockTime > 2) {
      return (true, abi.encodeWithSelector(TetuBalExtender.extend.selector, (uint(1))));
    }
    return (false, "Not yet");
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
