import { EthereumProtocolNetwork, EthereumProtocolOptions } from '@airgap/ethereum/v1'

export interface RootstockProtocolNetwork extends EthereumProtocolNetwork {}

export interface RootstockProtocolOptions extends EthereumProtocolOptions<RootstockProtocolNetwork> {}

export type RootstockUnits = 'RBTC' | 'ETH' | 'GWEI' | 'WEI'

