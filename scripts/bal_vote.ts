// '0x651361a042e0573295dd7f6a84dbd1da56dac9d5', // 50wstETH-50bb-a-USD
// '0x74ce2247ec3f0b87ba0737497e3db8873c184267', // bb-wstETH OP
// '0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D', // tetuBAL
// '0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4', // stMatic
// '0xcd4722b7c24c29e0413bdcd9e51404b4539d14ae', // B-stETH-STABLE eth
// '0x9703c0144e8b68280b97d9e30ac6f979dd6a38d7', // 50STG-50bb-a-USD
// '0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e', // B-stETH-STABLE arb
// '0xb32Ae42524d38be7E7eD9E02b5F9330fCEf07f3F', // 50BADGER-50rETH-gauge
// '0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00', // 50WETH-50AURA-gauge

import {DeployerUtilsLocal} from "./deploy/DeployerUtilsLocal";
import {
  BalLocker__factory,
  IERC20Metadata__factory,
  IERC20__factory,
  IGaugeController__factory
} from "../typechain";

// https://forum.balancer.fi/c/vebal/13
// https://github.com/balancer-labs/frontend-v2/blob/master/public/data/voting-gauges.json


// prev votes should be first
const votes = new Map<string, number>([
  ['0x74ce2247ec3f0b87ba0737497e3db8873c184267', 0], // bb-wstETH OP
  ['0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4', 0], // stMatic
  ['0xcd4722b7c24c29e0413bdcd9e51404b4539d14ae', 0], // B-stETH-STABLE eth
  ['0x9703c0144e8b68280b97d9e30ac6f979dd6a38d7', 0],
  ['0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e', 0],
  ['0xb32Ae42524d38be7E7eD9E02b5F9330fCEf07f3F', 0],
  ['0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00', 0],
  ['0xbbCd2045ac43F79E8494600e72cA8AF455E309Dd', 29_49], // amUSD
  ['0x79ef6103a513951a3b25743db509e267685726b7', 9_58], // B-rETH-STABLE
  ['0xC9Cd2B2D8744eB1E5F224612Bd7DBe7BB7d99b5A', 1], // tetuQi
  ['0x359ea8618c405023fc4b98dab1b01f373792a126', 9], // B-33WETH-33WBTC-33USDC
  ['0x3F0FB52648Eb3981EA598716b7320081d1c8Ba1a', 2_62], // sfrxETH-stETH-rETH-BPT-gauge
  ['0x87ae77A8270F223656D9dC40AD51aabfAB424b30', 3_49], // 50WSTETH-50USDC (0x87ae77)
  ['0x1E0C21296bF29EE2d56e0abBDfbBEdF2530A7c9A', 37_65], // 80TETU-20USDC (0x1e0c21)
  ['0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D', 7_39], // tetuBAL
  ['0xFBf87D2C22d1d298298ab5b0Ec957583a2731d15', 5_08], // BPSP (0xfbf87d)
  ['0x3F29e69955E5202759208DD0C5E0BA55ff934814', 3_20], // 20wbtc-80badger
  ['0xA5A0B6598B90d214eAf4d7a6b72d5a89C3b9A72c', 41], // polybase
  ['0x88D07558470484c03d3bb44c3ECc36CAfCF43253', 28], // BPTC
  ['0x89F65570Ac019f86E145c501023e2ef7010D155B', 1], // wstETH-ACX
  ['0x0312AA8D0BA4a1969Fddb382235870bF55f7f242', 70], // B-auraBAL-STABLE
])

const prevGauges = [
  '0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D', // tetuBAL  0
  '0x74ce2247ec3f0b87ba0737497e3db8873c184267', // bb-wstETH OP  0
  '0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4', // stMatic  2159
  '0xbbCd2045ac43F79E8494600e72cA8AF455E309Dd', // amUSD  1658
  '0xcd4722b7c24c29e0413bdcd9e51404b4539d14ae', // B-stETH-STABLE eth  1362
  '0x79ef6103a513951a3b25743db509e267685726b7', // B-rETH-STABLE  1073
  '0xC9Cd2B2D8744eB1E5F224612Bd7DBe7BB7d99b5A', // tetuQi  1039
  '0x9703c0144e8b68280b97d9e30ac6f979dd6a38d7', // 50STG-50bb-a-USD  961
  '0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e', // B-stETH-STABLE arb  831
  '0x359ea8618c405023fc4b98dab1b01f373792a126', // B-33WETH-33WBTC-33USDC  273
  '0x87ae77A8270F223656D9dC40AD51aabfAB424b30', // 50WSTETH-50USDC (0x87ae77)  224
  '0xb32Ae42524d38be7E7eD9E02b5F9330fCEf07f3F', // 50BADGER-50rETH-gauge  152
  '0x3F0FB52648Eb3981EA598716b7320081d1c8Ba1a', // sfrxETH-stETH-rETH-BPT-gauge  109
  '0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00', // 50WETH-50AURA-gauge  76
  '0xA5A0B6598B90d214eAf4d7a6b72d5a89C3b9A72c', // polybase  57
  '0x88D07558470484c03d3bb44c3ECc36CAfCF43253', // BPTC  26
]

