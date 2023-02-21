/* tslint:disable */
import {DeployerUtilsLocal} from "./deploy/DeployerUtilsLocal";
import {
  BalLocker__factory,
  IERC20Metadata__factory,
  IERC20__factory,
  IGaugeController__factory
} from "../typechain";
import {
  getGaugesJSON,
  getSnapshotData,
  poolAdrToName,
  poolNameToPoolAdr
} from "./utils/voting-utils";

// https://forum.balancer.fi/c/vebal/13
// https://github.com/balancer-labs/frontend-v2/blob/master/src/data/voting-gauges.json

type VOTE = {
  poolAdr: string,
  vote: number
}

const CURRENT_PROPOSAL = '0x681a54e643bccd2408d3d25320db046b28d913b947c865cbd927aa7f6ae83455';

async function main() {
  const signer = await DeployerUtilsLocal.impersonate('0x84169ea605619C16cc1e414AaD54C95ee1a5dA12');
  const balLocker = BalLocker__factory.connect('0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce', signer);

  const snapshotData = await getSnapshotData(CURRENT_PROPOSAL)
  console.log('CURRENT PROPOSAL', snapshotData.title);

  const curDate = Math.floor(new Date().getTime() / 1000);
  if (+snapshotData.end > curDate || (curDate - +snapshotData.end) > 60 * 60 * 24 * 3) throw new Error('Wrong proposal');

  const sumScores = snapshotData.scores.reduce((a: string, b: string) => +a + +b);
  const currentVotesMap = new Map<string, number>();
  const allVotes: VOTE[] = []
  console.log('sumScores', sumScores)

  const gauges = await getGaugesJSON();

  let sumPercent = 0;
  for (let i = 0; i < snapshotData.choices.length; ++i) {
    const pool = snapshotData.choices[i];
    const vote = Math.round((snapshotData.scores[i] / sumScores) * 100_00);
    if (+vote === 0) {
      continue;
    }
    sumPercent += vote;
    // console.log(pool, vote)
    const poolAdr = poolNameToPoolAdr(pool, gauges);
    currentVotesMap.set(poolAdr, vote);
    allVotes.push({
      poolAdr,
      vote,
    });
  }
  allVotes.sort((a, b) => a.vote > b.vote ? 1 : -1);

  const gaugeController = await balLocker.gaugeController();

  const allGaugesAdr: string[] = gauges.map((g: any) => g['address']);

  const prevVotes = new Map<string, number>();
  for (const gauge of Array.from(allGaugesAdr)) {
    const info = await IGaugeController__factory.connect(gaugeController, signer).vote_user_slopes(balLocker.address, gauge);
    if (info[1].toNumber() !== 0) {
      prevVotes.set(gauge.toLowerCase(), info[1].toNumber());
    }
  }
  console.log('prevVotes', prevVotes);

  const nonExistVotes: VOTE[] = [];
  const existVotes: VOTE[] = [];
  const zeroVotes: VOTE[] = [];


  allVotes.forEach(v => {
    if (prevVotes.has(v.poolAdr.toLowerCase())) {
      console.log('vote exist in prev and has vote in curr', poolAdrToName(v.poolAdr, gauges), v.poolAdr)
      existVotes.push(v)
    } else {
      console.log('vote do not exist in prev', poolAdrToName(v.poolAdr, gauges), v.poolAdr)
      nonExistVotes.push(v);
    }
  });

  Array.from(prevVotes.keys()).forEach(v => {
    if (!currentVotesMap.has(v.toLowerCase())) {
      console.log('vote exist in prev BUT do not have vote in curr', poolAdrToName(v, gauges), v)
      zeroVotes.push({
        poolAdr: v.toLowerCase(),
        vote: 0,
      })
    }
  })

  // console.log('zeroVotes', zeroVotes);
  // console.log('existVotes', existVotes);
  // console.log('nonExistVotes', nonExistVotes);


  const votesMap = new Map<string, number>();

  for (const v of zeroVotes) {
    votesMap.set(v.poolAdr, v.vote);
  }
  for (const v of existVotes) {
    votesMap.set(v.poolAdr, v.vote);
  }
  for (const v of nonExistVotes) {
    votesMap.set(v.poolAdr, v.vote);
  }


  let sum = 0;
  for (const w of Array.from(votesMap.values())) {
    sum += w;
  }
  console.log('sum:', sum);

  // fix rounding issues by adjusting the top vote
  if (sum !== 100_00) {

    let theHighestVote = '';
    let theHighestVoteScore = 0;
    for (const pool of Array.from(votesMap.keys())) {
      const vote = (votesMap.get(pool) ?? 0);
      if (vote > theHighestVoteScore) {
        theHighestVote = pool;
        theHighestVoteScore = vote;
      }
    }

    if (sum > 100_00) {
      votesMap.set(theHighestVote, theHighestVoteScore - (sum - 100_00));
    } else {
      votesMap.set(theHighestVote, theHighestVoteScore + (100_00 - sum));
    }


    sum = 0;
    for (const w of Array.from(votesMap.values())) {
      sum += w;
    }
    console.log('adjusted sum:', sum);
    if (sum !== 100_00) throw new Error('wrong sum');
  }


  for (const gauge of Array.from(votesMap.keys())) {
    console.log(gauge)
  }
  for (const weight of Array.from(votesMap.values())) {
    console.log(weight)
  }

  await balLocker.voteForManyGaugeWeights(Array.from(votesMap.keys()), Array.from(votesMap.values()));


  const newVotes = new Map<string, number>();
  for (const gauge of Array.from(votesMap.keys())) {
    const info = await IGaugeController__factory.connect(gaugeController, signer).vote_user_slopes(balLocker.address, gauge);
    newVotes.set(gauge, info[1].toNumber());
  }


  for (let pool of Array.from(newVotes.keys())) {
    console.log(poolAdrToName(pool, gauges), newVotes.get(pool));
  }


}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });


