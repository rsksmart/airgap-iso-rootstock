// tslint:disable: no-object-literal-type-assertion
import { AirGapTransactionStatus, Amount, ExtendedPublicKey, ExtendedSecretKey, PublicKey, SecretKey, Signature } from '@airgap/module-kit'

import {
  createRootstockProtocol,
  RootstockRawUnsignedTransaction,
  RootstockSignedTransaction,
  RootstockUnits,
  RootstockUnsignedTransaction
} from '../../../src/v1'
import { TestProtocolSpec } from '../implementations'
import { RootstockProtocolStub } from '../stubs/rootstock.stub'

export class RootstockTestProtocolSpec extends TestProtocolSpec {
  public name = 'Rootstock'
  public lib = createRootstockProtocol()
  public stub = new RootstockProtocolStub()
  public validAddresses = [
    '0x5e4e92788a7aE425100D869657aE91891af019BC',
    '0xEC7eF91eFB3737fc2749c0107fd428F6a878884c',
    '0xE8911B6Ad03Fc76A3248F1eA9babe85E5Cde086c',
    '0x14D8fB603edCb2d4038Aab0d0fa224E0c4D9c6f9',
    '0xF3f22E4740ade5DEB34bAff34c60d5FE33a8dA74',
    '0xcE25b34847A7Ac1d302cAf0633f74192A984118C',
    '0xD1279A75b8C106F4c478E8f63ffCa18d4b3D0A13',
    '0x967A77444DAE9e1Fa24FAb9D358ec32a69eb0684',
    '0x9f5B6fbFf7512c449cCF206Ac1cb3C2Aa5D71957',
    '0xEFC23d847a3297eFF70832429BDEc4986C3d8175'
  ]
  public wallet = {
    secretKey: {
      type: 'priv',
      format: 'hex',
      value: '0ffd0ff2c5a6ecb6d1a848e1e18dd3156d21bf75dada5514e477de400c505639'
    } as SecretKey,
    extendedSecretKey: {
      type: 'xpriv',
      format: 'encoded',
      value: 'xprv9zH4TjfVXFgeBALABGha6tGfWzxBYaumxmb5RZVoRyD48cv8ke45TNu4iAdD5pegE2p5K8hRjng8s2He1at5rgWLPZ8iqMHcVPc3miDLqxy'
    } as ExtendedSecretKey,
    publicKey: {
      type: 'pub',
      format: 'hex',
      value: '032186fc29fd3994dc888459725184d5dcf83b595a32c7ed504f326e4581a25e74'
    } as PublicKey,
    extendedPublicKey: {
      type: 'xpub',
      format: 'encoded',
      value: 'xpub6DGQsFCPMdEwPeQdHJEaU2DQ52nfx3ddKzWgDwuQzJk31RFHJBNL1BDYZTjShvwQWkTiC51mzoDYZC5rVyfc1p8zFvwVhsrJepS3KcjBz7U'
    } as ExtendedPublicKey,
    addresses: ['0xd9BDC7AF23b68D8A310B95c08Db0454c99e3dc91']
  }
  public txs = [
    {
      to: ['0xd9BDC7AF23b68D8A310B95c08Db0454c99e3dc91'],
      from: ['0xd9BDC7AF23b68D8A310B95c08Db0454c99e3dc91'],
      amount: {
        value: '1000000000000000000',
        unit: 'blockchain'
      } as Amount<RootstockUnits>,
      fee: {
        value: '420000000000000',
        unit: 'blockchain'
      } as Amount<RootstockUnits>,
      unsignedTx: {
        type: 'unsigned',
        ethereumType: 'raw',
        nonce: '0x0',
        gasPrice: '0x4a817c800',
        gasLimit: '0x5208',
        to: '0xd9BDC7AF23b68D8A310B95c08Db0454c99e3dc91',
        value: '0xde0b6b3a7640000',
        chainId: 30,
        data: '0x'
      } as RootstockUnsignedTransaction,
      signedTx: {
        type: 'signed',
        serialized:
          'f86c808504a817c80082520894d9bdc7af23b68d8a310b95c08db0454c99e3dc91880de0b6b3a76400008060a055497c91559538c37d9615529a24a221af3bf5b342d1db590f1fb84a75932c25a04348342643d0101f58db2a923a445a686606c4e2b2088429ffc04e9f526a3524'
      } as RootstockSignedTransaction
    }
  ]
  public transactionStatusTests: Record<string, AirGapTransactionStatus>[] = [
    {
      '0x20904cf629692c925a235e98ccf5b317c56bbc069c0941b9e45af2f35a5b612b': { type: 'applied' }
    },
    {
      '0x4a50a2d30b2ab022819ff6407ccfcfb3905406729fed82208e2d07ed92cedbe1': { type: 'failed' }
    },
    {
      '0x20904cf629692c925a235e98ccf5b317c56bbc069c0941b9e45af2f35a5b612b': { type: 'applied' },
      '0x4a50a2d30b2ab022819ff6407ccfcfb3905406729fed82208e2d07ed92cedbe1': { type: 'failed' }
    }
  ]
  public validRawTransactions: RootstockRawUnsignedTransaction[] = [
    {
      type: 'unsigned',
      ethereumType: 'raw',
      nonce: '0x0',
      gasPrice: '0x4a817c800',
      gasLimit: '0x5208',
      to: '0xd9BDC7AF23b68D8A310B95c08Db0454c99e3dc91',
      value: '0xde0b6b3a7640000',
      chainId: 30,
      data: '0x'
    }
  ]
  public invalidUnsignedTransactionValues: { property: string; testName: string; values: { value: any; expectedError: any }[] }[] = [
    {
      property: 'nonce',
      testName: 'Nonce',
      values: [
        { value: '0x', expectedError: undefined }, // TODO: Valid?
        { value: '', expectedError: [" can't be blank", ' is not hex string'] },
        { value: 0x0, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: 1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: -1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: undefined, expectedError: [" can't be blank", ' is not hex string'] },
        { value: null, expectedError: [" can't be blank", ' is not hex string'] }
      ]
    },
    {
      property: 'gasPrice',
      testName: 'Gas price',
      values: [
        { value: '0x', expectedError: undefined }, // TODO: Valid?
        { value: '', expectedError: [" can't be blank", ' is not hex string'] },
        { value: 0x0, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: 1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: -1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: undefined, expectedError: [" can't be blank", ' is not hex string'] },
        { value: null, expectedError: [" can't be blank", ' is not hex string'] }
      ]
    },
    {
      property: 'gasLimit',
      testName: 'Gas limit',
      values: [
        { value: '0x', expectedError: undefined }, // TODO: Valid?
        { value: '', expectedError: [" can't be blank", ' is not hex string'] },
        { value: 0x0, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: 1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: -1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: undefined, expectedError: [" can't be blank", ' is not hex string'] },
        { value: null, expectedError: [" can't be blank", ' is not hex string'] }
      ]
    },
    {
      property: 'to',
      testName: 'To',
      values: [
        { value: '0x', expectedError: [' is not a valid ethereum address'] }, // TODO: Valid?
        { value: '', expectedError: [" can't be blank", ' is not hex string', ' is not a valid ethereum address'] },
        { value: 0x0, expectedError: [' is not of type "String"', ' is not hex string', ' is not a valid ethereum address'] },
        { value: 1, expectedError: [' is not of type "String"', ' is not hex string', ' is not a valid ethereum address'] },
        { value: -1, expectedError: [' is not of type "String"', ' is not hex string', ' is not a valid ethereum address'] },
        { value: undefined, expectedError: [" can't be blank", ' is not hex string'] },
        { value: null, expectedError: [" can't be blank", ' is not hex string'] }
      ]
    },
    {
      property: 'value',
      testName: 'Value',
      values: [
        { value: '0x', expectedError: undefined }, // TODO: Valid?
        { value: '', expectedError: [" can't be blank", ' is not hex string'] },
        { value: 0x0, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: 1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: -1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: undefined, expectedError: [" can't be blank", ' is not hex string'] },
        { value: null, expectedError: [" can't be blank", ' is not hex string'] }
      ]
    },
    {
      property: 'chainId',
      testName: 'Chain id',
      values: [
        { value: '0x', expectedError: [' is not a number'] }, // TODO: Valid?
        { value: '', expectedError: [" can't be blank", ' is not a number'] },
        { value: 0x0, expectedError: undefined },
        { value: 30, expectedError: undefined },
        { value: -1, expectedError: [' must be greater than or equal to 0'] },
        { value: undefined, expectedError: [" can't be blank"] },
        { value: null, expectedError: [" can't be blank"] }
      ]
    },
    {
      property: 'data',
      testName: 'Data',
      values: [
        { value: '0x', expectedError: undefined }, // TODO: Valid?
        { value: '', expectedError: [" can't be blank", ' is not hex string'] },
        { value: 0x0, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: 1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: -1, expectedError: [' is not of type "String"', ' is not hex string'] },
        { value: undefined, expectedError: [" can't be blank", ' is not hex string'] },
        { value: null, expectedError: [" can't be blank", ' is not hex string'] }
      ]
    }
  ]

