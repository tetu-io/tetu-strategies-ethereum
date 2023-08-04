import {DoHardWorkLoopBase} from "../DoHardWorkLoopBase";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BigNumber, utils} from "ethers";
import {TokenUtils} from "../../TokenUtils";
import {StrategyTestUtils} from "../StrategyTestUtils";
import {EthAddresses} from "../../../scripts/addresses/EthAddresses";
import {
  BalDepositor__factory,
  IBVault__factory,
  IERC20__factory,
  IFeeDistributor__factory,
  StrategyBalStaking__factory
} from "../../../typechain";
import {VaultUtils} from "../../VaultUtils";
import {defaultAbiCoder} from "@ethersproject/abi";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {TimeUtils} from "../../TimeUtils";
import {Misc} from "../../../scripts/utils/tools/Misc";

const {expect} = chai;
chai.use(chaiAsPromised);


export class BalStakingDoHardWork extends DoHardWorkLoopBase {

  async init() {
    await super.init();
    // add reward to distributor
    // const amount = parseUnits('100');
    // await TokenUtils.getToken(EthAddresses.BAL_TOKEN, this.signer.address, amount);
    // await IERC20__factory.connect(EthAddresses.BAL_TOKEN, this.signer).approve(EthAddresses.BALANCER_FEE_DISTRIBUTOR, amount);
    // await IFeeDistributor__factory.connect(EthAddresses.BALANCER_FEE_DISTRIBUTOR, this.signer).depositToken(EthAddresses.BAL_TOKEN, amount);
  }

  public async loopStartActions(i: number) {
    await super.loopStartActions(i);

    // add reward to distributor
    await TimeUtils.advanceBlocksOnTs(60 * 60 * 24 * 7);
    const amount = parseUnits('100000');
    await TokenUtils.getToken(EthAddresses.BAL_TOKEN, this.signer.address, amount);
    await IERC20__factory.connect(EthAddresses.BAL_TOKEN, this.signer).approve(EthAddresses.BALANCER_FEE_DISTRIBUTOR, amount);
    await IFeeDistributor__factory.connect(EthAddresses.BALANCER_FEE_DISTRIBUTOR, this.signer).depositToken(EthAddresses.BAL_TOKEN, amount);

    await TokenUtils.getToken(EthAddresses.bbUSD_NEW2_TOKEN, this.signer.address, amount);
    await IERC20__factory.connect(EthAddresses.bbUSD_NEW2_TOKEN, this.signer).approve(EthAddresses.BALANCER_FEE_DISTRIBUTOR, amount);
    await IFeeDistributor__factory.connect(EthAddresses.BALANCER_FEE_DISTRIBUTOR, this.signer).depositToken(EthAddresses.bbUSD_NEW2_TOKEN, amount);
  }

