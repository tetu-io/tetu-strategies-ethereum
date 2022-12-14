import {deployBalancerVaultAndStrategy} from "../DeployBPTVaultAndStrategy";
import {EthAddresses} from "../../../../addresses/EthAddresses";

async function main() {
  await deployBalancerVaultAndStrategy(
    EthAddresses.BALANCER_BADGER_rETH,
    EthAddresses.BALANCER_BADGER_rETH_ID,
    EthAddresses.BALANCER_BADGER_rETH_GAUGE,
    EthAddresses.rETH_TOKEN
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
