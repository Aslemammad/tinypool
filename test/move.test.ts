import { Tinypool, isMovable, markMovable, isTransferable } from 'tinypool'
import { types } from 'node:util'
import { MessageChannel, MessagePort } from 'node:worker_threads'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const transferableSymbol = Tinypool.transferableSymbol as never
const valueSymbol = Tinypool.valueSymbol as never

test('Marking an object as movable works as expected', async () => {
  const obj: any = {
    get [transferableSymbol](): object {
      return {}
    },
    get [valueSymbol](): object {
      return {}
    },
  }
  expect(isTransferable(obj)).toBe(true)
  expect(!isMovable(obj)).toBe(true) // It's not movable initially
  markMovable(obj)
  expect(isMovable(obj)).toBe(true) // It is movable now
})

test('Marking primitives and null works as expected', async () => {
  expect(Tinypool.move(null!)).toBe(null)
  expect(Tinypool.move(1 as any)).toBe(1)
  expect(Tinypool.move(false as any)).toBe(false)
  expect(Tinypool.move('test' as any)).toBe('test')
})

test('Using Tinypool.move() returns a movable object', async () => {
  const obj: any = {
    get [transferableSymbol](): object {
      return {}
    },
    get [valueSymbol](): object {
      return {}
    },
  }
  expect(!isMovable(obj)).toBe(true) // It's not movable initially
  const movable = Tinypool.move(obj)
  expect(isMovable(movable)).toBe(true) // It is movable now
})

test('Using ArrayBuffer works as expected', async () => {
  const ab = new ArrayBuffer(5)
  const movable = Tinypool.move(ab)
  expect(isMovable(movable)).toBe(true)
  expect(types.isAnyArrayBuffer(movable[valueSymbol])).toBe(true)
  expect(types.isAnyArrayBuffer(movable[transferableSymbol])).toBe(true)
  expect(movable[transferableSymbol]).toEqual(ab)
})

test('Using TypedArray works as expected', async () => {
  const ab = new Uint8Array(5)
  const movable = Tinypool.move(ab)
  expect(isMovable(movable)).toBe(true)
  expect(types.isArrayBufferView(movable[valueSymbol])).toBe(true)
  expect(types.isAnyArrayBuffer(movable[transferableSymbol])).toBe(true)
  expect(movable[transferableSymbol]).toEqual(ab.buffer)
})

test('Using MessagePort works as expected', async () => {
  const mc = new MessageChannel()
  const movable = Tinypool.move(mc.port1)
  expect(isMovable(movable)).toBe(true)
  expect((movable[valueSymbol] as unknown) instanceof MessagePort).toBe(true)
  expect((movable[transferableSymbol] as unknown) instanceof MessagePort).toBe(
    true
  )
  expect(movable[transferableSymbol]).toEqual(mc.port1)
})

test('Moving works', async () => {
  const pool = new Tinypool({
    filename: resolve(__dirname, 'fixtures/move.js'),
  })

  {
    const ab = new ArrayBuffer(10)
    const ret = await pool.run(Tinypool.move(ab))
    expect(ab.byteLength).toBe(0) // It was moved
    expect(types.isAnyArrayBuffer(ret)).toBe(true)
  }

  {
    // Test with empty transferList
    const ab = new ArrayBuffer(10)
    const ret = await pool.run(Tinypool.move(ab), { transferList: [] })
    expect(ab.byteLength).toBe(0) // It was moved
    expect(types.isAnyArrayBuffer(ret)).toBe(true)
  }

  {
    // Test with empty transferList
    const ab = new ArrayBuffer(10)
    const ret = await pool.run(Tinypool.move(ab))
    expect(ab.byteLength).toBe(0) // It was moved
    expect(types.isAnyArrayBuffer(ret)).toBe(true)
  }

  {
    // Test with empty transferList
    const ab = new ArrayBuffer(10)
    const ret = await pool.run(Tinypool.move(ab), { transferList: [] })
    expect(ab.byteLength).toBe(0) // It was moved
    expect(types.isAnyArrayBuffer(ret)).toBe(true)
  }
})