  public invalidSignedTransactionValues: { property: string; testName: string; values: { value: any; expectedError: any }[] }[] = [
    {
      property: 'transaction',
      testName: 'Transaction',
      values: [
        { value: '0x', expectedError: [' not a valid Ethereum transaction'] }, // TODO: Valid?
        { value: '', expectedError: [" can't be blank", ' not a valid Ethereum transaction'] },
        { value: 0x0, expectedError: [' is not of type "String"', ' not a valid Ethereum transaction'] },
        { value: 1, expectedError: [' is not of type "String"', ' not a valid Ethereum transaction'] },
        { value: -1, expectedError: [' is not of type "String"', ' not a valid Ethereum transaction'] },
        { value: undefined, expectedError: [" can't be blank", ' not a valid Ethereum transaction'] },
        { value: null, expectedError: [" can't be blank", ' not a valid Ethereum transaction'] }
      ]
    }
  ]

  public validSignedTransactions: RootstockSignedTransaction[] = [
    {
      type: 'signed',
      serialized:
        'f86c808504a817c80082520894d9bdc7af23b68d8a310b95c08db0454c99e3dc91880de0b6b3a76400008060a055497c91559538c37d9615529a24a221af3bf5b342d1db590f1fb84a75932c25a04348342643d0101f58db2a923a445a686606c4e2b2088429ffc04e9f526a3524'
    }
  ]

  public messages = [
    {
      message: 'example message',
      signature: {
        value:
          '0xd7d281336cbf6f76f59f4b9ed8ebb8abda51ef8d9d6746756a3deefe0463d4831d9720220da9943486d2086cb6ee18c511d985029c5b37ca4ad4aeeaef625c8601',
        format: 'hex'
      } as Signature
    }
  ]

  public encryptAsymmetric = [
    {
      message: 'example message',
      encrypted:
        '04d58a595cdafca8d8f851133f455772f9337df7db1ad7a7eedee8b75747a9eb329f9b1f6346c357de9a0f578f56a9ae41686a5b3009b66dfaa73dad176eabc02c18c1ff5e8c61484e8ed4efadbc7b24b4570c9cce1b92746c394a94336e7561b0c2c619bc503ec2570d4ce3c6ebf1d6'
    }
  ]

  public encryptAES = [
    {
      message: 'example message',
      encrypted: 'd8095bfadb15055c73d62186231134ed!61f3b3eacfc13306522601331dc36c!7fd9b429addecf7e2af317c7eeef1b2f'
    }
  ]
}
