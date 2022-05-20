import {ethers, web3} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ContractFactory, utils} from "ethers";
import {CoreContractsWrapper} from "../../test/CoreContractsWrapper";
import {Addresses} from "../../addresses";
import {CoreAddresses} from "../models/CoreAddresses";
import {ToolsAddresses} from "../models/ToolsAddresses";
import axios from "axios";
import {RunHelper} from "../utils/tools/RunHelper";
import {config as dotEnvConfig} from "dotenv";
import {ToolsContractsWrapper} from "../../test/ToolsContractsWrapper";
import {Misc} from "../utils/tools/Misc";
import logSettings from "../../log_settings";
import {Logger} from "tslog";
import {readFileSync} from "fs";
import {Libraries} from "hardhat-deploy/dist/types";
import {
  IAnnouncer__factory,
  IBookkeeper__factory,
  IController,
  IController__factory,
  IFeeRewardForwarder__factory,
  IFundKeeper__factory,
  IMintHelper__factory,
  IPriceCalculator__factory,
  IRewardToken__factory,
  ISmartVault,
  ISmartVault__factory,
  IStrategy, IStrategy__factory,
  IStrategySplitter,
  IStrategySplitter__factory,
  IVaultController,
  IVaultController__factory,
  TetuProxyControlled,
  TetuProxyControlled__factory,
} from "../../typechain";
import {EthAddresses} from "../addresses/EthAddresses";

// tslint:disable-next-line:no-var-requires
const hre = require("hardhat");
const log: Logger = new Logger(logSettings);


const VAULT_LOGIC = '0xeE7FFE79689B3d826C7389B95780F42849Fb7019'
const SPLITTER_LOGIC = ''

dotEnvConfig();
// tslint:disable-next-line:no-var-requires
const argv = require('yargs/yargs')()
  .env('TETU')
  .options({
    networkScanKey: {
      type: "string",
    },
    vaultLogic: {
      type: "string",
      default: VAULT_LOGIC
    },
    splitterLogic: {
      type: "string",
      default: SPLITTER_LOGIC
    },
  }).argv;

const libraries = new Map<string, string>([
  ['SmartVault', 'VaultLibrary'],
  ['SmartVaultV110', 'VaultLibrary']
]);

export class DeployerUtilsLocal {

  public static coreCache: CoreContractsWrapper;
  public static toolsCache: ToolsContractsWrapper;

  public static getVaultLogic(signer: SignerWithAddress) {
    console.log('argv.vaultLogic', argv.vaultLogic);
    let logic = VAULT_LOGIC;
    if (!!argv.vaultLogic) {
      logic = argv.vaultLogic;
    }
    return ISmartVault__factory.connect(logic, signer);
  }

  public static getSplitterLogic(signer: SignerWithAddress) {
    console.log('argv.splitterLogic', argv.splitterLogic);
    let logic = SPLITTER_LOGIC;
    if (!!argv.splitterLogic) {
      logic = argv.splitterLogic;
    }
    return IStrategySplitter__factory.connect(logic, signer);
  }

  // ************ CONTRACT DEPLOY **************************

  public static async deployContract<T extends ContractFactory>(
    signer: SignerWithAddress,
    name: string,
    // tslint:disable-next-line:no-any
    ...args: any[]
  ) {
    const start = Date.now();
    log.info(`Deploying ${name}`);
    log.info("Account balance: " + utils.formatUnits(await signer.getBalance(), 18));

    const gasPrice = await web3.eth.getGasPrice();
    log.info("Gas price: " + gasPrice);
    const lib: string | undefined = libraries.get(name);
    let _factory;
    if (lib) {
      console.log('DEPLOY LIBRARY', lib, 'for', name);
      const libAddress = (await DeployerUtilsLocal.deployContract(signer, lib)).address;
      await DeployerUtilsLocal.wait(1);
      const librariesObj: Libraries = {};
      librariesObj[lib] = libAddress;
      _factory = (await ethers.getContractFactory(
        name,
        {
          signer,
          libraries: librariesObj
        }
      )) as T;
    } else {
      _factory = (await ethers.getContractFactory(
        name,
        signer
      )) as T;
    }
    const instance = await _factory.deploy(...args);
    console.log('Deploy tx:', instance.deployTransaction.hash);
    await instance.deployed();

    const receipt = await ethers.provider.getTransactionReceipt(instance.deployTransaction.hash);

    Misc.printDuration(`${name} deployed ${receipt.contractAddress} gas used: ${receipt.gasUsed.toString()}`, start);
    return _factory.attach(receipt.contractAddress);
  }

