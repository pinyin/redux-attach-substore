import {assume, existing, notExisting} from '@pinyin/maybe'
import {PAYLOAD, TYPE} from '@pinyin/redux'
import {Action, DeepPartial, Reducer, Store, StoreEnhancer, StoreEnhancerStoreCreator} from 'redux'
import {Container} from './Container'
import {
    ContainerMetaAction,
    isContainerAction,
    SubstoreAttached,
    SubstoreCleaned,
    SubstoreUpdated,
} from './ContainerMetaAction'
import {ContainerState, Substores} from './ContainerState'
import {SubstoreID} from './SubstoreID'
import {isSubstoreAction} from './SubstoreMetaAction'

export function asContainer(): StoreEnhancer<Container, ContainerState> {
    return (
        inner: StoreEnhancerStoreCreator,
    ): StoreEnhancerStoreCreator<Container, ContainerState> => <S, A extends Action>(
        reducer: Reducer<S, A>,
        preloadedState?: DeepPartial<S>,
    ): Store<S & ContainerState, A> & Container => {
        const wrapReducer = (
            innerReducer: Reducer<S, A>,
        ): Reducer<S & ContainerState, A | ContainerMetaAction> => (
            state: (S & ContainerState) | undefined, action: A | ContainerMetaAction,
        ): S & ContainerState => {
            const prevState = assume(state, it => it[Substores])
            const innerState = innerReducer(state, action as A) // TODO
            let currState = innerState as S & ContainerState
            if (notExisting(currState[Substores])) {
                currState = Object.assign({}, innerState) as S & ContainerState
                currState[Substores] = prevState || new Map()
            }

            if (isContainerAction(action)) {
                const substores = new Map(currState[Substores])
                const id: SubstoreID = action[PAYLOAD].id
                switch (action.type) {
                    case SubstoreAttached:
                        if (substores.has(id)) {
                            throw new Error(`Attempting to reattach substore with existing ID #${id.toString()}`)
                        }
                        substores.set(id, action[PAYLOAD].state)
                        currState = Object.assign({}, currState)
                        currState[Substores] = substores
                        break
                    case SubstoreUpdated:
                        if (!isSubstoreAction(action[PAYLOAD].action) &&
                            substores.get(id) !== action[PAYLOAD].newState) {
                            existing(action[PAYLOAD].newState) ?
                                substores.set(id, action[PAYLOAD].newState) :
                                substores.delete(id)
                            currState = Object.assign({}, currState)
                            currState[Substores] = substores
                        }
                        break
                    case SubstoreCleaned:
                        if (!substores.has(id)) {
                            throw new Error(`Attempting to clean on-existing substore #${id.toString()}`)
                        }
                        substores.delete(id)
                        currState = Object.assign({}, currState)
                        currState[Substores] = substores
                        break
                }
            }

            return currState
        }

        const innerStore: Store<S & ContainerState, A | ContainerMetaAction> = inner(
            wrapReducer(reducer), // FIXME
            preloadedState as DeepPartial<S & ContainerState>,
        )

        return {
            ...innerStore,
            replaceReducer: (reducer: Reducer<S & ContainerState, A>) =>
                innerStore.replaceReducer(wrapReducer(reducer as Reducer<S, A>)),
            dispatch: <T extends A>(action: T): T => {
                return innerStore.dispatch(action)
            },
            cleanUp: (substore: SubstoreID): void => {
                innerStore.dispatch({[TYPE]: SubstoreCleaned, [PAYLOAD]: {id: substore}} as ContainerMetaAction)
            },
        }
    }
}
