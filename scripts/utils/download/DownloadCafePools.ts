import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../deploy/DeployerUtilsLocal";
import {MaticAddresses} from "../../addresses/MaticAddresses";
import {ICafeMasterChef, ICafeMasterChef__factory} from "../../../typechain";
import {McLpDownloader} from "./McLpDownloader";


async function main() {
  const signer = (await ethers.getSigners())[0];
  const chef = ICafeMasterChef__factory.connect(MaticAddresses.CAFE_MASTERCHEF, signer);

  await McLpDownloader.download(
      '11',
      'CAFE',
      MaticAddresses.CAFE_MASTERCHEF,
      MaticAddresses.pBREW_TOKEN,
      chef.poolLength,
      chef.brewPerBlock,
      chef.totalAllocPoint,
      async (id) => {
        return chef.poolInfo(id)
          // tslint:disable-next-line:ban-ts-ignore
          // @ts-ignore
        .then(info => {
          return {
            "lpAddress": info.lpToken,
            "allocPoint": info.allocPoint,
            "lastUpdateTime": info.lastRewardBlock.toNumber(),
            "depositFeeBP": info.depositFeeBP
          };
        });
      },
      true
  );
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
