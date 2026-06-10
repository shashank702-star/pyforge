# Web APIs and Routing in Python

Learn how web APIs work, HTTP communication rules, and how to structure REST API endpoint routers in Python.

## What is a Web API?

An Application Programming Interface (API) allows different applications to communicate with each other. A **REST API** (Representational State Transfer) uses HTTP requests to GET, POST, PUT, and DELETE data resources.

### HTTP Methods & Codes
- **GET**: Retrieve resource data (Status: `200 OK`)
- **POST**: Create a new resource (Status: `201 Created`)
- **PUT**: Update an existing resource (Status: `200 OK`)
- **DELETE**: Remove a resource (Status: `204 No Content`)

## Handling JSON in Python

Modern Web APIs exchange data using the **JSON** (JavaScript Object Notation) format. Python's standard `json` module parses JSON strings into dictionaries.

```python
import json

# Parsing incoming request payload
payload_string = '{"username": "archimedes", "role": "admin"}'
data = json.loads(payload_string)
print(data["username"])  # Output: archimedes
```

## Simulating API Routing

In Python web frameworks (like Flask or FastAPI), endpoints are routed to specific handler functions. Here is how you can model a clean request router using Python dictionaries:

```python
class APIRouter:
    def __init__(self):
        self.routes = {}

    def route(self, path, method):
        # decorator to register handlers
        def decorator(handler):
            self.routes[(path, method.upper())] = handler
            return handler
        return decorator

    def handle_request(self, path, method, payload=None):
        handler = self.routes.get((path, method.upper()))
        if not handler:
            return {"status": 404, "error": "Not Found"}
        return handler(payload)

# Initialize router
router = APIRouter()

@router.route("/users", "GET")
def get_users(payload):
    return {"status": 200, "users": ["Alice", "Bob"]}

@router.route("/users", "POST")
def create_user(payload):
    if not payload or "name" not in payload:
        return {"status": 400, "error": "Bad Request"}
    return {"status": 201, "message": f"User {payload['name']} created!"}

# Simulate requests
print(router.handle_request("/users", "GET"))
print(router.handle_request("/users", "POST", {"name": "Charlie"}))
```
