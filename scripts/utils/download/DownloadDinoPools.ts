import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../deploy/DeployerUtilsLocal";
import {MaticAddresses} from "../../addresses/MaticAddresses";
import {IFossilFarms, IFossilFarms__factory} from "../../../typechain";
import {BigNumber} from "ethers";
import {McLpDownloader} from "./McLpDownloader";


async function main() {
  const signer = (await ethers.getSigners())[0];
  const chef = IFossilFarms__factory.connect(MaticAddresses.DINO_MASTERCHEF, signer);

  await McLpDownloader.download(
      "8",
      'DINO',
      MaticAddresses.DINO_MASTERCHEF,
      MaticAddresses.DINO_TOKEN,
      chef.poolLength,
      chef.dinoPerBlock,
      chef.totalAllocPoint,
      async (id) => {
        return chef.poolInfo(id)
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
