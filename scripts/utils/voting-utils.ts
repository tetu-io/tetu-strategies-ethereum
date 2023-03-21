/* tslint:disable:no-string-literal */
import fetch from 'node-fetch';

const SNAPSHOT_GRAPHQL_ENDPOINT = 'https://hub.snapshot.org/graphql'

// tslint:disable-next-line:no-var-requires
const {request, gql} = require('graphql-request')

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
export async function getAllGaugesFromSubgraph(): Promise<any> {
  const resp = await request(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
    gql`
        query {
            gauges(first: 1000) {
                address
                type {
                    id
                }
            }
        }
    `
  )

  // tslint:disable-next-line:ban-ts-ignore
  // @ts-ignore
  return resp.gauges.map(g => {
    return {
      address: g.address,
      gaugeType: g.type.id,
    }
  })
}

export async function getGaugesJSON() {
  const resp = await fetch('https://raw.githubusercontent.com/balancer-labs/frontend-v2/master/src/data/voting-gauges.json', {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });
  return resp.json()
}

// tslint:disable-next-line:no-any
export function poolNameToGaugeAdr(poolName: string, gauges: any[]): string {
  try {
    const poolAdrConct = '0x' + poolName.split('(0x')[1].split(')')[0].trim();
    const poolNameConct = poolName.split('(0x')[0].trim();
    // console.log('poolAdrConct', poolAdrConct, poolNameConct);
    // tslint:disable-next-line:no-any
    const element = Array.from(gauges).filter((el: any) => {
      // tslint:disable-next-line:no-string-literal
      const adr: string = el['address']
      return adr.slice(0, 8).toLowerCase() === poolAdrConct.toLowerCase();
    });
    if (element.length > 1) throw new Error('collision');
    if (element.length === 0) throw new Error('no gauge');
    // tslint:disable-next-line:no-string-literal
    return element[0]['address'].toLowerCase();
  } catch (e) {
    console.log('error parse pool name', poolName)
    throw e;
  }
}

// tslint:disable-next-line:no-any
export function gaugeAdrToName(gaugeAdr: string, gauges: any[]) {
  // tslint:disable-next-line:no-any
  return Array.from(gauges).filter((el: any) => {
    // tslint:disable-next-line:no-string-literal
    const adr: string = el['address']
    return adr.toLowerCase() === gaugeAdr.toLowerCase()
  })[0]['pool']['symbol'];
}
