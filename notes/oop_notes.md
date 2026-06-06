# PyForge Reference Notes: Object-Oriented Programming (OOP)

Python's object model is highly dynamic, giving classes first-class lookup capabilities and exposing hooks to customize standard interpreter operations.

---

## 1. Class Instantiation Memory Lifecycle

When you create a class instance:
```python
wizard = Wizard("Gandalf")
```
Python performs two distinct steps under the hood:

### Step A: Memory Allocation (`__new__`)
First, Python calls the magic constructor method `__new__(cls, *args, **kwargs)`. 
- This is a static method responsible for allocating the raw memory block for the object on the Heap space.
- It returns the newly created, uninitialized instance object.

### Step B: State Initialization (`__init__`)
Next, Python invokes `__init__(self, *args, **kwargs)`.
- It passes the instance returned by `__new__` as the first argument, `self`.
- This method binds attributes (like `self.name = "Gandalf"`) to the instance's local `__dict__` namespace database.

---

## 2. Magic (Dunder) Methods Reference

Dunder methods (double-underscores) let your custom classes emulate built-in behaviors:

- **String Representation**:
  - `__str__(self)`: Human-readable output. Triggered by `print(obj)` and `str(obj)`.
  - `__repr__(self)`: Exact, developer-focused representation. Triggered by inspection or in lists.
- **Collection Emulation**:
  - `__len__(self)`: Returns integer length. Called when executing `len(obj)`.
  - `__getitem__(self, index)`: Allows list-like slicing index operations: `obj[index]`.
- **Mathematical Overloading**:
  - `__add__(self, other)`: Implements the `+` operator.
  - `__eq__(self, other)`: Implements the `==` comparisons.

---

## 3. Multiple Inheritance & Method Resolution Order (MRO)

Python supports multiple parent classes:
```python
class C(A, B):
    pass
```

### The Diamond Problem
If class `A` and `B` both implement the same method, which one does `C` inherit?
Python resolves this using the **Method Resolution Order (MRO)** sequence, calculated via the **C3 Linearization** algorithm.

### C3 Linearization Rules
1. Subclasses are checked before base parent classes.
2. If a class inherits from multiple parents, they are searched in the order listed in the class definition (left-to-right).
3. Class priority ordering remains consistent across the entire hierarchy.

You can inspect lookup sequences dynamically:
```python
print(C.__mro__)
# Output: (<class 'C'>, <class 'A'>, <class 'B'>, <class 'object'>)
```

---

## 4. Super Class Methods Calling (`super()`)

To call inherited methods from parent classes, always use `super()`:
```python
class Child(Parent):
    def __init__(self, name, age):
        super().__init__(name)  # Binds Parent parameters first
        self.age = age
```

### Why use `super()` instead of direct class name calls?
1. **Dynamic lookup**: `super()` uses the active MRO sequence. In multiple inheritance diamonds, this guarantees parent class constructor calls are not duplicated or missed.
2. **Maintenance**: Avoids hardcoding parent class names, making inheritance refactoring painless.
