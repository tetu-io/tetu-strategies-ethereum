import {ethers} from "hardhat";
import {IPlatformVotemarket__factory} from "../../typechain";
import {RunHelper} from "./tools/RunHelper";

const PLATFORM = '0x00000008eF298e2B6dc47E88D72eeB1Fc2b1CA7f';
const RECIPIENT = '0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce';
const LAST_CLAIM_ID = 0;

async function main() {
  const [signer] = await ethers.getSigners();

  const platform = IPlatformVotemarket__factory.connect(PLATFORM, signer);

  const maxBountyId = (await platform.nextID()).toNumber();
  console.log(`maxBountyId: ${maxBountyId}`);

  const idsForClaim: number[] = []
  for (let i = LAST_CLAIM_ID; i < maxBountyId + 1; i++) {
    const claimable = await platform.claimable(RECIPIENT, i);
    if (claimable.gt(0)) {
      console.log('claimable', i, claimable.toString());
      idsForClaim.push(i);
    }
  }

  console.log('>>> idsForClaim', idsForClaim.length);

  if (idsForClaim.length > 0) {
    await RunHelper.runAndWait(() => platform.claimAllFor(RECIPIENT, idsForClaim));
  }

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
