import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../DeployerUtilsLocal";
import {StrategyAura__factory,} from "../../../../typechain";
import {writeFileSync} from "fs";
import {RunHelper} from "../../../utils/tools/RunHelper";
import {TokenUtils} from "../../../../test/TokenUtils";

// tslint:disable-next-line:no-var-requires
const hre = require("hardhat");

const AURA_STRAT_LOGIC = '0x422fd4563B565971E9a7E0E69aa2eDc83462C535';

export async function deployAuraStrategyForSplitter(splitter: string, pool: string, poolId: string, auraRewardPool: string, depositToken: string) {
  const signer = (await ethers.getSigners())[0];
  const core = await DeployerUtilsLocal.getCoreAddresses();
  const undSymbol = await TokenUtils.tokenSymbol(pool)


  const strategyProxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", AURA_STRAT_LOGIC);
  await RunHelper.runAndWait(() => StrategyAura__factory.connect(strategyProxy.address, signer).initialize(
    core.controller,
    splitter,
    depositToken,
    poolId,
    auraRewardPool,
    10_00,
  ));


  const txt = `splitter: ${splitter} strategy: ${strategyProxy.address}\n`;
  writeFileSync(`tmp/deployed/aura_${undSymbol.replace('/', '-')}.txt`, txt, 'utf8');

}
