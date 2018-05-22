import {assume, existing, notExisting} from '@pinyin/maybe'
import {Action} from '@pinyin/redux'
import {DeepPartial, Reducer, Store, StoreEnhancer, StoreEnhancerStoreCreator} from 'redux'
import {Container} from './Container'
import {ContainerAction, isContainerAction, SubstoreAttached, SubstoreCleaned, SubstoreUpdated} from './ContainerAction'
import {ContainerState, Substores} from './ContainerState'
import {isSubstoreAction} from './SubstoreAction'
import {SubstoreID} from './SubstoreID'

export function asContainer(): StoreEnhancer<Container, ContainerState> {
    return (
        inner: StoreEnhancerStoreCreator
    ): StoreEnhancerStoreCreator<Container, ContainerState> => <S, A extends Action>(
        reducer: Reducer<S, A>,
        preloadedState?: DeepPartial<S>
    ): Store<S & ContainerState, A> & Container => {
        const wrapReducer = (
            innerReducer: Reducer<S, A>
        ): Reducer<S & ContainerState, A | ContainerAction> => (
            state: (S & ContainerState) | undefined, action: A | ContainerAction
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
                const id: SubstoreID = action.payload.id
                switch (action.type) {
                    case SubstoreAttached:
                        if (substores.has(id)) {
                            throw new Error(`Attempting to reattach substore with existing ID #${id.toString()}`)
                        }
                        substores.set(id, action.payload.state)
                        currState = Object.assign({}, currState)
                        currState[Substores] = substores
                        break;
                    case SubstoreUpdated:
                        if (!isSubstoreAction(action.payload.action) &&
                            substores.get(id) !== action.payload.newState) {
                            existing(action.payload.newState) ?
                                substores.set(id, action.payload.newState) :
                                substores.delete(id)
                            currState = Object.assign({}, currState)
                            currState[Substores] = substores
                        }
                        break;
                    case SubstoreCleaned:
                        if (!substores.has(id)) {
                            throw new Error(`Attempting to clean on-existing substore #${id.toString()}`)
                        }
                        substores.delete(id)
                        currState = Object.assign({}, currState)
                        currState[Substores] = substores
                        break;
                }
            }

            return currState
        }

        const innerStore: Store<S & ContainerState, A | ContainerAction> = inner(
            wrapReducer(reducer), // FIXME
            preloadedState as DeepPartial<S & ContainerState>
        )

        return {
            ...innerStore,
            replaceReducer: (reducer: Reducer<S & ContainerState, A>) =>
                innerStore.replaceReducer(wrapReducer(reducer as Reducer<S, A>)),
            dispatch: <T extends A>(action: T): T => {
                return innerStore.dispatch(action)
            },
            cleanUp: (substore: SubstoreID): void => {
                innerStore.dispatch({type: SubstoreCleaned, payload: {id: substore}})
            }
        }
    }
}
