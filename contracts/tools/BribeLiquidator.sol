// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@tetu_io/tetu-contracts/contracts/openzeppelin/SafeERC20.sol";
import "@tetu_io/tetu-contracts/contracts/base/interface/ITetuLiquidator.sol";
import "@tetu_io/tetu-contracts/contracts/base/governance/ControllableV2.sol";
import "../third_party/paladin/IMultiMerkleDistributor.sol";
import "../third_party/hh/IRewardDistributor.sol";
import "../third_party/polygon/IRootChainManager.sol";

contract BribeLiquidator is ControllableV2 {
  using SafeERC20 for IERC20;

  // ----- CONSTANTS -------

  /// @notice Version of the contract
  string public constant VERSION = "1.0.0";

  address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  ITetuLiquidator internal constant LIQUIDATOR = ITetuLiquidator(0x90351d15F036289BE9b1fd4Cb0e2EeC63a9fF9b0);
  IMultiMerkleDistributor internal constant PALADIN_DISTRIBUTOR = IMultiMerkleDistributor(0x8EdcFE9Bc7d2a735117B94C16456D8303777abbb);
  IRewardDistributor internal constant HH_DISTRIBUTOR = IRewardDistributor(0x0b139682D5C9Df3e735063f46Fb98c689540Cf3A);
  IRootChainManager internal constant POLYGON_BRIDGE = IRootChainManager(0xA0c68C638235ee32657e8f720a23ceC1bFc77C77);

  uint public constant PRICE_IMPACT_TOLERANCE = 5_000;

  // ----- VARIABLES -------

  address public bribesReceiver;

  // ----- INITIALIZER -------

  function initialize(
    address controller_,
    address bribesReceiver_
  ) external initializer {
    ControllableV2.initializeControllable(controller_);
    bribesReceiver = bribesReceiver_;
  }

  modifier restricted() {
    address c = _controller();
    require(IController(c).isHardWorker(msg.sender) || IController(c).governance() == msg.sender, "FORBIDDEN");
    _;
  }

  // ----- MAIN LOGIC -------

  /// @dev Address on Polygon to receive bribes.
  function setBribesReceiver(address bribesReceiver_) external {
    require(IController(_controller()).governance() == msg.sender, "FORBIDDEN");
    bribesReceiver = bribesReceiver_;
  }

  /// @dev Governance can withdraw any token.
  function salvage(address token, uint amount, address dest) external {
    require(IController(_controller()).governance() == msg.sender, "FORBIDDEN");
    IERC20(token).safeTransfer(dest, amount);
  }

  /// @dev Claim Paladin rewards to this contract.
  function claimPaladin(IMultiMerkleDistributor.ClaimParams[] calldata claims) external {
    PALADIN_DISTRIBUTOR.multiClaim(address(this), claims);
  }

  /// @dev Claim Hidden Hand rewards to this contract.
  function claimHiddenHand(RewardDistributor.Claim[] calldata claims) external {
    HH_DISTRIBUTOR.claim(claims);
  }

  /// @dev Liquidate whole amount of given token to USDC and bridge it to Polygon.
  function liquidateAndBridge(address token) external restricted returns (uint amount) {
    amount = _liquidateToUSDC(token, IERC20(token).balanceOf(address(this)));
    if (amount != 0) {

      address predicate = POLYGON_BRIDGE.typeToPredicate(POLYGON_BRIDGE.tokenToType(token));
      require(predicate != address(0), "INVALID_PREDICATE");
      _approveIfNeed(token, predicate, amount);
      POLYGON_BRIDGE.depositFor(bribesReceiver, token, abi.encode(amount));
    }
  }

  // ----- INTERNAL -------

  /// @dev Sell given token to USDC using Tetu liquidator.
  function _liquidateToUSDC(address tokenIn, uint amount) internal returns (uint bought) {
    if (tokenIn == USDC) {
      return amount;
    }

    uint tokenOutBalanceBefore = IERC20(USDC).balanceOf(address(this));

    _approveIfNeed(tokenIn, address(LIQUIDATOR), amount);
    LIQUIDATOR.liquidate(tokenIn, USDC, amount, PRICE_IMPACT_TOLERANCE);

    return IERC20(USDC).balanceOf(address(this)) - tokenOutBalanceBefore;
  }

  function _approveIfNeed(address token, address dst, uint amount) internal {
    if (IERC20(token).allowance(address(this), dst) < amount) {
      IERC20(token).safeApprove(dst, 0);
      IERC20(token).safeApprove(dst, type(uint).max);
    }
  }

}
