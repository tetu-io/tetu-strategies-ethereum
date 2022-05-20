import {CoreAddresses} from "./scripts/models/CoreAddresses";
import {ToolsAddresses} from "./scripts/models/ToolsAddresses";
import {EthereumCoreAddresses} from "./addresses_core_ethereum";
import {EthereumToolsAddresses} from "./addresses_tools_ethereum";

export class Addresses {

  public static CORE = new Map<string, CoreAddresses>([
    ['1', EthereumCoreAddresses.ADDRESSES],
  ]);

  public static TOOLS = new Map<string, ToolsAddresses>([
    ['1', EthereumToolsAddresses.ADDRESSES],
  ]);

  public static TOKENS = new Map<string, Map<string, string>>([
    ['137', new Map([
      ['usdc', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'],
      ['sushi_lp_token_usdc', '0xF1c97B5d031f09f64580Fe79FE30110A8C971bF9'],
      ['quick_lp_token_usdc', '0x22E2BDaBEbA9b5ff8924275DbE47aDE5cf7b822B'],
    ])],

  ]);

  public static ORACLE = '0xb8c898e946a1e82f244c7fcaa1f6bd4de028d559';
}
