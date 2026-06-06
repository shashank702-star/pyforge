# PyForge Reference Notes: Variables & Reference Models

In Python, understanding how variables bind to data is crucial for writing bug-free, efficient code. Python behaves fundamentally differently from lower-level languages like C/C++ or Java regarding variable allocation.

---

## 1. The Label Binding Model

Unlike languages where a variable is a "box" in memory holding a fixed datatype value, **Python variables are name tags or bindings pointing to objects**.

When you write:
```python
x = 100
```
Python executes the following steps:
1. It creates an integer object `100` on the **Heap** memory.
2. It registers the name identifier `x` in the active **Stack Namespace** (or local frame dictionary).
3. It stores the memory address of the integer `100` in the namespace mapping for `x`.

---

## 2. Stack Memory vs Heap Memory

Memory in the Python runtime is split into two primary regions:

| Region | Contents | Mutability | Lifecycle |
| :--- | :--- | :--- | :--- |
| **Stack Namespace** | Variable identifier strings, local parameters, return instruction pointers. | Mutable (mappings updated constantly) | Pushed and popped automatically with scope frame lifetimes. |
| **Heap Memory** | Actual object instances: Integers, lists, dictionaries, strings, custom class instances. | Depends on object type (Lists are mutable, Strings are immutable) | Governed by reference counts and Garbage Collection (GC). |

---

## 3. Shared References & Mutation Gotchas

When you assign a variable to another:
```python
a = [10, 20]
b = a
```
No copy of the list is created. Both `a` and `b` hold the same reference pointer pointing to the single list object `#2490` on the heap.

### The Mutation Problem
If you modify the object through one of the name tags:
```python
a.append(30)
print(b)  # Output: [10, 20, 30]
```
Because `b` resolves to the same reference address `#2490`, it reflects the modified array immediately.

### Overcoming Shared Mutation
To duplicate the collection rather than the reference, perform an explicit shallow copy:
```python
# Option A: Slicing (lists only)
b = a[:]

# Option B: Factory method
b = list(a)

# Option C: Copy module (preferred for dicts/generic collections)
import copy
b = copy.copy(a)
```
For nested collections (e.g. lists containing dictionaries), use `copy.deepcopy(a)` to ensure nested objects are cloned recursively.

---

## 4. The Mutable Default Argument Bug

One of Python's most famous gotchas is using a mutable object as a default function argument:

```python
def add_member(name, member_list=[]):
    member_list.append(name)
    return member_list

print(add_member("Alice"))  # Output: ['Alice']
print(add_member("Bob"))    # Output: ['Alice', 'Bob']  <-- BUG!
```

### Why this happens
Default argument expressions are evaluated **once**, when the function is defined, NOT when the function is called. Python compiles the list `[]` and binds it to the function object's `__defaults__` tuple. Every function call without an explicit list parameter will write directly to that single, shared list.

### The Correct Pattern
Use `None` as the default placeholder and initialize the list inside the function body:
```python
def add_member(name, member_list=None):
    if member_list is None:
        member_list = []
    member_list.append(name)
    return member_list
```
This guarantees a new, fresh list object is allocated on the heap during every function invocation.
