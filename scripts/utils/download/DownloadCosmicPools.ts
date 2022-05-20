import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../deploy/DeployerUtilsLocal";
import {MaticAddresses} from "../../addresses/MaticAddresses";
import {ICosmicMasterChef, ICosmicMasterChef__factory} from "../../../typechain";
import {BigNumber} from "ethers";
import {McLpDownloader} from "./McLpDownloader";


async function main() {
  const signer = (await ethers.getSigners())[0];
  const chef = ICosmicMasterChef__factory.connect(MaticAddresses.COSMIC_MASTERCHEF, signer);

  await McLpDownloader.download(
      "6",
      'COSMIC',
      MaticAddresses.COSMIC_MASTERCHEF,
      MaticAddresses.COSMIC_TOKEN,
      chef.poolLength,
      chef.cosmicPerBlock,
      chef.totalAllocPoint,
      async (id) => {
        return chef.poolInfo(id)
          // tslint:disable-next-line:ban-ts-ignore
          // @ts-ignore
        .then(info => {
          return {
            "lpAddress": info[0] as string,
            "allocPoint": info[1] as BigNumber,
            "lastUpdateTime": info[2].toNumber()
          };
        });
      }
  );
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
