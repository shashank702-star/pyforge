# PyForge Reference Notes: Core Data Structures

Python is equipped with a rich set of built-in data collections. Knowing when to use which structure determines your program's memory footprint and operational complexity.

---

## 1. Lists (Ordered, Mutable Arrays)

Python lists are **dynamic arrays** containing pointer references to other objects. 

- **Memory Profile**: When a list grows, Python overallocates memory slot arrays in the heap to avoid resizing operations on every append (allocating roughly ~1.12x slots than active items).
- **Time Complexities**:
  - `append()` / `pop()`: $O(1)$ amortized.
  - `insert(0, val)` / `pop(0)`: $O(N)$ (requires shifting all reference cells in memory).
  - Index lookup `list[i]`: $O(1)$ (computes memory offset).
  - Search `item in list`: $O(N)$ (linear search scans).

---

## 2. Tuples (Ordered, Immutable Sequences)

Tuples look similar to lists but are strictly **immutable**.

- **Memory Profile**: Because they are fixed size, tuples do not allocate overallocated slots, resulting in smaller memory sizes compared to lists.
- **Optimization (Sticking)**: Small tuples are cached by the Python compiler. Re-creating identical tuples can bind to existing cached objects rather than spawning new memory nodes.
- **When to use**: Data payloads that must not mutate (e.g. database rows, keys for dictionaries).

---

## 3. Dictionaries (Unordered Key-Value Maps)

Python dictionaries are **Hash Maps** implemented using open addressing collision resolution.

- **Hashability**: Only objects that are **immutable** and implement a stable `__hash__` method can be used as keys. Tuples containing mutable lists cannot be keys.
- **Ordered preservation**: Since Python 3.7, dictionaries preserve insertion order by storing keys inside a dense index array and values in a separate hash table array.
- **Time Complexities**:
  - Key lookup `dict[key]`: $O(1)$ average (computes hash to index).
  - Insert / Delete: $O(1)$ average.
  - Search `key in dict`: $O(1)$.

---

## 4. Sets (Unordered Collections of Unique Items)

Sets are essentially hash maps without value entries.

- **Uniqueness**: Set elements must be hashable. Attempting to add duplicates yields no operations.
- **Performance**: Extremely fast lookup speeds. Use sets to deduplicate list arrays or perform intersection/union calculations.
- **Time Complexities**:
  - Add / Remove / Lookup: $O(1)$.

---

## Data Structure Summary Table

| Structure | Syntax | Ordering | Mutability | Duplicates | Key Time Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **List** | `[a, b, c]` | Ordered | Mutable | Yes | Index lookup: $O(1)$, Search: $O(N)$ |
| **Tuple** | `(a, b, c)` | Ordered | Immutable | Yes | Index lookup: $O(1)$, Search: $O(N)$ |
| **Dict** | `{"k": "v"}` | Insertion-Order | Mutable | No Keys | Key Lookup: $O(1)$ average |
| **Set** | `{a, b, c}` | Unordered | Mutable | No | Member Search: $O(1)$ |
