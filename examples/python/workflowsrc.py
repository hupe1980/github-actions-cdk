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