import { createStore } from 'redux'
import { asContainer } from '../src/asContainer'
import { attachTo } from '../src/attachTo'
import {
  ContainerMetaAction,
  SubstoreCleaned,
  SubstoreUpdated,
} from '../src/ContainerMetaAction'
import { Substores } from '../src/ContainerState'

describe(`${asContainer.name}-${attachTo.name}`, () => {
  const container = createStore((state: any, action: ContainerMetaAction) => {
    return {}
  }, asContainer())

  const idA = 'a'
  const substore = createStore(
    (state: number | undefined, action: { type: 'increase' }) => {
      return (state || 0) + 1
    },
    attachTo(container)(idA),
  )

  test(`container should have substore's initial state when substore attaches`, () => {
    expect(substore.getState()).toBe(1)
    expect(container.getState()[Substores].get(idA)).toBe(1)
  })

  test(`container should update with substores`, () => {
    substore.dispatch({ type: 'increase' })
    expect(substore.getState()).toBe(2)
    expect(container.getState()[Substores].get(idA)).toBe(2)
  })

  test(`substore should change with container`, () => {
    container.dispatch({
      type: SubstoreUpdated,
      id: idA,
      action: { type: 'increase' },
      newState: 18,
    })
    expect(container.getState()[Substores].get(idA)).toBe(18)
    expect(substore.getState()).toBe(18)
  })

  test(`substore should no longer change with container after detached`, () => {
    substore.detach()
    container.dispatch({
      type: SubstoreUpdated,
      id: idA,
      action: { type: 'increase' },
      newState: 1,
    })
    expect(container.getState()[Substores].get(idA)).toBe(1)
    expect(substore.getState()).toBe(18)
  })

  test(`container should be able to clean substore cache`, () => {
    container.dispatch({ type: SubstoreCleaned, id: idA })
    expect(container.getState()[Substores].get(idA)).toBeUndefined()
  })
})
