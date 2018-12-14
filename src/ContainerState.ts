import { SubstoreID } from './SubstoreID'

export const Substores = Symbol('Substores')

export interface ContainerState {
  [Substores]: Map<SubstoreID, any>
}
