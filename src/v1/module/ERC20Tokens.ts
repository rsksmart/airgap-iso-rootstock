// tslint:disable: max-file-line-count
import { ERC20TokenMetadata } from '@airgap/ethereum/v1'
import { SubProtocolSymbols } from '../types/protocol'

export const erc20Tokens: Record<string, ERC20TokenMetadata> = {
  'rbtc-erc20': {
    symbol: 'RIF',
    name: 'RSK Infrastructure Framework',
    marketSymbol: 'rif',
    identifier: SubProtocolSymbols.RBTC_ERC20,
    contractAddress: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5',
    decimals: 18
  }
}

export const erc20TokensIdentifiers: string[] = Object.keys(erc20Tokens)