// ["0x973fb174cdf9b1652e4213125a186f66684d899c",
//   "0x01a9502c11f411b494c62746d37e89d6f7078657",
//   "0x359ea8618c405023fc4b98dab1b01f373792a126",
//   "0xfbf87d2c22d1d298298ab5b0ec957583a2731d15",
//   "0xbbcd2045ac43f79e8494600e72ca8af455e309dd",
//   "0xf7c3b4e1edcb00f0230bfe03d937e26a5e654fd4",
//   "0xe77239359ce4d445fed27c17da23b8024d35e456",
//   "0xcd4722b7c24c29e0413bdcd9e51404b4539d14ae",
//   "0xf0d887c1f5996c91402eb69ab525f028dd5d7578",
//   "0x3d5f0520267fe92fff52b847fac3204554552f99",
//   "0x7fc115bf013844d6ef988837f7ae6398af153532",
//   "0x519cce718fcd11ac09194cff4517f12d263be067",
//   "0xe2b680a8d02fbf48c7d9465398c4225d7b7a7f87",
//   "0xa5a0b6598b90d214eaf4d7a6b72d5a89c3b9a72c",
//   "0x88d07558470484c03d3bb44c3ecc36cafcf43253",
//   "0xcf5938ca6d9f19c73010c7493e19c02acfa8d24d",
//   "0x0312aa8d0ba4a1969fddb382235870bf55f7f242",
//   "0x21a3de9292569f599e4cf83c741862705bf4f108",
//   "0x1e0c21296bf29ee2d56e0abbdfbbedf2530a7c9a",
//   "0x87012b0c3257423fd74a5986f81a0f1954c17a1d",
//   "0x2c967d6611c60274db45e0bb34c64fb5f504ede7",
//   "0xe96924d293b9e2961f9763ca058e389d27341d3d",
//   "0x39a9e78c3b9b5b47f1f6632bd74890e2430215cf",
//   "0x79ef6103a513951a3b25743db509e267685726b7",
//   "0x95201b61ef19c867da0d093df20021e1a559452c",
//   "0x3f29e69955e5202759208dd0c5e0ba55ff934814",
//   "0x2c2179abce3413e27bda6917f60ae37f96d01826",
//   "0x38727b907046818135c9a865d5c40be6cd1c0514",
//   "0xe9866b9dc2c1213433f614cbb22edaa0faff9a66",
//   "0x90437a1d2f6c0935dd6056f07f05c068f2a507f9"]
//
//   [0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   0,
//   3,
//   13,
//   28,
//   30,
//   68,
//   78,
//   78,
//   92,
//   222,
//   386,
//   723,
//   1826,
//   2,
//   7,
//   25,
//   65,
//   89,
//   169,
//   190,
//   195,
//   299,
//   1994,
//   3418]


