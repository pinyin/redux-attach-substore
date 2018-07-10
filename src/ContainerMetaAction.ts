import {ActionFromMap, PAYLOAD, TYPE} from '@pinyin/redux'
import {Action} from 'redux'
import {SubstoreID} from './SubstoreID'

export const SubstoreAttached = Symbol('SubstoreAttached')
export const SubstoreUpdated = Symbol('SubstoreUpdated')
export const SubstoreCleaned = Symbol('SubstoreCleaned')

export type ContainerMetaAction = ActionFromMap<{
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

let a: ContainerMetaAction = {[TYPE]: SubstoreCleaned, [PAYLOAD]: {id: ''}}

export function isContainerAction(action: any): action is ContainerMetaAction {
    return action.type === SubstoreUpdated ||
        action.type === SubstoreAttached ||
        action.type === SubstoreCleaned
}
