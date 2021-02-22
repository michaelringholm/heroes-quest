#aws dynamodb scan --table-name "om-hq-login" --output text
#export accessToken=
export accessToken=`(aws dynamodb scan --table-name "om-hq-login" --output text --query Items[0].accessToken.S)`