// const prevGauges = new Map<string, number>([
//   ['0x2C967D6611C60274db45E0BB34c64fb5F504eDE7', 0], // B-MaticX-stable 0x2c967d
//   ['0x87ae77A8270F223656D9dC40AD51aabfAB424b30', 0], // 50WSTETH-50USDC
//   ['0x3F29e69955E5202759208DD0C5E0BA55ff934814', 0], // 20wbtc-80badger
//   ['0x9703c0144e8b68280b97d9e30ac6f979dd6a38d7', 0], // 50STG-50bb-a-USD
//   ['0x79ef6103a513951a3b25743db509e267685726b7', 0], // rETH-STABLE
//   ['0xbbCd2045ac43F79E8494600e72cA8AF455E309Dd', 2], // amUSD
//   ['0xF0d887c1f5996C91402EB69Ab525f028DD5d7578', 8], // 2BRL (BRZ)
//   ['0x0312AA8D0BA4a1969Fddb382235870bF55f7f242', 16], // B-auraBAL-STABLE
//   ['0x359ea8618c405023fc4b98dab1b01f373792a126', 41], // B-33WETH-33WBTC-33USDC
//   ['0x88D07558470484c03d3bb44c3ECc36CAfCF43253', 47], // BPTC
//   ['0xcd4722b7c24c29e0413bdcd9e51404b4539d14ae', 49], // B-stETH-STABLE eth
//   ['0xA5A0B6598B90d214eAf4d7a6b72d5a89C3b9A72c', 60], // polybase
//   ['0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D', 1_49], // tetuBAL
//   ['0xFBf87D2C22d1d298298ab5b0Ec957583a2731d15', 2_07], // BPSP (0xfbf87d)
//   ['0x519cCe718FCD11AC09194CFf4517F12D263BE067', 2_08], // wstETH-WETH-Stable
//   ['0x3d5F0520267FE92FFf52B847FAC3204554552f99', 2_21], // 2eur (agEUR)
//   ['0x1E0C21296bF29EE2d56e0abBDfbBEdF2530A7c9A', 15_97], // 80TETU-20USDC (0x1e0c21)
//   ['0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4', 22_37], // B-stMATIC-Stable
//   ['0x21a3De9292569F599e4cf83c741862705bf4f108', 22_37], // wUSDR-STABLE
//   ['0x973fb174Cdf9b1652e4213125a186f66684D899c', 27_78], // 50TEMPLE-50bb-a-USD
//
//   ['0x7Fc115BF013844D6eF988837F7ae6398af153532', 8], // 20WETH-80T
//   ['0x01A9502C11f411b494c62746D37e89d6f7078657', 14], // B-cbETH-wstETH-Stable
//   ['0xe2b680A8d02fbf48C7D9465398C4225d7b7A7f87', 32], // USDC-PAL
//   ['0xE77239359CE4D445Fed27C17Da23B8024d35e456', 89], // 2BRLUSD-boosted
// ])

