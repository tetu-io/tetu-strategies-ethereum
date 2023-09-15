/* tslint:disable */
import {DeployerUtilsLocal} from "./deploy/DeployerUtilsLocal";
import {BalLocker__factory, IGaugeController__factory} from "../typechain";
import {
  gaugeAdrToName,
  getGaugesJSON,
  getSnapshotData,
  poolNameToGaugeAdr
} from "./utils/voting-utils";

// https://forum.balancer.fi/c/vebal/13
// https://github.com/balancer-labs/frontend-v2/blob/master/src/data/voting-gauges.json

type VOTE = {
  gaugeAdr: string,
  vote: number
}

const changeVoteTo = new Map<string, string>([
  // ['0xE629c43BCad1029E12ED51432B9dd3432b656cc9'.toLowerCase(), '0x28D4FE67c68d340fe66CfbCBe8e2cd279d8AA6dD'.toLowerCase()],
]);

const CURRENT_PROPOSAL = '0x2f4d1709f19291a97db05874f747844f05502c74600cdd19c2b7a3b456d8f4aa';

async function main() {
  const signer = await DeployerUtilsLocal.impersonate('0x84169ea605619C16cc1e414AaD54C95ee1a5dA12');
  const balLocker = BalLocker__factory.connect('0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce', signer);

  const snapshotData = await getSnapshotData(CURRENT_PROPOSAL)
  console.log('CURRENT PROPOSAL', snapshotData.title);

  const curDate = Math.floor(new Date().getTime() / 1000);
  if (+snapshotData.end > curDate || (curDate - +snapshotData.end) > 60 * 60 * 24 * 3) throw new Error('Wrong proposal');

  const sumScores = snapshotData.scores.reduce((a: string, b: string) => +a + +b);
  const currentVotesMap = new Map<string, number>();
  const votesFromCurrentProposal: VOTE[] = []
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
    let gaugeAdr = poolNameToGaugeAdr(pool, gauges);
    if (changeVoteTo.has(gaugeAdr)) {
      console.log('POOL CHANGED!', pool, vote)
      gaugeAdr = changeVoteTo.get(gaugeAdr) ?? 'ERROR';
    }

    currentVotesMap.set(gaugeAdr, vote);
    votesFromCurrentProposal.push({
      gaugeAdr: gaugeAdr,
      vote,
    });
  }
  votesFromCurrentProposal.sort((a, b) => a.vote > b.vote ? 1 : -1);

  const gaugeController = await balLocker.gaugeController();

  const allGaugesAdr: string[] = gauges.map((g: any) => g['address']);

  const prevVotes = new Map<string, number>();
  for (const gauge of Array.from(allGaugesAdr)) {
    const info = await IGaugeController__factory.connect(gaugeController, signer).vote_user_slopes(balLocker.address, gauge);
    if (info[1].toNumber() !== 0) {
      prevVotes.set(gauge.toLowerCase(), info[1].toNumber());
    }
  }

  console.log('----------- Previous votes -------------------------------------------------------------')
  for (const gauge of Array.from(prevVotes.keys())) {
    console.log(gaugeAdrToName(gauge, gauges), '=>', ((prevVotes.get(gauge) ?? 0) / 100) + '%');
  }
  console.log('-----------------------------------------------------------------------------------')

  const nonExistVotes: VOTE[] = [];
  const existVotes: VOTE[] = [];
  const existVotesLowered: VOTE[] = [];
  const zeroVotes: VOTE[] = [];


  votesFromCurrentProposal.forEach(v => {
    if (prevVotes.has(v.gaugeAdr.toLowerCase())) {
      const prevVote = prevVotes.get(v.gaugeAdr.toLowerCase()) ?? 0
      const currVote = v.vote;
      if (prevVote > currVote) {
        console.log('vote exist in prev and has vote in curr, and it is lower', gaugeAdrToName(v.gaugeAdr, gauges), v.gaugeAdr)
        existVotesLowered.push(v)
      } else {
        console.log('vote exist in prev and has vote in curr, and it is higher', gaugeAdrToName(v.gaugeAdr, gauges), v.gaugeAdr)
        existVotes.push(v)
      }
    } else {
      console.log('vote do not exist in prev', gaugeAdrToName(v.gaugeAdr, gauges), v.gaugeAdr)
      nonExistVotes.push(v);
    }
  });

  Array.from(prevVotes.keys()).forEach(v => {
    if (!currentVotesMap.has(v.toLowerCase())) {
      console.log('vote exist in prev BUT do not have vote in curr', gaugeAdrToName(v, gauges), v)
      zeroVotes.push({
        gaugeAdr: v.toLowerCase(),
        vote: 0,
      })
    }
  })

  // console.log('zeroVotes', zeroVotes);
  // console.log('existVotes', existVotes);
  // console.log('nonExistVotes', nonExistVotes);


  const votesMap = new Map<string, number>();

  for (const v of zeroVotes) {
    votesMap.set(v.gaugeAdr, v.vote);
  }
  for (const v of existVotesLowered) {
    votesMap.set(v.gaugeAdr, v.vote);
  }
  for (const v of existVotes) {
    votesMap.set(v.gaugeAdr, v.vote);
  }
  for (const v of nonExistVotes) {
    votesMap.set(v.gaugeAdr, v.vote);
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

  console.log('----------- Expected New votes -------------------------------------------------------------')
  for (const gauge of Array.from(votesMap.keys())) {
    console.log(gaugeAdrToName(gauge, gauges), '=>', ((votesMap.get(gauge) ?? 0) / 100) + '%');
  }
  console.log('----- CREATE TX WITH THIS DATA voteForManyGagues------------------------------------------------------------------------------')


  for (const gauge of Array.from(votesMap.keys())) {
    console.log(gauge + ',')
  }
  for (const weight of Array.from(votesMap.values())) {
    console.log(weight + ',')
  }
  console.log('-----------------------------------------------------------------------------------')

  // VOTE ONE BY ONE for detect issues
  // for (const gauge of Array.from(votesMap.keys())) {
  //   console.log('Vote for', gaugeAdrToName(gauge, gauges), '=>', votesMap.get(gauge));
  //   await balLocker.voteForManyGaugeWeights([gauge], [votesMap.get(gauge) ?? 0]);
  // }
  // console.log('One by one voting success!');

  await balLocker.voteForManyGaugeWeights(Array.from(votesMap.keys()), Array.from(votesMap.values()));


  const newVotes = new Map<string, number>();
  for (const gauge of Array.from(votesMap.keys())) {
    const info = await IGaugeController__factory.connect(gaugeController, signer).vote_user_slopes(balLocker.address, gauge);
    newVotes.set(gauge, info[1].toNumber());
  }


  // for (let pool of Array.from(newVotes.keys())) {
  //   console.log(gaugeAdrToName(pool, gauges), newVotes.get(pool));
  // }


}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
