import {existing, Maybe} from '@pinyin/maybe'
import {PAYLOAD, TYPE} from '@pinyin/redux'
import {nothing} from '@pinyin/types'
import {Action, DeepPartial, Reducer, Store, StoreEnhancer, StoreEnhancerStoreCreator} from 'redux'
import {Attacher} from './Attacher'
import {ContainerMetaAction, SubstoreAttached, SubstoreUpdated} from './ContainerMetaAction'
import {ContainerState, Substores} from './ContainerState'
import {Substore} from './Substore'
import {SubstoreID} from './SubstoreID'
import {ContainerSpecifiedState, isSubstoreAction, SubstoreMetaAction} from './SubstoreMetaAction'

export function attachTo(container: Store<ContainerState, ContainerMetaAction>): Attacher {
    return (id: SubstoreID): StoreEnhancer<Substore> => (
        next: StoreEnhancerStoreCreator,
    ) => <S, A extends Action>(
        reducer: Reducer<S, A>,
        preloadedState?: DeepPartial<S>,
    ): Store<S, A> & Substore => {
        const wrapReducer = (reducer: Reducer<S, A>): Reducer<S, A | SubstoreMetaAction> =>
            (state: S | undefined, action: A | SubstoreMetaAction): S => {
                if (isSubstoreAction(action)) {
                    if (action.type === ContainerSpecifiedState) {
                        return action[PAYLOAD]
                    }
                }
                return reducer(state, action as A)
            }
        const innerStore: Store<S, A | SubstoreMetaAction> = next(wrapReducer(reducer), preloadedState)
        const cachedState = container.getState()[Substores].get(id)
        if (existing(cachedState)) {
            innerStore.dispatch({[TYPE]: ContainerSpecifiedState, [PAYLOAD]: cachedState} as SubstoreMetaAction)
        } else {
            container.dispatch({[TYPE]: SubstoreAttached, [PAYLOAD]: {id: id, state: innerStore.getState()}})
        }

        let expectedState: Maybe<S> = nothing
        const unwatchContainer = container.subscribe(() => {
            const state = container.getState()[Substores].get(id)
            if (state !== expectedState) {
                innerStore.dispatch({[TYPE]: ContainerSpecifiedState, [PAYLOAD]: state} as SubstoreMetaAction)
            }
        })

        let attached: boolean = true
        const store: Store<S, A> & Substore = {
            ...innerStore as Store<S, A>,
            detach: () => {
                unwatchContainer()
                attached = false
            },
            dispatch: <T extends A>(action: T): T => {
                if (attached) {
                    const prevState = container.getState()[Substores].get(id)
                    expectedState = wrapReducer(reducer)(prevState, action)
                    if (prevState !== expectedState && !isSubstoreAction(action)) {
                        container.dispatch({
                            [TYPE]: SubstoreUpdated,
                            [PAYLOAD]: {id: id, action, newState: expectedState},
                        })
                        // used the synchronized nature of dispatch()
                        const stateInContainer = container.getState()[Substores].get(id)
                        if (stateInContainer === expectedState) {
                            innerStore.dispatch(action)
                        }
                    }
                } else {
                    innerStore.dispatch(action)
                }
                return action
            },
            replaceReducer: (reducer: Reducer<S, A>) => {
                innerStore.replaceReducer(wrapReducer(reducer))
            },
        }
        return store
    }
}
