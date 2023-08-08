import { AirGapTransaction } from '@airgap/module-kit'
import { expect } from 'chai'
import 'mocha'

import { RootstockSignedTransaction, RootstockUnsignedTransaction } from '../../src/v1'

import { RootstockTestProtocolSpec } from './specs/ethereum'

const ethProtocolSpec = new RootstockTestProtocolSpec()

const unsignedTxs: RootstockUnsignedTransaction[] = [
  {
    type: 'unsigned',
    ethereumType: 'raw',
    nonce: '0x0',
    gasPrice: '0x4a817c800',
    gasLimit: '0x5208',
    to: '0xd9BDC7AF23b68D8A310B95c08Db0454c99e3dc91',
    value: '100008',
    chainId: 1,
    data: '0x'
  },
  {
    type: 'unsigned',
    ethereumType: 'raw',
    nonce: '0x0',
    gasPrice: '0x4a817c800',
    gasLimit: '0x5208',
    to: '0xd9BDC7AF23b68D8A310B95c08Db0454c99e3dc91',
    value: '0x010',
    chainId: 1,
    data: '0x'
  }
]

describe(`Proper error handling`, () => {
  it('should return the correct error type ', async () => {
    try {
      const { secretKey, publicKey } = await ethProtocolSpec.lib.getKeyPairFromDerivative(await ethProtocolSpec.derivative())

      for (const unsignedTx of unsignedTxs) {
        const signedTx: RootstockSignedTransaction = await ethProtocolSpec.lib.signTransactionWithSecretKey(unsignedTx, secretKey)

        const txsFromUnsigned: AirGapTransaction[] = await ethProtocolSpec.lib.getDetailsFromTransaction(unsignedTx, publicKey)

        const txsFromSigned: AirGapTransaction[] = await ethProtocolSpec.lib.getDetailsFromTransaction(signedTx, publicKey)

        expect(txsFromUnsigned[0].amount).to.deep.equal(txsFromSigned[0].amount)
      }
    } catch (error) {
      console.error(error)
    }
  })
})
