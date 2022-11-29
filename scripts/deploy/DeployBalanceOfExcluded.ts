import {DeployerUtilsLocal} from "./DeployerUtilsLocal";
import {ethers} from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();

  const veBAL = '0xC128a9954e6c874eA3d62ce62B468bA073093F25'
  const auraVeBalHolder = '0xaF52695E1bB01A16D33D7194C28C42b10e0Dbec2'

  await DeployerUtilsLocal.deployContract(signer, 'BalanceOfExcluded', veBAL, [auraVeBalHolder])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
