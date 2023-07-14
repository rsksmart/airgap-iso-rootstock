import { MainProtocolSymbols } from '@airgap/coinlib-core'
import {
  DEFAULT_ETHEREUM_UNITS_METADATA,
  EthereumBaseProtocolImpl,
  EthereumBaseProtocolOptions,
  EtherscanInfoClient
} from '@airgap/ethereum/v1'
import { newAmount, RecursivePartial, ProtocolUnitsMetadata } from '@airgap/module-kit'
import { AirGapNodeClient } from '../client/node/AirGapNodeClient'
import { RootstockProtocolNetwork, RootstockProtocolOptions, RootstockUnits } from '../types/protocol'
import { RootstockBaseProtocol, RootstockBaseProtocolImpl } from './RootstockBaseProtocol'

// Interface

export interface RootstockProtocol extends RootstockBaseProtocol {}

// Implementation

const DEFAULT_ROOTSTOCK_UNITS_METADATA: ProtocolUnitsMetadata<RootstockUnits> = {
  ...DEFAULT_ETHEREUM_UNITS_METADATA
}

class RootstockProtocolImpl extends RootstockBaseProtocolImpl implements RootstockProtocol {
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
      // https://stats.rsk.co/
      feeDefaults: {
        low: newAmount(1244.04 /* 21000 GAS * 0.05924 Gwei */, 'ETH').blockchain(DEFAULT_ROOTSTOCK_UNITS_METADATA),
        medium: newAmount(1866.06 /* 21000 GAS * 0.05924 * 1.5 Gwei */, 'ETH').blockchain(DEFAULT_ROOTSTOCK_UNITS_METADATA),
        high: newAmount(2488.08 /* 21000 GAS *  0.05924 * 2 Gwei */, 'ETH').blockchain(DEFAULT_ROOTSTOCK_UNITS_METADATA)
      }
    }
    console.log('baseProtocolOptions', baseProtocolOptions.feeDefaults?.low.unit);

    const ethereumProtocol = new EthereumBaseProtocolImpl(nodeClient, infoClient, baseProtocolOptions)

    super(ethereumProtocol, nodeClient, infoClient, completeOptions)
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
