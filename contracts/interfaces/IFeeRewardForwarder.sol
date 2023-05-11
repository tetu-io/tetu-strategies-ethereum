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

interface IFeeRewardForwarder {
  event ContractInitialized(address controller, uint256 ts, uint256 block);
  event FeeMovedToFund(
    address indexed fund,
    address indexed token,
    uint256 amount
  );
  event FeeMovedToPs(
    address indexed ps,
    address indexed token,
    uint256 amount
  );
  event FeeMovedToVault(
    address indexed vault,
    address indexed token,
    uint256 amount
  );
  event Liquidated(
    address indexed tokenIn,
    address indexed tokenOut,
    uint256 amount
  );
  event LiquidityAdded(
    address router,
    address token0,
    uint256 token0Amount,
    address token1,
    uint256 token1Amount
  );
  event UpdatedAddressSlot(
    string indexed name,
    address oldValue,
    address newValue
  );
  event UpdatedUint256Slot(
    string indexed name,
    uint256 oldValue,
    uint256 newValue
  );

  function DEFAULT_UNI_FEE_DENOMINATOR() external view returns (uint256);

  function DEFAULT_UNI_FEE_NUMERATOR() external view returns (uint256);

  function LIQUIDITY_DENOMINATOR() external view returns (uint256);

  function MINIMUM_AMOUNT() external view returns (uint256);

  function ROUTE_LENGTH_MAX() external view returns (uint256);

  function SLIPPAGE_DENOMINATOR() external view returns (uint256);

  function VERSION() external view returns (string memory);

  function addBlueChipsLps(address[] memory _lps) external;

  function addLargestLps(address[] memory _tokens, address[] memory _lps)
  external;

  function blueChipsLps(address, address)
  external
  view
  returns (
    address lp,
    address token,
    address oppositeToken
  );

  function blueChipsTokens(address) external view returns (bool);

  function controller() external view returns (address);

  function created() external view returns (uint256 ts);

  function createdBlock() external view returns (uint256 ts);

  function distribute(
    uint256 _amount,
    address _token,
    address _vault
  ) external returns (uint256);

  function fund() external view returns (address);

  function fundToken() external view returns (address);

  function getBalData()
  external
  view
  returns (
    address balToken,
    address vault,
    bytes32 pool,
    address tokenOut
  );

  function initialize(address _controller) external;

  function initializeControllable(address __controller) external;

  function isController(address _value) external view returns (bool);

  function isGovernance(address _value) external view returns (bool);

  function largestLps(address)
  external
  view
  returns (
    address lp,
    address token,
    address oppositeToken
  );

  function liquidate(
    address tokenIn,
    address tokenOut,
    uint256 amount
  ) external returns (uint256);

  function liquidityNumerator() external view returns (uint256);

  function liquidityRouter() external view returns (address);

  function notifyCustomPool(
    address,
    address,
    uint256
  ) external pure returns (uint256);

  function notifyPsPool(address, uint256) external pure returns (uint256);

  function psVault() external view returns (address);

  function setBalData(
    address balToken,
    address vault,
    bytes32 pool,
    address tokenOut
  ) external;

  function setLiquidityNumerator(uint256 _value) external;

  function setLiquidityRouter(address _value) external;

  function setSlippageNumerator(uint256 _value) external;

  function setUniPlatformFee(
    address _factory,
    uint256 _feeNumerator,
    uint256 _feeDenominator
  ) external;

  function slippageNumerator() external view returns (uint256);

  function tetu() external view returns (address);

  function uniPlatformFee(address)
  external
  view
  returns (uint256 numerator, uint256 denominator);
}
