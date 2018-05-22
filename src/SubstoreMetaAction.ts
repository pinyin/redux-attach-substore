import {Action} from '@pinyin/redux'
import {SubstoreID} from './SubstoreID'

export const ContainerSpecifiedState = Symbol('ContainerSpecifiedState')

export type SubstoreMetaAction = Action<{
    [ContainerSpecifiedState]: {
        id: SubstoreID
        state: any
    }
}>

export function isSubstoreAction(action: any): action is SubstoreMetaAction {
    return action.type === ContainerSpecifiedState
}
