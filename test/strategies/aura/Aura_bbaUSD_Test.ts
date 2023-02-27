import {DeployInfo} from "../DeployInfo";
import {StrategyTestUtils} from "../StrategyTestUtils";
import {EthAddresses} from "../../../scripts/addresses/EthAddresses";
import {SpecificStrategyTest} from "../SpecificStrategyTest";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CoreContractsWrapper} from "../../CoreContractsWrapper";
import {DeployerUtilsLocal} from "../../../scripts/deploy/DeployerUtilsLocal";
import {
  ISmartVault,
  IStrategy, ITetuLiquidatorOp__factory, StrategyAura__factory,
} from "../../../typechain";
import {ToolsContractsWrapper} from "../../ToolsContractsWrapper";
import {universalStrategyTest} from "../UniversalStrategyTest";
import {AuraSpecificHardWork} from "./AuraSpecificHardWork";


describe('Aura_bbaUSD_Test', async () => {
  const deployInfo: DeployInfo = new DeployInfo();
  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, true);
    // add AURA to liquidator
    const s = await DeployerUtilsLocal.impersonate('0xbbbbb8C4364eC2ce52c59D2Ed3E56F307E529a94')
    const liquidator = ITetuLiquidatorOp__factory.connect('0x90351d15F036289BE9b1fd4Cb0e2EeC63a9fF9b0', s)
    await liquidator.addLargestPools([{
      pool: '0xCfCA23cA9CA720B6E98E3Eb9B6aa0fFC4a5C08B9',
      swapper: '0x7eFC54ED20E32EA76497CB241c7E658E3B29B04B',
      tokenIn: EthAddresses.AURA_TOKEN,
      tokenOut: EthAddresses.WETH_TOKEN,
    }], true)
  });


  // **********************************************
  // ************** CONFIG*************************
  // **********************************************
  const strategyContractName = 'StrategyAura';
  const vaultName = "bbaUSD_AURA";
  const underlying = EthAddresses.BALANCER_bbaUSD;
  const poolId = EthAddresses.BALANCER_bbaUSD_ID;
  const rewardPool = EthAddresses.AURA_bbaUSD_REWARD_POOL;
  const depositToken = EthAddresses.bbaUSDC_TOKEN;
  const buybackRatio = 500;

  // add custom liquidation path if necessary
  const forwarderConfigurator = null;
  // only for strategies where we expect PPFS fluctuations
  const ppfsDecreaseAllowed = false;
  // only for strategies where we expect PPFS fluctuations
  const balanceTolerance = 0;
  const finalBalanceTolerance = 0;
  const deposit = 100_000;
  // at least 3
  const loops = 3;
  const loopValue = 300;
  const advanceBlocks = false;
  const specificTests: SpecificStrategyTest[] = [];
  // **********************************************

  const deployer = (signer: SignerWithAddress) => {
    const core = deployInfo.core as CoreContractsWrapper;
    return StrategyTestUtils.deploy(
      signer,
      core,
      vaultName,
      async vaultAddress => {
        const strategy = await DeployerUtilsLocal.deployStrategyProxy(
          signer,
          strategyContractName,
        );
        await StrategyAura__factory.connect(strategy.address, signer).initialize(
          core.controller.address,
          vaultAddress,
          depositToken,
          poolId,
          rewardPool,
          buybackRatio,
        );

        return strategy;
      },
      underlying,
      0,
    );
  };
  const hwInitiator = (
    _signer: SignerWithAddress,
    _user: SignerWithAddress,
    _core: CoreContractsWrapper,
    _tools: ToolsContractsWrapper,
    _underlying: string,
    _vault: ISmartVault,
    _strategy: IStrategy,
    _balanceTolerance: number
  ) => {
    const hw = new AuraSpecificHardWork(
      _signer,
      _user,
      _core,
      _tools,
      _underlying,
      _vault,
      _strategy,
      _balanceTolerance,
      finalBalanceTolerance,
    );
    hw.checkToClaim = false;
    hw.checkPsSharePrice = false;
    return hw;
  };

  await universalStrategyTest(
    strategyContractName + vaultName,
    deployInfo,
    deployer,
    hwInitiator,
    forwarderConfigurator,
    ppfsDecreaseAllowed,
    balanceTolerance,
    deposit,
    loops,
    loopValue,
    advanceBlocks,
    specificTests,
  );

});
