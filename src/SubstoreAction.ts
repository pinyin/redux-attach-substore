import {Action} from '@pinyin/redux'
import {SubstoreID} from './SubstoreID'

export const ContainerSpecifiedState = Symbol('ContainerSpecifiedState')

export type SubstoreAction = Action<{
    [ContainerSpecifiedState]: {
        id: SubstoreID
        state: any
    }
}>

export function isSubstoreAction(action: any): action is SubstoreAction {
    return action.type === ContainerSpecifiedState
}
