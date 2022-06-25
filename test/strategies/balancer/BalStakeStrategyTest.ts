import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {config as dotEnvConfig} from "dotenv";
import {StrategyTestUtils} from "../StrategyTestUtils";
import {DeployInfo} from "../DeployInfo";
import {SpecificStrategyTest} from "../SpecificStrategyTest";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CoreContractsWrapper} from "../../CoreContractsWrapper";
import {
  BalDepositor__factory,
  BalLocker,
  IStrategy,
  IVotingEscrow__factory,
  ISmartVault,
  ISmartVault__factory,
  StrategyBalStaking
} from "../../../typechain";
import {ToolsContractsWrapper} from "../../ToolsContractsWrapper";
import {universalStrategyTest} from "../UniversalStrategyTest";
import {BalStakingDoHardWork} from "./BalStakingDoHardWork";
import {EthAddresses} from "../../../scripts/addresses/EthAddresses";
import {Misc} from "../../../scripts/utils/tools/Misc";
import {DeployerUtilsLocal} from "../../../scripts/deploy/DeployerUtilsLocal";

dotEnvConfig();
// tslint:disable-next-line:no-var-requires
const argv = require('yargs/yargs')()
  .env('TETU')
  .options({
    disableStrategyTests: {
      type: "boolean",
      default: false,
    },
    deployCoreContracts: {
      type: "boolean",
      default: false,
    },
    hardhatChainId: {
      type: "number",
      default: 137
    },
  }).argv;

const {expect} = chai;
chai.use(chaiAsPromised);

describe('BAL staking tests', async () => {
  const strategyName = 'StrategyBalStaking';
  const underlying = EthAddresses.BALANCER_BAL_WETH;

  const deployInfo: DeployInfo = new DeployInfo();
  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, argv.deployCoreContracts);
  });

  // **********************************************
  // ************** CONFIG*************************
  // **********************************************
  const strategyContractName = strategyName;
  const vaultName = 'tetuBAL';

  // only for strategies where we expect PPFS fluctuations
  const ppfsDecreaseAllowed = false;
  // only for strategies where we expect PPFS fluctuations
  const balanceTolerance = 0;
  const finalBalanceTolerance = 0;
  const deposit = 100_000;
  // at least 3
  const loops = 3;
  // number of blocks or timestamp value
  const loopValue = 60 * 60 * 24 * 7;
  // use 'true' if farmable platform values depends on blocks, instead you can use timestamp
  const advanceBlocks = false;
  const specificTests: SpecificStrategyTest[] = [];
  // **********************************************

  const deployer = async (signer: SignerWithAddress) => {
    const core = deployInfo.core as CoreContractsWrapper;
    const data = await StrategyTestUtils.deploy(
      signer,
      core,
      vaultName,
      async vaultAddress => {
        const depositorPrx = (await DeployerUtilsLocal.deployTetuProxyControlled(signer, 'BalDepositor'))[0];
        const depositor = BalDepositor__factory.connect(depositorPrx.address, signer);
        await depositor.initialize(core.controller.address);
        await depositor.setDestinationVault(vaultAddress);
        await depositor.setAnotherChainRecipient(signer.address);
        await core.controller.setPureRewardConsumers([depositor.address], true);


        const strategy = await DeployerUtilsLocal.deployStrategyProxy(
          signer,
          strategyContractName,
        ) as StrategyBalStaking;

        const balLocker = await DeployerUtilsLocal.deployContract(signer, 'BalLocker',
          core.controller.address,
          strategy.address,
          EthAddresses.BALANCER_GAUGE_CONTROLLER,
          EthAddresses.BALANCER_FEE_DISTRIBUTOR,
        ) as BalLocker;


        await strategy.initialize(core.controller.address, vaultAddress, depositor.address, Misc.ZERO_ADDRESS);
        await strategy.setVeLocker(balLocker.address);
        return strategy;
      },
      underlying
    );
    await ISmartVault__factory.connect(data[0].address, signer).changeAlwaysInvest(true);

    const checker = await DeployerUtilsLocal.deployContract(signer, 'SmartWalletCheckerStub');

    const veBalAdmin = await DeployerUtilsLocal.impersonate('0x8f42adbba1b16eaae3bb5754915e0d06059add75');
    await IVotingEscrow__factory.connect(EthAddresses.veBAL_TOKEN, veBalAdmin).commit_smart_wallet_checker(checker.address);
    await IVotingEscrow__factory.connect(EthAddresses.veBAL_TOKEN, veBalAdmin).apply_smart_wallet_checker();

    return data;
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
    return new BalStakingDoHardWork(
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
    strategyName + vaultName,
    deployInfo,
    deployer,
    hwInitiator,
    null,
    ppfsDecreaseAllowed,
    balanceTolerance,
    deposit,
    loops,
    loopValue,
    advanceBlocks,
    specificTests,
  );
});
