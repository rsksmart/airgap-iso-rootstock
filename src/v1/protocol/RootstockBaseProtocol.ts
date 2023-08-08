// tslint:disable: max-classes-per-file
import { assertNever, Domain } from '@airgap/coinlib-core'
import { BigNumber } from '@airgap/coinlib-core/dependencies/src/bignumber.js-9.0.0/bignumber'
// @ts-ignore
import { mnemonicToSeed } from '@airgap/coinlib-core/dependencies/src/bip39-2.5.0'
// @ts-ignore
import * as BitGo from '@airgap/coinlib-core/dependencies/src/bitgo-utxo-lib-5d91049fd7a988382df81c8260e244ee56d57aac/src'
import { BalanceError, ConditionViolationError, UnsupportedError } from '@airgap/coinlib-core/errors'
import { isHex } from '@airgap/coinlib-core/utils/hex'
import { encodeDerivative } from '@airgap/crypto'
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
  isAmount,
  KeyPair,
  newAmount,
  newExtendedPublicKey,
  newExtendedSecretKey,
  newPlainUIText,
  newPublicKey,
  newSecretKey,
  newSignature,
  newSignedTransaction,
  newUnsignedTransaction,
  newWarningUIAlert,
  ProtocolMetadata,
  ProtocolUnitsMetadata,
  PublicKey,
  SecretKey,
  Signature,
  TokenDetails,
  TransactionFullConfiguration,
  TransactionDetails,
  TransactionSimpleConfiguration,
  WalletConnectRequest
} from '@airgap/module-kit'
import Common from '@ethereumjs/common'
// TODO: ETH TX and ethereumjs-util-5.2.0 removed
import { FeeMarketEIP1559Transaction, Transaction, TransactionFactory, TxData, TypedTransaction } from '@ethereumjs/tx'

import { EthereumCryptoClient } from '@airgap/ethereum/v1/clients/crypto/EthereumCryptoClient'
import { EthereumInfoClientTransactionsResult } from '@airgap/ethereum/v1/clients/info/EthereumInfoClient'
import { RootstockNodeClient } from '../client/node/RootstockNodeClient'
import { RootstockInfoClient } from '../client/info/RootstockInfoClient'
import { EthereumAddress } from '@airgap/ethereum/v1/data/EthereumAddress'
import { EthereumBaseProtocolOptions, EthereumProtocolOptions } from '@airgap/ethereum/v1/types/protocol'
import {
  RootstockRawUnsignedTransaction,
  RootstockSignedTransaction,
  RootstockTransactionCursor,
  RootstockTypedUnsignedTransaction,
  RootstockUnsignedTransaction
} from '../types/transaction'
import { EthereumUtils } from '@airgap/ethereum/v1/utils/EthereumUtils'
import { convertExtendedPublicKey, convertExtendedSecretKey, convertPublicKey, convertSecretKey } from '@airgap/ethereum/v1/utils/key'
import { DEFAULT_ROOTSTOCK_UNITS_METADATA } from './RootstockProtocol'
import { RootstockProtocolNetwork, RootstockUnits } from '../types/protocol'
import { ETHEREUM_CHAIN_IDS } from '@airgap/ethereum/v1/protocol/EthereumChainIds'
import { RootstockCryptoConfiguration } from '../types/crypto'
// Interface

export interface RootstockBaseProtocol<
  _Units extends string = RootstockUnits,
  _ProtocolNetwork extends RootstockProtocolNetwork = RootstockProtocolNetwork
> extends AirGapProtocol<
    {
      AddressResult: Address
      ProtocolNetwork: _ProtocolNetwork
      CryptoConfiguration: RootstockCryptoConfiguration
      Units: _Units
      FeeUnits: RootstockUnits
      FeeEstimation: FeeDefaults<RootstockUnits>
      SignedTransaction: RootstockSignedTransaction
      UnsignedTransaction: RootstockUnsignedTransaction
      TransactionCursor: RootstockTransactionCursor
    },
    'Bip32',
    'Crypto',
    'FetchDataForAddress',
    'FetchDataForMultipleAddresses',
    'GetTokenBalances',
    'TransactionStatusChecker',
    'WalletConnect'
  > {}

const MAX_GAS_ESTIMATE: number = 300000

const WALLET_CONNECT_NAMESPACE = 'eip155'

