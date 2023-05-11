// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "./ITetuLiquidator.sol";

interface ITetuLiquidatorOp is ITetuLiquidator {
  function addLargestPools(ITetuLiquidator.PoolData[] memory _pools, bool rewrite) external;
}
