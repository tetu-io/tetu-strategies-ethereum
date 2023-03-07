import {deployAuraStrategyForSplitter} from "./DeployAuraStrategyForSplitter";
import {EthAddresses} from "../../../addresses/EthAddresses";

// const BADGER_RETH_SPLITTER = '';
// const WSTETH_BBUSD_SPLITTER = '';
const BBUSD_SPLITTER = '0x3c055f4a2B7234a4D807a29244403B5A44648a1F';
const RETH_WETH_SPLITTER = '0x3570CeC085974c1e7aC3dB2C68Ce65eD4f21ba94';
const WSTETH_WETH_SPLITTER = '0xf1905Bb290C30be96f15DAd19b40e97A9F6F371E';
const WUSDR_USDC_SPLITTER = '0xC70878D995c4319Fc6427Ca3161F7e4e335eCBa2';

// find `crvRewards` by pid in https://etherscan.io/token/0xa57b8d98dae62b26ec3bcc4a365338157060b234#readContract

async function main() {

  // deployed strategy 0x1C8F4e0b739090De64D0C33c89950CEc791AC7AF
  // await deployAuraStrategyForSplitter(
  //   BBUSD_SPLITTER,
  //   EthAddresses.BALANCER_bbaUSD,
  //   EthAddresses.BALANCER_bbaUSD_ID,
  //   EthAddresses.AURA_bbaUSD_REWARD_POOL,
  //   EthAddresses.bbaUSDC_TOKEN,
  // );

  // deployed strategy 0x778612982f3CD78b523c7fa00C2eF6f35367985D
  // await deployAuraStrategyForSplitter(
  //   RETH_WETH_SPLITTER,
  //   EthAddresses.BALANCER_rETH_WETH,
  //   EthAddresses.BALANCER_rETH_WETH_ID,
  //   EthAddresses.AURA_rETH_WETH_REWARD_POOL,
  //   EthAddresses.WETH_TOKEN,
  // );

  await deployAuraStrategyForSplitter(
    WSTETH_WETH_SPLITTER,
    EthAddresses.BALANCER_wstETH_WETH,
    EthAddresses.BALANCER_wstETH_WETH_ID,
    EthAddresses.AURA_wstETH_WETH_REWARD_POOL,
    EthAddresses.WETH_TOKEN,
  );

  await deployAuraStrategyForSplitter(
    WUSDR_USDC_SPLITTER,
    EthAddresses.BALANCER_wUSDR_USDC,
    EthAddresses.BALANCER_wUSDR_USDC_ID,
    EthAddresses.AURA_USDC_WUSDR_REWARD_POOL,
    EthAddresses.USDC_TOKEN,
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
