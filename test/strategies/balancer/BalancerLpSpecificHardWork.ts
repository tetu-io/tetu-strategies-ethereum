
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DoHardWorkLoopBase} from "../DoHardWorkLoopBase";
import {DeployerUtilsLocal} from "../../../scripts/deploy/DeployerUtilsLocal";


const {expect} = chai;
chai.use(chaiAsPromised);


export class BalancerLpSpecificHardWork extends DoHardWorkLoopBase {

  protected async loopStartActions(i: number) {
    await super.loopStartActions(i);

    // const strat = StrategyBalancerPool__factory.connect(this.strategy.address, this.signer);
    // const gauge = IBalancerGauge__factory.connect(await strat.gauge(), this.signer);

    // const owner = await DeployerUtilsLocal.impersonate('0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD');
    // const streamer = IChildChainStreamer__factory.connect('0x90a6EC799f21a154AB7aFFD0B34C5f3f129808e2', owner);
    // await TokenUtils.getToken(MaticAddresses.BAL_TOKEN, streamer.address, parseUnits('100000'));
    // // const balToken = IERC20__factory.connect(MaticAddresses.BAL_TOKEN, this.signer);
    // await streamer.notify_reward_amount(MaticAddresses.BAL_TOKEN)
  }


}
