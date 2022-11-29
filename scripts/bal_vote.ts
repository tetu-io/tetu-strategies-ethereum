// '0x651361a042e0573295dd7f6a84dbd1da56dac9d5', // 50wstETH-50bb-a-USD
// '0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D', // tetuBAL
// '0x74ce2247ec3f0b87ba0737497e3db8873c184267', // bb-wstETH OP

import {DeployerUtilsLocal} from "./deploy/DeployerUtilsLocal";
import {BalLocker__factory, IERC20Metadata__factory, IERC20__factory, IGaugeController__factory} from "../typechain";

async function main() {
  const signer = await DeployerUtilsLocal.impersonate('0x84169ea605619C16cc1e414AaD54C95ee1a5dA12');
  const balLocker = BalLocker__factory.connect('0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce', signer);

  const gaugeController = await balLocker.gaugeController();

  // zero votes should be first
  const gauges = [
    '0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D', // tetuBAL
    '0x74ce2247ec3f0b87ba0737497e3db8873c184267', // bb-wstETH OP
    '0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4', // stMatic
    '0xbbCd2045ac43F79E8494600e72cA8AF455E309Dd', // amUSD
    '0xcd4722b7c24c29e0413bdcd9e51404b4539d14ae', // B-stETH-STABLE eth
    '0x79ef6103a513951a3b25743db509e267685726b7', // B-rETH-STABLE
    '0xC9Cd2B2D8744eB1E5F224612Bd7DBe7BB7d99b5A', // tetuQi
    '0x9703c0144e8b68280b97d9e30ac6f979dd6a38d7', // 50STG-50bb-a-USD
    '0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e', // B-stETH-STABLE arb
    '0x359ea8618c405023fc4b98dab1b01f373792a126', // B-33WETH-33WBTC-33USDC
    '0x87ae77A8270F223656D9dC40AD51aabfAB424b30', // 50WSTETH-50USDC (0x87ae77)
    '0xb32Ae42524d38be7E7eD9E02b5F9330fCEf07f3F', // 50BADGER-50rETH-gauge
    '0x3F0FB52648Eb3981EA598716b7320081d1c8Ba1a', // sfrxETH-stETH-rETH-BPT-gauge
    '0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00', // 50WETH-50AURA-gauge
    '0xA5A0B6598B90d214eAf4d7a6b72d5a89C3b9A72c', // polybase
    '0x88D07558470484c03d3bb44c3ECc36CAfCF43253', // BPTC
  ];

  const weights = [
    0,
    0,
    21_59,
    16_58,
    13_62,
    10_73,
    10_39,
    9_61,
    8_31,
    2_73,
    2_24,
    1_52,
    1_09,
    76,
    57,
    26,
  ];

  const prevVotes = new Map<string, number>();
  for (const gauge of gauges) {
    const info = await IGaugeController__factory.connect(gaugeController, signer).vote_user_slopes(balLocker.address, gauge);
    prevVotes.set(gauge, info[1].toNumber());
  }
  console.log('prevVotes', prevVotes);
  const curVotes = new Set<string>(gauges.map(x => x.toLowerCase()));
  for (const prevVote of Array.from(prevVotes.keys())) {
    if (!curVotes.has(prevVote.toLowerCase())) {
      console.error("NEED TO VOTE TO ZERO FOR:", prevVote);
    }
  }

  let sum = 0;
  for (const w of weights) {
    sum += w;
  }
  console.log('sum:', sum);

  await balLocker.voteForManyGaugeWeights(gauges, weights);


  const newVotes = new Map<string, number>();
  for (const gauge of gauges) {
    const info = await IGaugeController__factory.connect(gaugeController, signer).vote_user_slopes(balLocker.address, gauge);
    newVotes.set(gauge, info[1].toNumber());
    const symbol = IERC20Metadata__factory.connect(gauge, signer).symbol();
    console.log(symbol, info[1].toNumber());
  }
  // console.log('newVotes', newVotes);


  for (const gauge of gauges) {
    console.log(gauge)
  }
  for (const weight of weights) {
    console.log(weight)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

//
// [
//   "0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D",
//   "0xC9Cd2B2D8744eB1E5F224612Bd7DBe7BB7d99b5A",
//   "0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4",
//   "0xbbCd2045ac43F79E8494600e72cA8AF455E309Dd",
//   "0x359ea8618c405023fc4b98dab1b01f373792a126",
//   "0x9703c0144e8b68280b97d9e30ac6f979dd6a38d7",
//   "0x79ef6103a513951a3b25743db509e267685726b7",
//   "0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e",
//   "0x74ce2247ec3f0b87ba0737497e3db8873c184267"
// ]
//
//   [
//   1176,
//     2648,
//     2491,
//     2295,
//     455,
//     360,
//     334,
//     237,
//     4
//   ]