  public static async deployTetuProxyControlled<T extends ContractFactory>(
    signer: SignerWithAddress,
    logicContractName: string,
  ) {
    const logic = await DeployerUtilsLocal.deployContract(signer, logicContractName);
    await DeployerUtilsLocal.wait(5);
    const proxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", logic.address);
    await DeployerUtilsLocal.wait(5);
    return [proxy, logic];
  }


  public static async deployStrategyProxy(signer: SignerWithAddress, strategyName: string): Promise<IStrategy> {
    const logic = await DeployerUtilsLocal.deployContract(signer, strategyName);
    await DeployerUtilsLocal.wait(1);
    const proxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", logic.address);
    return logic.attach(proxy.address) as IStrategy;
  }

  public static async deployStrategySplitter(signer: SignerWithAddress): Promise<IStrategySplitter> {
    const logic = DeployerUtilsLocal.getSplitterLogic(signer);
    const proxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", logic.address);
    return logic.attach(proxy.address) as IStrategySplitter;
  }


  public static async deployAndInitVaultAndStrategy<T>(
    underlying: string,
    vaultName: string,
    strategyDeployer: (vaultAddress: string) => Promise<IStrategy>,
    controller: IController,
    vaultController: IVaultController,
    vaultRewardToken: string,
    signer: SignerWithAddress,
    rewardDuration: number = 60 * 60 * 24 * 28, // 4 weeks
    depositFee = 0,
    wait = false
  ): Promise<[ISmartVault, ISmartVault, IStrategy]> {
    const start = Date.now();
    const vaultLogic = DeployerUtilsLocal.getVaultLogic(signer);
    const vaultProxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", vaultLogic.address) as TetuProxyControlled;
    const vault = vaultLogic.attach(vaultProxy.address) as ISmartVault;
    await RunHelper.runAndWait(() => vault.initializeSmartVault(
      "TETU_" + vaultName,
      "x" + vaultName,
      controller.address,
      underlying,
      rewardDuration,
      false,
      vaultRewardToken,
      depositFee
    ), true, wait);
    const strategy = await strategyDeployer(vault.address);
    Misc.printDuration(vaultName + ' vault initialized', start);

    await RunHelper.runAndWait(() => controller.addVaultsAndStrategies([vault.address], [strategy.address]), true, wait);
    await RunHelper.runAndWait(() => vaultController.setToInvest([vault.address], 1000), true, wait);
    Misc.printDuration(vaultName + ' deployAndInitVaultAndStrategy completed', start);
    return [vaultLogic, vault, strategy];
  }

  public static async deployVaultAndStrategy<T>(
    vaultName: string,
    strategyDeployer: (vaultAddress: string) => Promise<IStrategy>,
    controllerAddress: string,
    vaultRewardToken: string,
    signer: SignerWithAddress,
    rewardDuration: number = 60 * 60 * 24 * 28, // 4 weeks
    depositFee = 0,
    wait = false
  ): Promise<[ISmartVault, ISmartVault, IStrategy]> {
    const vaultLogic = DeployerUtilsLocal.getVaultLogic(signer);
    if (wait) {
      await DeployerUtilsLocal.wait(1);
    }
    log.info('vaultLogic ' + vaultLogic.address);
    const vaultProxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", vaultLogic.address);
    const vault = vaultLogic.attach(vaultProxy.address) as ISmartVault;

    const strategy = await strategyDeployer(vault.address);

    const strategyUnderlying = await strategy.underlying();

    await RunHelper.runAndWait(() => vault.initializeSmartVault(
      "TETU_" + vaultName,
      "x" + vaultName,
      controllerAddress,
      strategyUnderlying,
      rewardDuration,
      false,
      vaultRewardToken,
      depositFee
    ), true, wait);
    return [vaultLogic, vault, strategy];
  }

