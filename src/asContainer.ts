import {assume, existing, notExisting} from '@pinyin/maybe'
import {Action} from '@pinyin/redux'
import {DeepPartial, Reducer, Store, StoreEnhancer, StoreEnhancerStoreCreator} from 'redux'
import {isContainerAction, SubstoreAttached, SubstoreDetached, SubstoreUpdated} from './ContainerAction'
import {ContainerState, Substores} from './ContainerState'
import {isSubstoreAction} from './SubstoreAction'
import {SubstoreID} from './SubstoreID'

export function asContainer(): StoreEnhancer<{}, ContainerState> {
    return (
        inner: StoreEnhancerStoreCreator
    ): StoreEnhancerStoreCreator<{}, ContainerState> => <S, A extends Action>(
        reducer: Reducer<S, A>,
        preloadedState?: DeepPartial<S>
    ): Store<S & ContainerState, A> => {
        const wrapReducer = (
            innerReducer: Reducer<S & ContainerState, A>
        ): Reducer<S & ContainerState, A> => (
            state: (S & ContainerState) | undefined, action: A
        ): S & ContainerState => {
            const prevState = assume(state, it => it[Substores])
            const innerState = innerReducer(state, action)
            let currState = innerState as S & ContainerState
            if (notExisting(currState[Substores])) {
                currState = Object.assign({}, innerState)
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
                    case SubstoreDetached:
                        if (!substores.has(id)) {
                            throw new Error(`Attempting to detach non-existing substore #${id.toString()}`)
                        }
                        substores.delete(id)
                        currState = Object.assign({}, currState)
                        currState[Substores] = substores
                        break;
                }
            }

            return currState
        }

        const innerStore = inner(
            wrapReducer(reducer as Reducer<S & ContainerState, A>), // FIXME
            preloadedState as DeepPartial<S & ContainerState>
        )

        return {
            ...innerStore,
            replaceReducer: (reducer: Reducer<S & ContainerState, A>) =>
                innerStore.replaceReducer(wrapReducer(reducer)),
            dispatch: <T extends A>(action: T): T => {
                return innerStore.dispatch(action)
            }
        }
    }
}
