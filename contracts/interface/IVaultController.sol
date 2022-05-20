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

interface IVaultController {
  event UpdateController(address oldValue, address newValue);
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

  function VERSION() external view returns (string memory);

  function addRewardTokens(address[] memory _vaults, address _rt) external;

  function changePpfsDecreasePermissions(
    address[] memory _targets,
    bool _value
  ) external;

  function changeVaultsStatuses(
    address[] memory _targets,
    bool[] memory _statuses
  ) external;

  function controller() external view returns (address adr);

  function created() external view returns (uint256 ts);

  function disableLocks(address[] memory _targets) external;

  function initialize(address _controller) external;

  function initializeControllable(address _controller) external;

  function initializeVaultControllerStorage() external;

  function isController(address _adr) external view returns (bool);

  function isGovernance(address _adr) external view returns (bool);

  function rebalance(address[] memory _targets) external;

  function removeRewardTokens(address[] memory _vaults, address _rt) external;

  function rewardBoostDuration() external view returns (uint256);

  function rewardRatioWithoutBoost() external view returns (uint256);

  function setRewardBoostDuration(uint256 duration) external;

  function setRewardRatioWithoutBoost(uint256 ratio) external;

  function setToInvest(address[] memory _targets, uint256 _value) external;

  function stopVault(address _vault) external;

  function stopVaultsBatch(address[] memory _vaults) external;
}
