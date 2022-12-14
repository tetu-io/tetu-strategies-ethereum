import {deployBalancerVaultAndStrategy} from "../DeployBPTVaultAndStrategy";
import {EthAddresses} from "../../../../addresses/EthAddresses";

async function main() {
  await deployBalancerVaultAndStrategy(
    EthAddresses.BALANCER_bbaUSD,
    EthAddresses.BALANCER_bbaUSD_ID,
    EthAddresses.BALANCER_bbaUSD_GAUGE,
    EthAddresses.bbaUSDC_TOKEN
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
