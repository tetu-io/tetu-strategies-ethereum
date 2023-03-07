import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../DeployerUtilsLocal";
import {
  BalancerPoolBoostedStrategyBase__factory,
  StrategyAura__factory, StrategyBalancerPool__factory,
} from "../../../../typechain";
import {writeFileSync} from "fs";
import {RunHelper} from "../../../utils/tools/RunHelper";
import {TokenUtils} from "../../../../test/TokenUtils";

// tslint:disable-next-line:no-var-requires
const hre = require("hardhat");

const BALANCER_STRAT_LOGIC = '0x6eaCC32119e988d0C1d16A1Dc493D01319998F94';

export async function deployBalancerStrategyForSplitter(splitter: string, pool: string, poolId: string, gauge: string, depositToken: string) {
  const signer = (await ethers.getSigners())[0];
  const core = await DeployerUtilsLocal.getCoreAddresses();
  const undSymbol = await TokenUtils.tokenSymbol(pool)


  const strategyProxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", BALANCER_STRAT_LOGIC);
  await RunHelper.runAndWait(() => StrategyBalancerPool__factory.connect(strategyProxy.address, signer).initialize(
    core.controller,
    splitter,
    depositToken,
    poolId,
    gauge,
    10_00,
  ));


  const txt = `splitter: ${splitter} strategy: ${strategyProxy.address}\n`;
  writeFileSync(`tmp/deployed/balancer_${undSymbol.replace('/', '-')}.txt`, txt, 'utf8');

}
