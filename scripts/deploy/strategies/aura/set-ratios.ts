import {IStrategySplitter__factory} from "../../../../typechain";
import {ethers} from "hardhat";
import {RunHelper} from "../../../utils/tools/RunHelper";
import {DeployerUtilsLocal} from "../../DeployerUtilsLocal";


async function main() {
  const signer = (await ethers.getSigners())[0];
  // const signer = await DeployerUtilsLocal.impersonate()

  await RunHelper.runAndWait(() => IStrategySplitter__factory.connect('0x3c055f4a2B7234a4D807a29244403B5A44648a1F', signer).setStrategyRatios(
    ['0x1C8F4e0b739090De64D0C33c89950CEc791AC7AF', '0xA19f92D23B4cde7B145fe0539e17FC93A4a61316'],
    [100, 0]
  ));

  await RunHelper.runAndWait(() => IStrategySplitter__factory.connect('0x3570CeC085974c1e7aC3dB2C68Ce65eD4f21ba94', signer).setStrategyRatios(
    ['0x778612982f3CD78b523c7fa00C2eF6f35367985D', '0x673abC7cfcEeA4cE211d606E5213bDaad7Ec6FE6'],
    [100, 0]
  ));

  await RunHelper.runAndWait(() => IStrategySplitter__factory.connect('0xf1905Bb290C30be96f15DAd19b40e97A9F6F371E', signer).setStrategyRatios(
    ['0xEFd30CD5E21844F750B1F7d46B1E6564b3d0AFb3', '0x4C8a0Ba0cB03CedbcAA24A46C9a347FCbD97Af09'],
    [100, 0]
  ));

  await RunHelper.runAndWait(() => IStrategySplitter__factory.connect('0xC70878D995c4319Fc6427Ca3161F7e4e335eCBa2', signer).setStrategyRatios(
    ['0x511558267815Ec9C0592C3039Efaaba2c5F35CC0', '0x75b474BCC9D70A5D7194f57091394a8167a22d4C'],
    [100, 0]
  ));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
