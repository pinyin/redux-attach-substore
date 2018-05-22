import {Action} from '@pinyin/redux'

export const ContainerSpecifiedState = Symbol('ContainerSpecifiedState')

export type SubstoreMetaAction = Action<{
    [ContainerSpecifiedState]: any
}>

export function isSubstoreAction(action: any): action is SubstoreMetaAction {
    return action.type === ContainerSpecifiedState
}
