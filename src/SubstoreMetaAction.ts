import {ActionFromMap} from '@pinyin/redux'

export const ContainerSpecifiedState = Symbol('ContainerSpecifiedState')

export type SubstoreMetaAction = ActionFromMap<{
    [ContainerSpecifiedState]: any
}>

export function isSubstoreAction(action: any): action is SubstoreMetaAction {
    return action.type === ContainerSpecifiedState
}
