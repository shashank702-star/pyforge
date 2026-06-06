# PyForge Reference Notes: Working with Files

Interacting with the local filesystem is a core requirement for most practical software. Python makes file reading, writing, and directory scanning extremely intuitive.

---

## 1. Opening and Closing Files

To work with a file, you must first open it using the built-in `open()` function. This returns a file stream object which acts as a handle to read or write bytes.

```python
file_handle = open("sample.txt", "r")  # Open for reading
content = file_handle.read()
print(content)
file_handle.close()  # ALWAYS close the file stream!
```

> [!WARNING]
> Failing to close a file stream can lock the file in the OS, waste file descriptors, and lead to I/O corruption if buffers aren't flushed.

---

## 2. File Access Modes

The second argument of `open()` defines the mode of access:

| Mode | Name | Description | Behavior |
| :--- | :--- | :--- | :--- |
| `'r'` | Read | Default mode. Opens file for reading. | Raises `FileNotFoundError` if the file doesn't exist. |
| `'w'` | Write | Opens file for writing. | **Overwrites** the entire file if it exists, or creates it if missing. |
| `'a'` | Append | Opens file for appending text. | **Preserves** existing content; new text is added to the end. |
| `'r+'`| Read & Write | Opens file for both reading and writing. | Stream starts at the beginning of the file. |
| `'b'` | Binary | Appended to mode (e.g. `'rb'`, `'wb'`). | Reads/writes raw bytes (images, PDFs) instead of strings. |

---

## 3. The `with` Statement (Context Managers)

To guarantee that file streams are closed properly even if exceptions are thrown during read/write cycles, Python provides the **`with`** block statement (which invokes the context manager protocol):

```python
# The modern, safe way to write to a file:
with open("output.txt", "w") as f:
    f.write("Line 1: Hello PyForge!\n")
    f.write("Line 2: Context managers automatically close the stream.\n")

# No need to call f.close(). It is done automatically on exiting the 'with' block.
```

---

## 4. Reading Files Line-by-Line

Reading a large file entirely using `.read()` loads it completely into RAM, which can crash your system on multi-gigabyte datasets. Instead, read files line-by-line:

```python
# Method A: Iterating over the file object (Memory Efficient)
with open("large_dataset.txt", "r") as f:
    for line in f:
        print(line.strip())  # .strip() removes trailing newlines

# Method B: readlines() (Loads lines into a list)
with open("dataset.txt", "r") as f:
    all_lines = f.readlines()
    print(f"File has {len(all_lines)} lines.")
```
