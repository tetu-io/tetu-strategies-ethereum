import {ethers} from "hardhat";
import {DeployerUtilsLocal} from "../../deploy/DeployerUtilsLocal";
import {MaticAddresses} from "../../addresses/MaticAddresses";
import {
  ERC20,
  IIronChef,
  IIronLpToken__factory,
  IIronSwap__factory,
  IUniswapV2Pair__factory,
  PriceCalculator,
  SmartVault
} from "../../../typechain";
import {TokenUtils} from "../../../test/TokenUtils";
import {mkdir, writeFileSync} from "fs";
import {BigNumber, utils} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {VaultUtils} from "../../../test/VaultUtils";


async function main() {
  // const signer = (await ethers.getSigners())[0];
  // const core = await DeployerUtilsLocal.getCoreAddresses();
  // const tools = await DeployerUtilsLocal.getToolsAddresses();
  //
  // const chef = await DeployerUtilsLocal.connectInterface(signer, 'IIronChef', MaticAddresses.IRON_MINISHEFV2) as IIronChef;
  // const priceCalculator = await DeployerUtilsLocal.connectInterface(signer, 'PriceCalculator', tools.calculator) as PriceCalculator;
  //
  // const poolLength = (await chef.poolLength()).toNumber();
  // console.log('length', poolLength);
  //
  // const vaultInfos = await VaultUtils.getVaultInfoFromServer();
  // const underlyingStatuses = new Map<string, boolean>();
  // const currentRewards = new Map<string, number>();
  // const underlyingToVault = new Map<string, string>();
  // for (const vInfo of vaultInfos) {
  //   if (vInfo.platform !== '5') {
  //     continue;
  //   }
  //   underlyingStatuses.set(vInfo.underlying.toLowerCase(), vInfo.active);
  //   underlyingToVault.set(vInfo.underlying.toLowerCase(), vInfo.addr);
  //   if (vInfo.active) {
  //     const vctr = await DeployerUtilsLocal.connectInterface(signer, 'SmartVault', vInfo.addr) as SmartVault;
  //     currentRewards.set(vInfo.underlying.toLowerCase(), await VaultUtils.vaultRewardsAmount(vctr, core.psVault));
  //   }
  // }
  //
  // const rewardPerSecond = await chef.rewardPerSecond();
  // const totalAllocPoint = await chef.totalAllocPoint();
  // const rewardPrice = await priceCalculator.getPriceWithDefaultOutput(MaticAddresses.ICE_TOKEN);
  // console.log('reward price', utils.formatUnits(rewardPrice));
  //
  // let infos: string = 'idx, lp_name, lp_address, vault, tokens, token_names, alloc, rewardWeekUsd, weekRewardUsd, tvlUsd, apr, currentRewards \n';
  // for (let i = 0; i < poolLength; i++) {
  //   console.log('id', i);
  //
  //   // ** base contracts connections
  //   const lp = await chef.lpToken(i);
  //   const poolInfo = await chef.poolInfo(i);
  //   const lpContractErc20 = await DeployerUtilsLocal.connectInterface(signer, 'ERC20', lp) as ERC20;
  //
  //   // ** calculation numbers
  //   const rewardAllocPoint = poolInfo[2];
  //   const rewardDuration = +(((Date.now() / 1000) - poolInfo[1].toNumber()).toFixed(0));
  //
  //   const rewardWeekUsd = computeWeekReward(rewardDuration, rewardPerSecond, rewardAllocPoint, totalAllocPoint, rewardPrice);
  //   console.log('rewardWeekRewardUsd', rewardWeekUsd);
  //
  //   const lpPrice = await priceCalculator.getPriceWithDefaultOutput(lp);
  //   const tvl = await lpContractErc20.balanceOf(chef.address);
  //   const tvlUsd = utils.formatUnits(tvl.mul(lpPrice).div(1e9).div(1e9));
  //
  //   const apr = ((rewardWeekUsd / +tvlUsd) / 7) * 365 * 100;
  //
  //   // ** token info
  //   const tokens = await collectTokensInfo(signer, lp, i);
  //   let poolName = 'IRON';
  //   const tokenNames = [];
  //   for (const token of tokens) {
  //     const tokenName = await TokenUtils.tokenSymbol(token);
  //     tokenNames.push(tokenName);
  //     poolName += '_' + tokenName;
  //   }
  //
  //   const data = i + ',' +
  //     poolName + ',' +
  //     lp + ',' +
  //     underlyingToVault.get(lp.toLowerCase()) + ',' +
  //     tokens.join(' | ') + ',' +
  //     tokenNames.join(' | ') + ',' +
  //     rewardAllocPoint.toNumber() + ',' +
  //     rewardWeekUsd.toFixed(0) + ',' +
  //     rewardWeekUsd.toFixed(0) + ',' +
  //     (+tvlUsd).toFixed(0) + ',' +
  //     apr.toFixed(0) + ',' +
  //     currentRewards.get(lp.toLowerCase())
  //   ;
  //   console.log(data);
  //   infos += data + '\n';
  // }
  //
  // mkdir('./tmp/download', {recursive: true}, (err) => {
  //   if (err) throw err;
  // });
  //
  // // console.log('data', data);
  // writeFileSync('./tmp/download/iron_pools.csv', infos, 'utf8');
  // console.log('done');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

async function collectTokensInfo(signer: SignerWithAddress, lp: string, id: number): Promise<string[]> {
  if (id === 0 || id === 3) {
    return collectTokensInfoIronSwap(signer, lp);
  } else {
    return collectTokensInfoUniswap(signer, lp);
  }
}

async function collectTokensInfoIronSwap(signer: SignerWithAddress, lp: string): Promise<string[]> {
  const lpContract = IIronLpToken__factory.connect(lp, signer);
  const swapAddress = await lpContract.swap();
  const swapContract = IIronSwap__factory.connect(swapAddress, signer);
  return swapContract.getTokens();
}

async function collectTokensInfoUniswap(signer: SignerWithAddress, lp: string): Promise<string[]> {
  try {
    const lpContract = IUniswapV2Pair__factory.connect(lp, signer);
    const tokens = [];

    tokens.push(await lpContract.token0());
    tokens.push(await lpContract.token1());

    return tokens;
  } catch (e) {
    console.error('error collect tokens from ', lp);
  }
  return [];
}

function computeWeekReward(
  time: number,
  sushiPerSecond: BigNumber,
  allocPoint: BigNumber,
  totalAllocPoint: BigNumber,
  sushiPrice: BigNumber
): number {
  const sushiReward = BigNumber.from(time).mul(sushiPerSecond).mul(allocPoint).div(totalAllocPoint);
  const timeWeekRate = (60 * 60 * 24 * 7) / time;
  const sushiRewardForWeek = +utils.formatUnits(sushiReward) * timeWeekRate;
  return +utils.formatUnits(sushiPrice) * sushiRewardForWeek;
}
