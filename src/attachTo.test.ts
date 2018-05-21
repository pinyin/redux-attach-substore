import {createStore} from 'redux'
import {asContainer} from './asContainer'
import {attachTo} from './attachTo'
import {ContainerAction, SubstoreUpdated} from './ContainerAction'
import {Substores} from './ContainerState'

describe(`${attachTo.name}`, () => {
    const container = createStore(
        (state: any, action: ContainerAction) => { return {} },
        asContainer()
    )

    const asSubstore = attachTo(container)

    const idA = Symbol('a')
    const substore = createStore(
        (state: number | undefined, action: { type: 'increase' }) => { return (state || 0) + 1 },
        asSubstore(idA)
    )

    test(`container should have substore's initial states when substore attach`, () => {
        expect(substore.getState()).toBe(1)
        expect(container.getState()[Substores].get(idA)).toBe(1)
    })

    test(`container should have update with substores`, () => {
        substore.dispatch({type: 'increase'})
        expect(substore.getState()).toBe(2)
        expect(container.getState()[Substores].get(idA)).toBe(2)
    })

    test(`substore should change with container`, () => {
        container.dispatch({type: SubstoreUpdated, payload: {id: idA, action: {type: 'increase'}, newState: 18}})
        expect(container.getState()[Substores].get(idA)).toBe(18)
        expect(substore.getState()).toBe(18)
    })

})