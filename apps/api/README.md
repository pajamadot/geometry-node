# Backend of Geometry-Node

## Note
- Use FastAPI BackgroundTasks and SSE
  - SSE vs WebSockets
    - SSE: server-to-client
    - WebSockets: two-way chat
  - Solution
    - Geometry-node ai flow is: user_query -> backend -> multi_response, one question mutli answer, so choose to use SSE

## Ref
- Use YAML Format
  - Why: https://pocketflow.substack.com/p/structured-output-for-beginners-3
  - Cheatsheet: https://quickref.me/yaml