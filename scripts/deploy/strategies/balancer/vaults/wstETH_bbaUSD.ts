import {deployBalancerVaultAndStrategy} from "../DeployBPTVaultAndStrategy";
import {EthAddresses} from "../../../../addresses/EthAddresses";

async function main() {
  await deployBalancerVaultAndStrategy(
    EthAddresses.BALANCER_wstETH_bbaUSD,
    EthAddresses.BALANCER_wstETH_bbaUSD_ID,
    EthAddresses.BALANCER_wstETH_bbaUSD_GAUGE,
    EthAddresses.wstETH_TOKEN
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
