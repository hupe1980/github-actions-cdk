from github_actions_cdk import Project, PermissionLevel
from github_actions_cdk.actions import CheckoutV4, SetupNodeV4
import os

project = Project(
    #additional_checks=True,
    outdir=os.path.dirname(__file__) + "/.github/workflows",
)

workflow = project.add_workflow(
    id="build",
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

job = workflow.add_job(
    id="build",
    env={
        "CI": "true",
    },
)

CheckoutV4(
    scope=job,
    id="checkout",
    name="Checkout Code",
)

setup_node = SetupNodeV4(
    scope=job, 
    id="setup-node",    
    name="Set up Node.js",
    node_version="14.x",
)

job.add_output("node-version", setup_node.outputs.node_version)
                               
project.synth()