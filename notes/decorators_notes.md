# PyForge Reference Notes: Decorators & Closures

Decorators are one of Python's most powerful metaprogramming features, allowing developers to cleanly modify or extend function behaviors without changing their source code.

---

## 1. Under the Hood: Closures

To understand decorators, you must first master **Closures**. A closure is a nested function that retains reference bindings to names in its enclosing lexical scope, even after the outer function has completed execution.

```python
def make_multiplier(factor):
    def multiplier(number):
        return number * factor  # Retains binding to 'factor'
    return multiplier

double = make_multiplier(2)
print(double(5))  # Output: 10
```
When `make_multiplier(2)` completes, its local stack frame is destroyed. However, the inner `multiplier` function object holds a reference to the environment binding containing `factor = 2` inside its `__closure__` attribute.

---

## 2. Decorator Mechanics

A decorator is simply a function that takes a target function as an argument, wraps it inside a closure to extend its behavior, and returns the wrapper.

Writing:
```python
@my_decorator
def core_func():
    pass
```
Is compilation shorthand (syntactic sugar) for:
```python
core_func = my_decorator(core_func)
```

---

## 3. Forwarding Parameters using `*args` and `**kwargs`

To write a generic decorator that can wrap *any* function regardless of signature parameters, use `*args` (positional arguments tuple) and `**kwargs` (keyword arguments dictionary) forwarding:

```python
def logger(func):
    def wrapper(*args, **kwargs):
        print(f"Calling: {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Completed: {func.__name__} -> {result}")
        return result
    return wrapper
```

---

## 4. Preserving Function Identity (`functools.wraps`)

When you decorate a function, the original target name is bound to the wrapper closure. This breaks docstring lookups and name reflections:

```python
@logger
def add(a, b):
    """Adds two integers."""
    return a + b

print(add.__name__)  # Output: 'wrapper' (NOT 'add'!)
print(add.__doc__)   # Output: None
```

### The Solution: `functools.wraps`
Always import and apply the `@wraps` decorator to your inner wrapper functions. This copies metadata (name, docstrings, annotations) from the target function onto the wrapper:

```from functools import wraps

def logger(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```
With `@wraps`, reflection lookups for name and docstrings behave normally.
