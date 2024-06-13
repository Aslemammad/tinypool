// Set the index-th bith in i32array[0], then wait for it to be un-set again.
export default function ({ i32array, index }) {
  Atomics.or(i32array, 0, 1 << index)
  Atomics.notify(i32array, 0, Infinity)
  do {
    const v = Atomics.load(i32array, 0)
    if (!(v & (1 << index))) break
    Atomics.wait(i32array, 0, v)
  } while (true) // eslint-disable-line no-constant-condition -- intentional
}
