// tslint:disable: max-classes-per-file
import { Domain, NetworkError } from '@airgap/coinlib-core'
import axios, { AxiosError } from '@airgap/coinlib-core/dependencies/src/axios-0.19.0'
import {
  AirGapNodeClient as AirGapEthereumNodeClient,
  EthereumRPCBody,
  EthereumRPCResponse,
} from '@airgap/ethereum/v1'

export class AirGapNodeClient extends AirGapEthereumNodeClient {
  constructor(baseURL: string) {
    super(baseURL)
  }

  async send(body: EthereumRPCBody): Promise<EthereumRPCResponse> {
    const response = await axios.post(this.baseURL, body.toRPCBody(), {
      headers: {
        'Content-type': 'application/json'
      }
    }).catch((error) => {
      throw new NetworkError(Domain.ROOTSTOCK, error as AxiosError)
    })

    return response.data
  }
}