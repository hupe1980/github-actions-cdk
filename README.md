# 🚧 GitHub Actions CDK Monorepo

This monorepo provides a suite of TypeScript libraries designed to simplify the setup, management, and automation of GitHub Actions workflows specifically tailored for AWS CDK and CDKTF applications. Each package is crafted to enable developers to define CI/CD workflows for cloud infrastructure deployments in a modular, type-safe way—ideal for projects leveraging AWS CDK, CDKTF, or custom GitHub Actions.

With these libraries, users can define workflows, manage cross-account deployments, and integrate Terraform and AWS infrastructure management directly into GitHub workflows. This monorepo supports TypeScript and offers Python bindings for developers who prefer to work in Python.

## Key Benefits

- **Modular & Extensible Design**: Each package is designed with modularity in mind, allowing developers to create reusable components and customize workflows according to project needs.
- **Cross-Account and Multi-Region Support**: Easily manage and deploy infrastructure across AWS accounts and regions, ideal for complex setups involving multiple environments.
- **Type-Safe and Structured**: Built with TypeScript and leveraging strong typing, these libraries ensure workflows are structured and validated, reducing runtime errors.
- **Python Bindings**: Python bindings are available for general GitHub Actions workflows, enabling teams using Python to benefit from the same constructs and automation capabilities.

## Packages

The monorepo contains libraries tailored for different use cases, each of which has its own README with further details:
- **@github-actions-cdk/aws-cdk**: Tailored for AWS CDK projects.
- **@github-actions-cdk/cdktf**: Designed for projects using CDKTF (Cloud Development Kit for Terraform).
- **github-actions-cdk**: A general-purpose library for creating GitHub Actions workflows with Constructs, available in both TypeScript and Python.

## Getting Started

Refer to each package’s README for detailed installation instructions and usage examples. Additionally, the `examples/` directory contains sample workflows to help you quickly set up pipelines for various use cases, including multi-region deployments, automated testing, and infrastructure monitoring.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to get involved.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENCE) file for more information.
