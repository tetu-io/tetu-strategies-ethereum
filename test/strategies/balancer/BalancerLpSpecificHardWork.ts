import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DoHardWorkLoopBase} from "../DoHardWorkLoopBase";
import {
  BalancerPoolBoostedStrategyBase__factory,
  IBalancerGaugeEth__factory
} from "../../../typechain";
import {EthAddresses} from "../../../scripts/addresses/EthAddresses";
import {parseUnits} from "ethers/lib/utils";
import {TokenUtils} from "../../TokenUtils";
import {DeployerUtilsLocal} from "../../../scripts/deploy/DeployerUtilsLocal";
import {Misc} from "../../../scripts/utils/tools/Misc";


const {expect} = chai;
chai.use(chaiAsPromised);


export class BalancerLpSpecificHardWork extends DoHardWorkLoopBase {

  protected async loopStartActions(i: number) {
    await super.loopStartActions(i);

    const strat = BalancerPoolBoostedStrategyBase__factory.connect(this.strategy.address, this.signer);
    const gauge = IBalancerGaugeEth__factory.connect(await strat.gauge(), this.signer);

    const rts = await strat.rewardTokens();
    console.log('RTs', rts)
    for (const rt of rts) {
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


}
