# redux-attach-substore
Multistore Redux.

## Usage

```typescript jsx
import {attachTo, asContainer, Substores} from './index'
import {createStore} from 'redux'

const container = createStore(()=> {return {}}, asContainer())


```

## TODO 

Detect cyclic substore relation.
