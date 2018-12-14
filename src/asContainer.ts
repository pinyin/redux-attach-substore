import {
  Action,
  DeepPartial,
  Reducer,
  Store,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
} from 'redux'
import { Container } from './Container'
import {
  ContainerMetaAction,
  isContainerAction,
  SubstoreStateAttached,
  SubstoreStateCleaned,
  SubstoreStateUpdated,
} from './ContainerMetaAction'
import { ContainerState, Substores } from './ContainerState'
import { SubstoreID } from './SubstoreID'
import { isSubstoreAction } from './SubstoreMetaAction'

export function asContainer(): StoreEnhancer<Container, ContainerState> {
  return (
    inner: StoreEnhancerStoreCreator,
  ): StoreEnhancerStoreCreator<Container, ContainerState> => <
    S,
    A extends Action
  >(
    reducer: Reducer<S, A>,
    preloadedState?: DeepPartial<S>,
  ): Store<S & ContainerState, A> & Container => {
    const wrapReducer = (
      innerReducer: Reducer<S, A>,
    ): Reducer<S & ContainerState, A | ContainerMetaAction> => (
      state: (S & ContainerState) | undefined,
      action: A | ContainerMetaAction,
    ): S & ContainerState => {
      const prevState = state ? state[Substores] : null
      const innerState = innerReducer(state, action as A) // TODO
      let currState = innerState as S & ContainerState
      if (!currState[Substores]) {
        currState = Object.assign({}, innerState) as S & ContainerState
        currState[Substores] = prevState || new Map()
      }

      if (isContainerAction(action)) {
        const substores = new Map(currState[Substores])
        const id: SubstoreID = action.id
        switch (action.type) {
          case SubstoreStateAttached:
            if (substores.has(id)) {
              throw new Error(
                `Attempting to reattach substore with existing ID #${id.toString()}`,
              )
            }
            substores.set(id, action.state)
            currState = Object.assign({}, currState)
            currState[Substores] = substores
            break
          case SubstoreStateUpdated:
            if (
              !isSubstoreAction(action.action) &&
              substores.get(id) !== action.newState
            ) {
              action.newState
                ? substores.set(id, action.newState)
                : substores.delete(id)
              currState = Object.assign({}, currState)
              currState[Substores] = substores
            }
            break
          case SubstoreStateCleaned:
            if (!substores.has(id)) {
              throw new Error(
                `Attempting to clean on-existing substore #${id.toString()}`,
              )
            }
            substores.delete(id)
            currState = Object.assign({}, currState)
            currState[Substores] = substores
            break
        }
      }

      return currState
    }

    const innerStore: Store<
      S & ContainerState,
      A | ContainerMetaAction
    > = inner(
      wrapReducer(reducer), // FIXME
      preloadedState as DeepPartial<S & ContainerState>,
    )

    return {
      ...innerStore,
      replaceReducer: (reducer: Reducer<S & ContainerState, A>) =>
        innerStore.replaceReducer(wrapReducer(reducer as any)),
      dispatch: <T extends A>(action: T): T => {
        return innerStore.dispatch(action)
      },
      cleanUp: (substore: SubstoreID): void => {
        innerStore.dispatch({
          type: SubstoreStateCleaned,
          id: substore,
        } as ContainerMetaAction)
      },
    }
  }
}