export class RootstockBaseProtocolImpl<
  _Units extends string = RootstockUnits,
  _ProtocolNetwork extends RootstockProtocolNetwork = RootstockProtocolNetwork
> implements RootstockBaseProtocol<_Units, _ProtocolNetwork>
{
  protected readonly options: EthereumProtocolOptions<_ProtocolNetwork>

  protected readonly nodeClient: RootstockNodeClient
  protected readonly infoClient: RootstockInfoClient
  protected readonly cryptoClient: EthereumCryptoClient

  protected readonly bitcoinJS: {
    lib: any
    config: {
      network: any
    }
  } = {
    lib: BitGo,
    config: { network: BitGo.networks.bitcoin }
  }

  constructor(
    nodeClient: RootstockNodeClient,
    infoClient: RootstockInfoClient,
    options: EthereumBaseProtocolOptions<_Units, _ProtocolNetwork>
  ) {
    this.options = options

    this.nodeClient = nodeClient
    this.infoClient = infoClient
    this.cryptoClient = new EthereumCryptoClient()

    this.units = options.units

    this.feeDefaults = {
      // https://stats.rsk.co/
      low: newAmount(0.00000124404 /* 21000 GAS * 0.05924 Gwei */, 'RBTC').blockchain(DEFAULT_ROOTSTOCK_UNITS_METADATA),
      medium: newAmount(0.00000186606 /* 21000 GAS * 0.05924 * 1.5 Gwei */, 'RBTC').blockchain(DEFAULT_ROOTSTOCK_UNITS_METADATA),
      high: newAmount(0.00000248808 /* 21000 GAS *  0.05924 * 2 Gwei */, 'RBTC').blockchain(DEFAULT_ROOTSTOCK_UNITS_METADATA)
    },

    this.metadata = {
      identifier: options.identifier,
      name: options.name,

      units: options.units,
      mainUnit: options.mainUnit,

      fee: {
        defaults: this.feeDefaults,
        units: this.feeUnits,
        mainUnit: 'RBTC'
      },

      account: {
        standardDerivationPath: options.standardDerivationPath ?? `m/44'/60'/0'`,
        address: {
          isCaseSensitive: false,
          placeholder: '0xabc...',
          regex: '^0x[a-fA-F0-9]{40}$'
        }
      },

      transaction: {
        arbitraryData: {
          inner: { name: 'data' }
        }
      }
    }
  }

  // Common

  public readonly units: ProtocolUnitsMetadata<_Units>
  public readonly feeUnits: ProtocolUnitsMetadata<RootstockUnits> = DEFAULT_ROOTSTOCK_UNITS_METADATA
  protected readonly feeDefaults: FeeDefaults<RootstockUnits>

  protected readonly metadata: ProtocolMetadata<_Units, RootstockUnits>

  public async getMetadata(): Promise<ProtocolMetadata<_Units, RootstockUnits>> {
    return this.metadata
  }

  public async getAddressFromPublicKey(publicKey: PublicKey | ExtendedPublicKey): Promise<string> {
    return EthereumAddress.from(this.nonExtendedPublicKey(publicKey)).asString()
  }

  public async deriveFromExtendedPublicKey(
    extendedPublicKey: ExtendedPublicKey,
    visibilityIndex: number,
    addressIndex: number
  ): Promise<PublicKey> {
    return this.getPublicKeyFromExtendedPublicKey(extendedPublicKey, visibilityIndex, addressIndex)
  }

  public async getDetailsFromTransaction(
    transaction: RootstockSignedTransaction | RootstockUnsignedTransaction,
    publicKey: PublicKey | ExtendedPublicKey
  ): Promise<AirGapTransaction<_Units, RootstockUnits>[]> {
    return publicKey.type === 'pub'
      ? this.getDetailsFromTransactionWithPublicKey(transaction, publicKey)
      : this.getDetailsFromTransactionWithExtendedPublicKey(transaction, publicKey)
  }

  private async getDetailsFromTransactionWithPublicKey(
    transaction: RootstockSignedTransaction | RootstockUnsignedTransaction,
    publicKey: PublicKey
  ): Promise<AirGapTransaction<_Units, RootstockUnits>[]> {
    switch (transaction.type) {
      case 'signed':
        return this.getDetailsFromSignedTransaction(transaction)
      case 'unsigned':
        const ownAddress: string = await this.getAddressFromPublicKey(publicKey)
        if (transaction.ethereumType === 'typed') {
          return this.getDetailsFromTypedUnsignedTransaction(transaction, ownAddress)
        } else {
          return this.getDetailsFromRawUnsignedTransaction(transaction, ownAddress)
        }
      default:
        assertNever(transaction)
        throw new UnsupportedError(Domain.ETHEREUM, 'Unsupported transaction type.')
    }
  }

  private async getDetailsFromTransactionWithExtendedPublicKey(
    transaction: RootstockSignedTransaction | RootstockUnsignedTransaction,
    extendedPublicKey: ExtendedPublicKey
  ): Promise<AirGapTransaction<_Units, RootstockUnits>[]> {
    switch (transaction.type) {
      case 'signed':
        return this.getDetailsFromSignedTransaction(transaction)
      case 'unsigned':
        if (transaction.ethereumType === 'typed') {
          const dps: string[] = transaction.derivationPath.split('/')
          const derivedPublicKey: PublicKey = this.getPublicKeyFromExtendedPublicKey(
            extendedPublicKey,
            Number(dps[dps.length - 2]),
            Number(dps[dps.length - 1])
          )
          const ownAddress: string = await this.getAddressFromPublicKey(derivedPublicKey)

          return this.getDetailsFromTypedUnsignedTransaction(transaction, ownAddress)
        } else {
          const derivedPublicKey: PublicKey = this.getPublicKeyFromExtendedPublicKey(extendedPublicKey, 0, 0)
          const ownAddress: string = await this.getAddressFromPublicKey(derivedPublicKey)

          return this.getDetailsFromRawUnsignedTransaction(transaction, ownAddress)
        }
      default:
        assertNever(transaction)
        throw new UnsupportedError(Domain.ETHEREUM, 'Unsupported transaction type.')
    }
  }

  protected async getDetailsFromSignedTransaction(
    transaction: RootstockSignedTransaction
  ): Promise<AirGapTransaction<_Units, RootstockUnits>[]> {
    const ethTx = TransactionFactory.fromSerializedData(Buffer.from(transaction.serialized, 'hex'))

    if (ethTx.type === 0) {
      const tx = ethTx as Transaction

      const hexValue = tx.value.toString('hex') || '0x0'
      const hexGasPrice = tx.gasPrice.toString('hex') || '0x0'
      const hexGasLimit = tx.gasLimit.toString('hex') || '0x0'
      const hexNonce = tx.nonce.toString('hex') || '0x0'
      const chainId = tx.common.chainIdBN().toString(10)
      const to = tx.to

      if (!to) {
        throw new Error('No "TO" address')
      }

      return [
        {
          from: [tx.getSenderAddress().toString()],
          to: [to.toString()],
          isInbound: tx.toCreationAddress(),

          amount: newAmount(parseInt(hexValue, 16), 'blockchain'),
          fee: newAmount(new BigNumber(parseInt(hexGasLimit, 16)).multipliedBy(parseInt(hexGasPrice, 16)), 'blockchain'),

          network: this.options.network,
          status: {
            type: 'unknown',
            hash: `0x${tx.hash().toString('hex')}`
          },
          arbitraryData: `0x${tx.data.toString('hex')}`,
          extra: {
            chainId,
            nonce: parseInt(hexNonce, 16)
          }
        }
      ]
    }

    try {
      const feeTx = ethTx as FeeMarketEIP1559Transaction

      return [
        {
          from: [feeTx.getSenderAddress().toString()],
          to: [feeTx.to?.toString() ?? ''],
          isInbound: false,

          amount: newAmount(feeTx.value.toString(10), 'blockchain'),
          fee: newAmount(new BigNumber(feeTx.gasLimit.toString(10)).multipliedBy(feeTx.maxFeePerGas.toString(10)), 'blockchain'),

          network: this.options.network,
          arbitraryData: feeTx.data.toString('hex'),
          extra: {
            chainId: feeTx.chainId.toNumber(),
            nonce: feeTx.nonce.toNumber()
          }
        }
      ]
    } catch (e) {
      throw new Error(`Transaction type "${ethTx.type}" not supported`)
    }
  }

  protected async getDetailsFromTypedUnsignedTransaction(
    transaction: RootstockTypedUnsignedTransaction,
    ownAddress: string
  ): Promise<AirGapTransaction<_Units, RootstockUnits>[]> {
    const typedTransaction: FeeMarketEIP1559Transaction = TransactionFactory.fromSerializedData(
      Buffer.from(transaction.serialized, 'hex')
    ) as FeeMarketEIP1559Transaction
    const airGapTransaction: AirGapTransaction<_Units, RootstockUnits> = {
      from: [ownAddress],
      to: [typedTransaction.to?.toString() ?? ''],
      isInbound: false,

      amount: newAmount(typedTransaction.value.toString(10), 'blockchain'),
      fee: newAmount(
        new BigNumber(typedTransaction.gasLimit.toString(10)).multipliedBy(typedTransaction.maxFeePerGas.toString(10)),
        'blockchain'
      ),

      network: this.options.network,
      arbitraryData: typedTransaction.data.toString('hex'),

      uiAlerts:
        typedTransaction.chainId.toNumber() !== 1
          ? [
              newWarningUIAlert({
                title: newPlainUIText('Chain ID'),
                description: newPlainUIText(
                  `Please note that this is not an Ethereum Mainnet transaction, it is from ${
                    ETHEREUM_CHAIN_IDS[typedTransaction.chainId.toNumber()] ?? `Chain ID ${typedTransaction.chainId.toNumber()}`
                  }`
                )
              })
            ]
          : undefined
    }

    return [airGapTransaction]
  }

  protected async getDetailsFromRawUnsignedTransaction(
    transaction: RootstockRawUnsignedTransaction,
    ownAddress: string
  ): Promise<AirGapTransaction<_Units, RootstockUnits>[]> {
    return [
      {
        from: [ownAddress],
        to: [transaction.to],
        isInbound: false,

        amount: newAmount(transaction.value, 'blockchain'),
        fee: newAmount(new BigNumber(transaction.gasLimit).multipliedBy(transaction.gasPrice), 'blockchain'),

        network: this.options.network,
        arbitraryData: transaction.data
      }
    ]
  }

  public async verifyMessageWithPublicKey(
    message: string,
    signature: Signature,
    publicKey: PublicKey | ExtendedPublicKey
  ): Promise<boolean> {
    const hexSignature: Signature = signature
    const hexPublicKey: PublicKey = convertPublicKey(this.nonExtendedPublicKey(publicKey), 'hex')

    return this.cryptoClient.verifyMessage(message, hexSignature.value, hexPublicKey.value)
  }

  public async encryptAsymmetricWithPublicKey(payload: string, publicKey: PublicKey | ExtendedPublicKey): Promise<string> {
    const hexPublicKey: PublicKey = convertPublicKey(this.nonExtendedPublicKey(publicKey), 'hex')

    return this.cryptoClient.encryptAsymmetric(payload, hexPublicKey.value)
  }

  // Offline

  private readonly cryptoConfiguration: RootstockCryptoConfiguration = {
    algorithm: 'secp256k1'
  }

  public async getCryptoConfiguration(): Promise<RootstockCryptoConfiguration> {
    return this.cryptoConfiguration
  }

  public async getKeyPairFromDerivative(derivative: CryptoDerivative): Promise<KeyPair> {
    const node = this.derivativeToBip32Node(derivative)

    return {
      secretKey: newSecretKey(node.keyPair.getPrivateKeyBuffer().toString('hex'), 'hex'),
      publicKey: newPublicKey(node.neutered().keyPair.getPublicKeyBuffer().toString('hex'), 'hex')
    }
  }

  public async getExtendedKeyPairFromDerivative(derivative: CryptoDerivative): Promise<ExtendedKeyPair> {
    const node = this.derivativeToBip32Node(derivative)

    return {
      secretKey: newExtendedSecretKey(node.toBase58(), 'encoded'),
      publicKey: newExtendedPublicKey(node.neutered().toBase58(), 'encoded')
    }
  }

  public async deriveFromExtendedSecretKey(
    extendedSecretKey: ExtendedSecretKey,
    visibilityIndex: number,
    addressIndex: number
  ): Promise<SecretKey> {
    return this.getSecretKeyFromExtendedSecretKey(extendedSecretKey, visibilityIndex, addressIndex)
  }

  public async signTransactionWithSecretKey(
    transaction: RootstockUnsignedTransaction,
    secretKey: SecretKey | ExtendedSecretKey
  ): Promise<RootstockSignedTransaction> {
    return transaction.ethereumType === 'typed'
      ? this.signTypedUnsignedTransactionWithSecretKey(transaction, this.nonExtendedSecretKey(secretKey))
      : this.signRawUnsignedTransactionWithSecretKey(transaction, this.nonExtendedSecretKey(secretKey))
  }

  private async signTypedUnsignedTransactionWithSecretKey(
    transaction: RootstockTypedUnsignedTransaction,
    secretKey: SecretKey
  ): Promise<RootstockSignedTransaction> {
    const typedTransaction: TypedTransaction = TransactionFactory.fromSerializedData(Buffer.from(transaction.serialized, 'hex'))

    return this.signTypedTransactionWithSecretKey(typedTransaction, secretKey)
  }

  private async signRawUnsignedTransactionWithSecretKey(
    transaction: RootstockRawUnsignedTransaction,
    secretKey: SecretKey
  ): Promise<RootstockSignedTransaction> {
    const txData: TxData = {
      nonce: transaction.nonce,
      gasPrice: transaction.gasPrice,
      gasLimit: transaction.gasLimit,
      to: transaction.to,
      value: transaction.value.startsWith('0x') ? transaction.value : EthereumUtils.toHex(parseInt(transaction.value, 10)),
      data: transaction.data
    }

    let common: Common | undefined
    try {
      common = new Common({ chain: transaction.chainId })
    } catch {
      common = Common.custom({ chainId: transaction.chainId })
    }

    const typedTransaction: TypedTransaction = TransactionFactory.fromTxData(txData, { common })

    return this.signTypedTransactionWithSecretKey(typedTransaction, secretKey)
  }

  private async signTypedTransactionWithSecretKey(transaction: TypedTransaction, secretKey: SecretKey): Promise<RootstockSignedTransaction> {
    const hexSecretKey: SecretKey = convertSecretKey(secretKey, 'hex')
    const signedTransaction = transaction.sign(Buffer.from(hexSecretKey.value, 'hex'))

    return newSignedTransaction<RootstockSignedTransaction>({
      serialized: signedTransaction.serialize().toString('hex')
    })
  }

  public async signMessageWithKeyPair(message: string, keyPair: KeyPair | ExtendedKeyPair): Promise<Signature> {
    const hexSecretKey: SecretKey = convertSecretKey(this.nonExtendedSecretKey(keyPair.secretKey), 'hex')
    const signature: string = await this.cryptoClient.signMessage(message, { privateKey: hexSecretKey.value })

    return newSignature(signature, 'hex')
  }

  public async decryptAsymmetricWithKeyPair(payload: string, keyPair: KeyPair | ExtendedKeyPair): Promise<string> {
    const hexSecretKey: SecretKey = convertSecretKey(this.nonExtendedSecretKey(keyPair.secretKey), 'hex')
    const hexPublicKey: PublicKey = convertPublicKey(this.nonExtendedPublicKey(keyPair.publicKey), 'hex')

    return this.cryptoClient.decryptAsymmetric(payload, { privateKey: hexSecretKey.value, publicKey: hexPublicKey.value })
  }

  public async encryptAESWithSecretKey(payload: string, secretKey: SecretKey | ExtendedSecretKey): Promise<string> {
    const hexSecretKey: SecretKey = convertSecretKey(this.nonExtendedSecretKey(secretKey), 'hex')

    return this.cryptoClient.encryptAES(payload, hexSecretKey.value)
  }

  public async decryptAESWithSecretKey(payload: string, secretKey: SecretKey | ExtendedSecretKey): Promise<string> {
    const hexSecretKey: SecretKey = convertSecretKey(this.nonExtendedSecretKey(secretKey), 'hex')

    return this.cryptoClient.decryptAES(payload, hexSecretKey.value)
  }

  // Online

  public async getNetwork(): Promise<_ProtocolNetwork> {
    return this.options.network
  }

  public async getTransactionsForPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    limit: number,
    cursor?: RootstockTransactionCursor
  ): Promise<AirGapTransactionsWithCursor<RootstockTransactionCursor, _Units, RootstockUnits>> {
    const address: string = await this.getAddressFromPublicKey(publicKey)

    return this.getTransactionsForAddress(address, limit, cursor)
  }

  public async getTransactionsForAddress(
    address: string,
    limit: number,
    cursor?: RootstockTransactionCursor
  ): Promise<AirGapTransactionsWithCursor<RootstockTransactionCursor, _Units, RootstockUnits>> {
    return this.getTransactionsForAddresses([address], limit, cursor)
  }

  public async getTransactionsForAddresses(
    addresses: string[],
    limit: number,
    cursor?: RootstockTransactionCursor
  ): Promise<AirGapTransactionsWithCursor<RootstockTransactionCursor, _Units, RootstockUnits>> {
    return new Promise((overallResolve, overallReject) => {
      const promises: Promise<EthereumInfoClientTransactionsResult>[] = []
      for (const address of addresses) {
        promises.push(this.infoClient.fetchTransactions(address, limit, cursor))
      }

      Promise.all(promises)
        .then((values) => {
          const page = Math.max(...values.map((txResult) => txResult.cursor.page))
          const transactions: AirGapTransaction<_Units, RootstockUnits>[] = values.reduce((acc, current) => {
            return acc.concat(
              current.transactions.map((tx) => ({
                ...tx,
                amount: newAmount<_Units>(tx.amount.value, 'blockchain'),
                fee: newAmount<RootstockUnits>(tx.fee.value, 'blockchain'),
                network: this.options.network
              }))
            )
          }, [] as AirGapTransaction<_Units, RootstockUnits>[])

          const hasNext: boolean = transactions.length >= limit

          overallResolve({
            transactions,
            cursor: {
              hasNext,
              page: hasNext ? page : undefined
            }
          })
        })
        .catch(overallReject)
    })
  }

  public async getTransactionStatus(transactionIds: string[]): Promise<Record<string, AirGapTransactionStatus>> {
    const statuses: [string, AirGapTransactionStatus][] = await Promise.all(
      transactionIds.map(async (txHash: string) => {
        return [txHash, await this.nodeClient.getTransactionStatus(txHash)]
      })
    )

    return statuses.reduce((obj, next) => Object.assign(obj, { [next[0]]: next[1] }), {})
  }

  public async getBalanceOfPublicKey(publicKey: PublicKey | ExtendedPublicKey): Promise<Balance<_Units>> {
    const address: string = await this.getAddressFromPublicKey(publicKey)

    return this.getBalanceOfAddress(address)
  }

  public async getBalanceOfAddress(address: string): Promise<Balance<_Units>> {
    return this.getBalanceOfAddresses([address])
  }

  public async getBalanceOfAddresses(addresses: string[]): Promise<Balance<_Units>> {
    const balances: BigNumber[] = await Promise.all(
      addresses.map((address: string) => {
        return this.nodeClient.fetchBalance(address)
      })
    )

    return {
      total: newAmount(
        balances.reduce((a: BigNumber, b: BigNumber) => a.plus(b)),
        'blockchain'
      )
    }
  }

  public async getTokenBalancesOfPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    tokens: TokenDetails[]
  ): Promise<Record<string, Amount>> {
    const address: string = await this.getAddressFromPublicKey(publicKey)
    const contractAddresses: string[] = tokens.map((token: TokenDetails) => token.contractAddress)
    const balances: Record<string, BigNumber> = await this.nodeClient.callBalanceOfOnContracts(contractAddresses, address)

    return tokens.reduce((obj: Record<string, Amount>, next: TokenDetails) => {
      const balance: BigNumber | undefined = balances[next.contractAddress]
      if (balance === undefined) {
        return obj
      }

      return Object.assign(obj, { [next.identifier]: newAmount(balance, 'blockchain') })
    }, {})
  }

  public async getTransactionMaxAmountWithPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    to: string[],
    configuration?: TransactionFullConfiguration<RootstockUnits>
  ): Promise<Amount<_Units>> {
    const { total, transferable }: Balance<_Units> = await this.getBalanceOfPublicKey(publicKey)
    const balance = new BigNumber(newAmount(transferable ?? total).blockchain(this.units).value)

    let fee: Amount<RootstockUnits>
    if (configuration?.fee !== undefined) {
      fee = configuration.fee
    } else {
      const estimatedFee: FeeDefaults<RootstockUnits> = await this.getTransactionFeeWithPublicKey(
        publicKey,
        to.map((recipient: string) => ({
          to: recipient,
          amount: newAmount(balance.div(to.length).decimalPlaces(0, BigNumber.ROUND_CEIL), 'blockchain')
        }))
      )
      fee = newAmount(estimatedFee.medium).blockchain(this.feeUnits)
      if (balance.lte(fee.value)) {
        fee = newAmount(0, 'blockchain')
      }
    }

    let amountWithoutFees: BigNumber = balance.minus(fee.value)
    if (amountWithoutFees.isNegative()) {
      amountWithoutFees = new BigNumber(0)
    }

    return newAmount(amountWithoutFees, 'blockchain')
  }

  public async getTransactionFeeWithPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    details: TransactionDetails<_Units>[],
    configuration?: TransactionSimpleConfiguration
  ): Promise<FeeDefaults<RootstockUnits>> {
    if (details.length !== 1) {
      throw new ConditionViolationError(Domain.ETHEREUM, 'you cannot have 0 transaction details')
    }
    const address: string = await this.getAddressFromPublicKey(publicKey)
    const estimatedGas: BigNumber = await this.estimateGas(address, details[0].to, newAmount(details[0].amount).blockchain(this.units))
    const gasPrice: BigNumber = await this.nodeClient.getGasPrice()
    const feeStepFactor: BigNumber = new BigNumber(0.5)
    const estimatedFee: BigNumber = estimatedGas.times(gasPrice)
    const lowFee: BigNumber = estimatedFee.minus(estimatedFee.times(feeStepFactor).integerValue(BigNumber.ROUND_FLOOR))
    const mediumFee: BigNumber = estimatedFee
    const highFee: BigNumber = mediumFee.plus(mediumFee.times(feeStepFactor).integerValue(BigNumber.ROUND_FLOOR))

    return {
      low: newAmount(lowFee, 'blockchain'),
      medium: newAmount(mediumFee, 'blockchain'),
      high: newAmount(highFee, 'blockchain')
    }
  }

  public async prepareTransactionWithPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    details: TransactionDetails<_Units>[],
    configuration?: TransactionFullConfiguration<RootstockUnits>
  ): Promise<RootstockUnsignedTransaction> {
    if (details.length !== 1) {
      throw new ConditionViolationError(Domain.ETHEREUM, 'you cannot have 0 transaction details')
    }

    let fee: Amount<RootstockUnits>
    if (configuration?.fee !== undefined) {
      fee = configuration.fee
    } else {
      const estimatedFee: FeeDefaults<RootstockUnits> = await this.getTransactionFeeWithPublicKey(publicKey, details)
      fee = estimatedFee.medium
    }

    const wrappedFee: BigNumber = new BigNumber(newAmount(fee).blockchain(this.feeUnits).value)
    const wrappedAmount: BigNumber = new BigNumber(newAmount(details[0].amount).blockchain(this.units).value)

    const address: string = await this.getAddressFromPublicKey(publicKey)
    const hexAmount = EthereumUtils.toHex(wrappedAmount.toFixed())

    const balance = await this.getBalanceOfPublicKey(publicKey)
    const availableBalance = newAmount(balance.transferable ?? balance.total).blockchain(this.units)
    const gasLimit = await this.estimateGas(address, details[0].to, hexAmount)
    const gasPrice = wrappedFee.div(gasLimit).integerValue(BigNumber.ROUND_CEIL)
    if (new BigNumber(availableBalance.value).gte(wrappedAmount.plus(wrappedFee))) {
      const txCount = await this.nodeClient.fetchTransactionCount(address)
      const transaction: RootstockRawUnsignedTransaction = newUnsignedTransaction({
        ethereumType: 'raw',
        nonce: EthereumUtils.toHex(txCount),
        gasLimit: EthereumUtils.toHex(gasLimit.toFixed()),
        gasPrice: EthereumUtils.toHex(gasPrice.toFixed()), // 10 Gwei
        to: details[0].to,
        value: hexAmount,
        chainId: this.options.network.chainId,
        data: '0x'
      })

      return transaction
    } else {
      throw new BalanceError(Domain.ETHEREUM, 'not enough balance')
    }
  }

  public async getWalletConnectChain(): Promise<string> {
    return `${WALLET_CONNECT_NAMESPACE}:${this.options.network.chainId}`
  }

  public async prepareWalletConnectTransactionWithPublicKey(
    publicKey: PublicKey | ExtendedPublicKey,
    request: WalletConnectRequest
  ): Promise<RootstockUnsignedTransaction> {
    const gasPricePromise: Promise<string> = request.gasPrice
      ? Promise.resolve(request.gasPrice)
      : this.nodeClient.getGasPrice().then((gasPrice: BigNumber) => `0x${gasPrice.toString(16)}`)

    const noncePromise: Promise<string> = request.nonce
      ? Promise.resolve(request.nonce)
      : this.getAddressFromPublicKey(publicKey)
          .then((address: string) => this.nodeClient.fetchTransactionCount(address))
          .then((transactionCount: number) => `0x${new BigNumber(transactionCount).toString(16)}`)

    const [gasPrice, nonce]: [string, string] = await Promise.all([gasPricePromise, noncePromise])

    return newUnsignedTransaction<RootstockRawUnsignedTransaction>({
      ethereumType: 'raw',
      nonce,
      gasLimit: `0x${(300000).toString(16)}`,
      gasPrice,
      to: request.to ?? '',
      value: request.value ?? '0x00',
      chainId: this.options.network.chainId,
      data: request.data ?? '0x'
    })
  }

  public async broadcastTransaction(transaction: RootstockSignedTransaction): Promise<string> {
    return this.nodeClient.sendSignedTransaction(`0x${transaction.serialized.replace(/^0x/, '')}`)
  }

  // Custom

  private nonExtendedPublicKey(publicKey: PublicKey | ExtendedPublicKey): PublicKey {
    return publicKey.type === 'pub' ? publicKey : this.getPublicKeyFromExtendedPublicKey(publicKey)
  }

  private nonExtendedSecretKey(secretKey: SecretKey | ExtendedSecretKey): SecretKey {
    return secretKey.type === 'priv' ? secretKey : this.getSecretKeyFromExtendedSecretKey(secretKey)
  }

  private getPublicKeyFromExtendedPublicKey(
    extendedPublicKey: ExtendedPublicKey,
    visibilityIndex: number = 0,
    addressIndex: number = 0
  ): PublicKey {
    const encodedExtendedPublicKey: ExtendedPublicKey = convertExtendedPublicKey(extendedPublicKey, 'encoded')
    const derivedNode = this.deriveNode(encodedExtendedPublicKey.value, visibilityIndex, addressIndex)

    return newPublicKey(derivedNode.neutered().keyPair.getPublicKeyBuffer().toString('hex'), 'hex')
  }

  private getSecretKeyFromExtendedSecretKey(
    extendedSecretKey: ExtendedSecretKey,
    visibilityIndex: number = 0,
    addressIndex: number = 0
  ): SecretKey {
    const encodedExtendedSecretKey: ExtendedSecretKey = convertExtendedSecretKey(extendedSecretKey, 'encoded')
    const derivedNode = this.deriveNode(encodedExtendedSecretKey.value, visibilityIndex, addressIndex)

    return newSecretKey(derivedNode.keyPair.getPrivateKeyBuffer().toString('hex'), 'hex')
  }

  private deriveNode(base58: string, visibilityIndex?: number, addressIndex?: number): any {
    return [visibilityIndex, addressIndex].reduce(
      (node, index) => node.derive(index),
      this.bitcoinJS.lib.HDNode.fromBase58(base58, this.bitcoinJS.config.network)
    )
  }

  protected async estimateGas(
    fromAddress: string,
    toAddress: string,
    amount: string | number | BigNumber | Amount<_Units>,
    data?: string
  ): Promise<BigNumber> {
    let hexAmount: string
    if (typeof amount === 'string' && isHex(amount)) {
      hexAmount = amount
    } else {
      const blockchainAmount: Amount<_Units> = isAmount(amount) ? newAmount(amount).blockchain(this.units) : newAmount(amount, 'blockchain')

      hexAmount = EthereumUtils.toHex(blockchainAmount.value)
    }

    return this.nodeClient.estimateTransactionGas(fromAddress, toAddress, hexAmount, data, EthereumUtils.toHex(MAX_GAS_ESTIMATE))
  }

  private derivativeToBip32Node(derivative: CryptoDerivative) {
    const bip32Node = encodeDerivative('bip32', derivative)

    return this.bitcoinJS.lib.HDNode.fromBase58(bip32Node.secretKey, this.bitcoinJS.config.network)
  }
}
