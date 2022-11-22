import {deployBalancerVaultAndStrategy} from "../DeployBPTVaultAndStrategy";
import {EthAddresses} from "../../../../addresses/EthAddresses";

async function main() {
  await deployBalancerVaultAndStrategy(
    EthAddresses.BALANCER_wstETH_WETH,
    EthAddresses.BALANCER_wstETH_WETH_ID,
    EthAddresses.BALANCER_GAUGE_wstETH_WETH,
    EthAddresses.WETH_TOKEN
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
