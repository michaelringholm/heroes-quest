import UUID = require("uuid");
import * as Core from '@aws-cdk/core';
import IAM = require("@aws-cdk/aws-iam");
import S3 = require('@aws-cdk/aws-s3');
import CDP = require('@aws-cdk/aws-codedeploy');
import CBU = require('@aws-cdk/aws-codebuild');
import { MetaData } from './meta-data';
import { IServerApplication, ServerApplication, ServerDeploymentGroup } from "@aws-cdk/aws-codedeploy";
import { Server } from "http";
import { PipelineProject, Project } from "@aws-cdk/aws-codebuild";
import { ActionCategory, Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import { Action } from "@aws-cdk/aws-ec2";
import { CodeCommitSourceAction, CodeDeployEcsDeployAction, CodeDeployServerDeployAction, CodeDeployServerDeployActionProps, GitHubSourceAction } from "@aws-cdk/aws-codepipeline-actions";
import { SecretValue } from "@aws-cdk/core";

export class PipelineStack extends Core.Stack {
    constructor(scope: Core.Construct, id: string, props?: Core.StackProps) {
        super(scope, id, props);
        console.log("region="+props?.env?.region);
        this.createS3BuildBucket();
        var codeBuildProjectServiceRole = this.buildCodeBuildProjectServiceRole();
        var codeDeployServiceRole = this.buildCodeDeployServiceRole();
        this.buildPipelineServiceRole();
        var codeDeployApplication = this.createCodeDeployApplication();
        var deploymentGroup = this.createCodeDeployApplicationDeploymentGroup(codeDeployServiceRole, codeDeployApplication);
        this.createBuildProject(codeBuildProjectServiceRole);
        var artifact = this.createArtifact();
        var sourceAction = this.createSourceAction();
        var deployAction = this.createDeployAction(artifact, deploymentGroup);
        this.createPipeline(sourceAction, deployAction);
    }

    private createSourceAction(): GitHubSourceAction {
        var deployAction = new GitHubSourceAction({
            actionName: "GetSource",
            repo: "simple-java-bootstrap-app",
            branch: "main",
            owner: "sundgaard-aws",
            oauthToken: new SecretValue("asdasd"),
            output: new Artifact()
        });
        return deployAction;
    }    
    
    private createDeployAction(artifact: Artifact, deploymentGroup: ServerDeploymentGroup) {
        var deployAction = new CodeDeployServerDeployAction({
            actionName: "StartDeploy",
            deploymentGroup: deploymentGroup,
            input: artifact            
        });
        return deployAction;
    }
    
    private createArtifact(): Artifact {
        var name = MetaData.PREFIX+"artifact";
        var artifact = new Artifact(name);
        return artifact;
    }
    
    private createPipeline(sourceAction: GitHubSourceAction, deployAction: CodeDeployServerDeployAction) {
        var name = MetaData.PREFIX+"pipeline";
        var pipeline = new Pipeline(this, name, {
            pipelineName: name,
            stages: [
                { stageName: "Source", actions: [ sourceAction ] },
                { stageName: "Deploy", actions: [ deployAction ] }
            ]
        });
        /*{
                            actionProperties: {
                                actionName: "StartDeploy",
                                inputs: [artifact],
                                owner: "AWS",
                                version: "1",
                                provider: "CodeDeploy",
                                category: ActionCategory.DEPLOY,
                                artifactBounds: {maxInputs:1, maxOutputs:1, minInputs:1, minOutputs:1}

                            },

                        }*/
    }
    
    private createBuildProject(codeBuildProjectServiceRole: IAM.IRole) {
        var name = MetaData.PREFIX+"cb-proj";
        new PipelineProject(this, name, {
            projectName: name,
            description: "Code Build Project",
            role: codeBuildProjectServiceRole,
            environment: {
                buildImage: CBU.LinuxBuildImage.AMAZON_LINUX_2_3, computeType: CBU.ComputeType.SMALL
            }
        });
    }

    private createCodeDeployApplicationDeploymentGroup(codeDeployServiceRole: IAM.IRole, codeDeployApplication: IServerApplication): ServerDeploymentGroup {
        var name = MetaData.PREFIX+"cd-dgr";
        var deploymentGroup = new ServerDeploymentGroup(this, name, {
            role: codeDeployServiceRole,
            application: codeDeployApplication,
            deploymentGroupName: name
        });
        return deploymentGroup;
    }

    private createCodeDeployApplication(): IServerApplication {
        var name = MetaData.PREFIX+"cd-app";
        //new CodeDepl
        var application = new ServerApplication(this, name, {
            applicationName: name
        });
        return application;
    }
    
    private createS3BuildBucket() {
        var name = MetaData.PREFIX+"build-bucket";
        var s3Bucket = new S3.Bucket(this, name, {
            bucketName: name,
            removalPolicy: Core.RemovalPolicy.RETAIN
        });        
        Core.Tags.of(s3Bucket).add(MetaData.NAME, name);
        return s3Bucket;
    }

    private buildCodeDeployServiceRole(): IAM.IRole {
        var roleName = MetaData.PREFIX+"code-deploy-service-role";
        var role = new IAM.Role(this, roleName, {
            description: "CodeDeployServiceRole",
            roleName: roleName,                        
            assumedBy: new IAM.ServicePrincipal("codedeploy.amazonaws.com"),
            managedPolicies: [
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSCodeDeployRole", "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole")
                //IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
                //IAM.ManagedPolicy.fromManagedPolicyArn(this, "AmazonEC2RoleforAWSCodeDeploy", "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforAWSCodeDeploy")
            ]
        });
        /*role.addToPolicy(new IAM.PolicyStatement({
          effect: IAM.Effect.ALLOW,
          resources: ["*"],
          actions: ["logs:DescribeLogStreams", "logs:PutLogEvents", "secretsmanager:GetSecretValue"]
        }));*/
        //role.assumeRoleAction = "codedeploy.amazonaws.com";
        Core.Tags.of(role).add(MetaData.NAME, roleName);
        return role;
    }

    private buildPipelineServiceRole(): IAM.IRole {
        var roleName = MetaData.PREFIX+"pipeline-service-role";
        var role = new IAM.Role(this, roleName, {
            description: "PipelineServiceRole",
            roleName: roleName,                        
            assumedBy: new IAM.ServicePrincipal("codepipeline.amazonaws.com"),
            managedPolicies: [
                //IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSCodeDeployRole", "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole")
                //IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
                //IAM.ManagedPolicy.fromManagedPolicyArn(this, "AmazonEC2RoleforAWSCodeDeploy", "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforAWSCodeDeploy")
            ]
        });
        role.addToPolicy(new IAM.PolicyStatement({            
          effect: IAM.Effect.ALLOW,
          resources: ["*"],
          actions: [
            "iam:PassRole",
            "s3:*",
            "codebuild:BatchGetBuilds",
            "codebuild:StartBuild",
            "logs:*",
            "ec2:*",
            "ssm:*",
            "lambda:*",
            "cloudformation:*",
            "codecommit:*",
            "codedeploy:*",
            "cloudwatch:*",
            "codestar-connections:*"
          ]
        }));
        //role.assumeRoleAction = "codedeploy.amazonaws.com";
        Core.Tags.of(role).add(MetaData.NAME, roleName);
        return role;
    }

    private buildCodeBuildProjectServiceRole(): IAM.IRole {
        var roleName = MetaData.PREFIX+"code-build-project-service-role";
        var role = new IAM.Role(this, roleName, {
            description: "CodeBuildProjectServiceRole",
            roleName: roleName,                        
            assumedBy: new IAM.ServicePrincipal("codebuild.amazonaws.com"),
            managedPolicies: [
                //IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSCodeDeployRole", "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole")
                //IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
                //IAM.ManagedPolicy.fromManagedPolicyArn(this, "AmazonEC2RoleforAWSCodeDeploy", "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforAWSCodeDeploy")
            ]
        });
        role.addToPolicy(new IAM.PolicyStatement({
          effect: IAM.Effect.ALLOW,
          resources: ["*"],
          actions: [
            "iam:PassRole",
            "s3:*",
            "logs:*",
            "ssm:*",
            "lambda:*",
            "cloudformation:*",
            "codebuild:*",
            "codecommit:*",
            "cloudwatch:*",
            "codestar-connections:*",
          ]
        }));
        //role.assumeRoleAction = "codedeploy.amazonaws.com";
        Core.Tags.of(role).add(MetaData.NAME, roleName);
        return role;
    }        

    
}