  protected async enterToVault() {
    console.log('--- Enter to vault')
    // deposit through depositor contract

    const depositorAdr = await StrategyBalStaking__factory.connect(this.strategy.address, this.signer).depositor()
    const depositor = BalDepositor__factory.connect(depositorAdr, this.signer);

    const ethBalance0 = await TokenUtils.balanceOf(EthAddresses.WETH_TOKEN, this.signer.address);
    await TokenUtils.transfer(EthAddresses.WETH_TOKEN, this.signer, Misc.ZERO_ADDRESS, ethBalance0.toString());

    await IBVault__factory.connect(EthAddresses.BALANCER_VAULT, this.signer).exitPool(
      EthAddresses.BALANCER_BAL_WETH_ID,
      this.signer.address,
      this.signer.address,
      {
        assets: [EthAddresses.BAL_TOKEN, EthAddresses.WETH_TOKEN],
        minAmountsOut: [0, 0],
        userData: defaultAbiCoder.encode(['uint256', 'uint256'], [1, this.userDeposited.div(2)]),
        toInternalBalance: false
      }
    );

    const balBalance = await TokenUtils.balanceOf(EthAddresses.BAL_TOKEN, this.signer.address);
    const ethBalance = await TokenUtils.balanceOf(EthAddresses.WETH_TOKEN, this.signer.address);
    console.log('balBalance', formatUnits(balBalance));
    console.log('ethBalance', formatUnits(ethBalance));
    await TokenUtils.transfer(EthAddresses.BAL_TOKEN, this.signer, depositorAdr, balBalance.toString());
    await TokenUtils.transfer(EthAddresses.WETH_TOKEN, this.signer, depositorAdr, ethBalance.toString());

    await depositor.depositBridgedAssets('0x');

    const balBalance1 = await TokenUtils.balanceOf(EthAddresses.BAL_TOKEN, depositor.address);
    const ethBalance1 = await TokenUtils.balanceOf(EthAddresses.WETH_TOKEN, depositor.address);
    console.log('balBalance1', formatUnits(balBalance1));
    console.log('ethBalance1', formatUnits(ethBalance1));
    expect(balBalance1).eq(0);
    expect(ethBalance1).eq(0);

    const depositorBalance = await this.vault.underlyingBalanceWithInvestmentForHolder(depositor.address);
    expect(+utils.formatUnits(depositorBalance)).is.approximately(+utils.formatUnits(this.userDeposited.div(2)), +utils.formatUnits(this.userDeposited.div(2)) * 0.003);

    this.signerDeposited = this.userDeposited.div(2);
    await VaultUtils.deposit(this.user, this.vault, this.userDeposited);
    await this.userCheckBalanceInVault();

    // remove excess tokens
    const excessBalUser = await TokenUtils.balanceOf(this.underlying, this.user.address);
    if (!excessBalUser.isZero()) {
      await TokenUtils.transfer(this.underlying, this.user, this.tools.calculator.address, excessBalUser.toString());
    }
    const excessBalSigner = await TokenUtils.balanceOf(this.underlying, this.signer.address);
    if (!excessBalSigner.isZero()) {
      await TokenUtils.transfer(this.underlying, this.signer, this.tools.calculator.address, excessBalSigner.toString());
    }
    console.log('--- Enter to vault end')
  }

  // don't use for initial deposit
  protected async deposit(amount: BigNumber, invest: boolean) {
    console.log('PPFS before deposit', (await this.vault.getPricePerFullShare()).toString());
    await VaultUtils.deposit(this.user, this.vault, amount, invest);
    this.userWithdrew = this.userWithdrew.sub(amount);
    console.log('userWithdrew', this.userWithdrew.toString());
    await this.userCheckBalanceInVault();
    console.log('PPFS after deposit', (await this.vault.getPricePerFullShare()).toString());
  }


  public async loopEndActions(i: number) {
    console.log('loopEndActions - no withdraw actions')
  }

  public async doHardWork() {
    const depositorAdr = await StrategyBalStaking__factory.connect(this.strategy.address, this.signer).depositor()
    const depositor = BalDepositor__factory.connect(depositorAdr, this.signer);
    console.log('HW DEPOSITOR', depositor.address);
    await depositor.claimAndMoveToAnotherChain();
  }

  protected async postLoopCheck() {

    await this.vault.connect(this.signer).getAllRewards();
    await this.vault.connect(this.user).getAllRewards();

    const depositorAdr = await StrategyBalStaking__factory.connect(this.strategy.address, this.signer).depositor()
    const depositorBalance = await this.vault.underlyingBalanceWithInvestmentForHolder(depositorAdr);
    expect(+utils.formatUnits(depositorBalance)).is.approximately(+utils.formatUnits(this.userDeposited.div(2)), +utils.formatUnits(this.userDeposited.div(2)) * 0.003);

    // strategy should not contain any tokens in the end
    const stratRtBalances = await StrategyTestUtils.saveStrategyRtBalances(this.strategy);
    for (const rtBal of stratRtBalances) {
      expect(rtBal).is.eq(0, 'Strategy contains not liquidated rewards');
    }

    // check vault balance
    // const vaultBalanceAfter = await TokenUtils.balanceOf(this.core.psVault.address, this.vault.address);
    // expect(vaultBalanceAfter.sub(this.vaultRTBal)).is.not.eq("0", "vault reward should increase");

    // check ps balance
    // const psBalanceAfter = await TokenUtils.balanceOf(this.core.rewardToken.address, this.core.psVault.address);
    // expect(psBalanceAfter.sub(this.psBal)).is.not.eq("0", "ps balance should increase");

    // check reward for user
    // const rewardBalanceAfter = await TokenUtils.balanceOf(this.core.psVault.address, this.user.address);
    // expect(rewardBalanceAfter.sub(this.userRTBal).toString())
    //   .is.not.eq("0", "should have earned xTETU rewards");
  }

}
