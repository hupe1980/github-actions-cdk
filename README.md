# 🚧 GitHub Actions CDK

**github-actions-cdk** is a TypeScript library that simplifies the creation and management of GitHub Actions workflows using Constructs. With this library, developers can define workflows in a structured and type-safe manner, making it easier to automate CI/CD pipelines on GitHub. It also includes Python bindings for developers who prefer working in Python.

## Features

- **Type-Safe Workflows**: Leverage TypeScript's strong typing to define your GitHub Actions workflows and ensure correctness.
- **Python Bindings**: Access the same powerful constructs and features in Python, allowing seamless integration for Python developers.
- **Modular Design**: Easily create and manage jobs, triggers, and options for your workflows.

## Installation

To get started with `github-actions-cdk`, install the package using npm or yarn for TypeScript, or pip for Python:

### TypeScript

```bash
npm install github-actions-cdk
```

or 

```bash
yarn add github-actions-cdk
```

### Python
```bash
pip install github-actions-cdk
```

## Getting Started

### Basic Usage (TypeScript)

Here's a simple example of how to create a GitHub Actions workflow using `github-actions-cdk` in TypeScript::

```typescript
import { PermissionLevel, Project } from 'github-actions-cdk';
import { Checkout, SetupNode } from 'github-actions-cdk/actions';

const project = new Project();

const workflow = project.addWorkflow('build', {
    name: "Build",
    triggers: {
        push: { branches: ['main'] },
        workflowDispatch: {}
    },
    permissions: {
        contents: PermissionLevel.READ,
    }
});

const job = workflow.addJob('build', {
	env: {
		CI: 'true',
	},
});

job.addAction(
  new Checkout("checkout", {
    name: "Checkout Code",
    version: "v4",
  }),
);

job.addAction(
  new SetupNode("setup-node", {
    name: "Set up Node.js",
    version: "v4",
    nodeVersion: "20.x",
  }),
);

project.synth();
```

### Basic Usage (Python)

Here's how to create a GitHub Actions workflow using `github-actions-cdk` in Python:

```python
from github_actions_cdk import Project, PermissionLevel
from github_actions_cdk.actions import Checkout, SetupNode

project = Project(
    outdir="examples/python/.github/workflows",
)

workflow = project.add_workflow("build",
    name="Build",
    triggers={
        "push": {
            "branches": ["main"],
        }
    },
    permissions={
        "contents": PermissionLevel.READ,
    }
)

job = workflow.add_job("build",
    env={
        "CI": "true",
    },
)

job.add_action(
    Checkout("checkout",
        name="Checkout Code",
        version="v4",
    ),
)

job.add_action(
    SetupNode("setup-node",
        name="Set up Node.js",
        version="v4",
        node_version="20.x",
    ),
)
                               
project.synth()
```

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to get involved.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENCE) file for more information.
