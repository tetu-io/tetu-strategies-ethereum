import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DeployInfo} from "../DeployInfo";
import {StrategyTestUtils} from "../StrategyTestUtils";
import {EthAddresses} from "../../../scripts/addresses/EthAddresses";
import {SpecificStrategyTest} from "../SpecificStrategyTest";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CoreContractsWrapper} from "../../CoreContractsWrapper";
import {DeployerUtilsLocal} from "../../../scripts/deploy/DeployerUtilsLocal";
import {ISmartVault, IStrategy, StrategyBalancerPool__factory} from "../../../typechain";
import {ToolsContractsWrapper} from "../../ToolsContractsWrapper";
import {universalStrategyTest} from "../UniversalStrategyTest";
import {BalancerLpSpecificHardWork} from "./BalancerLpSpecificHardWork";


const {expect} = chai;
chai.use(chaiAsPromised);

describe.skip('BalancerPool_wstETH_WETH_Test', async () => {
  const deployInfo: DeployInfo = new DeployInfo();
  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, true);
  });


  // **********************************************
  // ************** CONFIG*************************
  // **********************************************
  const strategyContractName = 'StrategyBalancerPool';
  const vaultName = "wstETH_WETH_BPT";
  const underlying = EthAddresses.BALANCER_wstETH_WETH;
  const poolId = EthAddresses.BALANCER_wstETH_WETH_ID;
  const gauge = EthAddresses.BALANCER_GAUGE_wstETH_WETH;
  const depositToken = EthAddresses.WETH_TOKEN;
  const buybackRatio = 500;
  const rewardTokens = [EthAddresses.BAL_TOKEN];

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
          rewardTokens,
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
    return new BalancerLpSpecificHardWork(
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
