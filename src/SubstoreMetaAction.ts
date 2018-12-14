export const StateOverriddenByContainer = '@state-overridden-by-container'

export type SubstoreMetaAction = {
  type: typeof StateOverriddenByContainer
  payload: any
}
export function isSubstoreAction(action: any): action is SubstoreMetaAction {
  return action.type === StateOverriddenByContainer
}
