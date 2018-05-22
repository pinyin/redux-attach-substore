import {createStore} from 'redux'
import {asContainer} from './asContainer'
import {ContainerAction, SubstoreAttached, SubstoreCleaned, SubstoreUpdated} from './ContainerAction'
import {Substores} from './ContainerState'

describe(`${asContainer.name}`, () => {
    const store = createStore((state: {} | undefined, action: ContainerAction) => { return {} }, asContainer())

    test(`container store should have an empty map`, () => {
        expect(store.getState()[Substores]).toBeInstanceOf(Map)
    })

    const idA = Symbol('A')

    test(`container should have substore state when substore attach`, () => {
        store.dispatch({type: SubstoreAttached, payload: {id: idA, state: 'a'}})
        expect(store.getState()[Substores].get(idA)).toBe('a')
    })

    test(`container should delete corresponding state when substore is detached`, () => {
        store.dispatch({type: SubstoreCleaned, payload: {id: idA}})
        expect(store.getState()[Substores].get(idA)).toBeUndefined()
    })

    test(`container should update corresponding state when substore is updated`, () => {
        store.dispatch({type: SubstoreUpdated, payload: {id: idA, action: {type: 'a'}, newState: 'b'}})
        expect(store.getState()[Substores].get(idA)).toBe('b')
    })

})
