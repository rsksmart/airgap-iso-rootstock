import { TransactionSignRequest } from '@airgap/serializer'
import { HexString } from '@airgap/serializer/v3/schemas/definitions/hex-string'

import { RootstockRawUnsignedTransaction } from '../../../../types/transaction'

export interface SerializableRootstockRawUnsignedTransaction extends Omit<RootstockRawUnsignedTransaction, 'type' | 'ethereumType'> {
  nonce: HexString
  gasPrice: HexString
  gasLimit: HexString
  to: HexString
  value: HexString
  chainId: number
  data: HexString
}

export interface RootstockTransactionSignRequest extends TransactionSignRequest<SerializableRootstockRawUnsignedTransaction> {}
