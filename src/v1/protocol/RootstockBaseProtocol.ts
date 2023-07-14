import { EthereumBaseProtocolImpl, EthereumUnits } from '@airgap/ethereum/v1'
import {
  Address,
  AirGapProtocol,
  AirGapTransaction,
  AirGapTransactionStatus,
  AirGapTransactionsWithCursor,
  Amount,
  Balance,
  CryptoDerivative,
  ExtendedKeyPair,
  ExtendedPublicKey,
  ExtendedSecretKey,
  FeeDefaults,
  KeyPair,
  ProtocolUnitsMetadata,
  PublicKey,
  SecretKey,
  Signature,
  TransactionFullConfiguration,
  TransactionDetails
} from '@airgap/module-kit'

import { RootstockInfoClient } from '../client/info/RootstockInfoClient'
import { RootstockNodeClient } from '../client/node/RootstockNodeClient'
import { RootstockCryptoConfiguration } from '../types/crypto'
import { RootstockProtocolNetwork, RootstockProtocolOptions, RootstockUnits } from '../types/protocol'
import {
  RootstockSignedTransaction,
  RootstockTransactionCursor,
  RootstockUnsignedTransaction
} from '../types/transaction'

// Interface

export interface RootstockBaseProtocol<_Units extends string = RootstockUnits | EthereumUnits>
  extends AirGapProtocol<
    {
      AddressResult: Address
      ProtocolNetwork: RootstockProtocolNetwork
      CryptoConfiguration: RootstockCryptoConfiguration
      Units: _Units
      FeeUnits: RootstockUnits | EthereumUnits
      FeeEstimation: FeeDefaults<RootstockUnits>
      SignedTransaction: RootstockSignedTransaction
      UnsignedTransaction: RootstockUnsignedTransaction
      TransactionCursor: RootstockTransactionCursor
    },
    'Bip32',
    'Crypto',
    'FetchDataForAddress',
    'FetchDataForMultipleAddresses',
    'TransactionStatusChecker'
  > {}

// Implementation

export abstract class RootstockBaseProtocolImpl<
  _Units extends string = RootstockUnits | EthereumUnits,
  _EthereumProtocol extends EthereumBaseProtocolImpl<_Units, RootstockProtocolNetwork> = EthereumBaseProtocolImpl<
    _Units,
    RootstockProtocolNetwork
  >,
  _Options extends RootstockProtocolOptions = RootstockProtocolOptions
