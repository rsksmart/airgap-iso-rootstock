import { Domain, MainProtocolSymbols, SubProtocolSymbols } from '@airgap/coinlib-core'
import { UnsupportedError } from '@airgap/coinlib-core/errors'
import { AirGapV3SerializerCompanion, SignedTransaction, UnsignedTransaction } from '@airgap/module-kit'
import { V3SchemaConfiguration } from '@airgap/module-kit/types/serializer'
import { IACMessageType, SchemaRoot, TransactionSignRequest, TransactionSignResponse } from '@airgap/serializer'

import { RootstockSignedTransaction, RootstockUnsignedTransaction } from '../../types/transaction'

import {
  rootstockSignedTransactionToResponse,
  rootstockTransactionSignRequestToUnsigned,
  rootstockTransactionSignResponseToSigned,
  rootstockUnsignedTransactionToRequest
} from './schemas/converter/transaction-converter'
import { RootstockTransactionValidator } from './validators/transaction-validator'

const ethereumTransactionSignRequest: SchemaRoot = require('./schemas/generated/transaction-sign-request-rootstock.json')
const ethereumTypedTransactionSignRequest: SchemaRoot = require('./schemas/generated/transaction-sign-request-rootstock-typed.json')
const ethereumTransactionSignResponse: SchemaRoot = require('./schemas/generated/transaction-sign-response-rootstock.json')

export class RootstockV3SerializerCompanion implements AirGapV3SerializerCompanion {
  public readonly schemas: V3SchemaConfiguration[] = [
    {
      type: IACMessageType.TransactionSignRequest,
      schema: { schema: ethereumTransactionSignRequest },
      protocolIdentifier: MainProtocolSymbols.ROOTSTOCK
    },
    {
      type: IACMessageType.TransactionSignRequest,
      schema: { schema: ethereumTypedTransactionSignRequest },
      protocolIdentifier: MainProtocolSymbols.ROOTSTOCK
    },
    {
      type: IACMessageType.TransactionSignResponse,
      schema: { schema: ethereumTransactionSignResponse },
      protocolIdentifier: MainProtocolSymbols.ROOTSTOCK
    },
    {
      type: IACMessageType.TransactionSignRequest,
      schema: { schema: ethereumTransactionSignRequest },
      protocolIdentifier: SubProtocolSymbols.RBTC_ERC20
    },
    {
      type: IACMessageType.TransactionSignResponse,
      schema: { schema: ethereumTransactionSignResponse },
      protocolIdentifier: SubProtocolSymbols.RBTC_ERC20
    }
  ]

  private readonly ethereumTransactionValidator: RootstockTransactionValidator = new RootstockTransactionValidator()

  public async toTransactionSignRequest(
    identifier: string,
    unsignedTransaction: UnsignedTransaction,
    publicKey: string,
    callbackUrl?: string
  ): Promise<TransactionSignRequest> {
    switch (identifier) {
      case MainProtocolSymbols.ROOTSTOCK:
      case SubProtocolSymbols.RBTC_ERC20:
        return rootstockUnsignedTransactionToRequest(unsignedTransaction as RootstockUnsignedTransaction, publicKey, callbackUrl)
      default:
        throw new UnsupportedError(Domain.ROOTSTOCK, `Protocol ${identifier} not supported`)
    }
  }

  public async fromTransactionSignRequest(
    identifier: string,
    transactionSignRequest: TransactionSignRequest
  ): Promise<UnsignedTransaction> {
    switch (identifier) {
      case MainProtocolSymbols.ROOTSTOCK:
      case SubProtocolSymbols.RBTC_ERC20:
        return rootstockTransactionSignRequestToUnsigned(transactionSignRequest)
      default:
        throw new UnsupportedError(Domain.ROOTSTOCK, `Protocol ${identifier} not supported`)
    }
  }

  public async validateTransactionSignRequest(identifier: string, transactionSignRequest: TransactionSignRequest): Promise<boolean> {
    switch (identifier) {
      case MainProtocolSymbols.ROOTSTOCK:
      case SubProtocolSymbols.RBTC_ERC20:
        try {
          await this.ethereumTransactionValidator.validateUnsignedTransaction(transactionSignRequest)

          return true
        } catch {
          return false
        }
      default:
        throw new UnsupportedError(Domain.ROOTSTOCK, `Protocol ${identifier} not supported`)
    }
  }

  public async toTransactionSignResponse(
    identifier: string,
    signedTransaction: SignedTransaction,
    accountIdentifier: string
  ): Promise<TransactionSignResponse> {
    switch (identifier) {
      case MainProtocolSymbols.ROOTSTOCK:
      case SubProtocolSymbols.RBTC_ERC20:
        return rootstockSignedTransactionToResponse(signedTransaction as RootstockSignedTransaction, accountIdentifier)
      default:
        throw new UnsupportedError(Domain.ROOTSTOCK, `Protocol ${identifier} not supported`)
    }
  }

  public async fromTransactionSignResponse(
    identifier: string,
    transactionSignResponse: TransactionSignResponse
  ): Promise<SignedTransaction> {
    switch (identifier) {
      case MainProtocolSymbols.ROOTSTOCK:
      case SubProtocolSymbols.RBTC_ERC20:
        return rootstockTransactionSignResponseToSigned(transactionSignResponse)
      default:
        throw new UnsupportedError(Domain.ROOTSTOCK, `Protocol ${identifier} not supported`)
    }
  }

  public async validateTransactionSignResponse(identifier: string, transactionSignResponse: TransactionSignResponse): Promise<boolean> {
    switch (identifier) {
      case MainProtocolSymbols.ROOTSTOCK:
      case SubProtocolSymbols.RBTC_ERC20:
        try {
          await this.ethereumTransactionValidator.validateSignedTransaction(transactionSignResponse)

          return true
        } catch {
          return false
        }
      default:
        throw new UnsupportedError(Domain.ROOTSTOCK, `Protocol ${identifier} not supported`)
    }
  }
}
