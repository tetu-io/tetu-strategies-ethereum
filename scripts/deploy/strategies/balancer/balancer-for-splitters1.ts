import {EthAddresses} from "../../../addresses/EthAddresses";
import {deployBalancerStrategyForSplitter} from "./DeployBalancerStrategyForSplitter";


const BBUSD_SPLITTER = '0x3c055f4a2B7234a4D807a29244403B5A44648a1F';
const RETH_WETH_SPLITTER = '0x3570CeC085974c1e7aC3dB2C68Ce65eD4f21ba94';
const WSTETH_WETH_SPLITTER = '0xf1905Bb290C30be96f15DAd19b40e97A9F6F371E';
const WUSDR_USDC_SPLITTER = '0xC70878D995c4319Fc6427Ca3161F7e4e335eCBa2';

async function main() {

  await deployBalancerStrategyForSplitter(
    BBUSD_SPLITTER,
    EthAddresses.BALANCER_bbaUSD,
    EthAddresses.BALANCER_bbaUSD_ID,
    EthAddresses.BALANCER_bbaUSD_GAUGE,
    EthAddresses.bbaUSDC_TOKEN,
  );


  await deployBalancerStrategyForSplitter(
    RETH_WETH_SPLITTER,
    EthAddresses.BALANCER_rETH_WETH,
    EthAddresses.BALANCER_rETH_WETH_ID,
    EthAddresses.BALANCER_rETH_WETH_GAUGE,
    EthAddresses.WETH_TOKEN,
  );

  await deployBalancerStrategyForSplitter(
    WSTETH_WETH_SPLITTER,
    EthAddresses.BALANCER_wstETH_WETH,
    EthAddresses.BALANCER_wstETH_WETH_ID,
    EthAddresses.BALANCER_GAUGE_wstETH_WETH,
    EthAddresses.WETH_TOKEN,
  );

  await deployBalancerStrategyForSplitter(
    WUSDR_USDC_SPLITTER,
    EthAddresses.BALANCER_wUSDR_USDC,
    EthAddresses.BALANCER_wUSDR_USDC_ID,
    EthAddresses.BALANCER_wUSDR_USDC_GAUGE,
    EthAddresses.USDC_TOKEN,
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
