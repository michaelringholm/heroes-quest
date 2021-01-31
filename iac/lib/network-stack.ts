import * as Core from '@aws-cdk/core';
import EC2 = require('@aws-cdk/aws-ec2');
import { MetaData } from './meta-data';
import { IVpc, VpcEndpoint } from '@aws-cdk/aws-ec2';

export class NetworkStack extends Core.Stack {
    public Vpc:EC2.IVpc;
    public ApiSecurityGroup: EC2.ISecurityGroup;

    constructor(scope: Core.Construct, id: string, props?: Core.StackProps) {
        super(scope, id, props);
        this.Vpc = this.createVPC();
        this.createEndpoints(this.Vpc);
        //this.createRDSSecurityGroup();
        this.ApiSecurityGroup = this.createAPISecurityGroup(this.Vpc);
    }
    
    private createEndpoints(vpc: EC2.IVpc) {
        vpc.addGatewayEndpoint(MetaData.PREFIX+"dyndb-ep", {
            service: EC2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets: [
                 { subnetType: EC2.SubnetType.ISOLATED }, { subnetType: EC2.SubnetType.PUBLIC }
            ]
        });
        vpc.addGatewayEndpoint(MetaData.PREFIX+"s3-ep", {
            service: EC2.GatewayVpcEndpointAwsService.S3,
            subnets: [
                 { subnetType: EC2.SubnetType.ISOLATED }, { subnetType: EC2.SubnetType.PUBLIC }
            ]
        });
    }
    
    private createVPC():EC2.IVpc {
        // Link: https://blog.codecentric.de/en/2019/09/aws-cdk-create-custom-vpc/
        var vpc = new EC2.Vpc(this, MetaData.PREFIX+"vpc", {
            cidr: "10.30.0.0/16", subnetConfiguration: [
                { cidrMask: 24, name: MetaData.PREFIX+"private-sne", subnetType: EC2.SubnetType.ISOLATED },
                { cidrMask: 25, name: MetaData.PREFIX+"public-sne", subnetType: EC2.SubnetType.PUBLIC }
            ],
            natGateways: 0,
            maxAzs: 2
        });
        
        var publicNacl = this.createPublicNacl(vpc);
        vpc.publicSubnets.forEach( subnet => { subnet.associateNetworkAcl(MetaData.PREFIX+"public-nacl-assoc", publicNacl) } );
        var privateNacl = this.createPrivateNacl(vpc);
        vpc.privateSubnets.forEach( subnet => { subnet.associateNetworkAcl(MetaData.PREFIX+"private-nacl-assoc", privateNacl) } );
        
        this.tagVPCResources(vpc);
        
        return vpc;
    }
    
