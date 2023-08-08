import { HttpEthereumNodeClient } from '@airgap/ethereum/v1'
import { RootstockNodeClient } from './RootstockNodeClient'

export class AirGapNodeClient extends HttpEthereumNodeClient implements RootstockNodeClient {
  constructor(baseURL: string) {
    super(baseURL, { 'Content-Type': 'application/json' })
  }
}
