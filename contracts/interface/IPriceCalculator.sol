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

interface IPriceCalculator {
  event DefaultTokenChanged(address oldToken, address newToken);
  event KeyTokenAdded(address newKeyToken);
  event KeyTokenRemoved(address keyToken);
  event MultipartTokenUpdated(address token, bool status);
  event ReplacementTokenUpdated(address token, address replacementToken);
  event SwapPlatformAdded(address factoryAddress, string name);
  event SwapPlatformRemoved(address factoryAddress, string name);
  event UpdateController(address oldValue, address newValue);

  function CRV_USD_BTC_ETH() external view returns (address);

  function DEPTH() external view returns (uint256);

  function FIREBIRD_FACTORY() external view returns (address);

  function IRON_IS3USD() external view returns (string memory);

  function IS3USD() external view returns (string memory);

  function PRECISION_DECIMALS() external view returns (uint256);

  function VERSION() external view returns (string memory);

  function addKeyToken(address newToken) external;

  function addKeyTokens(address[] memory newTokens) external;

  function addSwapPlatform(address _factoryAddress, string memory _name)
  external;

  function checkFactory(address pair, address compareFactory)
  external
  view
  returns (bool);

  function computePrice(
    address token,
    address outputToken,
    address[] memory usedLps,
    uint256 deep
  ) external view returns (uint256);

  function controller() external view returns (address adr);

  function created() external view returns (uint256 ts);

  function defaultToken() external view returns (address value);

  function getLargestPool(address token, address[] memory usedLps)
  external
  view
  returns (
    address,
    uint256,
    address
  );

  function getLpForFactory(
    address _factory,
    address token,
    address tokenOpposite
  ) external view returns (uint256, address);

  function getLpSize(address pairAddress, address token)
  external
  view
  returns (uint256);

  function getLpUnderlying(address lpAddress)
  external
  view
  returns (address[2] memory, uint256[2] memory);

  function getPrice(address token, address outputToken)
  external
  view
  returns (uint256);

  function getPriceFromLp(address lpAddress, address token)
  external
  view
  returns (uint256);

  function getPriceWithDefaultOutput(address token)
  external
  view
  returns (uint256);

  function initialize(address _controller) external;

  function initializeControllable(address _controller) external;

  function isAave(address token) external view returns (bool);

  function isController(address _adr) external view returns (bool);

  function isGovernance(address _adr) external view returns (bool);

  function isIronPair(address token) external view returns (bool);

  function isKeyToken(address token) external view returns (bool);

  function isSwapFactoryToken(address adr) external view returns (bool);

  function isSwapName(string memory name) external view returns (bool);

  function isSwapPlatform(address token) external view returns (bool);

  function keyTokens(uint256) external view returns (address);

  function keyTokensSize() external view returns (uint256);

  function removeKeyToken(address keyToken) external;

  function removeSwapPlatform(address _factoryAddress, string memory _name)
  external;

  function setDefaultToken(address _newDefaultToken) external;

  function setReplacementTokens(
    address _inputToken,
    address _replacementToken
  ) external;

  function swapFactories(uint256) external view returns (address);

  function swapFactoriesSize() external view returns (uint256);

  function swapLpNames(uint256) external view returns (string memory);
}
