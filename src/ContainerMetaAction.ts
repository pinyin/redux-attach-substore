import {Action} from '@pinyin/redux'
import {SubstoreID} from './SubstoreID'

export const SubstoreAttached = Symbol('SubstoreAttached')
export const SubstoreUpdated = Symbol('SubstoreUpdated')
export const SubstoreCleaned = Symbol('SubstoreCleaned')

export type ContainerMetaAction = Action<{
    [SubstoreAttached]: {
        id: SubstoreID
        state: any
    }
    [SubstoreUpdated]: {
        id: SubstoreID
        action: Action
        newState: any
    }
    [SubstoreCleaned]: {
        id: SubstoreID
    }
}>

export function isContainerAction(action: any): action is ContainerMetaAction {
    return action.type === SubstoreUpdated ||
        action.type === SubstoreAttached ||
        action.type === SubstoreCleaned
}