    private createPublicNacl(vpc: EC2.Vpc):EC2.INetworkAcl {
        var publicNacl = new EC2.NetworkAcl(this, MetaData.PREFIX+"public-nacl", {
            vpc: vpc,
            networkAclName: MetaData.PREFIX+"public-nacl",
            subnetSelection: {
                subnetType: EC2.SubnetType.PUBLIC
            }
        });
        publicNacl.addEntry(MetaData.PREFIX+"public-nacl-allow-all-inbound", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.INGRESS,
           ruleAction: EC2.Action.ALLOW,
           ruleNumber: 500,
           traffic: EC2.AclTraffic.allTraffic(),
           networkAclEntryName: "all-traffic"
        });
        publicNacl.addEntry(MetaData.PREFIX+"public-nacl-allow-all-outbound", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.EGRESS,
           ruleAction: EC2.Action.ALLOW,
           ruleNumber: 500,
           traffic: EC2.AclTraffic.allTraffic(),
           networkAclEntryName: "all-traffic"
        });        
        Core.Tags.of(publicNacl).add(MetaData.NAME, MetaData.PREFIX+"public-nacl");
        return publicNacl;
    }
    
    private createPrivateNacl(vpc: EC2.Vpc):EC2.INetworkAcl {
        var privateNacl = new EC2.NetworkAcl(this, MetaData.PREFIX+"private-nacl", {
            vpc: vpc,
            networkAclName: MetaData.PREFIX+"private-nacl",
            subnetSelection: {
                subnetType: EC2.SubnetType.ISOLATED
            }
        });
        privateNacl.addEntry(MetaData.PREFIX+"private-nacl-allow-all-inbound", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.INGRESS,
           ruleAction: EC2.Action.ALLOW,
           ruleNumber: 500,
           traffic: EC2.AclTraffic.allTraffic(),
           networkAclEntryName: "all-traffic"
        });
        privateNacl.addEntry(MetaData.PREFIX+"private-nacl-deny-inbound-ssh", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.INGRESS,
           ruleAction: EC2.Action.DENY,
           ruleNumber: 100,
           traffic: EC2.AclTraffic.tcpPort(22),
           networkAclEntryName: "deny-ssh"
        });        
        privateNacl.addEntry(MetaData.PREFIX+"private-nacl-allow-all-outbound", {
           cidr: EC2.AclCidr.anyIpv4(),
           direction: EC2.TrafficDirection.EGRESS,
           ruleAction: EC2.Action.ALLOW,
           ruleNumber: 500,
           traffic: EC2.AclTraffic.allTraffic(),
           networkAclEntryName: "all-traffic"
        });
        Core.Tags.of(privateNacl).add(MetaData.NAME, MetaData.PREFIX+"private-nacl");
        return privateNacl;
    }
    
    
    private createAPISecurityGroup(vpc: IVpc): EC2.ISecurityGroup {
        var postFix = "api-sg";
        var securityGroup = new EC2.SecurityGroup(this, MetaData.PREFIX+postFix, {
            vpc: vpc,
            securityGroupName: MetaData.PREFIX+postFix,
            description: MetaData.PREFIX+postFix,
            allowAllOutbound: true
        });
        
        //securityGroup.connections.allowTo(this.metaData.RDSSecurityGroup, EC2.Port.tcp(3306), "Lambda to RDS");
        Core.Tags.of(securityGroup).add(MetaData.NAME, MetaData.PREFIX+postFix);
        //this.metaData.APISecurityGroup = securityGroup;
        return securityGroup;
    } 
    
    private tagVPCResources(vpc: EC2.Vpc) {
        Core.Tags.of(vpc).add(MetaData.NAME, MetaData.PREFIX+"vpc");
        Core.Tags.of(vpc).add(MetaData.NAME, MetaData.PREFIX+"igw", { includeResourceTypes: [EC2.CfnInternetGateway.CFN_RESOURCE_TYPE_NAME] });
        Core.Tags.of(vpc).add(MetaData.NAME, MetaData.PREFIX+"nat", { includeResourceTypes: [EC2.CfnNatGateway.CFN_RESOURCE_TYPE_NAME]});
        Core.Tags.of(vpc).add(MetaData.NAME, MetaData.PREFIX+"default-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
        var defaultNacl = EC2.NetworkAcl.fromNetworkAclId(vpc, MetaData.PREFIX+"vpc", vpc.vpcDefaultNetworkAcl);
        Core.Tags.of(defaultNacl).add(MetaData.NAME, MetaData.PREFIX+"default-nacl");
        
        Core.Tags.of(vpc).add(MetaData.NAME, MetaData.PREFIX+"default-sg", { includeResourceTypes: [EC2.CfnSecurityGroup.CFN_RESOURCE_TYPE_NAME]});
        
        vpc.publicSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"public-sne", { includeResourceTypes: [EC2.CfnSubnet.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"public-rt", { includeResourceTypes: [EC2.CfnRouteTable.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"public-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
        });
        
        vpc.privateSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"private-sne", { includeResourceTypes: [EC2.CfnSubnet.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"private-rt", { includeResourceTypes: [EC2.CfnRouteTable.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"private-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
        });
        
        vpc.isolatedSubnets.forEach( subnet => {
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"isolated-sne", { includeResourceTypes: [EC2.CfnSubnet.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"isolated-rt", { includeResourceTypes: [EC2.CfnRouteTable.CFN_RESOURCE_TYPE_NAME]});
            Core.Tags.of(subnet).add(MetaData.NAME, MetaData.PREFIX+"isolated-nacl", { includeResourceTypes: [EC2.CfnNetworkAcl.CFN_RESOURCE_TYPE_NAME]});
        });
    }
}