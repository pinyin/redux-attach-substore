import { Action } from 'redux'
import { SubstoreID } from './SubstoreID'

export const SubstoreAttached = Symbol('SubstoreAttached')
export const SubstoreUpdated = Symbol('SubstoreUpdated')
export const SubstoreCleaned = Symbol('SubstoreCleaned')

export type ContainerMetaAction =
  | { type: typeof SubstoreAttached; id: SubstoreID; state: any }
  | {
      type: typeof SubstoreUpdated
      id: SubstoreID
      action: Action
      newState: any
    }
  | { type: typeof SubstoreCleaned; id: SubstoreID }
let a: ContainerMetaAction = { type: SubstoreCleaned, id: '' }

export function isContainerAction(action: any): action is ContainerMetaAction {
  return (
    action.type === SubstoreUpdated ||
    action.type === SubstoreAttached ||
    action.type === SubstoreCleaned
  )
}
