import { MainProtocolSymbols } from '../../types/protocol'
// @ts-ignore
import * as ethUtil from '@airgap/coinlib-core/dependencies/src/ethereumjs-util-5.2.0'
import { AirGapInterface, RecursivePartial, implementsInterface } from '@airgap/module-kit'

import { RootstockInfoClient } from '../../client/info/RootstockInfoClient'
import { EtherscanInfoClient } from '@airgap/ethereum/v1/clients/info/EtherscanInfoClient';

import { AirGapNodeClient } from '../../client/node/AirGapNodeClient'
import { RootstockNodeClient } from '../../client/node/RootstockNodeClient'
import { ERC20TokenMetadata, ERC20TokenOptions, EthereumProtocolNetwork } from '@airgap/ethereum/v1/types/protocol'
import { ROOTSTOCK_MAINNET_PROTOCOL_NETWORK } from '../RootstockProtocol'
import { RootstockProtocolNetwork } from '../../types/protocol'
import { ERC20Protocol, ERC20ProtocolImpl } from './ERC20Protocol'

// Interface

export interface ERC20Token<_ProtocolNetwork extends RootstockProtocolNetwork = RootstockProtocolNetwork>
  extends AirGapInterface<ERC20Protocol<string, _ProtocolNetwork>, 'SingleTokenSubProtocol'> {
    name(): Promise<string | undefined>
    symbol(): Promise<string | undefined>
    decimals(): Promise<number | undefined>
  
    tokenMetadata(): Promise<ERC20TokenMetadata>
  }

// Implementation

export class ERC20TokenImpl<_ProtocolNetwork extends RootstockProtocolNetwork = RootstockProtocolNetwork>
  extends ERC20ProtocolImpl<string, _ProtocolNetwork>
  implements ERC20Token<_ProtocolNetwork> {

  public constructor(nodeClient: RootstockNodeClient, infoClient: RootstockInfoClient, options: ERC20TokenOptions<_ProtocolNetwork>) {
    super(nodeClient, infoClient, options)

    this._mainProtocol = options.mainIdentifier
    //super.options.mainUnit
  }

  // SubProtocol

  public async getType(): Promise<'token'> {
    return 'token'
  }

  private readonly _mainProtocol: string
  public async mainProtocol(): Promise<string> {
    return this._mainProtocol
  }

  public async getContractAddress(): Promise<string> {
    return this.contractAddress
  }

  public async tokenMetadata(): Promise<ERC20TokenMetadata> {
    const metaData = await this.getMetadata();
    const mainUnit = metaData.units[this.metadata.mainUnit]

    return {
      name: metaData.name,
      identifier: metaData.identifier,
      symbol: mainUnit.symbol.value,
      marketSymbol: mainUnit.symbol.market ?? mainUnit.symbol.value,
      contractAddress: await this.getContractAddress(),
      decimals: mainUnit.decimals
    }
  }
}

// Factory

type ERC20TokenOptionsWithoutMetadata = Omit<
  ERC20TokenOptions,
  'name' | 'identifier' | 'contractAddress' | 'symbol' | 'marketSymbol' | 'decimals'
>

export function createERC20Token(
  metadata: ERC20TokenMetadata,
  options: RecursivePartial<ERC20TokenOptionsWithoutMetadata> = {}
): ERC20Token {
  const completeOptions: ERC20TokenOptions = createERC20TokenOptions(metadata, options.network, options.mainIdentifier)

  return new ERC20TokenImpl(
    new AirGapNodeClient(completeOptions.network.rpcUrl),
    new EtherscanInfoClient(completeOptions.network.blockExplorerApi),
    completeOptions
  )
}

export const ROOTSTOCK_ERC20_MAINNET_PROTOCOL_NETWORK: RootstockProtocolNetwork = {
  ...ROOTSTOCK_MAINNET_PROTOCOL_NETWORK
}

const DEFAULT_ERC20_PROTOCOL_NETWORK: EthereumProtocolNetwork = ROOTSTOCK_ERC20_MAINNET_PROTOCOL_NETWORK

export function createERC20TokenOptions(
  metadata: ERC20TokenMetadata,
  network: Partial<EthereumProtocolNetwork> = {},
  mainIdentifier?: string
): ERC20TokenOptions {
  return {
    network: { ...DEFAULT_ERC20_PROTOCOL_NETWORK, ...network },
    name: metadata.name,
    identifier: metadata.identifier,
    mainIdentifier: mainIdentifier ?? MainProtocolSymbols.ROOTSTOCK,

    contractAddress: metadata.contractAddress,
    units: {
      [metadata.symbol]: {
        symbol: { value: metadata.symbol, market: metadata.marketSymbol },
        decimals: metadata.decimals
      }
    },
    mainUnit: metadata.symbol
  }
}


// Serializer

export interface SerializedERC20Token {
  metadata: ERC20TokenMetadata
  network: RootstockProtocolNetwork
}

export async function serializeERC20Token(erc20Token: ERC20Token): Promise<SerializedERC20Token> {
  const [tokenMetadata, network]: [ERC20TokenMetadata, RootstockProtocolNetwork] = await Promise.all([
    erc20Token.tokenMetadata(),
    erc20Token.getNetwork()
  ])

  return { metadata: tokenMetadata, network }
}

export function deserializeERC20Token(serialized: SerializedERC20Token): ERC20Token {
  return createERC20Token(serialized.metadata, { network: serialized.network })
}

export function isSerializedERC20Token(serialized: unknown): serialized is SerializedERC20Token {
  return implementsInterface<SerializedERC20Token>(serialized, { metadata: 'required', network: 'required' })
}