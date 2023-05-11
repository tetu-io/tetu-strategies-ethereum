// SPDX-License-Identifier: ISC
/**
* By using this software, you understand, acknowledge and accept that Tetu
* and/or the underlying software are provided “as is” and “as available”
* basis and without warranties or representations of any kind either expressed
* or implied. Any use of this open source software released under the ISC
* Internet Systems Consortium license is done at your own risk to the fullest
* extent permissible pursuant to applicable law any and all liability as well
* as all warranties, including any fitness for a particular purpose with respect
* to Tetu and/or the underlying software and the use thereof are disclaimed.
*/

pragma solidity 0.8.4;

interface IStrategySplitter {
  event Rebalance(address strategy);
  event RebalanceAll(
    uint256 underlyingBalance,
    uint256 strategiesBalancesSum
  );
  event RequestWithdraw(address user, uint256 amount, uint256 time);
  event Salvage(address recipient, address token, uint256 amount);
  event StrategyAdded(address strategy);
  event StrategyRatioChanged(address strategy, uint256 ratio);
  event StrategyRemoved(address strategy);
  event UpdateController(address oldValue, address newValue);
  event UpdatedAddressSlot(string name, address oldValue, address newValue);
  event UpdatedUint256Slot(string name, uint256 oldValue, uint256 newValue);

  function STRATEGY_NAME() external view returns (string memory);

  function STRATEGY_RATIO_DENOMINATOR() external view returns (uint256);

  function VERSION() external view returns (string memory);

  function WITHDRAW_REQUEST_TIMEOUT() external view returns (uint256);

  function addStrategy(address _strategy) external;

  function allStrategies() external view returns (address[] memory);

  function assets() external view returns (address[] memory);

  function buyBackRatio() external view returns (uint256);

  function continueInvesting() external;

  function controller() external view returns (address adr);

  function created() external view returns (uint256 ts);

  function doHardWork() external;

  function emergencyExit() external;

  function getPricePerFullShare() external view returns (uint256);

  function initialize(
    address _controller,
    address _underlying,
    address __vault
  ) external;

  function initializeControllable(address _controller) external;

  function investAllUnderlying() external;

  function investedUnderlyingBalance() external view returns (uint256);

  function isController(address _adr) external view returns (bool);

  function isGovernance(address _adr) external view returns (bool);

  function maxCheapWithdraw() external view returns (uint256);

  function needRebalance() external view returns (uint256);

  function notifyTargetRewardAmount(address _rewardToken, uint256 _amount)
  external;

  function pauseInvesting() external;

  function pausedInvesting() external view returns (bool);

  function platform() external pure returns (uint8);

  function poolTotalAmount() external view returns (uint256);

  function processWithdrawRequests() external;

  function readyToClaim() external view returns (uint256[] memory);

  function rebalance(address _strategy) external;

  function rebalanceAll() external;

  function removeStrategy(address _strategy) external;

  function requestWithdraw(uint256 _amount) external;

  function rewardPoolBalance() external view returns (uint256);

  function rewardTokens() external view returns (address[] memory);

  function salvage(
    address recipient,
    address token,
    uint256 amount
  ) external;

  function setNeedRebalance(uint256 _value) external;

  function setStrategyRatios(
    address[] memory _strategies,
    uint256[] memory _ratios
  ) external;

  function strategies(uint256) external view returns (address);

  function strategiesInited() external view returns (bool);

  function strategiesLength() external view returns (uint256);

  function strategiesRatios(address) external view returns (uint256);

  function strategyRewardTokens() external view returns (address[] memory);

  function totalSupply() external view returns (uint256);

  function underlying() external view returns (address);

  function underlyingBalance() external view returns (uint256);

  function underlyingBalanceWithInvestment() external view returns (uint256);

  function underlyingBalanceWithInvestmentForHolder(address holder)
  external
  view
  returns (uint256);

  function underlyingUnit() external view returns (uint256);

  function unsalvageableTokens(address token) external view returns (bool);

  function vault() external view returns (address);

  function wantToWithdraw() external view returns (uint256);

  function withdrawAllToVault() external;

  function withdrawRequestsCalls(address) external view returns (uint256);

  function withdrawToVault(uint256 amount) external;
}
