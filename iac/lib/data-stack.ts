import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import S3 = require('@aws-cdk/aws-s3');
import { IRole } from "@aws-cdk/aws-iam";
import Lambda = require('@aws-cdk/aws-dynamodb');
import { IVpc } from '@aws-cdk/aws-ec2';
import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';
import { MetaData } from './meta-data';
import { Bucket } from '@aws-cdk/aws-s3';

export class DataStack extends Core.Stack {
    private apiRole:IRole;
    constructor(scope: Core.Construct, id: string, vpc: IVpc, apiRole: IRole, props?: Core.StackProps) {
        super(scope, id, props);
        this.apiRole = apiRole;
        this.createLoginTable();
        this.createHeroTable();
        this.createBattleBucket();
        this.createMapBucket();
    }

    private createMapBucket() {
        var name = MetaData.PREFIX+"map";
        var bucket = new Bucket(this, name, {
            bucketName: name
        });
        bucket.grantReadWrite(this.apiRole);
    }    
    
    private createBattleBucket() {
        var name = MetaData.PREFIX+"battle";
        var bucket = new Bucket(this, name, {
            bucketName: name
        });
        bucket.grantReadWrite(this.apiRole);
    }

    private createHeroTable() {
        var name = MetaData.PREFIX+"hero";
        new Table(this, name, {
            tableName: name,
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {name: "userGuid", type: AttributeType.STRING},
            sortKey: {name: "heroName", type: AttributeType.STRING}
        });
    }
    
    private createLoginTable() {
        var name = MetaData.PREFIX+"login";
        new Table(this, name, {
            tableName: name,
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {name: "userName", type: AttributeType.STRING}
        });
    }
}