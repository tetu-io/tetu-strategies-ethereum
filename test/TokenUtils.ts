import {ethers} from "hardhat";
import {
  ERC20__factory,
  IERC721Enumerable__factory,
  IRewardToken__factory,
  IWmatic__factory
} from "../typechain";
import {BigNumber} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DeployerUtilsLocal} from "../scripts/deploy/DeployerUtilsLocal";
import {Misc} from "../scripts/utils/tools/Misc";
import {parseUnits} from "ethers/lib/utils";
import {EthAddresses} from "../scripts/addresses/EthAddresses";

const {expect} = chai;
chai.use(chaiAsPromised);

export class TokenUtils {

  // use the most neutral place, some contracts (like swap pairs) can be used in tests and direct transfer ruin internal logic
  public static TOKEN_HOLDERS = new Map<string, string>([
    [EthAddresses.USDC_TOKEN, '0x0a59649758aa4d66e25f08dd01271e891fe52199'.toLowerCase()], // maker
    [EthAddresses.TETU_TOKEN, '0x8f5adc58b32d4e5ca02eac0e293d35855999436c'.toLowerCase()], // todo temporally farm!
    [EthAddresses.BAL_TOKEN, '0xba12222222228d8ba445958a75a0704d566bf2c8'.toLowerCase()], // balancer vault
    [EthAddresses.BALANCER_BAL_WETH, '0xc128a9954e6c874ea3d62ce62b468ba073093f25'.toLowerCase()], // gnosis
    [EthAddresses.bbUSD_TOKEN, '0xba12222222228d8ba445958a75a0704d566bf2c8'.toLowerCase()], // bal vault
    [EthAddresses.BALANCER_wstETH_WETH, '0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE'.toLowerCase()], // bal gauge
    [EthAddresses.BALANCER_USDC_WUSDR, '0xe9866B9dc2c1213433f614CbB22EdAA0FAFF9a66'.toLowerCase()], // bal gauge
    [EthAddresses.LIDO_TOKEN, '0x3e40d73eb977dc6a537af587d48316fee66e9c8c'.toLowerCase()], // lido treasury
    [EthAddresses.BALANCER_GNO_WETH, EthAddresses.BALANCER_GNO_WETH_GAUGE.toLowerCase()], // gauge
    [EthAddresses.BALANCER_rETH_WETH, EthAddresses.BALANCER_rETH_WETH_GAUGE.toLowerCase()], // gauge
    [EthAddresses.BALANCER_wstETH_bbaUSD, EthAddresses.BALANCER_wstETH_bbaUSD_GAUGE.toLowerCase()], // gauge
    [EthAddresses.BALANCER_bbaUSD, EthAddresses.BALANCER_bbaUSD_GAUGE.toLowerCase()], // gauge
    [EthAddresses.BALANCER_BADGER_rETH, EthAddresses.BALANCER_BADGER_rETH_GAUGE.toLowerCase()], // gauge
    [EthAddresses.BALANCER_STG_bbaUSD, EthAddresses.BALANCER_STG_bbaUSD_GAUGE.toLowerCase()], // gauge
    [EthAddresses.BALANCER_wUSDR_USDC, EthAddresses.BALANCER_wUSDR_USDC_GAUGE.toLowerCase()], // gauge
  ]);

  public static async balanceOf(tokenAddress: string, account: string): Promise<BigNumber> {
    return ERC20__factory.connect(tokenAddress, ethers.provider).balanceOf(account);
  }

  public static async totalSupply(tokenAddress: string): Promise<BigNumber> {
    return ERC20__factory.connect(tokenAddress, ethers.provider).totalSupply();
  }

  public static async approve(tokenAddress: string, signer: SignerWithAddress, spender: string, amount: string) {
    console.log('approve', await TokenUtils.tokenSymbol(tokenAddress), amount);
    return ERC20__factory.connect(tokenAddress, signer).approve(spender, BigNumber.from(amount));
  }

