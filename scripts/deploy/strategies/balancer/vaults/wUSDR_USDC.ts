import {deployBalancerVaultAndStrategy} from "../DeployBPTVaultAndStrategy";
import {EthAddresses} from "../../../../addresses/EthAddresses";

async function main() {
  await deployBalancerVaultAndStrategy(
    EthAddresses.BALANCER_wUSDR_USDC,
    EthAddresses.BALANCER_wUSDR_USDC_ID,
    EthAddresses.BALANCER_wUSDR_USDC_GAUGE,
    EthAddresses.USDC_TOKEN
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
