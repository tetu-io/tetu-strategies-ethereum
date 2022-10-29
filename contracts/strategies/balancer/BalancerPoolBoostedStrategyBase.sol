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

import "@tetu_io/tetu-contracts/contracts/base/strategies/ProxyStrategyBase.sol";
import "../../third_party/balancer/IBalancerGauge.sol";
import "../../third_party/balancer/IBVault.sol";
import "./IBalLocker.sol";
import "../../interface/ITetuLiquidator.sol";

/// @title Base contract for BPT farming using ve boost
/// @author belbix
abstract contract BalancerPoolBoostedStrategyBase is ProxyStrategyBase {
  using SafeERC20 for IERC20;

  // *******************************************************
  //                      CONSTANTS
  // *******************************************************

  /// @notice Strategy type for statistical purposes
  string public constant override STRATEGY_NAME = "BalancerPoolBoostedStrategyBase";
  /// @notice Version of the contract
  /// @dev Should be incremented when contract changed
  string public constant VERSION = "1.0.0";

  uint private constant PRICE_IMPACT_TOLERANCE = 10_000;
  IBVault public constant BALANCER_VAULT = IBVault(0xBA12222222228d8Ba445958a75a0704d566BF2C8);
  IBalLocker public constant BAL_LOCKER = IBalLocker(0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce);
  ITetuLiquidator private constant TETU_LIQUIDATOR = ITetuLiquidator(0xC737eaB847Ae6A92028862fE38b828db41314772);

  // *******************************************************
  //                      VARIABLES
  // *******************************************************

  address public depositToken;
  IAsset[] public poolTokens;
  bytes32 public poolId;
  IBalancerGauge public gauge;
  address govRewardsConsumer;


  /// @notice Initialize contract after setup it as proxy implementation
  function initializeStrategy(
    address controller_,
    address vault_,
    address depositToken_,
    bytes32 poolId_,
    address gauge_,
    uint buybackRatio_,
    address[] memory rewardTokens_
  ) public initializer {

    (IERC20[] memory tokens,,) = BALANCER_VAULT.getPoolTokens(poolId_);
    IAsset[] memory tokenAssets = new IAsset[](tokens.length);
    for (uint i = 0; i < tokens.length; i++) {
      tokenAssets[i] = IAsset(address(tokens[i]));
    }
    poolTokens = tokenAssets;

    depositToken = depositToken_;
    poolId = poolId_;

    gauge = IBalancerGauge(gauge_);
    IERC20(_getPoolAddress(poolId_)).safeApprove(address(BAL_LOCKER), type(uint).max);

    govRewardsConsumer = IController(controller_).governance();

    ProxyStrategyBase.initializeStrategyBase(
      controller_,
      _getPoolAddress(poolId_),
      vault_,
      rewardTokens_,
      buybackRatio_
    );
  }

  // *******************************************************
  //                      GOV ACTIONS
  // *******************************************************

  /// @dev Set new reward tokens
  function setRewardTokens(address[] memory rts) external restricted {
    delete _rewardTokens;
    for (uint i = 0; i < rts.length; i++) {
      _rewardTokens.push(rts[i]);
      _unsalvageableTokens[rts[i]] = true;
    }
  }

  function setGovRewardsConsumer(address value) external restricted {
    govRewardsConsumer = value;
  }

  // *******************************************************
  //                      STRATEGY LOGIC
  // *******************************************************

  /// @dev Balance of staked LPs in the gauge
  function _rewardPoolBalance() internal override view returns (uint256) {
    return gauge.balanceOf(address(BAL_LOCKER));
  }

  /// @dev Rewards amount ready to claim
  function readyToClaim() external view override returns (uint256[] memory toClaim) {
    IBalancerGauge _gauge = gauge;
    toClaim = new uint256[](_rewardTokens.length);
    for (uint i; i < toClaim.length; i++) {
      address rt = _rewardTokens[i];
      toClaim[i] = _gauge.claimable_reward(address(BAL_LOCKER), rt);
    }
  }

  /// @dev Return TVL of the farmable pool
  function poolTotalAmount() external view override returns (uint256) {
    return IERC20(_underlying()).balanceOf(address(gauge));
  }

  /// @dev Platform name for statistical purposes
  /// @return Platform enum index
  function platform() external override pure returns (Platform) {
    return Platform.BALANCER;
  }

  /// @dev assets should reflect underlying tokens need to investing
  function assets() external override view returns (address[] memory) {
    address[] memory token = new address[](poolTokens.length);
    for (uint i = 0; i < poolTokens.length; i++) {
      token[i] = address(poolTokens[i]);
    }
    return token;
  }

  /// @dev Deposit LP tokens to gauge
  function depositToPool(uint256 amount) internal override {
    _doHardWork();
    if (amount != 0) {
      BAL_LOCKER.depositToGauge(address(gauge), amount);
    }
  }

  /// @dev Withdraw LP tokens from gauge
  function withdrawAndClaimFromPool(uint256 amount) internal override {
    if (amount != 0) {
      BAL_LOCKER.withdrawFromGauge(address(gauge), amount);
    }
    _doHardWork();
  }

  /// @dev Emergency withdraw all from a gauge
  function emergencyWithdrawFromPool() internal override {
    BAL_LOCKER.withdrawFromGauge(address(gauge), gauge.balanceOf(address(BAL_LOCKER)));
  }

  /// @dev Make something useful with rewards
  function doHardWork() external onlyNotPausedInvesting override hardWorkers {
    _doHardWork();
  }

  function _doHardWork() internal {
    BAL_LOCKER.claimRewardsFromGauge(address(gauge), address(this));
    liquidateReward();
    // hit for properly statistic metrics
    IBookkeeper(IController(_controller()).bookkeeper()).registerStrategyEarned(0);
  }

  function liquidateReward() internal override {
    address _govRewardsConsumer = govRewardsConsumer;
    address _depositToken = depositToken;
    uint bbRatio = _buyBackRatio();
    for (uint i = 0; i < _rewardTokens.length; i++) {
      address rt = _rewardTokens[i];
      uint amount = IERC20(rt).balanceOf(address(this));
      if (amount != 0) {
        uint toCompound = amount * (_BUY_BACK_DENOMINATOR - bbRatio) / _BUY_BACK_DENOMINATOR;
        uint toGov = amount - toCompound;
        if (toCompound != 0) {
          _liquidate(rt, _depositToken, toCompound);
        }
        if (toGov != 0) {
          IERC20(rt).safeTransfer(_govRewardsConsumer, toGov);
        }
      }
    }

    uint toPool = IERC20(_depositToken).balanceOf(address(this));
    if (toPool != 0) {
      _balancerJoin(poolTokens, poolId, _depositToken, toPool);
    }
  }

  /// @dev Join to the given pool (exchange tokenIn to underlying BPT)
  function _balancerJoin(IAsset[] memory _poolTokens, bytes32 _poolId, address _tokenIn, uint _amountIn) internal {
    uint[] memory amounts = new uint[](_poolTokens.length);
    for (uint i = 0; i < amounts.length; i++) {
      amounts[i] = address(_poolTokens[i]) == _tokenIn ? _amountIn : 0;
    }
    bytes memory userData = abi.encode(1, amounts, 1);
    IBVault.JoinPoolRequest memory request = IBVault.JoinPoolRequest({
    assets : _poolTokens,
    maxAmountsIn : amounts,
    userData : userData,
    fromInternalBalance : false
    });
    _approveIfNeeds(_tokenIn, _amountIn, address(BALANCER_VAULT));
    BALANCER_VAULT.joinPool(_poolId, address(this), address(this), request);
  }

  function _liquidate(address tokenIn, address tokenOut, uint amount) internal {
    if (tokenIn != tokenOut && amount != 0) {
      _approveIfNeeds(tokenIn, amount, address(TETU_LIQUIDATOR));
      // don't revert on errors
      try TETU_LIQUIDATOR.liquidate(tokenIn, tokenOut, amount, PRICE_IMPACT_TOLERANCE) {} catch {}
    }
  }

  function _approveIfNeeds(address token, uint amount, address spender) internal {
    if (IERC20(token).allowance(address(this), spender) < amount) {
      IERC20(token).safeApprove(spender, 0);
      IERC20(token).safeApprove(spender, type(uint).max);
    }
  }


  /// @dev Returns the address of a Pool's contract.
  ///      Due to how Pool IDs are created, this is done with no storage accesses and costs little gas.
  function _getPoolAddress(bytes32 id) internal pure returns (address) {
    // 12 byte logical shift left to remove the nonce and specialization setting. We don't need to mask,
    // since the logical shift already sets the upper bits to zero.
    return address(uint160(uint(id) >> (12 * 8)));
  }


  //slither-disable-next-line unused-state
  uint256[50] private ______gap;
}
