# PyForge Reference Notes: Standard Libraries & Imports

Python's philosophy is "batteries included," meaning it ships with a massive suite of built-in libraries that handle everything from mathematical calculations to OS interaction.

---

## 1. The Import System

To use code defined in another module or library, use the `import` statement. This tells Python to find the module file, compile it to bytecode, and make its namespace available.

```python
# Method A: Import the whole module (Recommended for namespace clarity)
import math
print(math.sqrt(16))

# Method B: Import specific bindings (Saves typing module prefix)
from math import sqrt, pi
print(sqrt(16))
print(pi)

# Method C: Import with an alias (Convenient for long module names)
import random as rnd
print(rnd.randint(1, 10))
```

> [!CAUTION]
> Avoid wildcard imports: `from math import *`. This imports all functions into your local namespace, causing naming conflicts (variable shadowing) that are difficult to debug.

---

## 2. Core Standard Modules

Here are the most common modules you will interact with in Python:

### `math` (Mathematical Computations)
Provides access to mathematical constants and transcendental functions.
* `math.sin(x)`, `math.cos(x)`
* `math.log(x, base)`
* `math.ceil(x)`, `math.floor(x)`

### `random` (Randomization & Sampling)
Generates pseudo-random numbers.
* `random.random()`: Float between `0.0` and `1.0`.
* `random.randint(a, b)`: Integer between `a` and `b` inclusive.
* `random.choice(sequence)`: Selects a random element from a list.

### `os` (Operating System Operations)
Interacts with the underlying operating system.
* `os.getcwd()`: Gets current working directory.
* `os.listdir(path)`: Lists all files in a folder.
* `os.mkdir(path)`: Creates a new directory.

### `sys` (System Parameters & Runtime)
Interacts with the Python interpreter environment.
* `sys.argv`: List of command line arguments passed to the script.
* `sys.path`: List of folder directories searched during imports.
* `sys.exit()`: Terminates the execution.
