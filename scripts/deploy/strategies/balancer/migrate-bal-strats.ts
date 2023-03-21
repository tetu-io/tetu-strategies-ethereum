import {
  IBookkeeper__factory,
  ISmartVault,
  ISmartVault__factory,
  IStrategy__factory,
  IStrategySplitter__factory
} from "../../../../typechain";
import {ethers} from "hardhat";
import {RunHelper} from "../../../utils/tools/RunHelper";
import {DeployerUtilsLocal} from "../../DeployerUtilsLocal";

const CHANGER = '0x63290e79760E441E9228C5308E8ff7De50843c20';
const BLOCK = 16757197;


async function main() {
  const signer = (await ethers.getSigners())[0];

  const core = await DeployerUtilsLocal.getCoreAddresses();

  const vaults = await IBookkeeper__factory.connect(core.bookkeeper, signer).vaults();

  const strategies: string[] = [];
  for (const vault of vaults) {
    const strategy = await ISmartVault__factory.connect(vault, signer).strategy({blockTag: BLOCK});
    const newStrategy = await ISmartVault__factory.connect(vault, signer).strategy();
    if (strategy !== newStrategy) {
      const platform = await IStrategy__factory.connect(strategy, signer).platform()
      if (platform === 36) {
        const name = await ISmartVault__factory.connect(vault, signer).symbol();
        const nameS = await IStrategy__factory.connect(strategy, signer).STRATEGY_NAME();
        console.log(`${name} strategy ${nameS} ${strategy}`);
        strategies.push(strategy);
      }
    }
  }
  // !!!!!!!!!!! >>>> STRAT oldStrat: 0x331A0041BD9A66592b85a4866c7AC51218F60A20 gauge: 0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE newStrat: 0x4C8a0Ba0cB03CedbcAA24A46C9a347FCbD97Af09
  // !!!!!!!!!!! >>>> STRAT oldStrat: 0xC4Ea3ca488b9E9c648d6217ea5d988774a5B389b gauge: 0xa6325e799d266632D347e41265a69aF111b05403 newStrat: 0xA19f92D23B4cde7B145fe0539e17FC93A4a61316
  // !!!!!!!!!!! >>>> STRAT oldStrat: 0x0FdE9432bAE1f8cfB2e697DC496e61323AA8DDD8 gauge: 0x79eF6103A513951a3b25743DB509E267685726B7 newStrat: 0x673abC7cfcEeA4cE211d606E5213bDaad7Ec6FE6

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