  public static async deployVaultAndStrategyProxy<T>(
    vaultName: string,
    underlying: string,
    strategyDeployer: (vaultAddress: string) => Promise<IStrategy>,
    controllerAddress: string,
    vaultRewardToken: string,
    signer: SignerWithAddress,
    rewardDuration: number = 60 * 60 * 24 * 28, // 4 weeks
    depositFee = 0,
    wait = false
  ): Promise<[ISmartVault, ISmartVault, IStrategy]> {
    const vaultLogic = DeployerUtilsLocal.getVaultLogic(signer);
    if (wait) {
      await DeployerUtilsLocal.wait(1);
    }
    log.info('vaultLogic ' + vaultLogic.address);
    const vaultProxy = await DeployerUtilsLocal.deployContract(signer, "TetuProxyControlled", vaultLogic.address);
    const vault = vaultLogic.attach(vaultProxy.address) as ISmartVault;

    await RunHelper.runAndWait(() => vault.initializeSmartVault(
      "TETU_" + vaultName,
      "x" + vaultName,
      controllerAddress,
      underlying,
      rewardDuration,
      false,
      vaultRewardToken,
      depositFee
    ), true, wait);

    if (wait) {
      await DeployerUtilsLocal.wait(1);
    }

    const strategy = await strategyDeployer(vault.address);
    return [vaultLogic, vault, strategy];
  }

  public static async deployDefaultNoopStrategyAndVault(
    signer: SignerWithAddress,
    controller: IController,
    vaultController: IVaultController,
    underlying: string,
    vaultRewardToken: string,
    rewardToken: string = ''
  ) {
    const netToken = await DeployerUtilsLocal.getNetworkTokenAddress();
    if (rewardToken === '') {
      rewardToken = netToken;
    }
    return DeployerUtilsLocal.deployAndInitVaultAndStrategy(
      underlying,
      't',
      vaultAddress => DeployerUtilsLocal.deployContract(
        signer,
        'NoopStrategy',
        controller.address, // _controller
        underlying, // _underlying
        vaultAddress,
        [rewardToken], // __rewardTokens
        [underlying], // __assets
        1 // __platform
      ) as Promise<IStrategy>,
      controller,
      vaultController,
      vaultRewardToken,
      signer
    );
  }

  public static async deployImpermaxLikeStrategies(
    signer: SignerWithAddress,
    controller: string,
    vaultAddress: string,
    underlying: string,
    strategyName: string,
    infoPath: string,
    minTvl = 2_000_000,
    buyBackRatio = 10_00,
  ) {

    const infos = readFileSync(infoPath, 'utf8').split(/\r?\n/);

    const strategies = [];

    for (const i of infos) {
      const info = i.split(',');
      const idx = info[0];
      const tokenName = info[2];
      const tokenAdr = info[3];
      const poolAdr = info[4];
      const tvl = info[5];

      if (+tvl < minTvl || idx === 'idx' || !tokenAdr || underlying.toLowerCase() !== tokenAdr.toLowerCase()) {
        // console.log('skip', idx, underlying, tokenAdr, +tvl);
        continue;
      }
      console.log('SubStrategy', idx, tokenName);

      const strategyArgs = [
        controller,
        vaultAddress,
        tokenAdr,
        poolAdr,
        buyBackRatio
      ];

      const deployedStart = await DeployerUtilsLocal.deployContract(
        signer,
        strategyName,
        ...strategyArgs
      ) as IStrategy;
      strategies.push(deployedStart.address);
    }
    console.log(' ================ IMPERMAX-LIKE DEPLOYED', strategies.length);
    return strategies;
  }

  // ************** VERIFY **********************

