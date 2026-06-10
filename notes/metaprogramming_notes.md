# Metaprogramming and Metaclasses in Python

Explore metaprogramming—writing code that manipulates, generates, or validates other code at runtime.

## What is Metaprogramming?

In Python, classes themselves are objects. A class defines how its instances behave, but a **metaclass** defines how classes behave. Metaprogramming lets you intercept class creation to enforce standards, modify behavior, or register elements dynamically.

## Magic Methods (Dunder Methods)

Magic methods begin and end with double underscores (`__`). They define internal object operations:
- `__new__(cls, ...)`: Allocates memory for a new object (called before `__init__`).
- `__init__(self, ...)`: Initializes the object state.
- `__call__(self, ...)`: Allows an object instance to be called like a function (e.g., `obj()`).
- `__getattr__(self, name)`: Intercepts lookups for missing attributes.

```python
class CallableObject:
    def __init__(self, name):
        self.name = name
    def __call__(self, x):
        return f"{self.name} received: {x}"

helper = CallableObject("Logger")
print(helper(50))  # Output: Logger received: 50
```

## Python Metaclasses (`type`)

By default, all classes in Python are instances of the base metaclass `type`. You can inherit from `type` to construct a custom metaclass, overriding `__new__` to validate class declarations.

```python
# 1. Custom Metaclass
class EnforcePascalCaseMeta(type):
    def __new__(cls, name, bases, dct):
        # Enforce that class name starts with uppercase
        if not name[0].isupper():
            raise TypeError(f"Class name '{name}' must start with an uppercase letter.")
        return super().__new__(cls, name, bases, dct)

# 2. Apply Metaclass
class GoodClass(metaclass=EnforcePascalCaseMeta):
    pass  # Compiles successfully

try:
    class badClass(metaclass=EnforcePascalCaseMeta):
        pass  # Throws TypeError during class definition time!
except TypeError as err:
    print(err)
```

## Dynamic Field Validation

Metaclasses are frequently used to build Object-Relational Mappers (ORMs) or validation schemas (like Pydantic):

```python
class Field:
    def __init__(self, val_type):
        self.val_type = val_type

class SchemaMeta(type):
    def __new__(cls, name, bases, dct):
        # Capture all validator fields declared
        dct['_fields'] = {k: v for k, v in dct.items() if isinstance(v, Field)}
        return super().__new__(cls, name, bases, dct)

class UserSchema(metaclass=SchemaMeta):
    username = Field(str)
    age = Field(int)

print(UserSchema._fields.keys())  # Output: dict_keys(['username', 'age'])
```
