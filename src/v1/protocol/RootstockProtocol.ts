import { MainProtocolSymbols } from '../types/protocol'
import {
  EthereumBaseProtocolOptions,
  EtherscanInfoClient
} from '@airgap/ethereum/v1'
import { RecursivePartial, ProtocolUnitsMetadata } from '@airgap/module-kit'
import { AirGapNodeClient } from '../client/node/AirGapNodeClient'
import { RootstockProtocolNetwork, RootstockProtocolOptions, RootstockUnits } from '../types/protocol'
import { RootstockBaseProtocolImpl, RootstockBaseProtocol } from './RootstockBaseProtocol'

// Interface

export interface RootstockProtocol extends RootstockBaseProtocol {}

// Implementation

export const DEFAULT_ROOTSTOCK_UNITS_METADATA: ProtocolUnitsMetadata<RootstockUnits> = {
  RBTC: {
    symbol: { value: 'RBTC', market: 'rbtc' },
    decimals: 18
  },
}

class RootstockProtocolImpl extends RootstockBaseProtocolImpl {
  constructor(options: RecursivePartial<RootstockProtocolOptions>) {
    const completeOptions = createRootstockProtocolOptions(options.network)
   
    const nodeClient = new AirGapNodeClient(completeOptions.network.rpcUrl)
    const infoClient = new EtherscanInfoClient(completeOptions.network.blockExplorerApi)
   
    const baseProtocolOptions: EthereumBaseProtocolOptions<RootstockUnits, RootstockProtocolNetwork> = {
      network: completeOptions.network,
      identifier: MainProtocolSymbols.ROOTSTOCK,    
      name: 'Rootstock',
      standardDerivationPath: `m/44'/137'/0'`,
      units: DEFAULT_ROOTSTOCK_UNITS_METADATA,
      mainUnit: 'RBTC',
    }
  
    super(nodeClient, infoClient, baseProtocolOptions)
  }
}

// Factory

export function createRootstockProtocol(options: RecursivePartial<RootstockProtocolOptions> = {}): RootstockProtocol {
  return new RootstockProtocolImpl(options)
}

export const ROOTSTOCK_MAINNET_PROTOCOL_NETWORK: RootstockProtocolNetwork = {
  name: 'Mainnet',
  type: 'mainnet',
  rpcUrl: 'https://public-node.rsk.co',
  chainId: 30,
  blockExplorerUrl: 'https://explorer.rsk.co',
  blockExplorerApi: 'https://blockscout.com/rsk/mainnet/api',
}

const DEFAULT_ROOTSTOCK_PROTOCOL_NETWORK: RootstockProtocolNetwork = ROOTSTOCK_MAINNET_PROTOCOL_NETWORK

export function createRootstockProtocolOptions(network: Partial<RootstockProtocolNetwork> = {}): RootstockProtocolOptions {
  return {
    network: { ...DEFAULT_ROOTSTOCK_PROTOCOL_NETWORK, ...network }
  }
}
