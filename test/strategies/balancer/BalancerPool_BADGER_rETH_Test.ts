import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DeployInfo} from "../DeployInfo";
import {StrategyTestUtils} from "../StrategyTestUtils";
import {EthAddresses} from "../../../scripts/addresses/EthAddresses";
import {SpecificStrategyTest} from "../SpecificStrategyTest";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CoreContractsWrapper} from "../../CoreContractsWrapper";
import {DeployerUtilsLocal} from "../../../scripts/deploy/DeployerUtilsLocal";
import {
  BalLocker__factory,
  ISmartVault,
  IStrategy,
  StrategyBalancerPool__factory
} from "../../../typechain";
import {ToolsContractsWrapper} from "../../ToolsContractsWrapper";
import {universalStrategyTest} from "../UniversalStrategyTest";
import {BalancerLpSpecificHardWork} from "./BalancerLpSpecificHardWork";


describe('BalancerPool_BADGER_rETH_Test', async () => {
  const deployInfo: DeployInfo = new DeployInfo();
  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, true);
  });


  // **********************************************
  // ************** CONFIG*************************
  // **********************************************
  const strategyContractName = 'StrategyBalancerPool';
  const vaultName = "BalancerPool_BADGER_rETH_Test";
  const underlying = EthAddresses.BALANCER_BADGER_rETH;
  const poolId = EthAddresses.BALANCER_BADGER_rETH_ID;
  const gauge = EthAddresses.BALANCER_BADGER_rETH_GAUGE;
  const depositToken = EthAddresses.rETH_TOKEN;
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
        await StrategyBalancerPool__factory.connect(strategy.address, signer).initialize(
          core.controller.address,
          vaultAddress,
          depositToken,
          poolId,
          gauge,
          buybackRatio,
        );

        await BalLocker__factory.connect(EthAddresses.BAL_LOCKER, await DeployerUtilsLocal.impersonate())
          .linkDepositorsToGauges([strategy.address], [gauge]);

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
    const hw = new BalancerLpSpecificHardWork(
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
