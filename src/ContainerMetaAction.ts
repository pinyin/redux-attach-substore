import { Action } from 'redux'
import { SubstoreID } from './SubstoreID'

export const SubstoreStateAttached = '@substore-state-attached'
export const SubstoreStateUpdated = '@substore-state-updated'
export const SubstoreStateCleaned = '@substore-state-cleaned'

export type ContainerMetaAction =
  | { type: typeof SubstoreStateAttached; id: SubstoreID; state: any }
  | {
      type: typeof SubstoreStateUpdated
      id: SubstoreID
      action: Action
      newState: any
    }
  | { type: typeof SubstoreStateCleaned; id: SubstoreID }
let a: ContainerMetaAction = { type: SubstoreStateCleaned, id: '' }

export function isContainerAction(action: any): action is ContainerMetaAction {
  return (
    action.type === SubstoreStateUpdated ||
    action.type === SubstoreStateAttached ||
    action.type === SubstoreStateCleaned
  )
}
