# Concurrency and Asyncio in Python

Master asynchronous execution, event loops, and coroutines to write non-blocking Python programs.

## Synchronous vs Asynchronous

In synchronous programming, instructions execute sequentially. If an instruction blocks (e.g., waiting for network IO or sleep), the entire program halts. Asynchronous programming allows the system to switch execution to other tasks while waiting for blocking operations to complete.

```
Synchronous:  [Task A (run)] -> [Task A (wait for IO)] -> [Task B (run)]
Asynchronous: [Task A (run)] -> [Switch to Task B (run)] -> [Task A (IO done, resume)]
```

## Python Event Loop & Coroutines

Python implements asynchronous programming using an **Event Loop**. The event loop manages and distributes the execution of different tasks.

### 1. Coroutines (`async def`)
A coroutine is a special function that can suspend its execution. You define a coroutine using the `async def` keyword:

```python
async def my_coroutine():
    print("Start coroutine")
    # Suspension point
```

### 2. Awaiting Tasks (`await`)
The `await` keyword suspends the execution of the calling coroutine until the awaited task completes, releasing control back to the event loop.

```python
import asyncio

async def main():
    print("Hello...")
    await asyncio.sleep(1)  # Releases control back to loop
    print("...World!")
```

## Running Concurrently (`asyncio.gather`)

To run multiple coroutines concurrently, use `asyncio.gather()`. This registers multiple tasks with the event loop to execute them simultaneously.

```python
import asyncio
import time

async def fetch_data(id, delay):
    print(f"Task {id}: starting fetch")
    await asyncio.sleep(delay)
    print(f"Task {id}: data retrieved")
    return f"Data {id}"

async def main():
    start = time.perf_counter()
    # Runs Task 1 and Task 2 concurrently
    results = await asyncio.gather(
        fetch_data(1, 2),
        fetch_data(2, 1)
    )
    end = time.perf_counter()
    print(f"Retrieved: {results}")
    print(f"Total time elapsed: {end - start:.2f} seconds")

# Run event loop
asyncio.run(main())
```
*(Notice that the total time is ~2 seconds instead of 3 seconds, proving concurrent execution!)*
