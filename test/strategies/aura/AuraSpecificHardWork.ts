import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DoHardWorkLoopBase} from "../DoHardWorkLoopBase";
import {
  AuraStrategyBase__factory,
  IBalancerGaugeEth__factory, IBaseRewardPool__factory, IBooster__factory
} from "../../../typechain";
import {parseUnits} from "ethers/lib/utils";
import {TokenUtils} from "../../TokenUtils";
import {DeployerUtilsLocal} from "../../../scripts/deploy/DeployerUtilsLocal";
import {Misc} from "../../../scripts/utils/tools/Misc";


chai.use(chaiAsPromised);

export class AuraSpecificHardWork extends DoHardWorkLoopBase {

  protected async loopStartActions(i: number) {
    await super.loopStartActions(i);

    const strat = AuraStrategyBase__factory.connect(this.strategy.address, this.signer);
    const booster = IBooster__factory.connect(await strat.AURA_BOOSTER(), this.signer)
    const auraRewardPool = IBaseRewardPool__factory.connect(await strat.auraRewardPool(), this.signer)
    const pid = await auraRewardPool.pid()
    const poolInfo = await booster.poolInfo(pid)
    const gauge = IBalancerGaugeEth__factory.connect(poolInfo.gauge, this.signer);

    const rts = await strat.rewardTokens();
    console.log('RTs', rts)
    const rt = rts[0]
    const amount = parseUnits('10');
    const data = await gauge.reward_data(rt);
    const acc = await DeployerUtilsLocal.impersonate(data.distributor)
    if (acc.address !== Misc.ZERO_ADDRESS) {
      await TokenUtils.getToken(rt, acc.address, amount);
      await TokenUtils.approve(rt, acc, gauge.address, amount.toString())
      await gauge.connect(acc).deposit_reward_token(rt, amount);
    }
  }


}
