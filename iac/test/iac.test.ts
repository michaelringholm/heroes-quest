import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Iac from '../lib/network-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Iac.XmasFunNetworkStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
