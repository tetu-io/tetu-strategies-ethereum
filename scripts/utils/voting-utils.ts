/* tslint:disable:no-string-literal */
import fetch from 'node-fetch';

const SNAPSHOT_GRAPHQL_ENDPOINT = 'https://hub.snapshot.org/graphql'
const BALANCER_GRAPHQL_ENDPOINT = 'https://api-v3.balancer.fi/'

// tslint:disable-next-line:no-var-requires
const {request, gql} = require('graphql-request')

// tslint:disable-next-line:no-any
export async function getBalancerGaugesData(): Promise<any> {
  const resp = await request(
    BALANCER_GRAPHQL_ENDPOINT,
    gql`
        query {
            veBalGetVotingList {
                id
                address
                chain
                type
                symbol
                gauge {
                    address
                    isKilled
                    relativeWeightCap
                    addedTimestamp
                    childGaugeAddress
                }
                tokens {
                    address
                    logoURI
                    symbol
                    weight
                }
            }
        }
    `
  )

  return resp.veBalGetVotingList
}

// tslint:disable-next-line:no-any
export async function getSnapshotData(proposalId: string): Promise<any> {
  const resp = await request(
    SNAPSHOT_GRAPHQL_ENDPOINT,
    gql`
        query {
            proposals (
                where: {
                    id: "${proposalId}"
                }
            ) {
                id
                title
                choices
                start
                end
                scores
                space {
                    id
                    name
                }
            }
        }
    `
  )

  return resp.proposals[0]
}

// tslint:disable-next-line:no-any
export function poolNameToGaugeAdr(poolName: string, balData: any[]): string {
  try {
    const poolAdrConct = '0x' + poolName.split('(0x')[1].split(')')[0].trim();
    const poolNameConct = poolName.split('(0x')[0].trim();
    // tslint:disable-next-line:no-any
    const element = Array.from(balData).filter((el: any) => {
      // console.log(el)
      const adr: string = el.gauge.address;
      return adr.slice(0, 8).toLowerCase() === poolAdrConct.toLowerCase(); // todo change to gauge
    });
    if (element.length > 1) {
      console.log('poolAdrConct', poolAdrConct, poolNameConct, element);

      let freshest = element[0];
      for(const el of element) {
        if(el.gauge.addedTimestamp > freshest.gauge.addedTimestamp) {
          freshest = el;
        }
      }
      throw new Error('collision');
    }
    if (element.length === 0) throw new Error('no gauge');
    return element[0].gauge.address.toLowerCase();
  } catch (e) {
    console.log('error parse pool name', poolName)
    throw e;
  }
}

// tslint:disable-next-line:no-any
export function gaugeAdrToName(gaugeAdr: string, balData: any[]) {
  if (gaugeAdr.toLowerCase() === '0x7342DD5970d9151850386fD4Df286fD85EA4917f'.toLowerCase()) {
    return 'tetuBAL-BALWETH NEW!';
  }
  // tslint:disable-next-line:no-any
  return Array.from(balData).filter((el: any) => {
    const adr: string = el.gauge.address;
    return adr.toLowerCase() === gaugeAdr.toLowerCase()
  })[0].symbol;
}
