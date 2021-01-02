#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
//import { MetaData } from './meta-data';
import { env } from 'process';
import EC2 = require('@aws-cdk/aws-ec2');
import { XmasFunNetworkStack } from './network-stack';
import { MetaData } from './meta-data';
import { PipelineStack } from './pipeline-stack';

const app = new cdk.App();
var props = {env: {account: process.env["CDK_DEFAULT_ACCOUNT"], region: process.env["CDK_DEFAULT_REGION"] } };
var metaData = new MetaData();

new PipelineStack(app, MetaData.PREFIX+"pipeline-stack");
//new XmasFunNetworkStack(app, MetaData.PREFIX+"network-stack", props);
//new DatabaseStackL2(app, metaData.PREFIX+"database-stack", metaData, props);

//new CodeStarStackL2(app, metaData.PREFIX+"code-star-stack", metaData, props);
//new CodeStarStackL2(app, metaData.PREFIX+"codestar-stack-via-yaml", metaData, props);