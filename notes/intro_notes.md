# PyForge Reference Notes: Introduction to Python Syntax

Understanding Python's basic syntax and structure is the essential first step to mastering the language. Python is famous for its clean readability, emphasizing simplicity over complex notation.

---

## 1. Indentation & Whitespace

In most programming languages (like C, Java, or JavaScript), braces `{}` are used to define blocks of code (like loops, functions, or conditionals). In Python, **indentation is part of the syntax itself**.

```python
# Correct Indentation
if True:
    print("This is indented with 4 spaces.")
    print("This is also inside the block.")

# Incorrect Indentation (will raise IndentationError)
if True:
print("This is not indented!")
```

### Best Practices:
* Always use **4 spaces** per indentation level.
* Never mix tabs and spaces in the same file. Python 3 will raise a `TabError` if you mix them.

---

## 2. Comments

Comments are used to write explanations within your code that the Python interpreter ignores.

* **Single-line comments**: Start with the `#` symbol.
* **Inline comments**: Placed on the same line after code, separated by at least two spaces.
* **Multi-line comments / Docstrings**: Use triple-quotes (`"""` or `'''`) to write block text, often used for function or class documentation.

```python
# This is a single-line comment

x = 42  # This is an inline comment

"""
This is a multi-line comment.
The Python interpreter reads it as a string literal,
but if not assigned to a variable, it is discarded.
"""
```

---

## 3. Basic Variable Names & Print Outputs

Variables are created the moment you assign a value to them using the `=` operator. Python is dynamically typed, meaning you don't need to specify the variable type in advance.

```python
name = "PyForge"  # A string variable
version = 3.11    # A float variable
is_active = True  # A boolean variable

# Printing values to stdout
print("Welcome to " + name)  # Concatenation

# Formatted string literals (f-strings) - Preferred in modern Python
print(f"Running {name} version {version}")
```

---

## 4. Fundamental Input/Output

You can request inputs from the terminal using the `input()` function. Note that `input()` always returns data as a **string**, so you must convert it to integers or floats if performing arithmetic.

```python
user_name = input("Enter your name: ")
age_str = input("Enter your age: ")

# Convert string to integer for calculation
age = int(age_str)
years_to_hundred = 100 - age

print(f"Hello {user_name}, you will turn 100 in {years_to_hundred} years!")
```
