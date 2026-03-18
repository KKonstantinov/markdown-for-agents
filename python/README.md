# markdown-for-agents (Python)

Runtime-agnostic HTML-to-Markdown converter built for AI agents. Python port of the [TypeScript library](https://github.com/KKonstantinov/markdown-for-agents).

## Installation

```bash
pip install markdown-for-agents
```

## Usage

```python
from markdown_for_agents import convert

result = convert("<h1>Hello</h1><p>World</p>")
print(result.markdown)
```