async function main() {
  const signer = await DeployerUtilsLocal.impersonate('0x84169ea605619C16cc1e414AaD54C95ee1a5dA12');
  const balLocker = BalLocker__factory.connect('0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce', signer);

  const gaugeController = await balLocker.gaugeController();

  const prevVotes = new Map<string, number>();
  for (const gauge of prevGauges) {
    const info = await IGaugeController__factory.connect(gaugeController, signer).vote_user_slopes(balLocker.address, gauge);
    prevVotes.set(gauge, info[1].toNumber());
  }
  console.log('prevVotes', prevVotes);
  const curVotes = new Set<string>(Array.from(votes.keys()).map(x => x.toLowerCase()));
  for (const prevVote of Array.from(prevVotes.keys())) {
    if (!curVotes.has(prevVote.toLowerCase())) {
      console.log("NEED TO VOTE TO ZERO FOR:", prevVote);
    }
  }

  let sum = 0;
  for (const w of Array.from(votes.values())) {
    sum += w;
  }
  console.log('sum:', sum);

  for (const gauge of Array.from(votes.keys())) {
    console.log(gauge)
  }
  for (const weight of Array.from(votes.values())) {
    console.log(weight)
  }

  await balLocker.voteForManyGaugeWeights(Array.from(votes.keys()), Array.from(votes.values()));


  const newVotes = new Map<string, number>();
  for (const gauge of Array.from(votes.keys())) {
    const info = await IGaugeController__factory.connect(gaugeController, signer).vote_user_slopes(balLocker.address, gauge);
    newVotes.set(gauge, info[1].toNumber());
    // let symbol = null;
    // try {
    //   symbol = await IERC20Metadata__factory.connect(gauge, signer).symbol();
    // } catch (e) {}
    // if(symbol === null) {
    //   symbol = gauge;
    // }
    // console.log(symbol, info[1].toNumber());
  }
  console.log('newVotes', newVotes);



}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
//
// ["0x74ce2247ec3f0b87ba0737497e3db8873c184267",
// "0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4",
// "0xcd4722b7c24c29e0413bdcd9e51404b4539d14ae",
// "0x9703c0144e8b68280b97d9e30ac6f979dd6a38d7",
// "0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e",
// "0xb32Ae42524d38be7E7eD9E02b5F9330fCEf07f3F",
// "0x275dF57d2B23d53e20322b4bb71Bf1dCb21D0A00",
// "0xbbCd2045ac43F79E8494600e72cA8AF455E309Dd",
// "0x79ef6103a513951a3b25743db509e267685726b7",
// "0xC9Cd2B2D8744eB1E5F224612Bd7DBe7BB7d99b5A",
// "0x359ea8618c405023fc4b98dab1b01f373792a126",
// "0x3F0FB52648Eb3981EA598716b7320081d1c8Ba1a",
// "0x87ae77A8270F223656D9dC40AD51aabfAB424b30",
// "0x1E0C21296bF29EE2d56e0abBDfbBEdF2530A7c9A",
// "0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D",
// "0xFBf87D2C22d1d298298ab5b0Ec957583a2731d15",
// "0x3F29e69955E5202759208DD0C5E0BA55ff934814",
// "0xA5A0B6598B90d214eAf4d7a6b72d5a89C3b9A72c",
// "0x88D07558470484c03d3bb44c3ECc36CAfCF43253",
// "0x89F65570Ac019f86E145c501023e2ef7010D155B",
// "0x0312AA8D0BA4a1969Fddb382235870bF55f7f242"]
//
// [0,
// 0,
// 0,
// 0,
// 0,
// 0,
// 0,
// 2949,
// 958,
// 1,
// 9,
// 262,
// 349,
// 3765,
// 739,
// 508,
// 320,
// 41,
// 28,
// 1,
// 70]
