import {ethers} from 'hardhat';
import {expect} from 'chai';
import {loadFixture} from "ethereum-waffle";
import {DeployerUtilsLocal} from "../../scripts/deploy/DeployerUtilsLocal";
import {TetuBalExtender, TetuBalExtender__factory} from "../../typechain";
import {TimeUtils} from "../TimeUtils";
import {TokenUtils} from "../TokenUtils";
import {EthAddresses} from "../../scripts/addresses/EthAddresses";
import {BigNumber} from "ethers";


describe('TetuBalExtenderTest', function () {

  async function deployContracts() {
    const [signer, other] = await ethers.getSigners();

    const resolver = await DeployerUtilsLocal.deployContract(signer, 'TetuBalExtender') as TetuBalExtender;

    return {resolver, signer};
  }

  describe('Smoke tests', function () {

    it('execution test', async function () {
      const {resolver, signer} = await loadFixture(deployContracts);

      await TokenUtils.getToken(EthAddresses.BALANCER_BAL_WETH, resolver.address, BigNumber.from(1));
      await TimeUtils.advanceBlocksOnTs(60 * 60 * 24 * 30);

      await resolver.setOperator(signer.address);

      const data = await resolver.isReadyToExtend();

      expect(data.canExec).eq(true);
      const callData = TetuBalExtender__factory.createInterface()
        .decodeFunctionData('extend', data.execPayload);

      const amount = callData.amount;

      console.log('amount', amount.toString());

      await resolver.extend(amount);
    });

  });
});
