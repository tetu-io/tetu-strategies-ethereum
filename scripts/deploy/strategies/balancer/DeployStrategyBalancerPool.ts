import { DeployerUtilsLocal } from "../../DeployerUtilsLocal";
import {ethers} from "hardhat";


async function main() {
  const signer = (await ethers.getSigners())[0];
  await DeployerUtilsLocal.deployContract(signer, 'StrategyBalancerPool');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