  public static async verify(address: string) {
    try {
      await hre.run("verify:verify", {
        address
      })
    } catch (e) {
      log.info('error verify ' + e);
    }
  }

  public static async verifyImpl(signer: SignerWithAddress, proxyAddress: string) {
    const proxy = TetuProxyControlled__factory.connect(proxyAddress, signer);
    const address = await proxy.implementation();
    console.log('impl address', address);
    try {
      await hre.run("verify:verify", {
        address
      })
    } catch (e) {
      log.info('error verify ' + e);
    }
    await this.verifyProxy(proxyAddress);
  }

  // tslint:disable-next-line:no-any
  public static async verifyWithArgs(address: string, args: any[]) {
    try {
      await hre.run("verify:verify", {
        address, constructorArguments: args
      })
    } catch (e) {
      log.info('error verify ' + e);
    }
  }

  // tslint:disable-next-line:no-any
  public static async verifyWithContractName(address: string, contractPath: string, args?: any[]) {
    try {
      await hre.run("verify:verify", {
        address, contract: contractPath, constructorArguments: args
      })
    } catch (e) {
      log.info('error verify ' + e);
    }
  }


  // tslint:disable-next-line:no-any
  public static async verifyImplWithContractName(signer: SignerWithAddress, proxyAddress: string, contractPath: string, args?: any[]) {
    const proxy = TetuProxyControlled__factory.connect(proxyAddress, signer);
    const address = await proxy.implementation();
    console.log('impl address', address);
    try {
      await hre.run("verify:verify", {
        address, contract: contractPath, constructorArguments: args
      })
    } catch (e) {
      log.info('error verify ' + e);
    }
    await this.verifyProxy(proxyAddress);
  }

  // tslint:disable-next-line:no-any
  public static async verifyWithArgsAndContractName(address: string, args: any[], contractPath: string) {
    try {
      await hre.run("verify:verify", {
        address, constructorArguments: args, contract: contractPath
      })
    } catch (e) {
      log.info('error verify ' + e);
    }
  }


  public static async verifyProxy(adr: string) {
    try {

      const resp =
        await axios.post(
          (await DeployerUtilsLocal.getNetworkScanUrl()) +
          `?module=contract&action=verifyproxycontract&apikey=${argv.networkScanKey}`,
          `address=${adr}`);
      // log.info("proxy verify resp", resp.data);
    } catch (e) {
      log.info('error proxy verify ' + adr + e);
    }
  }

  // ************** ADDRESSES **********************

  public static async getNetworkScanUrl(): Promise<string> {
    const net = (await ethers.provider.getNetwork());
    if (net.name === 'ropsten') {
      return 'https://api-ropsten.etherscan.io/api';
    } else if (net.name === 'kovan') {
      return 'https://api-kovan.etherscan.io/api';
    } else if (net.name === 'rinkeby') {
      return 'https://api-rinkeby.etherscan.io/api';
    } else if (net.name === 'ethereum') {
      return 'https://api.etherscan.io/api';
    } else if (net.name === 'matic') {
      return 'https://api.polygonscan.com/api'
    } else if (net.chainId === 80001) {
      return 'https://api-testnet.polygonscan.com/api'
    } else if (net.chainId === 250) {
      return 'https://api.ftmscan.com//api'
    } else {
      throw Error('network not found ' + net);
    }
  }

  public static async getCoreAddresses(): Promise<CoreAddresses> {
    const net = await ethers.provider.getNetwork();
    log.info('network ' + net.chainId);
    const core = Addresses.CORE.get(net.chainId + '');
    if (!core) {
      throw Error('No config for ' + net.chainId);
    }
    return core;
  }

