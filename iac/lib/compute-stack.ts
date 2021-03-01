import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import SQS = require('@aws-cdk/aws-sqs');
import IAM = require("@aws-cdk/aws-iam");
import Lambda = require('@aws-cdk/aws-lambda');
import LambdaEvents = require('@aws-cdk/aws-lambda-event-sources');
import { ISecurityGroup, IVpc } from '@aws-cdk/aws-ec2';
import { MetaData } from './meta-data';
import { CfnFunction } from '@aws-cdk/aws-lambda';
import * as SSM from '@aws-cdk/aws-ssm';
import { SSMHelper } from './ssm-helper';
import { ApiEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';

export class ComputeStack extends Core.Stack {
    private runtime:Lambda.Runtime = Lambda.Runtime.NODEJS_12_X;    
    private ssmHelper = new SSMHelper();
    public apiRole:IAM.IRole;

    constructor(scope: Core.Construct, id: string, vpc: IVpc, apiSecurityGroup: ISecurityGroup, props?: Core.StackProps) {
        super(scope, id, props);

        this.apiRole = this.buildAPIRole();
        this.createLoginFunction(apiSecurityGroup, vpc);
        this.createCreateLoginFunction(apiSecurityGroup, vpc);
        this.createCreateHeroFunction(apiSecurityGroup, vpc);
        this.createChooseHeroFunction(apiSecurityGroup, vpc);
        this.createMapMoveFunction(apiSecurityGroup, vpc);
        this.createEnterTownFunction(apiSecurityGroup, vpc);
        this.createLeaveTownFunction(apiSecurityGroup, vpc);
        this.createViewCharacterFunction(apiSecurityGroup, vpc);
        this.createVisitMeadhallFunction(apiSecurityGroup, vpc);
        this.createTrainHeroFunction(apiSecurityGroup, vpc);
        this.createVisitSmithyFunction(apiSecurityGroup, vpc);
        this.createBuyItemFunction(apiSecurityGroup, vpc);
        this.createSellItemFunction(apiSecurityGroup, vpc);
        this.createPlayRoundFunction(apiSecurityGroup, vpc);
        this.createFunctionAcceptFate(apiSecurityGroup, vpc);
        //this.createUpdateStatusFunction();
    }

    private createLambdaFunction(apiSecurityGroup: ISecurityGroup, name:string, handlerMethod:string, assetPath:string, vpc:EC2.IVpc):Lambda.Function {
        var codeFromLocalZip = Lambda.Code.fromAsset(assetPath);
        var lambdaFunction = new Lambda.Function(this, MetaData.PREFIX+name, { 
            functionName: MetaData.PREFIX+name, vpc: vpc, code: codeFromLocalZip, handler: handlerMethod, runtime: this.runtime, memorySize: 256, 
            timeout: Core.Duration.seconds(20), role: this.apiRole, securityGroups: [apiSecurityGroup],
            tracing: Lambda.Tracing.ACTIVE,
        });
        
        const proxyIntegration = new LambdaProxyIntegration({
            handler: lambdaFunction,
            });
            
        const httpApi = new HttpApi(this, MetaData.PREFIX+name+"-api");
        
        httpApi.addRoutes({
        path: "/" + name,
        methods: [ HttpMethod.POST, HttpMethod.OPTIONS ],
        integration: proxyIntegration,
        });
        
        Core.Tags.of(lambdaFunction).add(MetaData.NAME, MetaData.PREFIX+name);
        return lambdaFunction;
    } 

    private createLoginFunction(apiSecurityGroup: ISecurityGroup, vpc: IVpc):Lambda.Function {
        return this.createLambdaFunction(apiSecurityGroup, "login-fn", "index.handler", "../src/api/login", vpc);
    }

    private createCreateLoginFunction(apiSecurityGroup: ISecurityGroup, vpc: IVpc):Lambda.Function {
        return this.createLambdaFunction(apiSecurityGroup, "create-login-fn", "index.handler", "../src/api/create-login", vpc);
    }

    private createCreateHeroFunction(apiSecurityGroup: ISecurityGroup, vpc: IVpc):Lambda.Function {
        return this.createLambdaFunction(apiSecurityGroup, "create-hero-fn", "index.handler", "../src/api/create-hero", vpc);
    }

    private createChooseHeroFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "choose-hero-fn", "index.handler", "../src/api/choose-hero", vpc);
    }

    /*private createUpdateStatusFunction(apiSecurityGroup: ISecurityGroup, vpc: IVpc):Lambda.Function {
        return this.createLambdaFunction(apiSecurityGroup, "update-status-api-lam", "index.handler", "assets/update-status-api/", vpc);
    }*/

    private createTrainHeroFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "train-hero-fn", "index.handler", "../src/api/train-hero", vpc);
    }
    private createLeaveTownFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "leave-town-fn", "index.handler", "../src/api/leave-town", vpc);
    }
    private createEnterTownFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "enter-town-fn", "index.handler", "../src/api/enter-town", vpc);
    }
    private createVisitMeadhallFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "visit-meadhall-fn", "index.handler", "../src/api/visit-meadhall", vpc);
    }
    private createViewCharacterFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "view-character-fn", "index.handler", "../src/api/view-character", vpc);
    }
    private createVisitSmithyFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "visit-smithy-fn", "index.handler", "../src/api/visit-smithy", vpc);
    }           
    private createMapMoveFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "map-move-fn", "index.handler", "../src/api/map-move", vpc);
    }    
    private createSellItemFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "sell-item-fn", "index.handler", "../src/api/sell-item", vpc);
    }
    private createBuyItemFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "buy-item-fn", "index.handler", "../src/api/buy-item", vpc);
    }
    private createPlayRoundFunction(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "play-round-fn", "index.handler", "../src/api/play-round", vpc);
    } 
    private createFunctionAcceptFate(apiSecurityGroup: EC2.ISecurityGroup, vpc: EC2.IVpc) {
        return this.createLambdaFunction(apiSecurityGroup, "accept-fate-fn", "index.handler", "../src/api/accept-fate", vpc);
    }  
    
    /*private createStepFunctionsTrigger(apiSecurityGroup: ISecurityGroup, vpc: IVpc, queue:SQS.IQueue) {
        var sfnLambdaTriggerFunction = this.createLambdaFunction(apiSecurityGroup, "invoke-sfn-api-lam", "index.handler", "assets/invoke-sfn-api/", vpc);
        sfnLambdaTriggerFunction.addEventSource(new LambdaEvents.SqsEventSource(queue, {}));
    }*/
    
    private buildAPIRole(): IAM.IRole {
        var role = new IAM.Role(this, MetaData.PREFIX+"api-role", {
            description: "Lambda API Role",
            roleName: MetaData.PREFIX+"api-role",
            assumedBy: new IAM.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AWSStepFunctionsFullAccess"),
                IAM.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMFullAccess"),
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSLambdaSQSQueueExecutionRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"),
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSLambdaBasicExecutionRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
                IAM.ManagedPolicy.fromManagedPolicyArn(this, "AWSLambdaVPCAccessExecutionRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")
            ],
        });
        role.addToPolicy(new IAM.PolicyStatement({
          effect: IAM.Effect.ALLOW,
          resources: ["*"],
          actions: ["secretsmanager:GetSecretValue","dbqms:*","rds-data:*","xray:*","dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:Scan","dynamodb:Query"]
        }));

        Core.Tags.of(role).add(MetaData.NAME, MetaData.PREFIX+"api-role");
        return role;
    }      

    private createLambdaCodeBucket()
    {
        var codeBucket = new S3.Bucket(this, MetaData.PREFIX+"lambda-code-bucket", {
            bucketName: MetaData.PREFIX+"lambda-code-bucket", removalPolicy: Core.RemovalPolicy.DESTROY
        });
        Core.Tags.of(codeBucket).add(MetaData.NAME, MetaData.PREFIX+"lambda-code-bucket");
        //this.ssmHelper.createSSMParameter(this, MetaData.PREFIX+"state-machine-arn", stateMachine.stateMachineArn, SSM.ParameterType.STRING);
    }
    
    private createSQSQueue():SQS.IQueue
    {
        var deadLetterqueue = new SQS.Queue(this, MetaData.PREFIX+"dlq-sqs", {
            queueName: MetaData.PREFIX+"dlq-sqs", visibilityTimeout: Core.Duration.seconds(4), retentionPeriod: Core.Duration.days(14)
        });
        Core.Tags.of(deadLetterqueue).add(MetaData.NAME, MetaData.PREFIX+"dlq-sqs");
        
        var queue = new SQS.Queue(this, MetaData.PREFIX+"sqs", {
            queueName: MetaData.PREFIX+"sqs", visibilityTimeout: Core.Duration.seconds(4), retentionPeriod: Core.Duration.days(14), 
            deadLetterQueue: {queue: deadLetterqueue, maxReceiveCount: 5}
        });
        Core.Tags.of(queue).add(MetaData.NAME, MetaData.PREFIX+"sqs");
        this.ssmHelper.createSSMParameter(this, MetaData.PREFIX+"sqs-queue-url", queue.queueUrl, SSM.ParameterType.STRING);
        return queue;
    }    
}