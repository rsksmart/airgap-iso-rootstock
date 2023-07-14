import {
  ethereumSignedTransactionToResponse,
  EthereumTransactionSignRequest,
  ethereumTransactionSignRequestToUnsigned,
  ethereumTransactionSignResponseToSigned,
  ethereumUnsignedTransactionToRequest
} from '@airgap/ethereum/v1'
import { newSignedTransaction, newUnsignedTransaction } from '@airgap/module-kit'

import { RootstockRawUnsignedTransaction, RootstockSignedTransaction, RootstockUnsignedTransaction } from '../../../../types/transaction'
import { RootstockTransactionSignRequest } from '../definitions/transaction-sign-request-rootstock'
import { RootstockTypedTransactionSignRequest } from '../definitions/transaction-sign-request-rootstock-typed'
import { RootstockTransactionSignResponse } from '../definitions/transaction-sign-response-rootstock'

export function rootstockUnsignedTransactionToRequest(
  unsigned: RootstockUnsignedTransaction,
  publicKey: string,
  callbackUrl?: string
): RootstockTransactionSignRequest | RootstockTypedTransactionSignRequest {
  const ethereumAnyTransactionSignRequest = ethereumUnsignedTransactionToRequest(unsigned, publicKey, callbackUrl)

  if (unsigned.ethereumType === 'raw') {
    const ethereumTransactionSignRequest = ethereumAnyTransactionSignRequest as EthereumTransactionSignRequest
    const rootstockTransactionSignRequest: RootstockTransactionSignRequest = {
      ...ethereumTransactionSignRequest,
      transaction: {
        ...ethereumTransactionSignRequest.transaction,
      }
    }

    return rootstockTransactionSignRequest
  }

  return ethereumAnyTransactionSignRequest as RootstockTypedTransactionSignRequest
}

export function rootstockSignedTransactionToResponse(
  signed: RootstockSignedTransaction,
  accountIdentifier: string
): RootstockTransactionSignResponse {
  return ethereumSignedTransactionToResponse(
    {
      ...signed,
    },
    accountIdentifier
  )
}

export function rootstockTransactionSignRequestToUnsigned(
  request: RootstockTransactionSignRequest | RootstockTypedTransactionSignRequest
): RootstockUnsignedTransaction {
  const ethereumUnsignedTransaction = ethereumTransactionSignRequestToUnsigned(request)

  if (ethereumUnsignedTransaction.ethereumType === 'raw') {
    return newUnsignedTransaction<RootstockRawUnsignedTransaction>({
      ...ethereumUnsignedTransaction,
    })
  }

  return ethereumUnsignedTransaction
}

export function rootstockTransactionSignResponseToSigned(response: RootstockTransactionSignResponse): RootstockSignedTransaction {
  const ethereumSignedTransaction = ethereumTransactionSignResponseToSigned(response)

  try {
    const { serialized } = JSON.parse(ethereumSignedTransaction.serialized)

    return newSignedTransaction<RootstockSignedTransaction>({
      serialized,
    })
  } catch {
    return ethereumSignedTransaction
  }
}
