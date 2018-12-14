export const ContainerSpecifiedState = Symbol('ContainerSpecifiedState')

export type SubstoreMetaAction = {
  type: typeof ContainerSpecifiedState
  payload: any
}
export function isSubstoreAction(action: any): action is SubstoreMetaAction {
  return action.type === ContainerSpecifiedState
}