// prev votes should be first
// const votes = new Map<string, number>([
//   ['0xbbCd2045ac43F79E8494600e72cA8AF455E309Dd', 0], // amUSD
//   ['0x359ea8618c405023fc4b98dab1b01f373792a126', 0], // B-33WETH-33WBTC-33USDC
//   ['0xFBf87D2C22d1d298298ab5b0Ec957583a2731d15', 0], // BPSP (0xfbf87d)
//   ['0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4', 0], // B-stMATIC-Stable
//   ['0x973fb174Cdf9b1652e4213125a186f66684D899c', 0], // 50TEMPLE-50bb-a-USD
//   ['0x01A9502C11f411b494c62746D37e89d6f7078657', 0], // B-cbETH-wstETH-Stable
//   ['0xE77239359CE4D445Fed27C17Da23B8024d35e456', 0], // 2BRLUSD-boosted
//
//   ['0xcd4722b7c24c29e0413bdcd9e51404b4539d14ae', 3], // B-stETH-STABLE eth
//   ['0xF0d887c1f5996C91402EB69Ab525f028DD5d7578', 13], // 2BRL (BRZ)
//   ['0x3d5F0520267FE92FFf52B847FAC3204554552f99', 28], // 2eur (agEUR)
//   ['0x7Fc115BF013844D6eF988837F7ae6398af153532', 30], // 20WETH-80T
//   ['0x519cCe718FCD11AC09194CFf4517F12D263BE067', 68], // wstETH-WETH-Stable
//   ['0xe2b680A8d02fbf48C7D9465398C4225d7b7A7f87', 78], // USDC-PAL
//   ['0xA5A0B6598B90d214eAf4d7a6b72d5a89C3b9A72c', 78], // polybase
//   ['0x79ef6103a513951a3b25743db509e267685726b7', 89], // rETH-STABLE
//   ['0x88D07558470484c03d3bb44c3ECc36CAfCF43253', 92], // BPTC
//   ['0x3F29e69955E5202759208DD0C5E0BA55ff934814', 1_9], // 20wbtc-80badger
//   ['0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D', 2_22], // tetuBAL-BALWETH
//   ['0x0312AA8D0BA4a1969Fddb382235870bF55f7f242', 3_86], // B-auraBAL-STABLE
//   ['0x21a3De9292569F599e4cf83c741862705bf4f108', 7_23], // wUSDR-STABLE - POLY
//   ['0x1E0C21296bF29EE2d56e0abBDfbBEdF2530A7c9A', 18_26], // 80TETU-20USDC (0x1e0c21)
//
//   ['0x87012b0C3257423fD74a5986F81a0f1954C17a1d', 2], // 50rETH-50BADGER
//   ['0x2C967D6611C60274db45E0BB34c64fb5F504eDE7', 7], // B-MaticX-stable
//   ['0xE96924D293b9e2961f9763cA058E389D27341D3d', 25], // 50rETH-50bb-euler-USD
//   ['0x39a9E78c3b9b5B47f1f6632BD74890E2430215Cf', 65], // 80palStkAAVE-20AAVE
//   ['0x95201B61EF19C867dA0D093DF20021e1a559452c', 1_69], // 50wstETH-50LDO - CHECK DUPLICATE!
//   ['0x2C2179abce3413E27BDA6917f60ae37F96D01826', 1_95], // 50rETH-50RPL - CHECK DUPLICATE!
//   ['0x38727B907046818135c9a865D5C40BE6cd1c0514', 2_99], // 50TEMPLE-50bb-euler-USD
//   ['0xe9866B9dc2c1213433f614CbB22EdAA0FAFF9a66', 19_94], // B-wUSDR-STABLE - MAINNET!
//   ['0x90437a1D2F6C0935Dd6056f07f05C068f2A507F9', 34_20], // 20WMATIC-80SPHERE
// ])
