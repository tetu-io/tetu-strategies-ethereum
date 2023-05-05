import {expect} from 'chai';
import {loadFixture} from "ethereum-waffle";
import {DeployerUtilsLocal} from "../../scripts/deploy/DeployerUtilsLocal";
import {BribeLiquidator, BribeLiquidator__factory, IERC20__factory} from "../../typechain";
import {TokenUtils} from "../TokenUtils";
import {EthAddresses} from "../../scripts/addresses/EthAddresses";
import {parseUnits} from "ethers/lib/utils";
import {Misc} from "../../scripts/utils/tools/Misc";

const MSIG = '0xB9fA147b96BbC932e549f619A448275855b9A7D9';

describe('BribeLiquidatorTest', function () {

  async function deployContracts() {
    const signer = await DeployerUtilsLocal.impersonate();

    const core = await DeployerUtilsLocal.getCoreAddresses();

    const data = await DeployerUtilsLocal.deployTetuProxyControlled(signer, 'BribeLiquidator');
    const resolver = BribeLiquidator__factory.connect(data[0].address, signer);

    await resolver.initialize(core.controller);

    return {resolver, signer};
  }

  describe('Smoke tests', function () {

    it('execution test', async function () {
      const {resolver, signer} = await loadFixture(deployContracts);

      await TokenUtils.getToken(EthAddresses.USDC_TOKEN, MSIG, parseUnits('10000', 6));
      await TokenUtils.getToken(EthAddresses.WETH_TOKEN, MSIG, parseUnits('1'));

      await resolver.setGelato(signer.address);

      await resolver.whitelist([
        EthAddresses.WETH_TOKEN,
        EthAddresses.USDC_TOKEN,
      ], true);

      const msigSigner = await DeployerUtilsLocal.impersonate(MSIG);
      await IERC20__factory.connect(EthAddresses.WETH_TOKEN, msigSigner).approve(resolver.address, Misc.MAX_UINT);
      await IERC20__factory.connect(EthAddresses.USDC_TOKEN, msigSigner).approve(resolver.address, Misc.MAX_UINT);

      const data = await resolver.isReadyToLiquidate();

      expect(data.canExec).eq(true);
      const callData = BribeLiquidator__factory.createInterface()
        .decodeFunctionData('liquidateAndBridgeFromCommunityMsig', data.execPayload);

      const tokens = callData.tokens;
      const amounts = callData.amounts;

      console.log('tokens', tokens);
      console.log('amounts', amounts);

      await resolver.liquidateAndBridgeFromCommunityMsig(tokens, amounts, {gasLimit: 9_000_000});

      await TokenUtils.getToken(EthAddresses.USDC_TOKEN, resolver.address, parseUnits('10000', 6));
      await TokenUtils.getToken(EthAddresses.WETH_TOKEN, resolver.address, parseUnits('1'));

      const data2 = await resolver.isReadyToLiquidate();

      expect(data2.canExec).eq(true);
      const callData2 = BribeLiquidator__factory.createInterface()
        .decodeFunctionData('liquidateAndBridgeFromThis', data2.execPayload);

      const tokens2 = callData2.tokens;
      const amounts2 = callData2.amounts;

      console.log('tokens2', tokens2);
      console.log('amounts2', amounts2);

      await resolver.liquidateAndBridgeFromThis(tokens2, amounts2, {gasLimit: 9_000_000});
    });

  });
});
