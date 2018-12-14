import { SubstoreID } from './SubstoreID'

export type Container = {
  cleanUp: (substore: SubstoreID) => void
}
