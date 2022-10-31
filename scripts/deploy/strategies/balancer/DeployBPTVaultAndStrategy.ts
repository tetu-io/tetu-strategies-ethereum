import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../DeployerUtilsLocal";
import {
  IController__factory,
  ISmartVault__factory, StrategyBalancerPool__factory,
} from "../../../../typechain";
import {writeFileSync} from "fs";
import {RunHelper} from "../../../utils/tools/RunHelper";
import {TokenUtils} from "../../../../test/TokenUtils";
import {TimeUtils} from "../../../../test/TimeUtils";
import {Misc} from "../../../utils/tools/Misc";
import {EthAddresses} from "../../../addresses/EthAddresses";
import {BalancerConstants} from "./BalancerConstants";

// tslint:disable-next-line:no-var-requires
const hre = require("hardhat");

export async function deployBalancerVaultAndStrategy(pool: string, poolId: string, gauge: string, depositToken: string) {
  const signer = (await ethers.getSigners())[0];
  const core = await DeployerUtilsLocal.getCoreAddresses();
  const undSymbol = await TokenUtils.tokenSymbol(pool)

  if (await DeployerUtilsLocal.findVaultUnderlyingInBookkeeper(signer, pool)) {
    console.error("VAULT WITH THIS UNDERLYING EXIST! skip");
    return;
  }

  const vaultProxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", DeployerUtilsLocal.getVaultLogic(signer).address);
  await RunHelper.runAndWait(() => ISmartVault__factory.connect(vaultProxy.address, signer).initializeSmartVault(
    "Tetu Vault " + undSymbol,
    "x" + undSymbol,
    core.controller,
    pool,
    60 * 60 * 24 * 7,
    false,
    EthAddresses.ZERO_ADDRESS,
    0
  ));
  const strategyProxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", BalancerConstants.STRATEGY_BALANCER_POOL_LOGIC);
  await RunHelper.runAndWait(() => StrategyBalancerPool__factory.connect(strategyProxy.address, signer).initialize(
    core.controller,
    vaultProxy.address,
    depositToken,
    poolId,
    gauge,
    80_00
  ));

  if (hre.network.name !== 'hardhat') {
    const txt = `vault: ${vaultProxy.address}\nstrategy: ${strategyProxy.address}`;
    writeFileSync(`tmp/deployed/balancer_${undSymbol.replace('/', '-')}.txt`, txt, 'utf8');
  }

  // const governance = await IController__factory.connect(core.controller, signer).governance();
  // if (governance.toLowerCase() === signer.address.toLowerCase()) {
  //   await DeployerUtilsLocal.wait(10);
  //   await RunHelper.runAndWait(() => IController__factory.connect(core.controller, signer).addVaultsAndStrategies(
  //     [vaultProxy.address],
  //     [strategyProxy.address],
  //   ));
  //   await DeployerUtilsLocal.wait(10);
  //   await RunHelper.runAndWait(() => ConeStacker__factory.connect(ConeConstants.CONE_STACKER, signer).changeDepositorStatus(strategyProxy.address, true));
  // }
}
