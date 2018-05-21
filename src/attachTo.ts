import {Maybe} from '@pinyin/maybe'
import {Action} from '@pinyin/redux'
import {nothing} from '@pinyin/types'
import {DeepPartial, Reducer, Store, StoreEnhancer, StoreEnhancerStoreCreator} from 'redux'
import {ContainerAction, SubstoreAttached, SubstoreDetached, SubstoreUpdated} from './ContainerAction'
import {ContainerState, Substores} from './ContainerState'
import {Substore} from './Substore'
import {ContainerSpecifiedState, isSubstoreAction} from './SubstoreAction'
import {SubstoreID} from './SubstoreID'

export function attachTo(container: Store<ContainerState, ContainerAction>): (as: SubstoreID) => StoreEnhancer<Substore> {
    return (id: SubstoreID): StoreEnhancer<Substore> => (
        next: StoreEnhancerStoreCreator
    ) => <S, A extends Action>(
        reducer: Reducer<S, A>,
        preloadedState?: DeepPartial<S>
    ) => {
        let detached: boolean = false
        let expectedState: Maybe<S> = nothing

        const wrappedReducer: Reducer<S, A> = (state: S | undefined, action: A): S => {
            if (detached) {
                return reducer(state, action)
            }

            if (isSubstoreAction(action)) {
                if (action.type === ContainerSpecifiedState) {
                    return action.payload
                }
            }

            return reducer(state, action)
        }
        const innerStore: Store<S, A> = next(wrappedReducer, preloadedState)
        container.dispatch({type: SubstoreAttached, payload: {id: id, state: innerStore.getState()}})

        const unwatchContainer = container.subscribe(() => {
            const state = container.getState()[Substores].get(id)
            if (state !== expectedState) {
                innerStore.dispatch({type: ContainerSpecifiedState, payload: state} as any)
            }
        })

        return {
            ...innerStore,
            detach: () => {
                unwatchContainer()
                detached = true
                container.dispatch({type: SubstoreDetached, payload: {id: id}})
            },
            dispatch: <T extends A>(action: T): T => {
                const prevState = container.getState()[Substores].get(id)
                expectedState = reducer(prevState, action)
                container.dispatch({
                    type: SubstoreUpdated,
                    payload: {id: id, action, newState: expectedState}
                })
                // TODO
                const currState = container.getState()[Substores].get(id)
                if (currState === expectedState) {
                    innerStore.dispatch(action)
                }
                return action
            }
        }
    }
}
