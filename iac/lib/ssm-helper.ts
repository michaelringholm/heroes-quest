import * as Core from '@aws-cdk/core';
import * as SSM from '@aws-cdk/aws-ssm';
import * as SM from '@aws-cdk/aws-secretsmanager';

export class SSMHelper {

    constructor() {
    }

    public createSSMParameter(stack: Core.Construct, parameterName: string, parameterValue: string, parameterType: SSM.ParameterType) {
        new SSM.StringParameter(stack, parameterName, {
            description: parameterName,
            parameterName: parameterName,
            stringValue: parameterValue,
            type: parameterType
            // allowedPattern: '.*',
        });
    }
    
    public createSecureSSMParameter(stack: Core.Construct, parameterName: string, parameterValue: string, parameterType: SSM.ParameterType) {
        new SM.Secret(stack, parameterName, {
            description: parameterName,
            secretName: parameterName,
            generateSecretString: {}
            // allowedPattern: '.*',
        });
    }    
}