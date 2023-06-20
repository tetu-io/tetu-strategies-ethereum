import {ethers} from 'hardhat';
import {expect} from 'chai';
import {loadFixture} from "ethereum-waffle";
import {DeployerUtilsLocal} from "../../scripts/deploy/DeployerUtilsLocal";
import {VotemarketClaim, VotemarketClaim__factory} from "../../typechain";


describe('VotemarketClaimTest', function () {

  async function deployContracts() {
    const [signer, other] = await ethers.getSigners();

    const resolver = await DeployerUtilsLocal.deployContract(signer, 'VotemarketClaim') as VotemarketClaim;

    return {resolver, signer};
  }

  describe('Smoke tests', function () {

    it('execution test', async function () {
      const {resolver, signer} = await loadFixture(deployContracts);

      const data = await resolver.isReadyToClaim();

      expect(data.canExec).eq(true);
      const callData = VotemarketClaim__factory.createInterface()
        .decodeFunctionData('claim', data.execPayload);

      const ids = callData.ids;

      console.log('ids', ids.toString());

      await resolver.claim(ids);
    });

  });
});
