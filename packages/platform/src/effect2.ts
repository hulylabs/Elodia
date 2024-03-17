//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

export interface Effect<V> {
  then(success: (value: V) => void, failure?: (effect: Effect<V>) => void): void
}

type Code<V> = AsyncGenerator<Effect<V>, V>

class EffectImpl<V> implements Effect<V>, AsyncIterator<any, V> {
  constructor(private readonly code: Code<V>) {}

  async execute(): Promise<V> {
    while (true) {
      const i = await this.code.next()
      console.log('i:', i)
      if (i.done) return i.value
    }
  }

  async next(): Promise<IteratorResult<any, V>> {
    return this.code.next()
  }

  [Symbol.asyncIterator]() {
    return this
  }

  then(success: (value: V) => void, _?: (effect: Effect<V>) => void): void {
    this.execute().then(success)
  }
}

const effect = <V,>(code: () => Code<V>): EffectImpl<V> => new EffectImpl<V>(code())

const success = <V,>(value: V): EffectImpl<V> =>
  effect(async function* () {
    return value
  })

export const Effects2 = {
  effect,
  success,
}
