import {
  EthereumRawUnsignedTransaction,
  EthereumSignedTransaction,
  EthereumTransactionCursor,
  EthereumTypedUnsignedTransaction,
} from '@airgap/ethereum/v1'

export interface RootstockRawUnsignedTransaction extends EthereumRawUnsignedTransaction {
}

export type RootstockTypedUnsignedTransaction = EthereumTypedUnsignedTransaction

export type RootstockUnsignedTransaction = RootstockRawUnsignedTransaction | RootstockTypedUnsignedTransaction

export interface RootstockSignedTransaction extends EthereumSignedTransaction {
}

export type RootstockTransactionCursor = EthereumTransactionCursor