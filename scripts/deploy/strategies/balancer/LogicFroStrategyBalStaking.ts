import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../DeployerUtilsLocal";

async function main() {
  const [signer] = await ethers.getSigners();

  const ctr = await DeployerUtilsLocal.deployContract(signer, 'StrategyBalStaking');

  await DeployerUtilsLocal.verify(ctr.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
