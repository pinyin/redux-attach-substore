import { StoreEnhancer } from 'redux'
import { Substore } from './Substore'
import { SubstoreID } from './SubstoreID'

export type Attacher = (as: SubstoreID) => StoreEnhancer<Substore>
