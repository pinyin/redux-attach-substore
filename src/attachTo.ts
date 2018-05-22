import {Maybe} from '@pinyin/maybe'
import {Action} from '@pinyin/redux'
import {nothing} from '@pinyin/types'
import {DeepPartial, Reducer, Store, StoreEnhancer, StoreEnhancerStoreCreator} from 'redux'
import {ContainerAction, SubstoreAttached, SubstoreUpdated} from './ContainerAction'
import {ContainerState, Substores} from './ContainerState'
import {Substore} from './Substore';
import {ContainerSpecifiedState, isSubstoreAction} from './SubstoreAction'
import {SubstoreID} from './SubstoreID'

export function attachTo(container: Store<ContainerState, ContainerAction>): (as: SubstoreID) => StoreEnhancer<Substore> {
    return (id: SubstoreID): StoreEnhancer<Substore> => (
        next: StoreEnhancerStoreCreator
    ) => <S, A extends Action>(
        reducer: Reducer<S, A>,
        preloadedState?: DeepPartial<S>
    ): Store<S, A> & Substore => {
        const wrapReducer = (reducer: Reducer<S, A>) => {
            const wrappedReducer: Reducer<S, A> = (state: S | undefined, action: A): S => {
                if (isSubstoreAction(action)) {
                    if (action.type === ContainerSpecifiedState) {
                        return action.payload
                    }
                }

                return reducer(state, action)
            }
            return wrappedReducer
        }
        const innerStore: Store<S, A> = next(wrapReducer(reducer), preloadedState)
        container.dispatch({type: SubstoreAttached, payload: {id: id, state: innerStore.getState()}})

        let expectedState: Maybe<S> = nothing
        const unwatchContainer = container.subscribe(() => {
            const state = container.getState()[Substores].get(id)
            if (state !== expectedState) {
                innerStore.dispatch({type: ContainerSpecifiedState, payload: state} as any)
            }
        })

        let attached: boolean = true
        return {
            ...innerStore,
            detach: () => {
                unwatchContainer()
                attached = false
            },
            dispatch: <T extends A>(action: T): T => {
                if (attached) {
                    const prevState = container.getState()[Substores].get(id)
                    expectedState = reducer(prevState, action)
                    container.dispatch({
                        type: SubstoreUpdated,
                        payload: {id: id, action, newState: expectedState}
                    })
                    // TODO used the synchronized nature of dispatch()
                    const currState = container.getState()[Substores].get(id)
                    if (currState === expectedState) {
                        innerStore.dispatch(action)
                    }
                } else {
                    innerStore.dispatch(action)
                }
                return action
            },
            replaceReducer: (reducer: Reducer<S, A>) => {
                innerStore.replaceReducer(wrapReducer(reducer))
            }
        }
    }
}