  public static async approveNFT(tokenAddress: string, signer: SignerWithAddress, spender: string, id: string) {
    console.log('approve', await TokenUtils.tokenSymbol(tokenAddress), id);
    await TokenUtils.checkNftBalance(tokenAddress, signer.address, id);
    return ERC20__factory.connect(tokenAddress, signer).approve(spender, id);
  }

  public static async allowance(tokenAddress: string, signer: SignerWithAddress, spender: string): Promise<BigNumber> {
    return ERC20__factory.connect(tokenAddress, signer).allowance(signer.address, spender);
  }

  public static async transfer(tokenAddress: string, signer: SignerWithAddress, destination: string, amount: string) {
    console.log('transfer', await TokenUtils.tokenSymbol(tokenAddress), amount);
    return ERC20__factory.connect(tokenAddress, signer).transfer(destination, BigNumber.from(amount))
  }

  public static async wrapNetworkToken(signer: SignerWithAddress, amount: string) {
    const token = IWmatic__factory.connect(await DeployerUtilsLocal.getNetworkTokenAddress(), signer);
    return token.deposit({value: parseUnits(amount), from: signer.address});
  }

  public static async decimals(tokenAddress: string): Promise<number> {
    return ERC20__factory.connect(tokenAddress, ethers.provider).decimals();
  }

  public static async tokenName(tokenAddress: string): Promise<string> {
    return ERC20__factory.connect(tokenAddress, ethers.provider).name();
  }

  public static async tokenSymbol(tokenAddress: string): Promise<string> {
    return ERC20__factory.connect(tokenAddress, ethers.provider).symbol();
  }

  public static async checkBalance(tokenAddress: string, account: string, amount: string) {
    const bal = await TokenUtils.balanceOf(tokenAddress, account);
    expect(bal.gt(BigNumber.from(amount))).is.eq(true, 'Balance less than amount');
    return bal;
  }

  public static async tokenOfOwnerByIndex(tokenAddress: string, account: string, index: number) {
    return IERC721Enumerable__factory.connect(tokenAddress, ethers.provider).tokenOfOwnerByIndex(account, index);
  }

  public static async checkNftBalance(tokenAddress: string, account: string, id: string) {
    const nftCount = (await TokenUtils.balanceOf(tokenAddress, account)).toNumber();
    let found = false;
    let tokenId;
    for (let i = 0; i < nftCount; i++) {
      tokenId = await TokenUtils.tokenOfOwnerByIndex(tokenAddress, account, i);
      console.log('NFT', tokenId)
      if (tokenId.toString() === id) {
        found = true;
        break;
      }
    }
    expect(found).is.eq(true);
    return tokenId;
  }

  public static async getToken(token: string, to: string, amount?: BigNumber) {
    const start = Date.now();

    if (token.toLowerCase() === await DeployerUtilsLocal.getNetworkTokenAddress()) {
      console.log('mint weth');
      await IWmatic__factory.connect(token, await DeployerUtilsLocal.impersonate(to)).deposit({value: amount});
      return amount;
    }

    if (token.toLowerCase() === EthAddresses.TETU_TOKEN) {
      console.log('mint tetu');
      const minter = await DeployerUtilsLocal.impersonate('0x765277EebeCA2e31912C9946eAe1021199B39C61');
      await IRewardToken__factory.connect(token, minter).mint(to, amount || parseUnits('100000000'));
      return amount;
    }

    console.log('transfer token from biggest holder', token, amount?.toString());

    const holder = TokenUtils.TOKEN_HOLDERS.get(token.toLowerCase()) as string;
    if (!holder) {
      throw new Error('Please add holder for ' + token);
    }
    const signer = await DeployerUtilsLocal.impersonate(holder);
    const balance = (await TokenUtils.balanceOf(token, holder)).div(100);
    console.log('holder balance', balance.toString());
    if (amount) {
      await TokenUtils.transfer(token, signer, to, amount.toString());
    } else {
      await TokenUtils.transfer(token, signer, to, balance.toString());
    }
    Misc.printDuration('getToken completed', start);
    return balance;
  }

}
