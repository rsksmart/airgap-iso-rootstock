import { AirGapModule } from '@airgap/module-kit'
import { RootstockModule } from './module/RootstockModule'

export * from './index'

export function create(): AirGapModule {
  return new RootstockModule()
}
