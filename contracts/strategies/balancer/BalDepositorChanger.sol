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

import "./IBalLocker.sol";
import "@tetu_io/tetu-contracts/contracts/base/governance/ControllableV2.sol";

contract BalDepositorChanger is ControllableV2 {

  IBalLocker public constant BAL_LOCKER = IBalLocker(0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce);

  function change(address gauge, address newDepositor) external {
    require(_isGovernance(msg.sender), "!gov");
    BAL_LOCKER.changeDepositorToGaugeLink(gauge, newDepositor);
  }

}