  public static async getCoreAddressesWrapper(signer: SignerWithAddress): Promise<CoreContractsWrapper> {
    const net = await ethers.provider.getNetwork();
    log.info('network ' + net.chainId);
    const core = Addresses.CORE.get(net.chainId + '');
    if (!core) {
      throw Error('No config for ' + net.chainId);
    }

    const ps = ISmartVault__factory.connect(core.psVault, signer);
    // const str = await ps.strategy();
    const str = Misc.ZERO_ADDRESS; // todo
    return new CoreContractsWrapper(
      IController__factory.connect(core.controller, signer),
      '',
      IFeeRewardForwarder__factory.connect(core.feeRewardForwarder, signer),
      '',
      IBookkeeper__factory.connect(core.bookkeeper, signer),
      '',
      IMintHelper__factory.connect(core.mintHelper, signer),
      '',
      IRewardToken__factory.connect(core.rewardToken, signer),
      ps,
      '',
      IStrategySplitter__factory.connect(str, signer),
      IFundKeeper__factory.connect(core.fundKeeper, signer),
      '',
      IAnnouncer__factory.connect(core.announcer, signer),
      '',
      IVaultController__factory.connect(core.vaultController, signer),
      '',
    );

  }

  public static async getToolsAddressesWrapper(signer: SignerWithAddress): Promise<ToolsContractsWrapper> {
    const net = await ethers.provider.getNetwork();
    log.info('network ' + net.chainId);
    const tools = Addresses.TOOLS.get(net.chainId + '');
    if (!tools) {
      throw Error('No config for ' + net.chainId);
    }
    return new ToolsContractsWrapper(
      IPriceCalculator__factory.connect(tools.calculator, signer),
    );

  }

  public static async getToolsAddresses(): Promise<ToolsAddresses> {
    const net = await ethers.provider.getNetwork();
    log.info('network ' + net.chainId);
    const tools = Addresses.TOOLS.get(net.chainId + '');
    if (!tools) {
      throw Error('No config for ' + net.chainId);
    }
    return tools;
  }

  public static async getTokenAddresses(): Promise<Map<string, string>> {
    const net = await ethers.provider.getNetwork();
    log.info('network ' + net.chainId);
    const mocks = Addresses.TOKENS.get(net.chainId + '');
    if (!mocks) {
      throw Error('No config for ' + net.chainId);
    }
    return mocks;
  }

  public static async impersonate(address: string | null = null) {
    if (address === null) {
      address = await DeployerUtilsLocal.getGovernance();
    }
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });

    await hre.network.provider.request({
      method: "hardhat_setBalance",
      params: [address, "0x1431E0FAE6D7217CAA0000000"],
    });
    console.log('address impersonated', address);
    return ethers.getSigner(address || '');
  }

  public static async getDefaultNetworkFactory() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 1) {
      return EthAddresses.UNISWAP_FACTORY;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async getUSDCAddress() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 1) {
      return EthAddresses.USDC_TOKEN;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async getNetworkTokenAddress() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 1) {
      return EthAddresses.WETH_TOKEN;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async getTETUAddress() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 1) {
      return EthAddresses.TETU_TOKEN;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async getBlueChips() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 1) {
      return EthAddresses.BLUE_CHIPS;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async getGovernance() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 1) {
      return EthAddresses.GOV_ADDRESS;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async isBlueChip(address: string): Promise<boolean> {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 1) {
      return EthAddresses.BLUE_CHIPS.has(address.toLowerCase())
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async getRouterByFactory(_factory: string) {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 1) {
      return EthAddresses.getRouterByFactory(_factory);
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async isNetwork(id: number) {
    return (await ethers.provider.getNetwork()).chainId === id;
  }

  public static async getStorageAt(address: string, index: string) {
    return ethers.provider.getStorageAt(address, index);
  }

  public static async setStorageAt(address: string, index: string, value: string) {
    await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
    await ethers.provider.send("evm_mine", []); // Just mines to the next block
  }

  // ****************** WAIT ******************

  public static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static async wait(blocks: number) {
    if (hre.network.name === 'hardhat') {
      return;
    }
    const start = ethers.provider.blockNumber;
    while (true) {
      log.info('wait 10sec');
      await DeployerUtilsLocal.delay(10000);
      if (ethers.provider.blockNumber >= start + blocks) {
        break;
      }
    }
  }


}
