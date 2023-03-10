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

  for (const vault of vaults) {
    const strategy = await ISmartVault__factory.connect(vault, signer).strategy({blockTag: BLOCK});
    const newStrategy = await ISmartVault__factory.connect(vault, signer).strategy();
    if (strategy !== newStrategy) {
      const platform = await IStrategy__factory.connect(strategy, signer).platform()
      if (platform === 36) {
        const name = await ISmartVault__factory.connect(vault, signer).symbol();
        const nameS = await IStrategy__factory.connect(strategy, signer).STRATEGY_NAME();
        console.log(`${name} strategy ${nameS} ${strategy}`);
      }
    }
  }

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
