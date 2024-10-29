from github_actions_cdk import Project, PermissionLevel, Job
from github_actions_cdk.actions import CheckoutV4, SetupNodeV4
import os

class CustomJob(Job):
    def __init__(self, scope, id, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        CheckoutV4(self,
            id="checkout",
            name="Checkout Code",
        )

        SetupNodeV4(self, 
            id="setup-node",    
            name="Set up Node.js",
            node_version="14.x",
        )

project = Project(
    #additional_checks=True,
    outdir=os.path.dirname(__file__) + "/.github/workflows",
)

workflow = project.add_workflow("build",
    name="Build",
    triggers={
        "push": {
            "branches": ["main"],
        },
    },
    permissions={
        "contents": PermissionLevel.READ,
    },
)

CustomJob(
    scope=workflow, 
    id="build",
    env={
        "CI": "true",
    },
)
                            
project.synth()