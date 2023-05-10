import {DeployerUtilsLocal} from "./DeployerUtilsLocal";
import {ethers} from "hardhat";
import {BribeLiquidator__factory} from "../../typechain";
import {RunHelper} from "../utils/tools/RunHelper";

async function main() {
  const [signer] = await ethers.getSigners();

  const core = await DeployerUtilsLocal.getCoreAddresses();
  const data = await DeployerUtilsLocal.deployTetuProxyGov(signer, 'BribeLiquidator');
  const resolver = BribeLiquidator__factory.connect(data[0].address, signer);
  await RunHelper.runAndWait(() => resolver.initialize(core.controller));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
