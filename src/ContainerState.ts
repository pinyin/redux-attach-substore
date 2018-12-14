import { SubstoreID } from './SubstoreID'

export const Substores = '@substores'

export interface ContainerState {
  [Substores]: Map<SubstoreID, any>
}
