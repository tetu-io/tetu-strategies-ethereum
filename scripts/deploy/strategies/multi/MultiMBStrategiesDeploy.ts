import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../DeployerUtilsLocal";
import {
  ContractReader,
  StrategyMaiBal,
  StrategyMaiBal__factory
} from "../../../../typechain";
import {appendFileSync, mkdir} from "fs";
import {infos} from "./MultiMBInfos";
import {MultiPipeDeployer} from "./MultiPipeDeployer";


async function main() {
  // const strategyContractName = 'StrategyMaiBal';
  //
  // const signer = (await ethers.getSigners())[0];
  // const core = await DeployerUtilsLocal.getCoreAddresses();
  // const tools = await DeployerUtilsLocal.getToolsAddresses();
  //
  // const deployed = [];
  // const vaultNames = new Set<string>();
  //
  // const cReader = await DeployerUtilsLocal.connectContract(signer, "ContractReader", tools.reader) as ContractReader;
  //
  // const deployedVaultAddresses = await cReader.vaults();
  // console.log('all vaults size', deployedVaultAddresses.length);
  // for (const vAdr of deployedVaultAddresses) {
  //   const name = await cReader.vaultName(vAdr)
  //   vaultNames.add(name);
  //   // console.log('name', name);
  // }
  //
  // mkdir('./tmp/deployed', {recursive: true}, (err) => {
  //   if (err) throw err;
  // });
  //
  // for (const info of infos) {
  //
  //   const vaultNameWithoutPrefix = `MULTI_${info.underlyingName}`;
  //
  //   if (vaultNames.has('TETU_' + vaultNameWithoutPrefix)) {
  //     console.error('Strategy already exist!!!', vaultNameWithoutPrefix);
  //     return;
  //   }
  //
  //   console.log('strat', info.underlyingName);
  //   const pipes: string[] = [];
  //   let strategyArgs;
  //   // tslint:disable-next-line:no-any
  //   const data: any[] = [];
  //
  //   data.push(...await DeployerUtilsLocal.deployVaultAndStrategyProxy(
  //           vaultNameWithoutPrefix,
  //           info.underlying,
  //           async vaultAddress => {
  //             // -----------------
  //             const maiStablecoinPipeData = await MultiPipeDeployer.deployMaiStablecoinPipe(
  //                 signer,
  //                 info.underlying,
  //                 info.stablecoin,
  //                 info.targetPercentage,
  //                 info.collateralNumerator || '1'
  //             );
  //             pipes.push(maiStablecoinPipeData.address);
  //             // -----------------
  //             const balVaultPipeData = await MultiPipeDeployer.deployBalVaultPipe(
  //                 signer
  //             );
  //             pipes.push(balVaultPipeData.address);
  //             // -----------------
  //
  //             strategyArgs = [
  //               core.controller,
  //               vaultAddress,
  //               info.underlying,
  //               pipes
  //             ];
  //             const strategyData = await DeployerUtilsLocal.deployTetuProxyControlled(
  //                 signer,
  //                 strategyContractName
  //             );
  //             await StrategyMaiBal__factory.connect(strategyData[0].address, signer).initialize(
  //                 core.controller,
  //                 vaultAddress,
  //                 info.underlying,
  //                 pipes
  //             )
  //             return StrategyMaiBal__factory.connect(strategyData[0].address, signer);
  //           },
  //           core.controller,
  //           core.psVault,
  //           signer,
  //           60 * 60 * 24 * 28,
  //           30,
  //           true
  //       )
  //   );
  //   data.push(strategyArgs);
  //   deployed.push(data);
  //
  //   const txt = `${vaultNameWithoutPrefix}:     vault: ${data[1].address}     strategy: ${data[2].address}\n`;
  //   appendFileSync(`./tmp/deployed/multiMB.txt`, txt, 'utf8');
  //
  //   await DeployerUtilsLocal.wait(5);
  //   // tslint:disable-next-line:prefer-for-of
  //   for (let i = 0; i < pipes.length; i++) {
  //     const pipeAdr = pipes[i];
  //     await DeployerUtilsLocal.verify(pipeAdr);
  //   }
  // }
  // await DeployerUtilsLocal.wait(5);
  //
  // for (const data of deployed) {
  //   await DeployerUtilsLocal.verify(data[0].address);
  //   await DeployerUtilsLocal.verifyWithArgs(data[1].address, [data[0].address]);
  //   await DeployerUtilsLocal.verifyProxy(data[1].address);
  //   await DeployerUtilsLocal.verifyWithContractName(data[2].address, 'contracts/strategies/matic/multi/StrategyMaiBal.sol:StrategyMaiBal', data[3]);
  // }
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
