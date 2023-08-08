import { EthereumProtocolNetwork, EthereumProtocolOptions } from '@airgap/ethereum/v1'

export interface RootstockProtocolNetwork extends EthereumProtocolNetwork {}

export interface RootstockProtocolOptions extends EthereumProtocolOptions<RootstockProtocolNetwork> {}

export type RootstockUnits = 'RBTC'

export enum MainProtocolSymbols {
  ROOTSTOCK = 'rbtc'
}

export enum SubProtocolSymbols {
  RBTC_ERC20 = 'rbtc-erc20'
}

export enum Domain {
  ROOTSTOCK = 'ROOTSTOCK'
}