import {
  aesEncryptionSchema,
  AirGapAnyProtocol,
  asymmetricEncryptionOfflineSchema,
  bip32OfflineProtocolSchema,
  bip32OnlineProtocolSchema,
  fetchDataForAddressProtocolSchema,
  fetchDataForMultipleAddressesProtocolSchema,
  implementsInterface,
  offlineProtocolSchema,
  onlineProtocolSchema,
  Schema,
  signMessageOfflineSchema,
  singleTokenSubProtocolSchema,
  transactionStatusCheckerSchema
} from '@airgap/module-kit'

import { ERC20Token } from '../protocol/erc20/ERC20Token'
import { RootstockBaseProtocol } from '../protocol/RootstockBaseProtocol'
import { RootstockProtocol } from '../protocol/RootstockProtocol'

// Schemas

export const rootstockBaseProtocolSchema: Schema<RootstockBaseProtocol> = {
  ...offlineProtocolSchema,
  ...onlineProtocolSchema,
  ...bip32OfflineProtocolSchema,
  ...bip32OnlineProtocolSchema,
  ...aesEncryptionSchema,
  ...asymmetricEncryptionOfflineSchema,
  ...signMessageOfflineSchema,
  ...fetchDataForAddressProtocolSchema,
  ...fetchDataForMultipleAddressesProtocolSchema,
  ...transactionStatusCheckerSchema
}

export const rootstockProtocolSchema: Schema<RootstockProtocol> = {
  ...rootstockBaseProtocolSchema
}

export const rootstockERC20TokenSchema: Schema<ERC20Token> = {
  ...rootstockBaseProtocolSchema,
  ...singleTokenSubProtocolSchema,
  name: 'required',
  symbol: 'required',
  decimals: 'required',
  tokenMetadata: 'required'
}

// Implementation Checks

export function isAnyRootstockProtocol(protocol: AirGapAnyProtocol): protocol is RootstockBaseProtocol {
  return implementsInterface<RootstockBaseProtocol>(protocol, rootstockBaseProtocolSchema)
}

export function isRootstockProtocol(protocol: AirGapAnyProtocol): protocol is RootstockProtocol {
  return implementsInterface<RootstockProtocol>(protocol, rootstockProtocolSchema)
}

export function isRootstockERC20Token(protocol: AirGapAnyProtocol): protocol is ERC20Token {
  return implementsInterface<ERC20Token>(protocol, rootstockERC20TokenSchema)
}