> implements RootstockBaseProtocol<_Units> {
  protected constructor(
    protected readonly ethereumProtocol: _EthereumProtocol,
    protected readonly nodeClient: RootstockNodeClient,
    protected readonly infoClient: RootstockInfoClient,
    protected readonly options: _Options
  ) {
    this.units = this.ethereumProtocol.units
    this.feeUnits = this.ethereumProtocol.feeUnits as ProtocolUnitsMetadata<RootstockUnits | EthereumUnits>
  }

  // Common

  protected readonly units: ProtocolUnitsMetadata<_Units>
  protected readonly feeUnits: ProtocolUnitsMetadata<RootstockUnits | EthereumUnits>

  public async getMetadata(): Promise<any> { // ProtocolMetadata<_Units, EthereumUnits | RootstockUnits>
    return this.ethereumProtocol.getMetadata()
  }

  public async getAddressFromPublicKey(publicKey: PublicKey | ExtendedPublicKey): Promise<string> {
    return this.ethereumProtocol.getAddressFromPublicKey(publicKey)
  }

  public async deriveFromExtendedPublicKey(
    extendedPublicKey: ExtendedPublicKey,
    visibilityIndex: number,
    addressIndex: number
  ): Promise<PublicKey> {
    return this.ethereumProtocol.deriveFromExtendedPublicKey(extendedPublicKey, visibilityIndex, addressIndex)
  }

  public async getDetailsFromTransaction(
    transaction: RootstockUnsignedTransaction | RootstockSignedTransaction,
    publicKey: PublicKey | ExtendedPublicKey
  ): Promise<AirGapTransaction<_Units, RootstockUnits>[]> {
    return this.ethereumProtocol.getDetailsFromTransaction(transaction, publicKey)
  }

  public async verifyMessageWithPublicKey(
    message: string,
    signature: Signature,
    publicKey: PublicKey | ExtendedPublicKey
  ): Promise<boolean> {
    return this.ethereumProtocol.verifyMessageWithPublicKey(message, signature, publicKey)
  }

  public async encryptAsymmetricWithPublicKey(payload: string, publicKey: PublicKey | ExtendedPublicKey): Promise<string> {
    return this.ethereumProtocol.encryptAsymmetricWithPublicKey(payload, publicKey)
  }

  // Offline

  public async getCryptoConfiguration(): Promise<RootstockCryptoConfiguration> {
    return this.ethereumProtocol.getCryptoConfiguration()
  }

  public async getKeyPairFromDerivative(derivative: CryptoDerivative): Promise<KeyPair> {
    return this.ethereumProtocol.getKeyPairFromDerivative(derivative)
  }

  public async getExtendedKeyPairFromDerivative(derivative: CryptoDerivative): Promise<ExtendedKeyPair> {
    return this.ethereumProtocol.getExtendedKeyPairFromDerivative(derivative)
  }

  public async deriveFromExtendedSecretKey(
    extendedSecretKey: ExtendedSecretKey,
    visibilityIndex: number,
    addressIndex: number
  ): Promise<SecretKey> {
    return this.ethereumProtocol.deriveFromExtendedSecretKey(extendedSecretKey, visibilityIndex, addressIndex)
  }

  public async signTransactionWithSecretKey(
    transaction: RootstockUnsignedTransaction,
    secretKey: SecretKey | ExtendedSecretKey
  ): Promise<RootstockSignedTransaction> {
    return this.ethereumProtocol.signTransactionWithSecretKey(transaction, secretKey)
  }

  public async signMessageWithKeyPair(message: string, keyPair: KeyPair | ExtendedKeyPair): Promise<Signature> {
    return this.ethereumProtocol.signMessageWithKeyPair(message, keyPair)
  }

  public async decryptAsymmetricWithKeyPair(payload: string, keyPair: KeyPair | ExtendedKeyPair): Promise<string> {
    return this.ethereumProtocol.decryptAsymmetricWithKeyPair(payload, keyPair)
  }

  public async encryptAESWithSecretKey(payload: string, secretKey: SecretKey | ExtendedSecretKey): Promise<string> {
    return this.ethereumProtocol.encryptAESWithSecretKey(payload, secretKey)
  }

  public async decryptAESWithSecretKey(payload: string, secretKey: SecretKey | ExtendedSecretKey): Promise<string> {
    return this.ethereumProtocol.decryptAESWithSecretKey(payload, secretKey)
  }

  // Online

  public async getNetwork(): Promise<RootstockProtocolNetwork> {
    return this.ethereumProtocol.getNetwork()
  }

  public async getTransactionsForPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    limit: number,
    cursor?: RootstockTransactionCursor
  ): Promise<AirGapTransactionsWithCursor<RootstockTransactionCursor, _Units, EthereumUnits>> {
    return this.ethereumProtocol.getTransactionsForPublicKey(publicKey, limit, cursor)
  }

  public async getTransactionsForAddress(
    address: string,
    limit: number,
    cursor?: RootstockTransactionCursor
  ): Promise<AirGapTransactionsWithCursor<RootstockTransactionCursor, _Units, EthereumUnits>> {
    return this.ethereumProtocol.getTransactionsForAddress(address, limit, cursor)
  }

  public async getTransactionsForAddresses(
    addresses: string[],
    limit: number,
    cursor?: RootstockTransactionCursor
  ): Promise<AirGapTransactionsWithCursor<RootstockTransactionCursor, _Units, EthereumUnits>> {
    return this.ethereumProtocol.getTransactionsForAddresses(addresses, limit, cursor)
  }

  public async getTransactionStatus(transactionIds: string[]): Promise<Record<string, AirGapTransactionStatus>> {
    return this.ethereumProtocol.getTransactionStatus(transactionIds)
  }

  public async getBalanceOfPublicKey(publicKey: PublicKey | ExtendedPublicKey): Promise<Balance<_Units>> {
    return this.ethereumProtocol.getBalanceOfPublicKey(publicKey)
  }

  public async getBalanceOfAddress(address: string): Promise<Balance<_Units>> {
    return this.ethereumProtocol.getBalanceOfAddress(address)
  }

  public async getBalanceOfAddresses(addresses: string[]): Promise<Balance<_Units>> {
    return this.ethereumProtocol.getBalanceOfAddresses(addresses)
  }

  public async getTransactionMaxAmountWithPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    to: string[],
    configuration?: TransactionFullConfiguration<EthereumUnits>
  ): Promise<Amount<_Units>> {
    return this.ethereumProtocol.getTransactionMaxAmountWithPublicKey(publicKey, to, configuration)
  }

  public async getTransactionFeeWithPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    details: TransactionDetails<_Units>[]
  ): Promise<FeeDefaults<EthereumUnits>> {
    return this.ethereumProtocol.getTransactionFeeWithPublicKey(publicKey, details)
  }

  public async prepareTransactionWithPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    details: TransactionDetails<_Units>[],
    configuration?: TransactionFullConfiguration<EthereumUnits>
  ): Promise<RootstockUnsignedTransaction> {
    return this.ethereumProtocol.prepareTransactionWithPublicKey(publicKey, details, configuration)
  }

  public async broadcastTransaction(transaction: RootstockSignedTransaction): Promise<string> {
    return this.ethereumProtocol.broadcastTransaction(transaction)
  }
}
