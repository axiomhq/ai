/**
 * ==========================================================================================================
 * 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨 AXIOM NOTE 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
 * ==========================================================================================================
 * This is copy/pasted from the `@opentelemetry/semantic-conventions` package.
 * Because incubating semantic conventions are no longer experted.
 *
 * Currently at 1.32.0
 *
 * @see: https://github.com/open-telemetry/opentelemetry-js/blob/b0b721ae3eb4ecf04c1654522bdc64f825e89887/semantic-conventions/src/experimental_attributes.ts
 * ==========================================================================================================
 * 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨 AXIOM NOTE 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
 * ==========================================================================================================
 */

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//----------------------------------------------------------------------------------------------------------
// DO NOT EDIT, this is an Auto-generated file from scripts/semconv/templates/registry/stable/attributes.ts.j2
//----------------------------------------------------------------------------------------------------------

/**
 * This attribute represents the state of the application.
 *
 * @example created
 *
 * @note The Android lifecycle states are defined in [Activity lifecycle callbacks](https://developer.android.com/guide/components/activities/activity-lifecycle#lc), and from which the `OS identifiers` are derived.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ANDROID_APP_STATE = 'android.app.state' as const;

/**
 * Enum value "background" for attribute {@link ATTR_ANDROID_APP_STATE}.
 */
export const ANDROID_APP_STATE_VALUE_BACKGROUND = 'background' as const;

/**
 * Enum value "created" for attribute {@link ATTR_ANDROID_APP_STATE}.
 */
export const ANDROID_APP_STATE_VALUE_CREATED = 'created' as const;

/**
 * Enum value "foreground" for attribute {@link ATTR_ANDROID_APP_STATE}.
 */
export const ANDROID_APP_STATE_VALUE_FOREGROUND = 'foreground' as const;

/**
 * Uniquely identifies the framework API revision offered by a version (`os.version`) of the android operating system. More information can be found [here](https://developer.android.com/guide/topics/manifest/uses-sdk-element#ApiLevels).
 *
 * @example 33
 * @example 32
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ANDROID_OS_API_LEVEL = 'android.os.api_level' as const;

/**
 * Deprecated. Use `android.app.state` instead.
 *
 * @note The Android lifecycle states are defined in [Activity lifecycle callbacks](https://developer.android.com/guide/components/activities/activity-lifecycle#lc), and from which the `OS identifiers` are derived.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Renamed to `android.app.state`
 */
export const ATTR_ANDROID_STATE = 'android.state' as const;

/**
 * Enum value "background" for attribute {@link ATTR_ANDROID_STATE}.
 */
export const ANDROID_STATE_VALUE_BACKGROUND = 'background' as const;

/**
 * Enum value "created" for attribute {@link ATTR_ANDROID_STATE}.
 */
export const ANDROID_STATE_VALUE_CREATED = 'created' as const;

/**
 * Enum value "foreground" for attribute {@link ATTR_ANDROID_STATE}.
 */
export const ANDROID_STATE_VALUE_FOREGROUND = 'foreground' as const;

/**
 * A unique identifier representing the installation of an application on a specific device
 *
 * @example 2ab2916d-a51f-4ac8-80ee-45ac31a28092
 *
 * @note Its value **SHOULD** persist across launches of the same application installation, including through application upgrades.
 * It **SHOULD** change if the application is uninstalled or if all applications of the vendor are uninstalled.
 * Additionally, users might be able to reset this value (e.g. by clearing application data).
 * If an app is installed multiple times on the same device (e.g. in different accounts on Android), each `app.installation.id` **SHOULD** have a different value.
 * If multiple OpenTelemetry SDKs are used within the same application, they **SHOULD** use the same value for `app.installation.id`.
 * Hardware IDs (e.g. serial number, IMEI, MAC address) **MUST NOT** be used as the `app.installation.id`.
 *
 * For iOS, this value **SHOULD** be equal to the [vendor identifier](https://developer.apple.com/documentation/uikit/uidevice/identifierforvendor).
 *
 * For Android, examples of `app.installation.id` implementations include:
 *
 *   - [Firebase Installation ID](https://firebase.google.com/docs/projects/manage-installations).
 *   - A globally unique UUID which is persisted across sessions in your application.
 *   - [App set ID](https://developer.android.com/identity/app-set-id).
 *   - [`Settings.getString(Settings.Secure.ANDROID_ID)`](https://developer.android.com/reference/android/provider/Settings.Secure#ANDROID_ID).
 *
 * More information about Android identifier best practices can be found [here](https://developer.android.com/training/articles/user-data-ids).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_APP_INSTALLATION_ID = 'app.installation.id' as const;

/**
 * The provenance filename of the built attestation which directly relates to the build artifact filename. This filename **SHOULD** accompany the artifact at publish time. See the [SLSA Relationship](https://slsa.dev/spec/v1.0/distributing-provenance#relationship-between-artifacts-and-attestations) specification for more information.
 *
 * @example golang-binary-amd64-v0.1.0.attestation
 * @example docker-image-amd64-v0.1.0.intoto.json1
 * @example release-1.tar.gz.attestation
 * @example file-name-package.tar.gz.intoto.json1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ARTIFACT_ATTESTATION_FILENAME = 'artifact.attestation.filename' as const;

/**
 * The full [hash value (see glossary)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf), of the built attestation. Some envelopes in the [software attestation space](https://github.com/in-toto/attestation/tree/main/spec) also refer to this as the **digest**.
 *
 * @example 1b31dfcd5b7f9267bf2ff47651df1cfb9147b9e4df1f335accf65b4cda498408
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ARTIFACT_ATTESTATION_HASH = 'artifact.attestation.hash' as const;

/**
 * The id of the build [software attestation](https://slsa.dev/attestation-model).
 *
 * @example 123
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ARTIFACT_ATTESTATION_ID = 'artifact.attestation.id' as const;

/**
 * The human readable file name of the artifact, typically generated during build and release processes. Often includes the package name and version in the file name.
 *
 * @example golang-binary-amd64-v0.1.0
 * @example docker-image-amd64-v0.1.0
 * @example release-1.tar.gz
 * @example file-name-package.tar.gz
 *
 * @note This file name can also act as the [Package Name](https://slsa.dev/spec/v1.0/terminology#package-model)
 * in cases where the package ecosystem maps accordingly.
 * Additionally, the artifact [can be published](https://slsa.dev/spec/v1.0/terminology#software-supply-chain)
 * for others, but that is not a guarantee.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ARTIFACT_FILENAME = 'artifact.filename' as const;

/**
 * The full [hash value (see glossary)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf), often found in checksum.txt on a release of the artifact and used to verify package integrity.
 *
 * @example 9ff4c52759e2c4ac70b7d517bc7fcdc1cda631ca0045271ddd1b192544f8a3e9
 *
 * @note The specific algorithm used to create the cryptographic hash value is
 * not defined. In situations where an artifact has multiple
 * cryptographic hashes, it is up to the implementer to choose which
 * hash value to set here; this should be the most secure hash algorithm
 * that is suitable for the situation and consistent with the
 * corresponding attestation. The implementer can then provide the other
 * hash values through an additional set of attribute extensions as they
 * deem necessary.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ARTIFACT_HASH = 'artifact.hash' as const;

/**
 * The [Package URL](https://github.com/package-url/purl-spec) of the [package artifact](https://slsa.dev/spec/v1.0/terminology#package-model) provides a standard way to identify and locate the packaged artifact.
 *
 * @example pkg:github/package-url/purl-spec@1209109710924
 * @example pkg:npm/foo@12.12.3
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ARTIFACT_PURL = 'artifact.purl' as const;

/**
 * The version of the artifact.
 *
 * @example v0.1.0
 * @example 1.2.1
 * @example 122691-build
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ARTIFACT_VERSION = 'artifact.version' as const;

/**
 * The JSON-serialized value of each item in the `AttributeDefinitions` request field.
 *
 * @example ["{ "AttributeName": "string", "AttributeType": "string" }"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS =
  'aws.dynamodb.attribute_definitions' as const;

/**
 * The value of the `AttributesToGet` request parameter.
 *
 * @example ["lives", "id"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_ATTRIBUTES_TO_GET = 'aws.dynamodb.attributes_to_get' as const;

/**
 * The value of the `ConsistentRead` request parameter.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_CONSISTENT_READ = 'aws.dynamodb.consistent_read' as const;

/**
 * The JSON-serialized value of each item in the `ConsumedCapacity` response field.
 *
 * @example ["{ "CapacityUnits": number, "GlobalSecondaryIndexes": { "string" : { "CapacityUnits": number, "ReadCapacityUnits": number, "WriteCapacityUnits": number } }, "LocalSecondaryIndexes": { "string" : { "CapacityUnits": number, "ReadCapacityUnits": number, "WriteCapacityUnits": number } }, "ReadCapacityUnits": number, "Table": { "CapacityUnits": number, "ReadCapacityUnits": number, "WriteCapacityUnits": number }, "TableName": "string", "WriteCapacityUnits": number }"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_CONSUMED_CAPACITY = 'aws.dynamodb.consumed_capacity' as const;

/**
 * The value of the `Count` response parameter.
 *
 * @example 10
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_COUNT = 'aws.dynamodb.count' as const;

/**
 * The value of the `ExclusiveStartTableName` request parameter.
 *
 * @example Users
 * @example CatsTable
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_EXCLUSIVE_START_TABLE =
  'aws.dynamodb.exclusive_start_table' as const;

/**
 * The JSON-serialized value of each item in the `GlobalSecondaryIndexUpdates` request field.
 *
 * @example ["{ "Create": { "IndexName": "string", "KeySchema": [ { "AttributeName": "string", "KeyType": "string" } ], "Projection": { "NonKeyAttributes": [ "string" ], "ProjectionType": "string" }, "ProvisionedThroughput": { "ReadCapacityUnits": number, "WriteCapacityUnits": number } }"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES =
  'aws.dynamodb.global_secondary_index_updates' as const;

/**
 * The JSON-serialized value of each item of the `GlobalSecondaryIndexes` request field
 *
 * @example ["{ "IndexName": "string", "KeySchema": [ { "AttributeName": "string", "KeyType": "string" } ], "Projection": { "NonKeyAttributes": [ "string" ], "ProjectionType": "string" }, "ProvisionedThroughput": { "ReadCapacityUnits": number, "WriteCapacityUnits": number } }"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES =
  'aws.dynamodb.global_secondary_indexes' as const;

/**
 * The value of the `IndexName` request parameter.
 *
 * @example name_to_group
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_INDEX_NAME = 'aws.dynamodb.index_name' as const;

/**
 * The JSON-serialized value of the `ItemCollectionMetrics` response field.
 *
 * @example { "string" : [ { "ItemCollectionKey": { "string" : { "B": blob, "BOOL": boolean, "BS": [ blob ], "L": [ "AttributeValue" ], "M": { "string" : "AttributeValue" }, "N": "string", "NS": [ "string" ], "NULL": boolean, "S": "string", "SS": [ "string" ] } }, "SizeEstimateRangeGB": [ number ] } ] }
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_ITEM_COLLECTION_METRICS =
  'aws.dynamodb.item_collection_metrics' as const;

/**
 * The value of the `Limit` request parameter.
 *
 * @example 10
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_LIMIT = 'aws.dynamodb.limit' as const;

/**
 * The JSON-serialized value of each item of the `LocalSecondaryIndexes` request field.
 *
 * @example ["{ "IndexArn": "string", "IndexName": "string", "IndexSizeBytes": number, "ItemCount": number, "KeySchema": [ { "AttributeName": "string", "KeyType": "string" } ], "Projection": { "NonKeyAttributes": [ "string" ], "ProjectionType": "string" } }"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES =
  'aws.dynamodb.local_secondary_indexes' as const;

/**
 * The value of the `ProjectionExpression` request parameter.
 *
 * @example Title
 * @example Title, Price, Color
 * @example Title, Description, RelatedItems, ProductReviews
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_PROJECTION = 'aws.dynamodb.projection' as const;

/**
 * The value of the `ProvisionedThroughput.ReadCapacityUnits` request parameter.
 *
 * @example 1.0
 * @example 2.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY =
  'aws.dynamodb.provisioned_read_capacity' as const;

/**
 * The value of the `ProvisionedThroughput.WriteCapacityUnits` request parameter.
 *
 * @example 1.0
 * @example 2.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY =
  'aws.dynamodb.provisioned_write_capacity' as const;

/**
 * The value of the `ScanIndexForward` request parameter.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_SCAN_FORWARD = 'aws.dynamodb.scan_forward' as const;

/**
 * The value of the `ScannedCount` response parameter.
 *
 * @example 50
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_SCANNED_COUNT = 'aws.dynamodb.scanned_count' as const;

/**
 * The value of the `Segment` request parameter.
 *
 * @example 10
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_SEGMENT = 'aws.dynamodb.segment' as const;

/**
 * The value of the `Select` request parameter.
 *
 * @example ALL_ATTRIBUTES
 * @example COUNT
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_SELECT = 'aws.dynamodb.select' as const;

/**
 * The number of items in the `TableNames` response parameter.
 *
 * @example 20
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_TABLE_COUNT = 'aws.dynamodb.table_count' as const;

/**
 * The keys in the `RequestItems` object field.
 *
 * @example ["Users", "Cats"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_TABLE_NAMES = 'aws.dynamodb.table_names' as const;

/**
 * The value of the `TotalSegments` request parameter.
 *
 * @example 100
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_DYNAMODB_TOTAL_SEGMENTS = 'aws.dynamodb.total_segments' as const;

/**
 * The ARN of an [ECS cluster](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/clusters.html).
 *
 * @example arn:aws:ecs:us-west-2:123456789123:cluster/my-cluster
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_ECS_CLUSTER_ARN = 'aws.ecs.cluster.arn' as const;

/**
 * The Amazon Resource Name (ARN) of an [ECS container instance](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ECS_instances.html).
 *
 * @example arn:aws:ecs:us-west-1:123456789123:container/32624152-9086-4f0e-acae-1a75b14fe4d9
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_ECS_CONTAINER_ARN = 'aws.ecs.container.arn' as const;

/**
 * The [launch type](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/launch_types.html) for an ECS task.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_ECS_LAUNCHTYPE = 'aws.ecs.launchtype' as const;

/**
 * Enum value "ec2" for attribute {@link ATTR_AWS_ECS_LAUNCHTYPE}.
 */
export const AWS_ECS_LAUNCHTYPE_VALUE_EC2 = 'ec2' as const;

/**
 * Enum value "fargate" for attribute {@link ATTR_AWS_ECS_LAUNCHTYPE}.
 */
export const AWS_ECS_LAUNCHTYPE_VALUE_FARGATE = 'fargate' as const;

/**
 * The ARN of a running [ECS task](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-account-settings.html#ecs-resource-ids).
 *
 * @example arn:aws:ecs:us-west-1:123456789123:task/10838bed-421f-43ef-870a-f43feacbbb5b
 * @example arn:aws:ecs:us-west-1:123456789123:task/my-cluster/task-id/23ebb8ac-c18f-46c6-8bbe-d55d0e37cfbd
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_ECS_TASK_ARN = 'aws.ecs.task.arn' as const;

/**
 * The family name of the [ECS task definition](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html) used to create the ECS task.
 *
 * @example opentelemetry-family
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_ECS_TASK_FAMILY = 'aws.ecs.task.family' as const;

/**
 * The ID of a running ECS task. The ID **MUST** be extracted from `task.arn`.
 *
 * @example 10838bed-421f-43ef-870a-f43feacbbb5b
 * @example 23ebb8ac-c18f-46c6-8bbe-d55d0e37cfbd
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_ECS_TASK_ID = 'aws.ecs.task.id' as const;

/**
 * The revision for the task definition used to create the ECS task.
 *
 * @example 8
 * @example 26
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_ECS_TASK_REVISION = 'aws.ecs.task.revision' as const;

/**
 * The ARN of an EKS cluster.
 *
 * @example arn:aws:ecs:us-west-2:123456789123:cluster/my-cluster
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_EKS_CLUSTER_ARN = 'aws.eks.cluster.arn' as const;

/**
 * The AWS extended request ID as returned in the response header `x-amz-id-2`.
 *
 * @example wzHcyEWfmOGDIE5QOhTAqFDoDWP3y8IUvpNINCwL9N4TEHbUw0/gZJ+VZTmCNCWR7fezEN3eCiQ=
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_EXTENDED_REQUEST_ID = 'aws.extended_request_id' as const;

/**
 * The full invoked ARN as provided on the `Context` passed to the function (`Lambda-Runtime-Invoked-Function-Arn` header on the `/runtime/invocation/next` applicable).
 *
 * @example arn:aws:lambda:us-east-1:123456:function:myfunction:myalias
 *
 * @note This may be different from `cloud.resource_id` if an alias is involved.
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_LAMBDA_INVOKED_ARN = 'aws.lambda.invoked_arn' as const;

/**
 * The Amazon Resource Name(s) (ARN) of the AWS log group(s).
 *
 * @example ["arn:aws:logs:us-west-1:123456789012:log-group:/aws/my/group:*"]
 *
 * @note See the [log group ARN format documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/iam-access-control-overview-cwl.html#CWL_ARN_Format).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_LOG_GROUP_ARNS = 'aws.log.group.arns' as const;

/**
 * The name(s) of the AWS log group(s) an application is writing to.
 *
 * @example ["/aws/lambda/my-function", "opentelemetry-service"]
 *
 * @note Multiple log groups must be supported for cases like multi-container applications, where a single application has sidecar containers, and each write to their own log group.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_LOG_GROUP_NAMES = 'aws.log.group.names' as const;

/**
 * The ARN(s) of the AWS log stream(s).
 *
 * @example ["arn:aws:logs:us-west-1:123456789012:log-group:/aws/my/group:log-stream:logs/main/10838bed-421f-43ef-870a-f43feacbbb5b"]
 *
 * @note See the [log stream ARN format documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/iam-access-control-overview-cwl.html#CWL_ARN_Format). One log group can contain several log streams, so these ARNs necessarily identify both a log group and a log stream.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_LOG_STREAM_ARNS = 'aws.log.stream.arns' as const;

/**
 * The name(s) of the AWS log stream(s) an application is writing to.
 *
 * @example ["logs/main/10838bed-421f-43ef-870a-f43feacbbb5b"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_LOG_STREAM_NAMES = 'aws.log.stream.names' as const;

/**
 * The AWS request ID as returned in the response headers `x-amzn-requestid`, `x-amzn-request-id` or `x-amz-request-id`.
 *
 * @example 79b9da39-b7ae-508a-a6bc-864b2829c622
 * @example C9ER4AJX75574TDJ
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_REQUEST_ID = 'aws.request_id' as const;

/**
 * The S3 bucket name the request refers to. Corresponds to the `--bucket` parameter of the [S3 API](https://docs.aws.amazon.com/cli/latest/reference/s3api/index.html) operations.
 *
 * @example some-bucket-name
 *
 * @note The `bucket` attribute is applicable to all S3 operations that reference a bucket, i.e. that require the bucket name as a mandatory parameter.
 * This applies to almost all S3 operations except `list-buckets`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_S3_BUCKET = 'aws.s3.bucket' as const;

/**
 * The source object (in the form `bucket`/`key`) for the copy operation.
 *
 * @example someFile.yml
 *
 * @note The `copy_source` attribute applies to S3 copy operations and corresponds to the `--copy-source` parameter
 * of the [copy-object operation within the S3 API](https://docs.aws.amazon.com/cli/latest/reference/s3api/copy-object.html).
 * This applies in particular to the following operations:
 *
 *   - [copy-object](https://docs.aws.amazon.com/cli/latest/reference/s3api/copy-object.html)
 *   - [upload-part-copy](https://docs.aws.amazon.com/cli/latest/reference/s3api/upload-part-copy.html)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_S3_COPY_SOURCE = 'aws.s3.copy_source' as const;

/**
 * The delete request container that specifies the objects to be deleted.
 *
 * @example Objects=[{Key=string,VersionId=string},{Key=string,VersionId=string}],Quiet=boolean
 *
 * @note The `delete` attribute is only applicable to the [delete-object](https://docs.aws.amazon.com/cli/latest/reference/s3api/delete-object.html) operation.
 * The `delete` attribute corresponds to the `--delete` parameter of the
 * [delete-objects operation within the S3 API](https://docs.aws.amazon.com/cli/latest/reference/s3api/delete-objects.html).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_S3_DELETE = 'aws.s3.delete' as const;

/**
 * The S3 object key the request refers to. Corresponds to the `--key` parameter of the [S3 API](https://docs.aws.amazon.com/cli/latest/reference/s3api/index.html) operations.
 *
 * @example someFile.yml
 *
 * @note The `key` attribute is applicable to all object-related S3 operations, i.e. that require the object key as a mandatory parameter.
 * This applies in particular to the following operations:
 *
 *   - [copy-object](https://docs.aws.amazon.com/cli/latest/reference/s3api/copy-object.html)
 *   - [delete-object](https://docs.aws.amazon.com/cli/latest/reference/s3api/delete-object.html)
 *   - [get-object](https://docs.aws.amazon.com/cli/latest/reference/s3api/get-object.html)
 *   - [head-object](https://docs.aws.amazon.com/cli/latest/reference/s3api/head-object.html)
 *   - [put-object](https://docs.aws.amazon.com/cli/latest/reference/s3api/put-object.html)
 *   - [restore-object](https://docs.aws.amazon.com/cli/latest/reference/s3api/restore-object.html)
 *   - [select-object-content](https://docs.aws.amazon.com/cli/latest/reference/s3api/select-object-content.html)
 *   - [abort-multipart-upload](https://docs.aws.amazon.com/cli/latest/reference/s3api/abort-multipart-upload.html)
 *   - [complete-multipart-upload](https://docs.aws.amazon.com/cli/latest/reference/s3api/complete-multipart-upload.html)
 *   - [create-multipart-upload](https://docs.aws.amazon.com/cli/latest/reference/s3api/create-multipart-upload.html)
 *   - [list-parts](https://docs.aws.amazon.com/cli/latest/reference/s3api/list-parts.html)
 *   - [upload-part](https://docs.aws.amazon.com/cli/latest/reference/s3api/upload-part.html)
 *   - [upload-part-copy](https://docs.aws.amazon.com/cli/latest/reference/s3api/upload-part-copy.html)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_S3_KEY = 'aws.s3.key' as const;

/**
 * The part number of the part being uploaded in a multipart-upload operation. This is a positive integer between 1 and 10,000.
 *
 * @example 3456
 *
 * @note The `part_number` attribute is only applicable to the [upload-part](https://docs.aws.amazon.com/cli/latest/reference/s3api/upload-part.html)
 * and [upload-part-copy](https://docs.aws.amazon.com/cli/latest/reference/s3api/upload-part-copy.html) operations.
 * The `part_number` attribute corresponds to the `--part-number` parameter of the
 * [upload-part operation within the S3 API](https://docs.aws.amazon.com/cli/latest/reference/s3api/upload-part.html).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_S3_PART_NUMBER = 'aws.s3.part_number' as const;

/**
 * Upload ID that identifies the multipart upload.
 *
 * @example dfRtDYWFbkRONycy.Yxwh66Yjlx.cph0gtNBtJ
 *
 * @note The `upload_id` attribute applies to S3 multipart-upload operations and corresponds to the `--upload-id` parameter
 * of the [S3 API](https://docs.aws.amazon.com/cli/latest/reference/s3api/index.html) multipart operations.
 * This applies in particular to the following operations:
 *
 *   - [abort-multipart-upload](https://docs.aws.amazon.com/cli/latest/reference/s3api/abort-multipart-upload.html)
 *   - [complete-multipart-upload](https://docs.aws.amazon.com/cli/latest/reference/s3api/complete-multipart-upload.html)
 *   - [list-parts](https://docs.aws.amazon.com/cli/latest/reference/s3api/list-parts.html)
 *   - [upload-part](https://docs.aws.amazon.com/cli/latest/reference/s3api/upload-part.html)
 *   - [upload-part-copy](https://docs.aws.amazon.com/cli/latest/reference/s3api/upload-part-copy.html)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AWS_S3_UPLOAD_ID = 'aws.s3.upload_id' as const;

/**
 * [Azure Resource Provider Namespace](https://learn.microsoft.com/azure/azure-resource-manager/management/azure-services-resource-providers) as recognized by the client.
 *
 * @example Microsoft.Storage
 * @example Microsoft.KeyVault
 * @example Microsoft.ServiceBus
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZ_NAMESPACE = 'az.namespace' as const;

/**
 * The unique identifier of the service request. It's generated by the Azure service and returned with the response.
 *
 * @example 00000000-0000-0000-0000-000000000000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZ_SERVICE_REQUEST_ID = 'az.service_request_id' as const;

/**
 * The unique identifier of the client instance.
 *
 * @example 3ba4827d-4422-483f-b59f-85b74211c11d
 * @example storage-client-1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZURE_CLIENT_ID = 'azure.client.id' as const;

/**
 * Cosmos client connection mode.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZURE_COSMOSDB_CONNECTION_MODE = 'azure.cosmosdb.connection.mode' as const;

/**
 * Enum value "direct" for attribute {@link ATTR_AZURE_COSMOSDB_CONNECTION_MODE}.
 */
export const AZURE_COSMOSDB_CONNECTION_MODE_VALUE_DIRECT = 'direct' as const;

/**
 * Enum value "gateway" for attribute {@link ATTR_AZURE_COSMOSDB_CONNECTION_MODE}.
 */
export const AZURE_COSMOSDB_CONNECTION_MODE_VALUE_GATEWAY = 'gateway' as const;

/**
 * Account or request [consistency level](https://learn.microsoft.com/azure/cosmos-db/consistency-levels).
 *
 * @example Eventual
 * @example ConsistentPrefix
 * @example BoundedStaleness
 * @example Strong
 * @example Session
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZURE_COSMOSDB_CONSISTENCY_LEVEL = 'azure.cosmosdb.consistency.level' as const;

/**
 * Enum value "BoundedStaleness" for attribute {@link ATTR_AZURE_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const AZURE_COSMOSDB_CONSISTENCY_LEVEL_VALUE_BOUNDED_STALENESS = 'BoundedStaleness' as const;

/**
 * Enum value "ConsistentPrefix" for attribute {@link ATTR_AZURE_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const AZURE_COSMOSDB_CONSISTENCY_LEVEL_VALUE_CONSISTENT_PREFIX = 'ConsistentPrefix' as const;

/**
 * Enum value "Eventual" for attribute {@link ATTR_AZURE_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const AZURE_COSMOSDB_CONSISTENCY_LEVEL_VALUE_EVENTUAL = 'Eventual' as const;

/**
 * Enum value "Session" for attribute {@link ATTR_AZURE_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const AZURE_COSMOSDB_CONSISTENCY_LEVEL_VALUE_SESSION = 'Session' as const;

/**
 * Enum value "Strong" for attribute {@link ATTR_AZURE_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const AZURE_COSMOSDB_CONSISTENCY_LEVEL_VALUE_STRONG = 'Strong' as const;

/**
 * List of regions contacted during operation in the order that they were contacted. If there is more than one region listed, it indicates that the operation was performed on multiple regions i.e. cross-regional call.
 *
 * @example ["North Central US", "Australia East", "Australia Southeast"]
 *
 * @note Region name matches the format of `displayName` in [Azure Location API](https://learn.microsoft.com/rest/api/subscription/subscriptions/list-locations?view=rest-subscription-2021-10-01&tabs=HTTP#location)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZURE_COSMOSDB_OPERATION_CONTACTED_REGIONS =
  'azure.cosmosdb.operation.contacted_regions' as const;

/**
 * The number of request units consumed by the operation.
 *
 * @example 46.18
 * @example 1.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZURE_COSMOSDB_OPERATION_REQUEST_CHARGE =
  'azure.cosmosdb.operation.request_charge' as const;

/**
 * Request payload size in bytes.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZURE_COSMOSDB_REQUEST_BODY_SIZE = 'azure.cosmosdb.request.body.size' as const;

/**
 * Cosmos DB sub status code.
 *
 * @example 1000
 * @example 1002
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_AZURE_COSMOSDB_RESPONSE_SUB_STATUS_CODE =
  'azure.cosmosdb.response.sub_status_code' as const;

/**
 * Array of brand name and version separated by a space
 *
 * @example [" Not A;Brand 99", "Chromium 99", "Chrome 99"]
 *
 * @note This value is intended to be taken from the [UA client hints API](https://wicg.github.io/ua-client-hints/#interface) (`navigator.userAgentData.brands`).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_BROWSER_BRANDS = 'browser.brands' as const;

/**
 * Preferred language of the user using the browser
 *
 * @example en
 * @example en-US
 * @example fr
 * @example fr-FR
 *
 * @note This value is intended to be taken from the Navigator API `navigator.language`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_BROWSER_LANGUAGE = 'browser.language' as const;

/**
 * A boolean that is true if the browser is running on a mobile device
 *
 * @note This value is intended to be taken from the [UA client hints API](https://wicg.github.io/ua-client-hints/#interface) (`navigator.userAgentData.mobile`). If unavailable, this attribute **SHOULD** be left unset.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_BROWSER_MOBILE = 'browser.mobile' as const;

/**
 * The platform on which the browser is running
 *
 * @example Windows
 * @example macOS
 * @example Android
 *
 * @note This value is intended to be taken from the [UA client hints API](https://wicg.github.io/ua-client-hints/#interface) (`navigator.userAgentData.platform`). If unavailable, the legacy `navigator.platform` API **SHOULD NOT** be used instead and this attribute **SHOULD** be left unset in order for the values to be consistent.
 * The list of possible values is defined in the [W3C User-Agent Client Hints specification](https://wicg.github.io/ua-client-hints/#sec-ch-ua-platform). Note that some (but not all) of these values can overlap with values in the [`os.type` and `os.name` attributes](./os.md). However, for consistency, the values in the `browser.platform` attribute should capture the exact value that the user agent provides.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_BROWSER_PLATFORM = 'browser.platform' as const;

/**
 * The consistency level of the query. Based on consistency values from [CQL](https://docs.datastax.com/en/cassandra-oss/3.0/cassandra/dml/dmlConfigConsistency.html).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CASSANDRA_CONSISTENCY_LEVEL = 'cassandra.consistency.level' as const;

/**
 * Enum value "all" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_ALL = 'all' as const;

/**
 * Enum value "any" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_ANY = 'any' as const;

/**
 * Enum value "each_quorum" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_EACH_QUORUM = 'each_quorum' as const;

/**
 * Enum value "local_one" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_LOCAL_ONE = 'local_one' as const;

/**
 * Enum value "local_quorum" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_LOCAL_QUORUM = 'local_quorum' as const;

/**
 * Enum value "local_serial" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_LOCAL_SERIAL = 'local_serial' as const;

/**
 * Enum value "one" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_ONE = 'one' as const;

/**
 * Enum value "quorum" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_QUORUM = 'quorum' as const;

/**
 * Enum value "serial" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_SERIAL = 'serial' as const;

/**
 * Enum value "three" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_THREE = 'three' as const;

/**
 * Enum value "two" for attribute {@link ATTR_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const CASSANDRA_CONSISTENCY_LEVEL_VALUE_TWO = 'two' as const;

/**
 * The data center of the coordinating node for a query.
 *
 * @example "us-west-2"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CASSANDRA_COORDINATOR_DC = 'cassandra.coordinator.dc' as const;

/**
 * The ID of the coordinating node for a query.
 *
 * @example "be13faa2-8574-4d71-926d-27f16cf8a7af"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CASSANDRA_COORDINATOR_ID = 'cassandra.coordinator.id' as const;

/**
 * The fetch size used for paging, i.e. how many rows will be returned at once.
 *
 * @example 5000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CASSANDRA_PAGE_SIZE = 'cassandra.page.size' as const;

/**
 * Whether or not the query is idempotent.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CASSANDRA_QUERY_IDEMPOTENT = 'cassandra.query.idempotent' as const;

/**
 * The number of times a query was speculatively executed. Not set or `0` if the query was not executed speculatively.
 *
 * @example 0
 * @example 2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CASSANDRA_SPECULATIVE_EXECUTION_COUNT =
  'cassandra.speculative_execution.count' as const;

/**
 * The human readable name of the pipeline within a CI/CD system.
 *
 * @example Build and Test
 * @example Lint
 * @example Deploy Go Project
 * @example deploy_to_environment
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_NAME = 'cicd.pipeline.name' as const;

/**
 * The result of a pipeline run.
 *
 * @example success
 * @example failure
 * @example timeout
 * @example skipped
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_RESULT = 'cicd.pipeline.result' as const;

/**
 * Enum value "cancellation" for attribute {@link ATTR_CICD_PIPELINE_RESULT}.
 */
export const CICD_PIPELINE_RESULT_VALUE_CANCELLATION = 'cancellation' as const;

/**
 * Enum value "error" for attribute {@link ATTR_CICD_PIPELINE_RESULT}.
 */
export const CICD_PIPELINE_RESULT_VALUE_ERROR = 'error' as const;

/**
 * Enum value "failure" for attribute {@link ATTR_CICD_PIPELINE_RESULT}.
 */
export const CICD_PIPELINE_RESULT_VALUE_FAILURE = 'failure' as const;

/**
 * Enum value "skip" for attribute {@link ATTR_CICD_PIPELINE_RESULT}.
 */
export const CICD_PIPELINE_RESULT_VALUE_SKIP = 'skip' as const;

/**
 * Enum value "success" for attribute {@link ATTR_CICD_PIPELINE_RESULT}.
 */
export const CICD_PIPELINE_RESULT_VALUE_SUCCESS = 'success' as const;

/**
 * Enum value "timeout" for attribute {@link ATTR_CICD_PIPELINE_RESULT}.
 */
export const CICD_PIPELINE_RESULT_VALUE_TIMEOUT = 'timeout' as const;

/**
 * The unique identifier of a pipeline run within a CI/CD system.
 *
 * @example 120912
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_RUN_ID = 'cicd.pipeline.run.id' as const;

/**
 * The pipeline run goes through these states during its lifecycle.
 *
 * @example pending
 * @example executing
 * @example finalizing
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_RUN_STATE = 'cicd.pipeline.run.state' as const;

/**
 * Enum value "executing" for attribute {@link ATTR_CICD_PIPELINE_RUN_STATE}.
 */
export const CICD_PIPELINE_RUN_STATE_VALUE_EXECUTING = 'executing' as const;

/**
 * Enum value "finalizing" for attribute {@link ATTR_CICD_PIPELINE_RUN_STATE}.
 */
export const CICD_PIPELINE_RUN_STATE_VALUE_FINALIZING = 'finalizing' as const;

/**
 * Enum value "pending" for attribute {@link ATTR_CICD_PIPELINE_RUN_STATE}.
 */
export const CICD_PIPELINE_RUN_STATE_VALUE_PENDING = 'pending' as const;

/**
 * The [URL](https://wikipedia.org/wiki/URL) of the pipeline run, providing the complete address in order to locate and identify the pipeline run.
 *
 * @example https://github.com/open-telemetry/semantic-conventions/actions/runs/9753949763?pr=1075
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_RUN_URL_FULL = 'cicd.pipeline.run.url.full' as const;

/**
 * The human readable name of a task within a pipeline. Task here most closely aligns with a [computing process](https://wikipedia.org/wiki/Pipeline_(computing)) in a pipeline. Other terms for tasks include commands, steps, and procedures.
 *
 * @example Run GoLang Linter
 * @example Go Build
 * @example go-test
 * @example deploy_binary
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_TASK_NAME = 'cicd.pipeline.task.name' as const;

/**
 * The unique identifier of a task run within a pipeline.
 *
 * @example 12097
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_TASK_RUN_ID = 'cicd.pipeline.task.run.id' as const;

/**
 * The [URL](https://wikipedia.org/wiki/URL) of the pipeline task run, providing the complete address in order to locate and identify the pipeline task run.
 *
 * @example https://github.com/open-telemetry/semantic-conventions/actions/runs/9753949763/job/26920038674?pr=1075
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_TASK_RUN_URL_FULL = 'cicd.pipeline.task.run.url.full' as const;

/**
 * The type of the task within a pipeline.
 *
 * @example build
 * @example test
 * @example deploy
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_PIPELINE_TASK_TYPE = 'cicd.pipeline.task.type' as const;

/**
 * Enum value "build" for attribute {@link ATTR_CICD_PIPELINE_TASK_TYPE}.
 */
export const CICD_PIPELINE_TASK_TYPE_VALUE_BUILD = 'build' as const;

/**
 * Enum value "deploy" for attribute {@link ATTR_CICD_PIPELINE_TASK_TYPE}.
 */
export const CICD_PIPELINE_TASK_TYPE_VALUE_DEPLOY = 'deploy' as const;

/**
 * Enum value "test" for attribute {@link ATTR_CICD_PIPELINE_TASK_TYPE}.
 */
export const CICD_PIPELINE_TASK_TYPE_VALUE_TEST = 'test' as const;

/**
 * The name of a component of the CICD system.
 *
 * @example controller
 * @example scheduler
 * @example agent
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_SYSTEM_COMPONENT = 'cicd.system.component' as const;

/**
 * The state of a CICD worker / agent.
 *
 * @example idle
 * @example busy
 * @example down
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CICD_WORKER_STATE = 'cicd.worker.state' as const;

/**
 * Enum value "available" for attribute {@link ATTR_CICD_WORKER_STATE}.
 */
export const CICD_WORKER_STATE_VALUE_AVAILABLE = 'available' as const;

/**
 * Enum value "busy" for attribute {@link ATTR_CICD_WORKER_STATE}.
 */
export const CICD_WORKER_STATE_VALUE_BUSY = 'busy' as const;

/**
 * Enum value "offline" for attribute {@link ATTR_CICD_WORKER_STATE}.
 */
export const CICD_WORKER_STATE_VALUE_OFFLINE = 'offline' as const;

/**
 * The cloud account ID the resource is assigned to.
 *
 * @example 111111111111
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUD_ACCOUNT_ID = 'cloud.account.id' as const;

/**
 * Cloud regions often have multiple, isolated locations known as zones to increase availability. Availability zone represents the zone where the resource is running.
 *
 * @example us-east-1c
 *
 * @note Availability zones are called "zones" on Alibaba Cloud and Google Cloud.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUD_AVAILABILITY_ZONE = 'cloud.availability_zone' as const;

/**
 * The cloud platform in use.
 *
 * @note The prefix of the service **SHOULD** match the one specified in `cloud.provider`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUD_PLATFORM = 'cloud.platform' as const;

/**
 * Enum value "alibaba_cloud_ecs" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_ALIBABA_CLOUD_ECS = 'alibaba_cloud_ecs' as const;

/**
 * Enum value "alibaba_cloud_fc" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_ALIBABA_CLOUD_FC = 'alibaba_cloud_fc' as const;

/**
 * Enum value "alibaba_cloud_openshift" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_ALIBABA_CLOUD_OPENSHIFT = 'alibaba_cloud_openshift' as const;

/**
 * Enum value "aws_app_runner" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AWS_APP_RUNNER = 'aws_app_runner' as const;

/**
 * Enum value "aws_ec2" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AWS_EC2 = 'aws_ec2' as const;

/**
 * Enum value "aws_ecs" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AWS_ECS = 'aws_ecs' as const;

/**
 * Enum value "aws_eks" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AWS_EKS = 'aws_eks' as const;

/**
 * Enum value "aws_elastic_beanstalk" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AWS_ELASTIC_BEANSTALK = 'aws_elastic_beanstalk' as const;

/**
 * Enum value "aws_lambda" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AWS_LAMBDA = 'aws_lambda' as const;

/**
 * Enum value "aws_openshift" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AWS_OPENSHIFT = 'aws_openshift' as const;

/**
 * Enum value "azure_aks" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AZURE_AKS = 'azure_aks' as const;

/**
 * Enum value "azure_app_service" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AZURE_APP_SERVICE = 'azure_app_service' as const;

/**
 * Enum value "azure_container_apps" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AZURE_CONTAINER_APPS = 'azure_container_apps' as const;

/**
 * Enum value "azure_container_instances" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AZURE_CONTAINER_INSTANCES = 'azure_container_instances' as const;

/**
 * Enum value "azure_functions" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AZURE_FUNCTIONS = 'azure_functions' as const;

/**
 * Enum value "azure_openshift" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AZURE_OPENSHIFT = 'azure_openshift' as const;

/**
 * Enum value "azure_vm" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_AZURE_VM = 'azure_vm' as const;

/**
 * Enum value "gcp_app_engine" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_GCP_APP_ENGINE = 'gcp_app_engine' as const;

/**
 * Enum value "gcp_bare_metal_solution" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_GCP_BARE_METAL_SOLUTION = 'gcp_bare_metal_solution' as const;

/**
 * Enum value "gcp_cloud_functions" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_GCP_CLOUD_FUNCTIONS = 'gcp_cloud_functions' as const;

/**
 * Enum value "gcp_cloud_run" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_GCP_CLOUD_RUN = 'gcp_cloud_run' as const;

/**
 * Enum value "gcp_compute_engine" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_GCP_COMPUTE_ENGINE = 'gcp_compute_engine' as const;

/**
 * Enum value "gcp_kubernetes_engine" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_GCP_KUBERNETES_ENGINE = 'gcp_kubernetes_engine' as const;

/**
 * Enum value "gcp_openshift" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_GCP_OPENSHIFT = 'gcp_openshift' as const;

/**
 * Enum value "ibm_cloud_openshift" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_IBM_CLOUD_OPENSHIFT = 'ibm_cloud_openshift' as const;

/**
 * Enum value "oracle_cloud_compute" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_ORACLE_CLOUD_COMPUTE = 'oracle_cloud_compute' as const;

/**
 * Enum value "oracle_cloud_oke" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_ORACLE_CLOUD_OKE = 'oracle_cloud_oke' as const;

/**
 * Enum value "tencent_cloud_cvm" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_TENCENT_CLOUD_CVM = 'tencent_cloud_cvm' as const;

/**
 * Enum value "tencent_cloud_eks" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_TENCENT_CLOUD_EKS = 'tencent_cloud_eks' as const;

/**
 * Enum value "tencent_cloud_scf" for attribute {@link ATTR_CLOUD_PLATFORM}.
 */
export const CLOUD_PLATFORM_VALUE_TENCENT_CLOUD_SCF = 'tencent_cloud_scf' as const;

/**
 * Name of the cloud provider.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUD_PROVIDER = 'cloud.provider' as const;

/**
 * Enum value "alibaba_cloud" for attribute {@link ATTR_CLOUD_PROVIDER}.
 */
export const CLOUD_PROVIDER_VALUE_ALIBABA_CLOUD = 'alibaba_cloud' as const;

/**
 * Enum value "aws" for attribute {@link ATTR_CLOUD_PROVIDER}.
 */
export const CLOUD_PROVIDER_VALUE_AWS = 'aws' as const;

/**
 * Enum value "azure" for attribute {@link ATTR_CLOUD_PROVIDER}.
 */
export const CLOUD_PROVIDER_VALUE_AZURE = 'azure' as const;

/**
 * Enum value "gcp" for attribute {@link ATTR_CLOUD_PROVIDER}.
 */
export const CLOUD_PROVIDER_VALUE_GCP = 'gcp' as const;

/**
 * Enum value "heroku" for attribute {@link ATTR_CLOUD_PROVIDER}.
 */
export const CLOUD_PROVIDER_VALUE_HEROKU = 'heroku' as const;

/**
 * Enum value "ibm_cloud" for attribute {@link ATTR_CLOUD_PROVIDER}.
 */
export const CLOUD_PROVIDER_VALUE_IBM_CLOUD = 'ibm_cloud' as const;

/**
 * Enum value "oracle_cloud" for attribute {@link ATTR_CLOUD_PROVIDER}.
 */
export const CLOUD_PROVIDER_VALUE_ORACLE_CLOUD = 'oracle_cloud' as const;

/**
 * Enum value "tencent_cloud" for attribute {@link ATTR_CLOUD_PROVIDER}.
 */
export const CLOUD_PROVIDER_VALUE_TENCENT_CLOUD = 'tencent_cloud' as const;

/**
 * The geographical region the resource is running.
 *
 * @example us-central1
 * @example us-east-1
 *
 * @note Refer to your provider's docs to see the available regions, for example [Alibaba Cloud regions](https://www.alibabacloud.com/help/doc-detail/40654.htm), [AWS regions](https://aws.amazon.com/about-aws/global-infrastructure/regions_az/), [Azure regions](https://azure.microsoft.com/global-infrastructure/geographies/), [Google Cloud regions](https://cloud.google.com/about/locations), or [Tencent Cloud regions](https://www.tencentcloud.com/document/product/213/6091).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUD_REGION = 'cloud.region' as const;

/**
 * Cloud provider-specific native identifier of the monitored cloud resource (e.g. an [ARN](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html) on AWS, a [fully qualified resource ID](https://learn.microsoft.com/rest/api/resources/resources/get-by-id) on Azure, a [full resource name](https://google.aip.dev/122#full-resource-names) on GCP)
 *
 * @example arn:aws:lambda:REGION:ACCOUNT_ID:function:my-function
 * @example //run.googleapis.com/projects/PROJECT_ID/locations/LOCATION_ID/services/SERVICE_ID
 * @example /subscriptions/<SUBSCRIPTION_GUID>/resourceGroups/<RG>/providers/Microsoft.Web/sites/<FUNCAPP>/functions/<FUNC>
 *
 * @note On some cloud providers, it may not be possible to determine the full ID at startup,
 * so it may be necessary to set `cloud.resource_id` as a span attribute instead.
 *
 * The exact value to use for `cloud.resource_id` depends on the cloud provider.
 * The following well-known definitions **MUST** be used if you set this attribute and they apply:
 *
 *   - **AWS Lambda:** The function [ARN](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html).
 *     Take care not to use the "invoked ARN" directly but replace any
 *     [alias suffix](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)
 *     with the resolved function version, as the same runtime instance may be invocable with
 *     multiple different aliases.
 *   - **GCP:** The [URI of the resource](https://cloud.google.com/iam/docs/full-resource-names)
 *   - **Azure:** The [Fully Qualified Resource ID](https://docs.microsoft.com/rest/api/resources/resources/get-by-id) of the invoked function,
 *     *not* the function app, having the form
 *     `/subscriptions/<SUBSCRIPTION_GUID>/resourceGroups/<RG>/providers/Microsoft.Web/sites/<FUNCAPP>/functions/<FUNC>`.
 *     This means that a span attribute **MUST** be used, as an Azure function app can host multiple functions that would usually share
 *     a TracerProvider.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUD_RESOURCE_ID = 'cloud.resource_id' as const;

/**
 * The [event_id](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#id) uniquely identifies the event.
 *
 * @example 123e4567-e89b-12d3-a456-426614174000
 * @example 0001
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDEVENTS_EVENT_ID = 'cloudevents.event_id' as const;

/**
 * The [source](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#source-1) identifies the context in which an event happened.
 *
 * @example https://github.com/cloudevents
 * @example /cloudevents/spec/pull/123
 * @example my-service
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDEVENTS_EVENT_SOURCE = 'cloudevents.event_source' as const;

/**
 * The [version of the CloudEvents specification](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#specversion) which the event uses.
 *
 * @example "1.0"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDEVENTS_EVENT_SPEC_VERSION = 'cloudevents.event_spec_version' as const;

/**
 * The [subject](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#subject) of the event in the context of the event producer (identified by source).
 *
 * @example "mynewfile.jpg"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDEVENTS_EVENT_SUBJECT = 'cloudevents.event_subject' as const;

/**
 * The [event_type](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#type) contains a value describing the type of event related to the originating occurrence.
 *
 * @example com.github.pull_request.opened
 * @example com.example.object.deleted.v2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDEVENTS_EVENT_TYPE = 'cloudevents.event_type' as const;

/**
 * The guid of the application.
 *
 * @example 218fc5a9-a5f1-4b54-aa05-46717d0ab26d
 *
 * @note Application instrumentation should use the value from environment
 * variable `VCAP_APPLICATION.application_id`. This is the same value as
 * reported by `cf app <app-name> --guid`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_APP_ID = 'cloudfoundry.app.id' as const;

/**
 * The index of the application instance. 0 when just one instance is active.
 *
 * @example 0
 * @example 1
 *
 * @note CloudFoundry defines the `instance_id` in the [Loggregator v2 envelope](https://github.com/cloudfoundry/loggregator-api#v2-envelope).
 * It is used for logs and metrics emitted by CloudFoundry. It is
 * supposed to contain the application instance index for applications
 * deployed on the runtime.
 *
 * Application instrumentation should use the value from environment
 * variable `CF_INSTANCE_INDEX`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_APP_INSTANCE_ID = 'cloudfoundry.app.instance.id' as const;

/**
 * The name of the application.
 *
 * @example my-app-name
 *
 * @note Application instrumentation should use the value from environment
 * variable `VCAP_APPLICATION.application_name`. This is the same value
 * as reported by `cf apps`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_APP_NAME = 'cloudfoundry.app.name' as const;

/**
 * The guid of the CloudFoundry org the application is running in.
 *
 * @example 218fc5a9-a5f1-4b54-aa05-46717d0ab26d
 *
 * @note Application instrumentation should use the value from environment
 * variable `VCAP_APPLICATION.org_id`. This is the same value as
 * reported by `cf org <org-name> --guid`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_ORG_ID = 'cloudfoundry.org.id' as const;

/**
 * The name of the CloudFoundry organization the app is running in.
 *
 * @example my-org-name
 *
 * @note Application instrumentation should use the value from environment
 * variable `VCAP_APPLICATION.org_name`. This is the same value as
 * reported by `cf orgs`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_ORG_NAME = 'cloudfoundry.org.name' as const;

/**
 * The UID identifying the process.
 *
 * @example 218fc5a9-a5f1-4b54-aa05-46717d0ab26d
 *
 * @note Application instrumentation should use the value from environment
 * variable `VCAP_APPLICATION.process_id`. It is supposed to be equal to
 * `VCAP_APPLICATION.app_id` for applications deployed to the runtime.
 * For system components, this could be the actual PID.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_PROCESS_ID = 'cloudfoundry.process.id' as const;

/**
 * The type of process.
 *
 * @example web
 *
 * @note CloudFoundry applications can consist of multiple jobs. Usually the
 * main process will be of type `web`. There can be additional background
 * tasks or side-cars with different process types.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_PROCESS_TYPE = 'cloudfoundry.process.type' as const;

/**
 * The guid of the CloudFoundry space the application is running in.
 *
 * @example 218fc5a9-a5f1-4b54-aa05-46717d0ab26d
 *
 * @note Application instrumentation should use the value from environment
 * variable `VCAP_APPLICATION.space_id`. This is the same value as
 * reported by `cf space <space-name> --guid`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_SPACE_ID = 'cloudfoundry.space.id' as const;

/**
 * The name of the CloudFoundry space the application is running in.
 *
 * @example my-space-name
 *
 * @note Application instrumentation should use the value from environment
 * variable `VCAP_APPLICATION.space_name`. This is the same value as
 * reported by `cf spaces`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_SPACE_NAME = 'cloudfoundry.space.name' as const;

/**
 * A guid or another name describing the event source.
 *
 * @example cf/gorouter
 *
 * @note CloudFoundry defines the `source_id` in the [Loggregator v2 envelope](https://github.com/cloudfoundry/loggregator-api#v2-envelope).
 * It is used for logs and metrics emitted by CloudFoundry. It is
 * supposed to contain the component name, e.g. "gorouter", for
 * CloudFoundry components.
 *
 * When system components are instrumented, values from the
 * [Bosh spec](https://bosh.io/docs/jobs/#properties-spec)
 * should be used. The `system.id` should be set to
 * `spec.deployment/spec.name`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_SYSTEM_ID = 'cloudfoundry.system.id' as const;

/**
 * A guid describing the concrete instance of the event source.
 *
 * @example 218fc5a9-a5f1-4b54-aa05-46717d0ab26d
 *
 * @note CloudFoundry defines the `instance_id` in the [Loggregator v2 envelope](https://github.com/cloudfoundry/loggregator-api#v2-envelope).
 * It is used for logs and metrics emitted by CloudFoundry. It is
 * supposed to contain the vm id for CloudFoundry components.
 *
 * When system components are instrumented, values from the
 * [Bosh spec](https://bosh.io/docs/jobs/#properties-spec)
 * should be used. The `system.instance.id` should be set to `spec.id`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CLOUDFOUNDRY_SYSTEM_INSTANCE_ID = 'cloudfoundry.system.instance.id' as const;

/**
 * Deprecated, use `code.column.number`
 *
 * @example 16
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `code.column.number`
 */
export const ATTR_CODE_COLUMN = 'code.column' as const;

/**
 * The column number in `code.file.path` best representing the operation. It **SHOULD** point within the code unit named in `code.function.name`.
 *
 * @example 16
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CODE_COLUMN_NUMBER = 'code.column.number' as const;

/**
 * The source code file name that identifies the code unit as uniquely as possible (preferably an absolute file path).
 *
 * @example "/usr/local/MyApplication/content_root/app/index.php"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CODE_FILE_PATH = 'code.file.path' as const;

/**
 * Deprecated, use `code.file.path` instead
 *
 * @example "/usr/local/MyApplication/content_root/app/index.php"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `code.file.path`
 */
export const ATTR_CODE_FILEPATH = 'code.filepath' as const;

/**
 * Deprecated, use `code.function.name` instead
 *
 * @example "serveRequest"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `code.function.name`
 */
export const ATTR_CODE_FUNCTION = 'code.function' as const;

/**
 * The method or function fully-qualified name without arguments. The value should fit the natural representation of the language runtime, which is also likely the same used within `code.stacktrace` attribute value.
 *
 * @example com.example.MyHttpService.serveRequest
 * @example GuzzleHttp\\Client::transfer
 * @example fopen
 *
 * @note Values and format depends on each language runtime, thus it is impossible to provide an exhaustive list of examples.
 * The values are usually the same (or prefixes of) the ones found in native stack trace representation stored in
 * `code.stacktrace` without information on arguments.
 *
 * Examples:
 *
 *   - Java method: `com.example.MyHttpService.serveRequest`
 *   - Java anonymous class method: `com.mycompany.Main$1.myMethod`
 *   - Java lambda method: `com.mycompany.Main$$Lambda/0x0000748ae4149c00.myMethod`
 *   - PHP function: `GuzzleHttp\Client::transfer`
 *   - Go function: `github.com/my/repo/pkg.foo.func5`
 *   - Elixir: `OpenTelemetry.Ctx.new`
 *   - Erlang: `opentelemetry_ctx:new`
 *   - Rust: `playground::my_module::my_cool_func`
 *   - C function: `fopen`
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CODE_FUNCTION_NAME = 'code.function.name' as const;

/**
 * The line number in `code.file.path` best representing the operation. It **SHOULD** point within the code unit named in `code.function.name`.
 *
 * @example 42
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CODE_LINE_NUMBER = 'code.line.number' as const;

/**
 * Deprecated, use `code.line.number` instead
 *
 * @example 42
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `code.line.number`
 */
export const ATTR_CODE_LINENO = 'code.lineno' as const;

/**
 * Deprecated, namespace is now included into `code.function.name`
 *
 * @example "com.example.MyHttpService"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Value should be included in `code.function.name` which is expected to be a fully-qualified name.
 */
export const ATTR_CODE_NAMESPACE = 'code.namespace' as const;

/**
 * A stacktrace as a string in the natural representation for the language runtime. The representation is identical to [`exception.stacktrace`](/docs/exceptions/exceptions-spans.md#stacktrace-representation).
 *
 * @example "at com.example.GenerateTrace.methodB(GenerateTrace.java:13)\\n at com.example.GenerateTrace.methodA(GenerateTrace.java:9)\\n at com.example.GenerateTrace.main(GenerateTrace.java:5)\\n"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CODE_STACKTRACE = 'code.stacktrace' as const;

/**
 * The command used to run the container (i.e. the command name).
 *
 * @example otelcontribcol
 *
 * @note If using embedded credentials or sensitive data, it is recommended to remove them to prevent potential leakage.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_COMMAND = 'container.command' as const;

/**
 * All the command arguments (including the command/executable itself) run by the container.
 *
 * @example ["otelcontribcol", "--config", "config.yaml"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_COMMAND_ARGS = 'container.command_args' as const;

/**
 * The full command run by the container as a single string representing the full command.
 *
 * @example otelcontribcol --config config.yaml
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_COMMAND_LINE = 'container.command_line' as const;

/**
 * Deprecated, use `cpu.mode` instead.
 *
 * @example user
 * @example kernel
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cpu.mode`
 */
export const ATTR_CONTAINER_CPU_STATE = 'container.cpu.state' as const;

/**
 * Enum value "kernel" for attribute {@link ATTR_CONTAINER_CPU_STATE}.
 */
export const CONTAINER_CPU_STATE_VALUE_KERNEL = 'kernel' as const;

/**
 * Enum value "system" for attribute {@link ATTR_CONTAINER_CPU_STATE}.
 */
export const CONTAINER_CPU_STATE_VALUE_SYSTEM = 'system' as const;

/**
 * Enum value "user" for attribute {@link ATTR_CONTAINER_CPU_STATE}.
 */
export const CONTAINER_CPU_STATE_VALUE_USER = 'user' as const;

/**
 * The name of the CSI ([Container Storage Interface](https://github.com/container-storage-interface/spec)) plugin used by the volume.
 *
 * @example pd.csi.storage.gke.io
 *
 * @note This can sometimes be referred to as a "driver" in CSI implementations. This should represent the `name` field of the GetPluginInfo RPC.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_CSI_PLUGIN_NAME = 'container.csi.plugin.name' as const;

/**
 * The unique volume ID returned by the CSI ([Container Storage Interface](https://github.com/container-storage-interface/spec)) plugin.
 *
 * @example projects/my-gcp-project/zones/my-gcp-zone/disks/my-gcp-disk
 *
 * @note This can sometimes be referred to as a "volume handle" in CSI implementations. This should represent the `Volume.volume_id` field in CSI spec.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_CSI_VOLUME_ID = 'container.csi.volume.id' as const;

/**
 * Container ID. Usually a UUID, as for example used to [identify Docker containers](https://docs.docker.com/engine/containers/run/#container-identification). The UUID might be abbreviated.
 *
 * @example a3bf90e006b2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_ID = 'container.id' as const;

/**
 * Runtime specific image identifier. Usually a hash algorithm followed by a UUID.
 *
 * @example sha256:19c92d0a00d1b66d897bceaa7319bee0dd38a10a851c60bcec9474aa3f01e50f
 *
 * @note Docker defines a sha256 of the image id; `container.image.id` corresponds to the `Image` field from the Docker container inspect [API](https://docs.docker.com/engine/api/v1.43/#tag/Container/operation/ContainerInspect) endpoint.
 * K8s defines a link to the container registry repository with digest `"imageID": "registry.azurecr.io /namespace/service/dockerfile@sha256:bdeabd40c3a8a492eaf9e8e44d0ebbb84bac7ee25ac0cf8a7159d25f62555625"`.
 * The ID is assigned by the container runtime and can vary in different environments. Consider using `oci.manifest.digest` if it is important to identify the same image in different environments/runtimes.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_IMAGE_ID = 'container.image.id' as const;

/**
 * Name of the image the container was built on.
 *
 * @example gcr.io/opentelemetry/operator
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_IMAGE_NAME = 'container.image.name' as const;

/**
 * Repo digests of the container image as provided by the container runtime.
 *
 * @example ["example@sha256:afcc7f1ac1b49db317a7196c902e61c6c3c4607d63599ee1a82d702d249a0ccb", "internal.registry.example.com:5000/example@sha256:b69959407d21e8a062e0416bf13405bb2b71ed7a84dde4158ebafacfa06f5578"]
 *
 * @note [Docker](https://docs.docker.com/engine/api/v1.43/#tag/Image/operation/ImageInspect) and [CRI](https://github.com/kubernetes/cri-api/blob/c75ef5b473bbe2d0a4fc92f82235efd665ea8e9f/pkg/apis/runtime/v1/api.proto#L1237-L1238) report those under the `RepoDigests` field.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_IMAGE_REPO_DIGESTS = 'container.image.repo_digests' as const;

/**
 * Container image tags. An example can be found in [Docker Image Inspect](https://docs.docker.com/engine/api/v1.43/#tag/Image/operation/ImageInspect). Should be only the `<tag>` section of the full name for example from `registry.example.com/my-org/my-image:<tag>`.
 *
 * @example ["v1.27.1", "3.5.7-0"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_IMAGE_TAGS = 'container.image.tags' as const;

/**
 * Container labels, `<key>` being the label name, the value being the label value.
 *
 * @example container.label.app=nginx
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_LABEL = (key: string) => `container.label.${key}`;

/**
 * Deprecated, use `container.label` instead.
 *
 * @example container.label.app=nginx
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `container.label`.
 */
export const ATTR_CONTAINER_LABELS = (key: string) => `container.labels.${key}`;

/**
 * Container name used by container runtime.
 *
 * @example opentelemetry-autoconf
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_NAME = 'container.name' as const;

/**
 * The container runtime managing this container.
 *
 * @example docker
 * @example containerd
 * @example rkt
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CONTAINER_RUNTIME = 'container.runtime' as const;

/**
 * The logical CPU number [0..n-1]
 *
 * @example 1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CPU_LOGICAL_NUMBER = 'cpu.logical_number' as const;

/**
 * The mode of the CPU
 *
 * @example user
 * @example system
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CPU_MODE = 'cpu.mode' as const;

/**
 * Enum value "idle" for attribute {@link ATTR_CPU_MODE}.
 */
export const CPU_MODE_VALUE_IDLE = 'idle' as const;

/**
 * Enum value "interrupt" for attribute {@link ATTR_CPU_MODE}.
 */
export const CPU_MODE_VALUE_INTERRUPT = 'interrupt' as const;

/**
 * Enum value "iowait" for attribute {@link ATTR_CPU_MODE}.
 */
export const CPU_MODE_VALUE_IOWAIT = 'iowait' as const;

/**
 * Enum value "kernel" for attribute {@link ATTR_CPU_MODE}.
 */
export const CPU_MODE_VALUE_KERNEL = 'kernel' as const;

/**
 * Enum value "nice" for attribute {@link ATTR_CPU_MODE}.
 */
export const CPU_MODE_VALUE_NICE = 'nice' as const;

/**
 * Enum value "steal" for attribute {@link ATTR_CPU_MODE}.
 */
export const CPU_MODE_VALUE_STEAL = 'steal' as const;

/**
 * Enum value "system" for attribute {@link ATTR_CPU_MODE}.
 */
export const CPU_MODE_VALUE_SYSTEM = 'system' as const;

/**
 * Enum value "user" for attribute {@link ATTR_CPU_MODE}.
 */
export const CPU_MODE_VALUE_USER = 'user' as const;

/**
 * Value of the garbage collector collection generation.
 *
 * @example 0
 * @example 1
 * @example 2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_CPYTHON_GC_GENERATION = 'cpython.gc.generation' as const;

/**
 * Enum value 0 for attribute {@link ATTR_CPYTHON_GC_GENERATION}.
 */
export const CPYTHON_GC_GENERATION_VALUE_GENERATION_0 = 0 as const;

/**
 * Enum value 1 for attribute {@link ATTR_CPYTHON_GC_GENERATION}.
 */
export const CPYTHON_GC_GENERATION_VALUE_GENERATION_1 = 1 as const;

/**
 * Enum value 2 for attribute {@link ATTR_CPYTHON_GC_GENERATION}.
 */
export const CPYTHON_GC_GENERATION_VALUE_GENERATION_2 = 2 as const;

/**
 * Deprecated, use `cassandra.consistency.level` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cassandra.consistency.level`.
 */
export const ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL = 'db.cassandra.consistency_level' as const;

/**
 * Enum value "all" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_ALL = 'all' as const;

/**
 * Enum value "any" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_ANY = 'any' as const;

/**
 * Enum value "each_quorum" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_EACH_QUORUM = 'each_quorum' as const;

/**
 * Enum value "local_one" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_LOCAL_ONE = 'local_one' as const;

/**
 * Enum value "local_quorum" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_LOCAL_QUORUM = 'local_quorum' as const;

/**
 * Enum value "local_serial" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_LOCAL_SERIAL = 'local_serial' as const;

/**
 * Enum value "one" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_ONE = 'one' as const;

/**
 * Enum value "quorum" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_QUORUM = 'quorum' as const;

/**
 * Enum value "serial" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_SERIAL = 'serial' as const;

/**
 * Enum value "three" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_THREE = 'three' as const;

/**
 * Enum value "two" for attribute {@link ATTR_DB_CASSANDRA_CONSISTENCY_LEVEL}.
 */
export const DB_CASSANDRA_CONSISTENCY_LEVEL_VALUE_TWO = 'two' as const;

/**
 * Deprecated, use `cassandra.coordinator.dc` instead.
 *
 * @example "us-west-2"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cassandra.coordinator.dc`.
 */
export const ATTR_DB_CASSANDRA_COORDINATOR_DC = 'db.cassandra.coordinator.dc' as const;

/**
 * Deprecated, use `cassandra.coordinator.id` instead.
 *
 * @example "be13faa2-8574-4d71-926d-27f16cf8a7af"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cassandra.coordinator.id`.
 */
export const ATTR_DB_CASSANDRA_COORDINATOR_ID = 'db.cassandra.coordinator.id' as const;

/**
 * Deprecated, use `cassandra.query.idempotent` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cassandra.query.idempotent`.
 */
export const ATTR_DB_CASSANDRA_IDEMPOTENCE = 'db.cassandra.idempotence' as const;

/**
 * Deprecated, use `cassandra.page.size` instead.
 *
 * @example 5000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cassandra.page.size`.
 */
export const ATTR_DB_CASSANDRA_PAGE_SIZE = 'db.cassandra.page_size' as const;

/**
 * Deprecated, use `cassandra.speculative_execution.count` instead.
 *
 * @example 0
 * @example 2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cassandra.speculative_execution.count`.
 */
export const ATTR_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT =
  'db.cassandra.speculative_execution_count' as const;

/**
 * Deprecated, use `db.collection.name` instead.
 *
 * @example "mytable"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.collection.name`.
 */
export const ATTR_DB_CASSANDRA_TABLE = 'db.cassandra.table' as const;

/**
 * The name of the connection pool; unique within the instrumented application. In case the connection pool implementation doesn't provide a name, instrumentation **SHOULD** use a combination of parameters that would make the name unique, for example, combining attributes `server.address`, `server.port`, and `db.namespace`, formatted as `server.address:server.port/db.namespace`. Instrumentations that generate connection pool name following different patterns **SHOULD** document it.
 *
 * @example myDataSource
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_CLIENT_CONNECTION_POOL_NAME = 'db.client.connection.pool.name' as const;

/**
 * The state of a connection in the pool
 *
 * @example idle
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_CLIENT_CONNECTION_STATE = 'db.client.connection.state' as const;

/**
 * Enum value "idle" for attribute {@link ATTR_DB_CLIENT_CONNECTION_STATE}.
 */
export const DB_CLIENT_CONNECTION_STATE_VALUE_IDLE = 'idle' as const;

/**
 * Enum value "used" for attribute {@link ATTR_DB_CLIENT_CONNECTION_STATE}.
 */
export const DB_CLIENT_CONNECTION_STATE_VALUE_USED = 'used' as const;

/**
 * Deprecated, use `db.client.connection.pool.name` instead.
 *
 * @example myDataSource
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.client.connection.pool.name`.
 */
export const ATTR_DB_CLIENT_CONNECTIONS_POOL_NAME = 'db.client.connections.pool.name' as const;

/**
 * Deprecated, use `db.client.connection.state` instead.
 *
 * @example idle
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.client.connection.state`.
 */
export const ATTR_DB_CLIENT_CONNECTIONS_STATE = 'db.client.connections.state' as const;

/**
 * Enum value "idle" for attribute {@link ATTR_DB_CLIENT_CONNECTIONS_STATE}.
 */
export const DB_CLIENT_CONNECTIONS_STATE_VALUE_IDLE = 'idle' as const;

/**
 * Enum value "used" for attribute {@link ATTR_DB_CLIENT_CONNECTIONS_STATE}.
 */
export const DB_CLIENT_CONNECTIONS_STATE_VALUE_USED = 'used' as const;

/**
 * The name of a collection (table, container) within the database.
 *
 * @example public.users
 * @example customers
 *
 * @note It is **RECOMMENDED** to capture the value as provided by the application
 * without attempting to do any case normalization.
 *
 * The collection name **SHOULD NOT** be extracted from `db.query.text`,
 * when the database system supports cross-table queries in non-batch operations.
 *
 * For batch operations, if the individual operations are known to have the same
 * collection name then that collection name **SHOULD** be used.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_COLLECTION_NAME = 'db.collection.name' as const;

/**
 * Deprecated, use `server.address`, `server.port` attributes instead.
 *
 * @example "Server=(localdb)\\v11.0;Integrated Security=true;"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `server.address` and `server.port`.
 */
export const ATTR_DB_CONNECTION_STRING = 'db.connection_string' as const;

/**
 * Deprecated, use `azure.client.id` instead.
 *
 * @example "3ba4827d-4422-483f-b59f-85b74211c11d"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `azure.client.id`.
 */
export const ATTR_DB_COSMOSDB_CLIENT_ID = 'db.cosmosdb.client_id' as const;

/**
 * Deprecated, use `azure.cosmosdb.connection.mode` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `azure.cosmosdb.connection.mode`.
 */
export const ATTR_DB_COSMOSDB_CONNECTION_MODE = 'db.cosmosdb.connection_mode' as const;

/**
 * Enum value "direct" for attribute {@link ATTR_DB_COSMOSDB_CONNECTION_MODE}.
 */
export const DB_COSMOSDB_CONNECTION_MODE_VALUE_DIRECT = 'direct' as const;

/**
 * Enum value "gateway" for attribute {@link ATTR_DB_COSMOSDB_CONNECTION_MODE}.
 */
export const DB_COSMOSDB_CONNECTION_MODE_VALUE_GATEWAY = 'gateway' as const;

/**
 * Deprecated, use `cosmosdb.consistency.level` instead.
 *
 * @example Eventual
 * @example ConsistentPrefix
 * @example BoundedStaleness
 * @example Strong
 * @example Session
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `azure.cosmosdb.consistency.level`.
 */
export const ATTR_DB_COSMOSDB_CONSISTENCY_LEVEL = 'db.cosmosdb.consistency_level' as const;

/**
 * Enum value "BoundedStaleness" for attribute {@link ATTR_DB_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const DB_COSMOSDB_CONSISTENCY_LEVEL_VALUE_BOUNDED_STALENESS = 'BoundedStaleness' as const;

/**
 * Enum value "ConsistentPrefix" for attribute {@link ATTR_DB_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const DB_COSMOSDB_CONSISTENCY_LEVEL_VALUE_CONSISTENT_PREFIX = 'ConsistentPrefix' as const;

/**
 * Enum value "Eventual" for attribute {@link ATTR_DB_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const DB_COSMOSDB_CONSISTENCY_LEVEL_VALUE_EVENTUAL = 'Eventual' as const;

/**
 * Enum value "Session" for attribute {@link ATTR_DB_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const DB_COSMOSDB_CONSISTENCY_LEVEL_VALUE_SESSION = 'Session' as const;

/**
 * Enum value "Strong" for attribute {@link ATTR_DB_COSMOSDB_CONSISTENCY_LEVEL}.
 */
export const DB_COSMOSDB_CONSISTENCY_LEVEL_VALUE_STRONG = 'Strong' as const;

/**
 * Deprecated, use `db.collection.name` instead.
 *
 * @example "mytable"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.collection.name`.
 */
export const ATTR_DB_COSMOSDB_CONTAINER = 'db.cosmosdb.container' as const;

/**
 * Deprecated, no replacement at this time.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated No replacement at this time.
 */
export const ATTR_DB_COSMOSDB_OPERATION_TYPE = 'db.cosmosdb.operation_type' as const;

/**
 * Enum value "batch" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_BATCH = 'batch' as const;

/**
 * Enum value "create" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_CREATE = 'create' as const;

/**
 * Enum value "delete" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_DELETE = 'delete' as const;

/**
 * Enum value "execute" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_EXECUTE = 'execute' as const;

/**
 * Enum value "execute_javascript" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_EXECUTE_JAVASCRIPT = 'execute_javascript' as const;

/**
 * Enum value "head" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_HEAD = 'head' as const;

/**
 * Enum value "head_feed" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_HEAD_FEED = 'head_feed' as const;

/**
 * Enum value "invalid" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_INVALID = 'invalid' as const;

/**
 * Enum value "patch" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_PATCH = 'patch' as const;

/**
 * Enum value "query" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_QUERY = 'query' as const;

/**
 * Enum value "query_plan" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_QUERY_PLAN = 'query_plan' as const;

/**
 * Enum value "read" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_READ = 'read' as const;

/**
 * Enum value "read_feed" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_READ_FEED = 'read_feed' as const;

/**
 * Enum value "replace" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_REPLACE = 'replace' as const;

/**
 * Enum value "upsert" for attribute {@link ATTR_DB_COSMOSDB_OPERATION_TYPE}.
 */
export const DB_COSMOSDB_OPERATION_TYPE_VALUE_UPSERT = 'upsert' as const;

/**
 * Deprecated, use `azure.cosmosdb.operation.contacted_regions` instead.
 *
 * @example ["North Central US", "Australia East", "Australia Southeast"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `azure.cosmosdb.operation.contacted_regions`.
 */
export const ATTR_DB_COSMOSDB_REGIONS_CONTACTED = 'db.cosmosdb.regions_contacted' as const;

/**
 * Deprecated, use `azure.cosmosdb.operation.request_charge` instead.
 *
 * @example 46.18
 * @example 1.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `azure.cosmosdb.operation.request_charge`.
 */
export const ATTR_DB_COSMOSDB_REQUEST_CHARGE = 'db.cosmosdb.request_charge' as const;

/**
 * Deprecated, use `azure.cosmosdb.request.body.size` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `azure.cosmosdb.request.body.size`.
 */
export const ATTR_DB_COSMOSDB_REQUEST_CONTENT_LENGTH =
  'db.cosmosdb.request_content_length' as const;

/**
 * Deprecated, use `db.response.status_code` instead.
 *
 * @example 200
 * @example 201
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.response.status_code`.
 */
export const ATTR_DB_COSMOSDB_STATUS_CODE = 'db.cosmosdb.status_code' as const;

/**
 * Deprecated, use `azure.cosmosdb.response.sub_status_code` instead.
 *
 * @example 1000
 * @example 1002
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `azure.cosmosdb.response.sub_status_code`.
 */
export const ATTR_DB_COSMOSDB_SUB_STATUS_CODE = 'db.cosmosdb.sub_status_code' as const;

/**
 * Deprecated, use `db.namespace` instead.
 *
 * @example e9106fc68e3044f0b1475b04bf4ffd5f
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.namespace`.
 */
export const ATTR_DB_ELASTICSEARCH_CLUSTER_NAME = 'db.elasticsearch.cluster.name' as const;

/**
 * Deprecated, use `elasticsearch.node.name` instead.
 *
 * @example instance-0000000001
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `elasticsearch.node.name`.
 */
export const ATTR_DB_ELASTICSEARCH_NODE_NAME = 'db.elasticsearch.node.name' as const;

/**
 * Deprecated, use `db.operation.parameter` instead.
 *
 * @example db.elasticsearch.path_parts.index=test-index
 * @example db.elasticsearch.path_parts.doc_id=123
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.operation.parameter`.
 */
export const ATTR_DB_ELASTICSEARCH_PATH_PARTS = (key: string) =>
  `db.elasticsearch.path_parts.${key}`;

/**
 * Deprecated, no general replacement at this time. For Elasticsearch, use `db.elasticsearch.node.name` instead.
 *
 * @example "mysql-e26b99z.example.com"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Deprecated, no general replacement at this time. For Elasticsearch, use `db.elasticsearch.node.name` instead.
 */
export const ATTR_DB_INSTANCE_ID = 'db.instance.id' as const;

/**
 * Removed, no replacement at this time.
 *
 * @example org.postgresql.Driver
 * @example com.microsoft.sqlserver.jdbc.SQLServerDriver
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Removed as not used.
 */
export const ATTR_DB_JDBC_DRIVER_CLASSNAME = 'db.jdbc.driver_classname' as const;

/**
 * Deprecated, use `db.collection.name` instead.
 *
 * @example "mytable"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.collection.name`.
 */
export const ATTR_DB_MONGODB_COLLECTION = 'db.mongodb.collection' as const;

/**
 * Deprecated, SQL Server instance is now populated as a part of `db.namespace` attribute.
 *
 * @example "MSSQLSERVER"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Deprecated, no replacement at this time.
 */
export const ATTR_DB_MSSQL_INSTANCE_NAME = 'db.mssql.instance_name' as const;

/**
 * Deprecated, use `db.namespace` instead.
 *
 * @example customers
 * @example main
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.namespace`.
 */
export const ATTR_DB_NAME = 'db.name' as const;

/**
 * The name of the database, fully qualified within the server address and port.
 *
 * @example customers
 * @example test.users
 *
 * @note If a database system has multiple namespace components, they **SHOULD** be concatenated (potentially using database system specific conventions) from most general to most specific namespace component, and more specific namespaces **SHOULD NOT** be captured without the more general namespaces, to ensure that "startswith" queries for the more general namespaces will be valid.
 * Semantic conventions for individual database systems **SHOULD** document what `db.namespace` means in the context of that system.
 * It is **RECOMMENDED** to capture the value as provided by the application without attempting to do any case normalization.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_NAMESPACE = 'db.namespace' as const;

/**
 * Deprecated, use `db.operation.name` instead.
 *
 * @example findAndModify
 * @example HMSET
 * @example SELECT
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.operation.name`.
 */
export const ATTR_DB_OPERATION = 'db.operation' as const;

/**
 * The number of queries included in a batch operation.
 *
 * @example 2
 * @example 3
 * @example 4
 *
 * @note Operations are only considered batches when they contain two or more operations, and so `db.operation.batch.size` **SHOULD** never be `1`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_OPERATION_BATCH_SIZE = 'db.operation.batch.size' as const;

/**
 * The name of the operation or command being executed.
 *
 * @example findAndModify
 * @example HMSET
 * @example SELECT
 *
 * @note It is **RECOMMENDED** to capture the value as provided by the application
 * without attempting to do any case normalization.
 *
 * The operation name **SHOULD NOT** be extracted from `db.query.text`,
 * when the database system supports cross-table queries in non-batch operations.
 *
 * If spaces can occur in the operation name, multiple consecutive spaces
 * **SHOULD** be normalized to a single space.
 *
 * For batch operations, if the individual operations are known to have the same operation name
 * then that operation name **SHOULD** be used prepended by `BATCH `,
 * otherwise `db.operation.name` **SHOULD** be `BATCH` or some other database
 * system specific term if more applicable.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_OPERATION_NAME = 'db.operation.name' as const;

/**
 * A database operation parameter, with `<key>` being the parameter name, and the attribute value being a string representation of the parameter value.
 *
 * @example someval
 * @example 55
 *
 * @note If a parameter has no name and instead is referenced only by index, then `<key>` **SHOULD** be the 0-based index.
 * If `db.query.text` is also captured, then `db.operation.parameter.<key>` **SHOULD** match up with the parameterized placeholders present in `db.query.text`.
 * `db.operation.parameter.<key>` **SHOULD NOT** be captured on batch operations.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_OPERATION_PARAMETER = (key: string) => `db.operation.parameter.${key}`;

/**
 * A query parameter used in `db.query.text`, with `<key>` being the parameter name, and the attribute value being a string representation of the parameter value.
 *
 * @example someval
 * @example 55
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.operation.parameter`.
 */
export const ATTR_DB_QUERY_PARAMETER = (key: string) => `db.query.parameter.${key}`;

/**
 * Low cardinality representation of a database query text.
 *
 * @example SELECT wuser_table
 * @example INSERT shipping_details SELECT orders
 * @example get user by id
 *
 * @note `db.query.summary` provides static summary of the query text. It describes a class of database queries and is useful as a grouping key, especially when analyzing telemetry for database calls involving complex queries.
 * Summary may be available to the instrumentation through instrumentation hooks or other means. If it is not available, instrumentations that support query parsing **SHOULD** generate a summary following [Generating query summary](../database/database-spans.md#generating-a-summary-of-the-query-text) section.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_QUERY_SUMMARY = 'db.query.summary' as const;

/**
 * The database query being executed.
 *
 * @example SELECT * FROM wuser_table where username = ?
 * @example SET mykey ?
 *
 * @note For sanitization see [Sanitization of `db.query.text`](../database/database-spans.md#sanitization-of-dbquerytext).
 * For batch operations, if the individual operations are known to have the same query text then that query text **SHOULD** be used, otherwise all of the individual query texts **SHOULD** be concatenated with separator `; ` or some other database system specific separator if more applicable.
 * Even though parameterized query text can potentially have sensitive data, by using a parameterized query the user is giving a strong signal that any sensitive data will be passed as parameter values, and the benefit to observability of capturing the static part of the query text by default outweighs the risk.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_QUERY_TEXT = 'db.query.text' as const;

/**
 * Deprecated, use `db.namespace` instead.
 *
 * @example 0
 * @example 1
 * @example 15
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.namespace`.
 */
export const ATTR_DB_REDIS_DATABASE_INDEX = 'db.redis.database_index' as const;

/**
 * Number of rows returned by the operation.
 *
 * @example 10
 * @example 30
 * @example 1000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_RESPONSE_RETURNED_ROWS = 'db.response.returned_rows' as const;

/**
 * Database response status code.
 *
 * @example 102
 * @example ORA-17002
 * @example 08P01
 * @example 404
 *
 * @note The status code returned by the database. Usually it represents an error code, but may also represent partial success, warning, or differentiate between various types of successful outcomes.
 * Semantic conventions for individual database systems **SHOULD** document what `db.response.status_code` means in the context of that system.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_RESPONSE_STATUS_CODE = 'db.response.status_code' as const;

/**
 * Deprecated, use `db.collection.name` instead, but only if not extracting the value from `db.query.text`.
 *
 * @example "mytable"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.collection.name`, but only if not extracting the value from `db.query.text`.
 */
export const ATTR_DB_SQL_TABLE = 'db.sql.table' as const;

/**
 * The database statement being executed.
 *
 * @example SELECT * FROM wuser_table
 * @example SET mykey "WuValue"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.query.text`.
 */
export const ATTR_DB_STATEMENT = 'db.statement' as const;

/**
 * The name of a stored procedure within the database.
 *
 * @example GetCustomer
 *
 * @note It is **RECOMMENDED** to capture the value as provided by the application
 * without attempting to do any case normalization.
 *
 * For batch operations, if the individual operations are known to have the same
 * stored procedure name then that stored procedure name **SHOULD** be used.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_STORED_PROCEDURE_NAME = 'db.stored_procedure.name' as const;

/**
 * Deprecated, use `db.system.name` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.system.name`.
 */
export const ATTR_DB_SYSTEM = 'db.system' as const;

/**
 * Enum value "adabas" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_ADABAS = 'adabas' as const;

/**
 * Enum value "cache" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_CACHE = 'cache' as const;

/**
 * Enum value "cassandra" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_CASSANDRA = 'cassandra' as const;

/**
 * Enum value "clickhouse" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_CLICKHOUSE = 'clickhouse' as const;

/**
 * Enum value "cloudscape" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_CLOUDSCAPE = 'cloudscape' as const;

/**
 * Enum value "cockroachdb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_COCKROACHDB = 'cockroachdb' as const;

/**
 * Enum value "coldfusion" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_COLDFUSION = 'coldfusion' as const;

/**
 * Enum value "cosmosdb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_COSMOSDB = 'cosmosdb' as const;

/**
 * Enum value "couchbase" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_COUCHBASE = 'couchbase' as const;

/**
 * Enum value "couchdb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_COUCHDB = 'couchdb' as const;

/**
 * Enum value "db2" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_DB2 = 'db2' as const;

/**
 * Enum value "derby" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_DERBY = 'derby' as const;

/**
 * Enum value "dynamodb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_DYNAMODB = 'dynamodb' as const;

/**
 * Enum value "edb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_EDB = 'edb' as const;

/**
 * Enum value "elasticsearch" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_ELASTICSEARCH = 'elasticsearch' as const;

/**
 * Enum value "filemaker" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_FILEMAKER = 'filemaker' as const;

/**
 * Enum value "firebird" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_FIREBIRD = 'firebird' as const;

/**
 * Enum value "firstsql" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_FIRSTSQL = 'firstsql' as const;

/**
 * Enum value "geode" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_GEODE = 'geode' as const;

/**
 * Enum value "h2" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_H2 = 'h2' as const;

/**
 * Enum value "hanadb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_HANADB = 'hanadb' as const;

/**
 * Enum value "hbase" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_HBASE = 'hbase' as const;

/**
 * Enum value "hive" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_HIVE = 'hive' as const;

/**
 * Enum value "hsqldb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_HSQLDB = 'hsqldb' as const;

/**
 * Enum value "influxdb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_INFLUXDB = 'influxdb' as const;

/**
 * Enum value "informix" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_INFORMIX = 'informix' as const;

/**
 * Enum value "ingres" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_INGRES = 'ingres' as const;

/**
 * Enum value "instantdb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_INSTANTDB = 'instantdb' as const;

/**
 * Enum value "interbase" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_INTERBASE = 'interbase' as const;

/**
 * Enum value "intersystems_cache" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_INTERSYSTEMS_CACHE = 'intersystems_cache' as const;

/**
 * Enum value "mariadb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_MARIADB = 'mariadb' as const;

/**
 * Enum value "maxdb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_MAXDB = 'maxdb' as const;

/**
 * Enum value "memcached" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_MEMCACHED = 'memcached' as const;

/**
 * Enum value "mongodb" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_MONGODB = 'mongodb' as const;

/**
 * Enum value "mssql" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_MSSQL = 'mssql' as const;

/**
 * Enum value "mssqlcompact" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_MSSQLCOMPACT = 'mssqlcompact' as const;

/**
 * Enum value "mysql" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_MYSQL = 'mysql' as const;

/**
 * Enum value "neo4j" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_NEO4J = 'neo4j' as const;

/**
 * Enum value "netezza" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_NETEZZA = 'netezza' as const;

/**
 * Enum value "opensearch" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_OPENSEARCH = 'opensearch' as const;

/**
 * Enum value "oracle" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_ORACLE = 'oracle' as const;

/**
 * Enum value "other_sql" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_OTHER_SQL = 'other_sql' as const;

/**
 * Enum value "pervasive" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_PERVASIVE = 'pervasive' as const;

/**
 * Enum value "pointbase" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_POINTBASE = 'pointbase' as const;

/**
 * Enum value "postgresql" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_POSTGRESQL = 'postgresql' as const;

/**
 * Enum value "progress" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_PROGRESS = 'progress' as const;

/**
 * Enum value "redis" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_REDIS = 'redis' as const;

/**
 * Enum value "redshift" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_REDSHIFT = 'redshift' as const;

/**
 * Enum value "spanner" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_SPANNER = 'spanner' as const;

/**
 * Enum value "sqlite" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_SQLITE = 'sqlite' as const;

/**
 * Enum value "sybase" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_SYBASE = 'sybase' as const;

/**
 * Enum value "teradata" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_TERADATA = 'teradata' as const;

/**
 * Enum value "trino" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_TRINO = 'trino' as const;

/**
 * Enum value "vertica" for attribute {@link ATTR_DB_SYSTEM}.
 */
export const DB_SYSTEM_VALUE_VERTICA = 'vertica' as const;

/**
 * The database management system (DBMS) product as identified by the client instrumentation.
 *
 * @note The actual DBMS may differ from the one identified by the client. For example, when using PostgreSQL client libraries to connect to a CockroachDB, the `db.system.name` is set to `postgresql` based on the instrumentation's best knowledge.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DB_SYSTEM_NAME = 'db.system.name' as const;

/**
 * Enum value "actian.ingres" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_ACTIAN_INGRES = 'actian.ingres' as const;

/**
 * Enum value "aws.dynamodb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_AWS_DYNAMODB = 'aws.dynamodb' as const;

/**
 * Enum value "aws.redshift" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_AWS_REDSHIFT = 'aws.redshift' as const;

/**
 * Enum value "azure.cosmosdb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_AZURE_COSMOSDB = 'azure.cosmosdb' as const;

/**
 * Enum value "cassandra" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_CASSANDRA = 'cassandra' as const;

/**
 * Enum value "clickhouse" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_CLICKHOUSE = 'clickhouse' as const;

/**
 * Enum value "cockroachdb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_COCKROACHDB = 'cockroachdb' as const;

/**
 * Enum value "couchbase" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_COUCHBASE = 'couchbase' as const;

/**
 * Enum value "couchdb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_COUCHDB = 'couchdb' as const;

/**
 * Enum value "derby" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_DERBY = 'derby' as const;

/**
 * Enum value "elasticsearch" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_ELASTICSEARCH = 'elasticsearch' as const;

/**
 * Enum value "firebirdsql" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_FIREBIRDSQL = 'firebirdsql' as const;

/**
 * Enum value "gcp.spanner" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_GCP_SPANNER = 'gcp.spanner' as const;

/**
 * Enum value "geode" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_GEODE = 'geode' as const;

/**
 * Enum value "h2database" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_H2DATABASE = 'h2database' as const;

/**
 * Enum value "hbase" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_HBASE = 'hbase' as const;

/**
 * Enum value "hive" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_HIVE = 'hive' as const;

/**
 * Enum value "hsqldb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_HSQLDB = 'hsqldb' as const;

/**
 * Enum value "ibm.db2" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_IBM_DB2 = 'ibm.db2' as const;

/**
 * Enum value "ibm.informix" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_IBM_INFORMIX = 'ibm.informix' as const;

/**
 * Enum value "ibm.netezza" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_IBM_NETEZZA = 'ibm.netezza' as const;

/**
 * Enum value "influxdb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_INFLUXDB = 'influxdb' as const;

/**
 * Enum value "instantdb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_INSTANTDB = 'instantdb' as const;

/**
 * Enum value "intersystems.cache" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_INTERSYSTEMS_CACHE = 'intersystems.cache' as const;

/**
 * Enum value "mariadb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_MARIADB = 'mariadb' as const;

/**
 * Enum value "memcached" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_MEMCACHED = 'memcached' as const;

/**
 * Enum value "microsoft.sql_server" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_MICROSOFT_SQL_SERVER = 'microsoft.sql_server' as const;

/**
 * Enum value "mongodb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_MONGODB = 'mongodb' as const;

/**
 * Enum value "mysql" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_MYSQL = 'mysql' as const;

/**
 * Enum value "neo4j" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_NEO4J = 'neo4j' as const;

/**
 * Enum value "opensearch" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_OPENSEARCH = 'opensearch' as const;

/**
 * Enum value "oracle.db" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_ORACLE_DB = 'oracle.db' as const;

/**
 * Enum value "other_sql" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_OTHER_SQL = 'other_sql' as const;

/**
 * Enum value "postgresql" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_POSTGRESQL = 'postgresql' as const;

/**
 * Enum value "redis" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_REDIS = 'redis' as const;

/**
 * Enum value "sap.hana" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_SAP_HANA = 'sap.hana' as const;

/**
 * Enum value "sap.maxdb" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_SAP_MAXDB = 'sap.maxdb' as const;

/**
 * Enum value "softwareag.adabas" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_SOFTWAREAG_ADABAS = 'softwareag.adabas' as const;

/**
 * Enum value "sqlite" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_SQLITE = 'sqlite' as const;

/**
 * Enum value "teradata" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_TERADATA = 'teradata' as const;

/**
 * Enum value "trino" for attribute {@link ATTR_DB_SYSTEM_NAME}.
 */
export const DB_SYSTEM_NAME_VALUE_TRINO = 'trino' as const;

/**
 * Deprecated, no replacement at this time.
 *
 * @example readonly_user
 * @example reporting_user
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated No replacement at this time.
 */
export const ATTR_DB_USER = 'db.user' as const;

/**
 * 'Deprecated, use `deployment.environment.name` instead.'
 *
 * @example staging
 * @example production
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Deprecated, use `deployment.environment.name` instead.
 */
export const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment' as const;

/**
 * Name of the [deployment environment](https://wikipedia.org/wiki/Deployment_environment) (aka deployment tier).
 *
 * @example staging
 * @example production
 *
 * @note `deployment.environment.name` does not affect the uniqueness constraints defined through
 * the `service.namespace`, `service.name` and `service.instance.id` resource attributes.
 * This implies that resources carrying the following attribute combinations **MUST** be
 * considered to be identifying the same service:
 *
 *   - `service.name=frontend`, `deployment.environment.name=production`
 *   - `service.name=frontend`, `deployment.environment.name=staging`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name' as const;

/**
 * The id of the deployment.
 *
 * @example 1208
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DEPLOYMENT_ID = 'deployment.id' as const;

/**
 * The name of the deployment.
 *
 * @example deploy my app
 * @example deploy-frontend
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DEPLOYMENT_NAME = 'deployment.name' as const;

/**
 * The status of the deployment.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DEPLOYMENT_STATUS = 'deployment.status' as const;

/**
 * Enum value "failed" for attribute {@link ATTR_DEPLOYMENT_STATUS}.
 */
export const DEPLOYMENT_STATUS_VALUE_FAILED = 'failed' as const;

/**
 * Enum value "succeeded" for attribute {@link ATTR_DEPLOYMENT_STATUS}.
 */
export const DEPLOYMENT_STATUS_VALUE_SUCCEEDED = 'succeeded' as const;

/**
 * Destination address - domain name if available without reverse DNS lookup; otherwise, IP address or Unix domain socket name.
 *
 * @example destination.example.com
 * @example 10.1.2.80
 * @example /tmp/my.sock
 *
 * @note When observed from the source side, and when communicating through an intermediary, `destination.address` **SHOULD** represent the destination address behind any intermediaries, for example proxies, if it's available.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DESTINATION_ADDRESS = 'destination.address' as const;

/**
 * Destination port number
 *
 * @example 3389
 * @example 2888
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DESTINATION_PORT = 'destination.port' as const;

/**
 * A unique identifier representing the device
 *
 * @example 123456789012345
 * @example 01:23:45:67:89:AB
 *
 * @note Its value **SHOULD** be identical for all apps on a device and it **SHOULD NOT** change if an app is uninstalled and re-installed.
 * However, it might be resettable by the user for all apps on a device.
 * Hardware IDs (e.g. vendor-specific serial number, IMEI or MAC address) **MAY** be used as values.
 *
 * More information about Android identifier best practices can be found [here](https://developer.android.com/training/articles/user-data-ids).
 *
 * > [!WARNING]> This attribute may contain sensitive (PII) information. Caution should be taken when storing personal data or anything which can identify a user. GDPR and data protection laws may apply,
 * > ensure you do your own due diligence.> Due to these reasons, this identifier is not recommended for consumer applications and will likely result in rejection from both Google Play and App Store.
 * > However, it may be appropriate for specific enterprise scenarios, such as kiosk devices or enterprise-managed devices, with appropriate compliance clearance.
 * > Any instrumentation providing this identifier **> MUST**>  implement it as an opt-in feature.> See [`app.installation.id`](/docs/attributes-registry/app.md#app-installation-id)>  for a more privacy-preserving alternative.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DEVICE_ID = 'device.id' as const;

/**
 * The name of the device manufacturer
 *
 * @example Apple
 * @example Samsung
 *
 * @note The Android OS provides this field via [Build](https://developer.android.com/reference/android/os/Build#MANUFACTURER). iOS apps **SHOULD** hardcode the value `Apple`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DEVICE_MANUFACTURER = 'device.manufacturer' as const;

/**
 * The model identifier for the device
 *
 * @example iPhone3,4
 * @example SM-G920F
 *
 * @note It's recommended this value represents a machine-readable version of the model identifier rather than the market or consumer-friendly name of the device.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DEVICE_MODEL_IDENTIFIER = 'device.model.identifier' as const;

/**
 * The marketing name for the device model
 *
 * @example iPhone 6s Plus
 * @example Samsung Galaxy S6
 *
 * @note It's recommended this value represents a human-readable version of the device model rather than a machine-readable alternative.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DEVICE_MODEL_NAME = 'device.model.name' as const;

/**
 * The disk IO operation direction.
 *
 * @example read
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DISK_IO_DIRECTION = 'disk.io.direction' as const;

/**
 * Enum value "read" for attribute {@link ATTR_DISK_IO_DIRECTION}.
 */
export const DISK_IO_DIRECTION_VALUE_READ = 'read' as const;

/**
 * Enum value "write" for attribute {@link ATTR_DISK_IO_DIRECTION}.
 */
export const DISK_IO_DIRECTION_VALUE_WRITE = 'write' as const;

/**
 * The name being queried.
 *
 * @example www.example.com
 * @example opentelemetry.io
 *
 * @note If the name field contains non-printable characters (below 32 or above 126), those characters should be represented as escaped base 10 integers (\\DDD). Back slashes and quotes should be escaped. Tabs, carriage returns, and line feeds should be converted to \\t, \\r, and \\n respectively.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_DNS_QUESTION_NAME = 'dns.question.name' as const;

/**
 * Represents the human-readable identifier of the node/instance to which a request was routed.
 *
 * @example instance-0000000001
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ELASTICSEARCH_NODE_NAME = 'elasticsearch.node.name' as const;

/**
 * Unique identifier of an end user in the system. It maybe a username, email address, or other identifier.
 *
 * @example username
 *
 * @note Unique identifier of an end user in the system.
 *
 * > [!Warning]
 * > This field contains sensitive (PII) information.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ENDUSER_ID = 'enduser.id' as const;

/**
 * Pseudonymous identifier of an end user. This identifier should be a random value that is not directly linked or associated with the end user's actual identity.
 *
 * @example QdH5CAWJgqVT4rOr0qtumf
 *
 * @note Pseudonymous identifier of an end user.
 *
 * > [!Warning]
 * > This field contains sensitive (linkable PII) information.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ENDUSER_PSEUDO_ID = 'enduser.pseudo.id' as const;

/**
 * Deprecated, use `user.roles` instead.
 *
 * @example "admin"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `user.roles` attribute.
 */
export const ATTR_ENDUSER_ROLE = 'enduser.role' as const;

/**
 * Deprecated, no replacement at this time.
 *
 * @example "read:message, write:files"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Removed.
 */
export const ATTR_ENDUSER_SCOPE = 'enduser.scope' as const;

/**
 * A message providing more detail about an error in human-readable form.
 *
 * @example Unexpected input type: string
 * @example The user has exceeded their storage quota
 *
 * @note `error.message` should provide additional context and detail about an error.
 * It is NOT **RECOMMENDED** to duplicate the value of `error.type` in `error.message`.
 * It is also NOT **RECOMMENDED** to duplicate the value of `exception.message` in `error.message`.
 *
 * `error.message` is NOT **RECOMMENDED** for metrics or spans due to its unbounded cardinality and overlap with span status.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_ERROR_MESSAGE = 'error.message' as const;

/**
 * Identifies the class / type of event.
 *
 * @example browser.mouse.click
 * @example device.app.lifecycle
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by EventName top-level field on the LogRecord
 */
export const ATTR_EVENT_NAME = 'event.name' as const;

/**
 * A boolean that is true if the serverless function is executed for the first time (aka cold-start).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_COLDSTART = 'faas.coldstart' as const;

/**
 * A string containing the schedule period as [Cron Expression](https://docs.oracle.com/cd/E12058_01/doc/doc.1014/e12030/cron_expressions.htm).
 *
 * @example "0/5 * * * ? *"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_CRON = 'faas.cron' as const;

/**
 * The name of the source on which the triggering operation was performed. For example, in Cloud Storage or S3 corresponds to the bucket name, and in Cosmos DB to the database name.
 *
 * @example myBucketName
 * @example myDbName
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_DOCUMENT_COLLECTION = 'faas.document.collection' as const;

/**
 * The document name/table subjected to the operation. For example, in Cloud Storage or S3 is the name of the file, and in Cosmos DB the table name.
 *
 * @example myFile.txt
 * @example myTableName
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_DOCUMENT_NAME = 'faas.document.name' as const;

/**
 * Describes the type of the operation that was performed on the data.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_DOCUMENT_OPERATION = 'faas.document.operation' as const;

/**
 * Enum value "delete" for attribute {@link ATTR_FAAS_DOCUMENT_OPERATION}.
 */
export const FAAS_DOCUMENT_OPERATION_VALUE_DELETE = 'delete' as const;

/**
 * Enum value "edit" for attribute {@link ATTR_FAAS_DOCUMENT_OPERATION}.
 */
export const FAAS_DOCUMENT_OPERATION_VALUE_EDIT = 'edit' as const;

/**
 * Enum value "insert" for attribute {@link ATTR_FAAS_DOCUMENT_OPERATION}.
 */
export const FAAS_DOCUMENT_OPERATION_VALUE_INSERT = 'insert' as const;

/**
 * A string containing the time when the data was accessed in the [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format expressed in [UTC](https://www.w3.org/TR/NOTE-datetime).
 *
 * @example "2020-01-23T13:47:06Z"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_DOCUMENT_TIME = 'faas.document.time' as const;

/**
 * The execution environment ID as a string, that will be potentially reused for other invocations to the same function/function version.
 *
 * @example 2021/06/28/[$LATEST]2f399eb14537447da05ab2a2e39309de
 *
 * @note - **AWS Lambda:** Use the (full) log stream name.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_INSTANCE = 'faas.instance' as const;

/**
 * The invocation ID of the current function invocation.
 *
 * @example "af9d5aa4-a685-4c5f-a22b-444f80b3cc28"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_INVOCATION_ID = 'faas.invocation_id' as const;

/**
 * The name of the invoked function.
 *
 * @example "my-function"
 *
 * @note **SHOULD** be equal to the `faas.name` resource attribute of the invoked function.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_INVOKED_NAME = 'faas.invoked_name' as const;

/**
 * The cloud provider of the invoked function.
 *
 * @note **SHOULD** be equal to the `cloud.provider` resource attribute of the invoked function.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_INVOKED_PROVIDER = 'faas.invoked_provider' as const;

/**
 * Enum value "alibaba_cloud" for attribute {@link ATTR_FAAS_INVOKED_PROVIDER}.
 */
export const FAAS_INVOKED_PROVIDER_VALUE_ALIBABA_CLOUD = 'alibaba_cloud' as const;

/**
 * Enum value "aws" for attribute {@link ATTR_FAAS_INVOKED_PROVIDER}.
 */
export const FAAS_INVOKED_PROVIDER_VALUE_AWS = 'aws' as const;

/**
 * Enum value "azure" for attribute {@link ATTR_FAAS_INVOKED_PROVIDER}.
 */
export const FAAS_INVOKED_PROVIDER_VALUE_AZURE = 'azure' as const;

/**
 * Enum value "gcp" for attribute {@link ATTR_FAAS_INVOKED_PROVIDER}.
 */
export const FAAS_INVOKED_PROVIDER_VALUE_GCP = 'gcp' as const;

/**
 * Enum value "tencent_cloud" for attribute {@link ATTR_FAAS_INVOKED_PROVIDER}.
 */
export const FAAS_INVOKED_PROVIDER_VALUE_TENCENT_CLOUD = 'tencent_cloud' as const;

/**
 * The cloud region of the invoked function.
 *
 * @example "eu-central-1"
 *
 * @note **SHOULD** be equal to the `cloud.region` resource attribute of the invoked function.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_INVOKED_REGION = 'faas.invoked_region' as const;

/**
 * The amount of memory available to the serverless function converted to Bytes.
 *
 * @example 134217728
 *
 * @note It's recommended to set this attribute since e.g. too little memory can easily stop a Java AWS Lambda function from working correctly. On AWS Lambda, the environment variable `AWS_LAMBDA_FUNCTION_MEMORY_SIZE` provides this information (which must be multiplied by 1,048,576).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_MAX_MEMORY = 'faas.max_memory' as const;

/**
 * The name of the single function that this runtime instance executes.
 *
 * @example my-function
 * @example myazurefunctionapp/some-function-name
 *
 * @note This is the name of the function as configured/deployed on the FaaS
 * platform and is usually different from the name of the callback
 * function (which may be stored in the
 * [`code.namespace`/`code.function.name`](/docs/general/attributes.md#source-code-attributes)
 * span attributes).
 *
 * For some cloud providers, the above definition is ambiguous. The following
 * definition of function name **MUST** be used for this attribute
 * (and consequently the span name) for the listed cloud providers/products:
 *
 *   - **Azure:**  The full name `<FUNCAPP>/<FUNC>`, i.e., function app name
 *     followed by a forward slash followed by the function name (this form
 *     can also be seen in the resource JSON for the function).
 *     This means that a span attribute **MUST** be used, as an Azure function
 *     app can host multiple functions that would usually share
 *     a TracerProvider (see also the `cloud.resource_id` attribute).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_NAME = 'faas.name' as const;

/**
 * A string containing the function invocation time in the [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format expressed in [UTC](https://www.w3.org/TR/NOTE-datetime).
 *
 * @example "2020-01-23T13:47:06Z"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_TIME = 'faas.time' as const;

/**
 * Type of the trigger which caused this function invocation.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_TRIGGER = 'faas.trigger' as const;

/**
 * Enum value "datasource" for attribute {@link ATTR_FAAS_TRIGGER}.
 */
export const FAAS_TRIGGER_VALUE_DATASOURCE = 'datasource' as const;

/**
 * Enum value "http" for attribute {@link ATTR_FAAS_TRIGGER}.
 */
export const FAAS_TRIGGER_VALUE_HTTP = 'http' as const;

/**
 * Enum value "other" for attribute {@link ATTR_FAAS_TRIGGER}.
 */
export const FAAS_TRIGGER_VALUE_OTHER = 'other' as const;

/**
 * Enum value "pubsub" for attribute {@link ATTR_FAAS_TRIGGER}.
 */
export const FAAS_TRIGGER_VALUE_PUBSUB = 'pubsub' as const;

/**
 * Enum value "timer" for attribute {@link ATTR_FAAS_TRIGGER}.
 */
export const FAAS_TRIGGER_VALUE_TIMER = 'timer' as const;

/**
 * The immutable version of the function being executed.
 *
 * @example 26
 * @example pinkfroid-00002
 *
 * @note Depending on the cloud provider and platform, use:
 *
 *   - **AWS Lambda:** The [function version](https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html)
 *     (an integer represented as a decimal string).
 *   - **Google Cloud Run (Services):** The [revision](https://cloud.google.com/run/docs/managing/revisions)
 *     (i.e., the function name plus the revision suffix).
 *   - **Google Cloud Functions:** The value of the
 *     [`K_REVISION` environment variable](https://cloud.google.com/functions/docs/env-var#runtime_environment_variables_set_automatically).
 *   - **Azure Functions:** Not applicable. Do not set this attribute.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FAAS_VERSION = 'faas.version' as const;

/**
 * The unique identifier for the flag evaluation context. For example, the targeting key.
 *
 * @example 5157782b-2203-4c80-a857-dbbd5e7761db
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FEATURE_FLAG_CONTEXT_ID = 'feature_flag.context.id' as const;

/**
 * A message explaining the nature of an error occurring during flag evaluation.
 *
 * @example Flag `header-color` expected type `string` but found type `number`
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FEATURE_FLAG_EVALUATION_ERROR_MESSAGE =
  'feature_flag.evaluation.error.message' as const;

/**
 * Deprecated, use `feature_flag.result.reason` instead.
 *
 * @example static
 * @example targeting_match
 * @example error
 * @example default
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `feature_flag.result.reason`.
 */
export const ATTR_FEATURE_FLAG_EVALUATION_REASON = 'feature_flag.evaluation.reason' as const;

/**
 * Enum value "cached" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_CACHED = 'cached' as const;

/**
 * Enum value "default" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_DEFAULT = 'default' as const;

/**
 * Enum value "disabled" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_DISABLED = 'disabled' as const;

/**
 * Enum value "error" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_ERROR = 'error' as const;

/**
 * Enum value "split" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_SPLIT = 'split' as const;

/**
 * Enum value "stale" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_STALE = 'stale' as const;

/**
 * Enum value "static" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_STATIC = 'static' as const;

/**
 * Enum value "targeting_match" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_TARGETING_MATCH = 'targeting_match' as const;

/**
 * Enum value "unknown" for attribute {@link ATTR_FEATURE_FLAG_EVALUATION_REASON}.
 */
export const FEATURE_FLAG_EVALUATION_REASON_VALUE_UNKNOWN = 'unknown' as const;

/**
 * The lookup key of the feature flag.
 *
 * @example logo-color
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FEATURE_FLAG_KEY = 'feature_flag.key' as const;

/**
 * Identifies the feature flag provider.
 *
 * @example Flag Manager
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FEATURE_FLAG_PROVIDER_NAME = 'feature_flag.provider_name' as const;

/**
 * The reason code which shows how a feature flag value was determined.
 *
 * @example static
 * @example targeting_match
 * @example error
 * @example default
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FEATURE_FLAG_RESULT_REASON = 'feature_flag.result.reason' as const;

/**
 * Enum value "cached" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_CACHED = 'cached' as const;

/**
 * Enum value "default" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_DEFAULT = 'default' as const;

/**
 * Enum value "disabled" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_DISABLED = 'disabled' as const;

/**
 * Enum value "error" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_ERROR = 'error' as const;

/**
 * Enum value "split" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_SPLIT = 'split' as const;

/**
 * Enum value "stale" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_STALE = 'stale' as const;

/**
 * Enum value "static" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_STATIC = 'static' as const;

/**
 * Enum value "targeting_match" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_TARGETING_MATCH = 'targeting_match' as const;

/**
 * Enum value "unknown" for attribute {@link ATTR_FEATURE_FLAG_RESULT_REASON}.
 */
export const FEATURE_FLAG_RESULT_REASON_VALUE_UNKNOWN = 'unknown' as const;

/**
 * A semantic identifier for an evaluated flag value.
 *
 * @example red
 * @example true
 * @example on
 *
 * @note A semantic identifier, commonly referred to as a variant, provides a means
 * for referring to a value without including the value itself. This can
 * provide additional context for understanding the meaning behind a value.
 * For example, the variant `red` maybe be used for the value `#c05543`.
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FEATURE_FLAG_RESULT_VARIANT = 'feature_flag.result.variant' as const;

/**
 * The identifier of the [flag set](https://openfeature.dev/specification/glossary/#flag-set) to which the feature flag belongs.
 *
 * @example proj-1
 * @example ab98sgs
 * @example service1/dev
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FEATURE_FLAG_SET_ID = 'feature_flag.set.id' as const;

/**
 * Deprecated, use `feature_flag.result.variant` instead.
 *
 * @example red
 * @example true
 * @example on
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `feature_flag.result.variant`.
 */
export const ATTR_FEATURE_FLAG_VARIANT = 'feature_flag.variant' as const;

/**
 * The version of the ruleset used during the evaluation. This may be any stable value which uniquely identifies the ruleset.
 *
 * @example 1
 * @example 01ABCDEF
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FEATURE_FLAG_VERSION = 'feature_flag.version' as const;

/**
 * Time when the file was last accessed, in ISO 8601 format.
 *
 * @example 2021-01-01T12:00:00Z
 *
 * @note This attribute might not be supported by some file systems — NFS, FAT32, in embedded OS, etc.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_ACCESSED = 'file.accessed' as const;

/**
 * Array of file attributes.
 *
 * @example ["readonly", "hidden"]
 *
 * @note Attributes names depend on the OS or file system. Here’s a non-exhaustive list of values expected for this attribute: `archive`, `compressed`, `directory`, `encrypted`, `execute`, `hidden`, `immutable`, `journaled`, `read`, `readonly`, `symbolic link`, `system`, `temporary`, `write`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_ATTRIBUTES = 'file.attributes' as const;

/**
 * Time when the file attributes or metadata was last changed, in ISO 8601 format.
 *
 * @example 2021-01-01T12:00:00Z
 *
 * @note `file.changed` captures the time when any of the file's properties or attributes (including the content) are changed, while `file.modified` captures the timestamp when the file content is modified.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_CHANGED = 'file.changed' as const;

/**
 * Time when the file was created, in ISO 8601 format.
 *
 * @example 2021-01-01T12:00:00Z
 *
 * @note This attribute might not be supported by some file systems — NFS, FAT32, in embedded OS, etc.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_CREATED = 'file.created' as const;

/**
 * Directory where the file is located. It should include the drive letter, when appropriate.
 *
 * @example /home/user
 * @example C:\\Program Files\\MyApp
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_DIRECTORY = 'file.directory' as const;

/**
 * File extension, excluding the leading dot.
 *
 * @example png
 * @example gz
 *
 * @note When the file name has multiple extensions (example.tar.gz), only the last one should be captured ("gz", not "tar.gz").
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_EXTENSION = 'file.extension' as const;

/**
 * Name of the fork. A fork is additional data associated with a filesystem object.
 *
 * @example Zone.Identifer
 *
 * @note On Linux, a resource fork is used to store additional data with a filesystem object. A file always has at least one fork for the data portion, and additional forks may exist.
 * On NTFS, this is analogous to an Alternate Data Stream (ADS), and the default data stream for a file is just called $DATA. Zone.Identifier is commonly used by Windows to track contents downloaded from the Internet. An ADS is typically of the form: C:\\path\\to\\filename.extension:some_fork_name, and some_fork_name is the value that should populate `fork_name`. `filename.extension` should populate `file.name`, and `extension` should populate `file.extension`. The full path, `file.path`, will include the fork name.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_FORK_NAME = 'file.fork_name' as const;

/**
 * Primary Group ID (GID) of the file.
 *
 * @example 1000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_GROUP_ID = 'file.group.id' as const;

/**
 * Primary group name of the file.
 *
 * @example users
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_GROUP_NAME = 'file.group.name' as const;

/**
 * Inode representing the file in the filesystem.
 *
 * @example 256383
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_INODE = 'file.inode' as const;

/**
 * Mode of the file in octal representation.
 *
 * @example 0640
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_MODE = 'file.mode' as const;

/**
 * Time when the file content was last modified, in ISO 8601 format.
 *
 * @example 2021-01-01T12:00:00Z
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_MODIFIED = 'file.modified' as const;

/**
 * Name of the file including the extension, without the directory.
 *
 * @example example.png
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_NAME = 'file.name' as const;

/**
 * The user ID (UID) or security identifier (SID) of the file owner.
 *
 * @example 1000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_OWNER_ID = 'file.owner.id' as const;

/**
 * Username of the file owner.
 *
 * @example root
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_OWNER_NAME = 'file.owner.name' as const;

/**
 * Full path to the file, including the file name. It should include the drive letter, when appropriate.
 *
 * @example /home/alice/example.png
 * @example C:\\Program Files\\MyApp\\myapp.exe
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_PATH = 'file.path' as const;

/**
 * File size in bytes.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_SIZE = 'file.size' as const;

/**
 * Path to the target of a symbolic link.
 *
 * @example /usr/bin/python3
 *
 * @note This attribute is only applicable to symbolic links.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_FILE_SYMBOLIC_LINK_TARGET_PATH = 'file.symbolic_link.target_path' as const;

/**
 * The container within GCP where the AppHub application is defined.
 *
 * @example projects/my-container-project
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_APPLICATION_CONTAINER = 'gcp.apphub.application.container' as const;

/**
 * The name of the application as configured in AppHub.
 *
 * @example my-application
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_APPLICATION_ID = 'gcp.apphub.application.id' as const;

/**
 * The GCP zone or region where the application is defined.
 *
 * @example us-central1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_APPLICATION_LOCATION = 'gcp.apphub.application.location' as const;

/**
 * Criticality of a service indicates its importance to the business.
 *
 * @note [See AppHub type enum](https://cloud.google.com/app-hub/docs/reference/rest/v1/Attributes#type)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_SERVICE_CRITICALITY_TYPE =
  'gcp.apphub.service.criticality_type' as const;

/**
 * Enum value "HIGH" for attribute {@link ATTR_GCP_APPHUB_SERVICE_CRITICALITY_TYPE}.
 */
export const GCP_APPHUB_SERVICE_CRITICALITY_TYPE_VALUE_HIGH = 'HIGH' as const;

/**
 * Enum value "LOW" for attribute {@link ATTR_GCP_APPHUB_SERVICE_CRITICALITY_TYPE}.
 */
export const GCP_APPHUB_SERVICE_CRITICALITY_TYPE_VALUE_LOW = 'LOW' as const;

/**
 * Enum value "MEDIUM" for attribute {@link ATTR_GCP_APPHUB_SERVICE_CRITICALITY_TYPE}.
 */
export const GCP_APPHUB_SERVICE_CRITICALITY_TYPE_VALUE_MEDIUM = 'MEDIUM' as const;

/**
 * Enum value "MISSION_CRITICAL" for attribute {@link ATTR_GCP_APPHUB_SERVICE_CRITICALITY_TYPE}.
 */
export const GCP_APPHUB_SERVICE_CRITICALITY_TYPE_VALUE_MISSION_CRITICAL =
  'MISSION_CRITICAL' as const;

/**
 * Environment of a service is the stage of a software lifecycle.
 *
 * @note [See AppHub environment type](https://cloud.google.com/app-hub/docs/reference/rest/v1/Attributes#type_1)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE =
  'gcp.apphub.service.environment_type' as const;

/**
 * Enum value "DEVELOPMENT" for attribute {@link ATTR_GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE}.
 */
export const GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE_VALUE_DEVELOPMENT = 'DEVELOPMENT' as const;

/**
 * Enum value "PRODUCTION" for attribute {@link ATTR_GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE}.
 */
export const GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE_VALUE_PRODUCTION = 'PRODUCTION' as const;

/**
 * Enum value "STAGING" for attribute {@link ATTR_GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE}.
 */
export const GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE_VALUE_STAGING = 'STAGING' as const;

/**
 * Enum value "TEST" for attribute {@link ATTR_GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE}.
 */
export const GCP_APPHUB_SERVICE_ENVIRONMENT_TYPE_VALUE_TEST = 'TEST' as const;

/**
 * The name of the service as configured in AppHub.
 *
 * @example my-service
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_SERVICE_ID = 'gcp.apphub.service.id' as const;

/**
 * Criticality of a workload indicates its importance to the business.
 *
 * @note [See AppHub type enum](https://cloud.google.com/app-hub/docs/reference/rest/v1/Attributes#type)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE =
  'gcp.apphub.workload.criticality_type' as const;

/**
 * Enum value "HIGH" for attribute {@link ATTR_GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE}.
 */
export const GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE_VALUE_HIGH = 'HIGH' as const;

/**
 * Enum value "LOW" for attribute {@link ATTR_GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE}.
 */
export const GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE_VALUE_LOW = 'LOW' as const;

/**
 * Enum value "MEDIUM" for attribute {@link ATTR_GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE}.
 */
export const GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE_VALUE_MEDIUM = 'MEDIUM' as const;

/**
 * Enum value "MISSION_CRITICAL" for attribute {@link ATTR_GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE}.
 */
export const GCP_APPHUB_WORKLOAD_CRITICALITY_TYPE_VALUE_MISSION_CRITICAL =
  'MISSION_CRITICAL' as const;

/**
 * Environment of a workload is the stage of a software lifecycle.
 *
 * @note [See AppHub environment type](https://cloud.google.com/app-hub/docs/reference/rest/v1/Attributes#type_1)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE =
  'gcp.apphub.workload.environment_type' as const;

/**
 * Enum value "DEVELOPMENT" for attribute {@link ATTR_GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE}.
 */
export const GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE_VALUE_DEVELOPMENT = 'DEVELOPMENT' as const;

/**
 * Enum value "PRODUCTION" for attribute {@link ATTR_GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE}.
 */
export const GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE_VALUE_PRODUCTION = 'PRODUCTION' as const;

/**
 * Enum value "STAGING" for attribute {@link ATTR_GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE}.
 */
export const GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE_VALUE_STAGING = 'STAGING' as const;

/**
 * Enum value "TEST" for attribute {@link ATTR_GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE}.
 */
export const GCP_APPHUB_WORKLOAD_ENVIRONMENT_TYPE_VALUE_TEST = 'TEST' as const;

/**
 * The name of the workload as configured in AppHub.
 *
 * @example my-workload
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_APPHUB_WORKLOAD_ID = 'gcp.apphub.workload.id' as const;

/**
 * Identifies the Google Cloud service for which the official client library is intended.
 *
 * @example appengine
 * @example run
 * @example firestore
 * @example alloydb
 * @example spanner
 *
 * @note Intended to be a stable identifier for Google Cloud client libraries that is uniform across implementation languages. The value should be derived from the canonical service domain for the service; for example, 'foo.googleapis.com' should result in a value of 'foo'.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_CLIENT_SERVICE = 'gcp.client.service' as const;

/**
 * The name of the Cloud Run [execution](https://cloud.google.com/run/docs/managing/job-executions) being run for the Job, as set by the [`CLOUD_RUN_EXECUTION`](https://cloud.google.com/run/docs/container-contract#jobs-env-vars) environment variable.
 *
 * @example job-name-xxxx
 * @example sample-job-mdw84
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_CLOUD_RUN_JOB_EXECUTION = 'gcp.cloud_run.job.execution' as const;

/**
 * The index for a task within an execution as provided by the [`CLOUD_RUN_TASK_INDEX`](https://cloud.google.com/run/docs/container-contract#jobs-env-vars) environment variable.
 *
 * @example 0
 * @example 1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_CLOUD_RUN_JOB_TASK_INDEX = 'gcp.cloud_run.job.task_index' as const;

/**
 * The hostname of a GCE instance. This is the full value of the default or [custom hostname](https://cloud.google.com/compute/docs/instances/custom-hostname-vm).
 *
 * @example my-host1234.example.com
 * @example sample-vm.us-west1-b.c.my-project.internal
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_GCE_INSTANCE_HOSTNAME = 'gcp.gce.instance.hostname' as const;

/**
 * The instance name of a GCE instance. This is the value provided by `host.name`, the visible name of the instance in the Cloud Console UI, and the prefix for the default hostname of the instance as defined by the [default internal DNS name](https://cloud.google.com/compute/docs/internal-dns#instance-fully-qualified-domain-names).
 *
 * @example instance-1
 * @example my-vm-name
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GCP_GCE_INSTANCE_NAME = 'gcp.gce.instance.name' as const;

/**
 * Free-form description of the GenAI agent provided by the application.
 *
 * @example Helps with math problems
 * @example Generates fiction stories
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_AGENT_DESCRIPTION = 'gen_ai.agent.description' as const;

/**
 * The unique identifier of the GenAI agent.
 *
 * @example asst_5j66UpCpwteGg4YSxUnt7lPY
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_AGENT_ID = 'gen_ai.agent.id' as const;

/**
 * Human-readable name of the GenAI agent provided by the application.
 *
 * @example Math Tutor
 * @example Fiction Writer
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_AGENT_NAME = 'gen_ai.agent.name' as const;

/**
 * Deprecated, use Event API to report completions contents.
 *
 * @example [{'role': 'assistant', 'content': 'The capital of France is Paris.'}]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Removed, no replacement at this time.
 */
export const ATTR_GEN_AI_COMPLETION = 'gen_ai.completion' as const;

/**
 * Deprecated, use `gen_ai.output.type`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `gen_ai.output.type`.
 */
export const ATTR_GEN_AI_OPENAI_REQUEST_RESPONSE_FORMAT =
  'gen_ai.openai.request.response_format' as const;

/**
 * Enum value "json_object" for attribute {@link ATTR_GEN_AI_OPENAI_REQUEST_RESPONSE_FORMAT}.
 */
export const GEN_AI_OPENAI_REQUEST_RESPONSE_FORMAT_VALUE_JSON_OBJECT = 'json_object' as const;

/**
 * Enum value "json_schema" for attribute {@link ATTR_GEN_AI_OPENAI_REQUEST_RESPONSE_FORMAT}.
 */
export const GEN_AI_OPENAI_REQUEST_RESPONSE_FORMAT_VALUE_JSON_SCHEMA = 'json_schema' as const;

/**
 * Enum value "text" for attribute {@link ATTR_GEN_AI_OPENAI_REQUEST_RESPONSE_FORMAT}.
 */
export const GEN_AI_OPENAI_REQUEST_RESPONSE_FORMAT_VALUE_TEXT = 'text' as const;

/**
 * Deprecated, use `gen_ai.request.seed`.
 *
 * @example 100
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `gen_ai.request.seed` attribute.
 */
export const ATTR_GEN_AI_OPENAI_REQUEST_SEED = 'gen_ai.openai.request.seed' as const;

/**
 * The service tier requested. May be a specific tier, default, or auto.
 *
 * @example auto
 * @example default
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_OPENAI_REQUEST_SERVICE_TIER =
  'gen_ai.openai.request.service_tier' as const;

/**
 * Enum value "auto" for attribute {@link ATTR_GEN_AI_OPENAI_REQUEST_SERVICE_TIER}.
 */
export const GEN_AI_OPENAI_REQUEST_SERVICE_TIER_VALUE_AUTO = 'auto' as const;

/**
 * Enum value "default" for attribute {@link ATTR_GEN_AI_OPENAI_REQUEST_SERVICE_TIER}.
 */
export const GEN_AI_OPENAI_REQUEST_SERVICE_TIER_VALUE_DEFAULT = 'default' as const;

/**
 * The service tier used for the response.
 *
 * @example scale
 * @example default
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_OPENAI_RESPONSE_SERVICE_TIER =
  'gen_ai.openai.response.service_tier' as const;

/**
 * A fingerprint to track any eventual change in the Generative AI environment.
 *
 * @example fp_44709d6fcb
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_OPENAI_RESPONSE_SYSTEM_FINGERPRINT =
  'gen_ai.openai.response.system_fingerprint' as const;

/**
 * The name of the operation being performed.
 *
 * @note If one of the predefined values applies, but specific system uses a different name it's **RECOMMENDED** to document it in the semantic conventions for specific GenAI system and use system-specific name in the instrumentation. If a different name is not documented, instrumentation libraries **SHOULD** use applicable predefined value.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_OPERATION_NAME = 'gen_ai.operation.name' as const;

/**
 * Enum value "chat" for attribute {@link ATTR_GEN_AI_OPERATION_NAME}.
 */
export const GEN_AI_OPERATION_NAME_VALUE_CHAT = 'chat' as const;

/**
 * Enum value "create_agent" for attribute {@link ATTR_GEN_AI_OPERATION_NAME}.
 */
export const GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT = 'create_agent' as const;

/**
 * Enum value "embeddings" for attribute {@link ATTR_GEN_AI_OPERATION_NAME}.
 */
export const GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS = 'embeddings' as const;

/**
 * Enum value "execute_tool" for attribute {@link ATTR_GEN_AI_OPERATION_NAME}.
 */
export const GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL = 'execute_tool' as const;

/**
 * Enum value "text_completion" for attribute {@link ATTR_GEN_AI_OPERATION_NAME}.
 */
export const GEN_AI_OPERATION_NAME_VALUE_TEXT_COMPLETION = 'text_completion' as const;

/**
 * Represents the content type requested by the client.
 *
 * @note This attribute **SHOULD** be used when the client requests output of a specific type. The model may return zero or more outputs of this type.
 * This attribute specifies the output modality and not the actual output format. For example, if an image is requested, the actual output could be a URL pointing to an image file.
 * Additional output format details may be recorded in the future in the `gen_ai.output.{type}.*` attributes.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_OUTPUT_TYPE = 'gen_ai.output.type' as const;

/**
 * Enum value "image" for attribute {@link ATTR_GEN_AI_OUTPUT_TYPE}.
 */
export const GEN_AI_OUTPUT_TYPE_VALUE_IMAGE = 'image' as const;

/**
 * Enum value "json" for attribute {@link ATTR_GEN_AI_OUTPUT_TYPE}.
 */
export const GEN_AI_OUTPUT_TYPE_VALUE_JSON = 'json' as const;

/**
 * Enum value "speech" for attribute {@link ATTR_GEN_AI_OUTPUT_TYPE}.
 */
export const GEN_AI_OUTPUT_TYPE_VALUE_SPEECH = 'speech' as const;

/**
 * Enum value "text" for attribute {@link ATTR_GEN_AI_OUTPUT_TYPE}.
 */
export const GEN_AI_OUTPUT_TYPE_VALUE_TEXT = 'text' as const;

/**
 * Deprecated, use Event API to report prompt contents.
 *
 * @example [{'role': 'user', 'content': 'What is the capital of France?'}]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Removed, no replacement at this time.
 */
export const ATTR_GEN_AI_PROMPT = 'gen_ai.prompt' as const;

/**
 * The target number of candidate completions to return.
 *
 * @example 3
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_CHOICE_COUNT = 'gen_ai.request.choice.count' as const;

/**
 * The encoding formats requested in an embeddings operation, if specified.
 *
 * @example ["base64"]
 * @example ["float", "binary"]
 *
 * @note In some GenAI systems the encoding formats are called embedding types. Also, some GenAI systems only accept a single format per request.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_ENCODING_FORMATS = 'gen_ai.request.encoding_formats' as const;

/**
 * The frequency penalty setting for the GenAI request.
 *
 * @example 0.1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_FREQUENCY_PENALTY = 'gen_ai.request.frequency_penalty' as const;

/**
 * The maximum number of tokens the model generates for a request.
 *
 * @example 100
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_MAX_TOKENS = 'gen_ai.request.max_tokens' as const;

/**
 * The name of the GenAI model a request is being made to.
 *
 * @example "gpt-4"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_MODEL = 'gen_ai.request.model' as const;

/**
 * The presence penalty setting for the GenAI request.
 *
 * @example 0.1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_PRESENCE_PENALTY = 'gen_ai.request.presence_penalty' as const;

/**
 * Requests with same seed value more likely to return same result.
 *
 * @example 100
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_SEED = 'gen_ai.request.seed' as const;

/**
 * List of sequences that the model will use to stop generating further tokens.
 *
 * @example ["forest", "lived"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_STOP_SEQUENCES = 'gen_ai.request.stop_sequences' as const;

/**
 * The temperature setting for the GenAI request.
 *
 * @example 0.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_TEMPERATURE = 'gen_ai.request.temperature' as const;

/**
 * The top_k sampling setting for the GenAI request.
 *
 * @example 1.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_TOP_K = 'gen_ai.request.top_k' as const;

/**
 * The top_p sampling setting for the GenAI request.
 *
 * @example 1.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_REQUEST_TOP_P = 'gen_ai.request.top_p' as const;

/**
 * Array of reasons the model stopped generating tokens, corresponding to each generation received.
 *
 * @example ["stop"]
 * @example ["stop", "length"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_RESPONSE_FINISH_REASONS = 'gen_ai.response.finish_reasons' as const;

/**
 * The unique identifier for the completion.
 *
 * @example chatcmpl-123
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_RESPONSE_ID = 'gen_ai.response.id' as const;

/**
 * The name of the model that generated the response.
 *
 * @example gpt-4-0613
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_RESPONSE_MODEL = 'gen_ai.response.model' as const;

/**
 * The Generative AI product as identified by the client or server instrumentation.
 *
 * @example "openai"
 *
 * @note The `gen_ai.system` describes a family of GenAI models with specific model identified
 * by `gen_ai.request.model` and `gen_ai.response.model` attributes.
 *
 * The actual GenAI product may differ from the one identified by the client.
 * Multiple systems, including Azure OpenAI and Gemini, are accessible by OpenAI client
 * libraries. In such cases, the `gen_ai.system` is set to `openai` based on the
 * instrumentation's best knowledge, instead of the actual system. The `server.address`
 * attribute may help identify the actual system in use for `openai`.
 *
 * For custom model, a custom friendly name **SHOULD** be used.
 * If none of these options apply, the `gen_ai.system` **SHOULD** be set to `_OTHER`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_SYSTEM = 'gen_ai.system' as const;

/**
 * Enum value "anthropic" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_ANTHROPIC = 'anthropic' as const;

/**
 * Enum value "aws.bedrock" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_AWS_BEDROCK = 'aws.bedrock' as const;

/**
 * Enum value "az.ai.inference" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_AZ_AI_INFERENCE = 'az.ai.inference' as const;

/**
 * Enum value "az.ai.openai" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_AZ_AI_OPENAI = 'az.ai.openai' as const;

/**
 * Enum value "cohere" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_COHERE = 'cohere' as const;

/**
 * Enum value "deepseek" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_DEEPSEEK = 'deepseek' as const;

/**
 * Enum value "gemini" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_GEMINI = 'gemini' as const;

/**
 * Enum value "groq" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_GROQ = 'groq' as const;

/**
 * Enum value "ibm.watsonx.ai" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_IBM_WATSONX_AI = 'ibm.watsonx.ai' as const;

/**
 * Enum value "mistral_ai" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_MISTRAL_AI = 'mistral_ai' as const;

/**
 * Enum value "openai" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_OPENAI = 'openai' as const;

/**
 * Enum value "perplexity" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_PERPLEXITY = 'perplexity' as const;

/**
 * Enum value "vertex_ai" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_VERTEX_AI = 'vertex_ai' as const;

/**
 * Enum value "xai" for attribute {@link ATTR_GEN_AI_SYSTEM}.
 */
export const GEN_AI_SYSTEM_VALUE_XAI = 'xai' as const;

/**
 * The type of token being counted.
 *
 * @example input
 * @example output
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_TOKEN_TYPE = 'gen_ai.token.type' as const;

/**
 * Enum value "input" for attribute {@link ATTR_GEN_AI_TOKEN_TYPE}.
 */
export const GEN_AI_TOKEN_TYPE_VALUE_INPUT = 'input' as const;

/**
 * Enum value "output" for attribute {@link ATTR_GEN_AI_TOKEN_TYPE}.
 */
export const GEN_AI_TOKEN_TYPE_VALUE_COMPLETION = 'output' as const;

/**
 * Enum value "output" for attribute {@link ATTR_GEN_AI_TOKEN_TYPE}.
 */
export const GEN_AI_TOKEN_TYPE_VALUE_OUTPUT = 'output' as const;

/**
 * The tool call identifier.
 *
 * @example call_mszuSIzqtI65i1wAUOE8w5H4
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_TOOL_CALL_ID = 'gen_ai.tool.call.id' as const;

/**
 * Name of the tool utilized by the agent.
 *
 * @example Flights
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_TOOL_NAME = 'gen_ai.tool.name' as const;

/**
 * Type of the tool utilized by the agent
 *
 * @example function
 * @example extension
 * @example datastore
 *
 * @note Extension: A tool executed on the agent-side to directly call external APIs, bridging the gap between the agent and real-world systems.
 * Agent-side operations involve actions that are performed by the agent on the server or within the agent's controlled environment.
 * Function: A tool executed on the client-side, where the agent generates parameters for a predefined function, and the client executes the logic.
 * Client-side operations are actions taken on the user's end or within the client application.
 * Datastore: A tool used by the agent to access and query structured or unstructured external data for retrieval-augmented tasks or knowledge updates.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_TOOL_TYPE = 'gen_ai.tool.type' as const;

/**
 * Deprecated, use `gen_ai.usage.output_tokens` instead.
 *
 * @example 42
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `gen_ai.usage.output_tokens` attribute.
 */
export const ATTR_GEN_AI_USAGE_COMPLETION_TOKENS = 'gen_ai.usage.completion_tokens' as const;

/**
 * The number of tokens used in the GenAI input (prompt).
 *
 * @example 100
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_USAGE_INPUT_TOKENS = 'gen_ai.usage.input_tokens' as const;

/**
 * The number of tokens used in the GenAI response (completion).
 *
 * @example 180
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEN_AI_USAGE_OUTPUT_TOKENS = 'gen_ai.usage.output_tokens' as const;

/**
 * Deprecated, use `gen_ai.usage.input_tokens` instead.
 *
 * @example 42
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `gen_ai.usage.input_tokens` attribute.
 */
export const ATTR_GEN_AI_USAGE_PROMPT_TOKENS = 'gen_ai.usage.prompt_tokens' as const;

/**
 * Two-letter code representing continent’s name.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEO_CONTINENT_CODE = 'geo.continent.code' as const;

/**
 * Enum value "AF" for attribute {@link ATTR_GEO_CONTINENT_CODE}.
 */
export const GEO_CONTINENT_CODE_VALUE_AF = 'AF' as const;

/**
 * Enum value "AN" for attribute {@link ATTR_GEO_CONTINENT_CODE}.
 */
export const GEO_CONTINENT_CODE_VALUE_AN = 'AN' as const;

/**
 * Enum value "AS" for attribute {@link ATTR_GEO_CONTINENT_CODE}.
 */
export const GEO_CONTINENT_CODE_VALUE_AS = 'AS' as const;

/**
 * Enum value "EU" for attribute {@link ATTR_GEO_CONTINENT_CODE}.
 */
export const GEO_CONTINENT_CODE_VALUE_EU = 'EU' as const;

/**
 * Enum value "NA" for attribute {@link ATTR_GEO_CONTINENT_CODE}.
 */
export const GEO_CONTINENT_CODE_VALUE_NA = 'NA' as const;

/**
 * Enum value "OC" for attribute {@link ATTR_GEO_CONTINENT_CODE}.
 */
export const GEO_CONTINENT_CODE_VALUE_OC = 'OC' as const;

/**
 * Enum value "SA" for attribute {@link ATTR_GEO_CONTINENT_CODE}.
 */
export const GEO_CONTINENT_CODE_VALUE_SA = 'SA' as const;

/**
 * Two-letter ISO Country Code ([ISO 3166-1 alpha2](https://wikipedia.org/wiki/ISO_3166-1#Codes)).
 *
 * @example CA
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEO_COUNTRY_ISO_CODE = 'geo.country.iso_code' as const;

/**
 * Locality name. Represents the name of a city, town, village, or similar populated place.
 *
 * @example Montreal
 * @example Berlin
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEO_LOCALITY_NAME = 'geo.locality.name' as const;

/**
 * Latitude of the geo location in [WGS84](https://wikipedia.org/wiki/World_Geodetic_System#WGS84).
 *
 * @example 45.505918
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEO_LOCATION_LAT = 'geo.location.lat' as const;

/**
 * Longitude of the geo location in [WGS84](https://wikipedia.org/wiki/World_Geodetic_System#WGS84).
 *
 * @example -73.61483
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEO_LOCATION_LON = 'geo.location.lon' as const;

/**
 * Postal code associated with the location. Values appropriate for this field may also be known as a postcode or ZIP code and will vary widely from country to country.
 *
 * @example 94040
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEO_POSTAL_CODE = 'geo.postal_code' as const;

/**
 * Region ISO code ([ISO 3166-2](https://wikipedia.org/wiki/ISO_3166-2)).
 *
 * @example CA-QC
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GEO_REGION_ISO_CODE = 'geo.region.iso_code' as const;

/**
 * The type of memory.
 *
 * @example other
 * @example stack
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GO_MEMORY_TYPE = 'go.memory.type' as const;

/**
 * Enum value "other" for attribute {@link ATTR_GO_MEMORY_TYPE}.
 */
export const GO_MEMORY_TYPE_VALUE_OTHER = 'other' as const;

/**
 * Enum value "stack" for attribute {@link ATTR_GO_MEMORY_TYPE}.
 */
export const GO_MEMORY_TYPE_VALUE_STACK = 'stack' as const;

/**
 * The GraphQL document being executed.
 *
 * @example "query findBookById { bookById(id: ?) { name } }"
 *
 * @note The value may be sanitized to exclude sensitive information.
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GRAPHQL_DOCUMENT = 'graphql.document' as const;

/**
 * The name of the operation being executed.
 *
 * @example "findBookById"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GRAPHQL_OPERATION_NAME = 'graphql.operation.name' as const;

/**
 * The type of the operation being executed.
 *
 * @example query
 * @example mutation
 * @example subscription
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_GRAPHQL_OPERATION_TYPE = 'graphql.operation.type' as const;

/**
 * Enum value "mutation" for attribute {@link ATTR_GRAPHQL_OPERATION_TYPE}.
 */
export const GRAPHQL_OPERATION_TYPE_VALUE_MUTATION = 'mutation' as const;

/**
 * Enum value "query" for attribute {@link ATTR_GRAPHQL_OPERATION_TYPE}.
 */
export const GRAPHQL_OPERATION_TYPE_VALUE_QUERY = 'query' as const;

/**
 * Enum value "subscription" for attribute {@link ATTR_GRAPHQL_OPERATION_TYPE}.
 */
export const GRAPHQL_OPERATION_TYPE_VALUE_SUBSCRIPTION = 'subscription' as const;

/**
 * Unique identifier for the application
 *
 * @example 2daa2797-e42b-4624-9322-ec3f968df4da
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HEROKU_APP_ID = 'heroku.app.id' as const;

/**
 * Commit hash for the current release
 *
 * @example e6134959463efd8966b20e75b913cafe3f5ec
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HEROKU_RELEASE_COMMIT = 'heroku.release.commit' as const;

/**
 * Time and date the release was created
 *
 * @example 2022-10-23T18:00:42Z
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HEROKU_RELEASE_CREATION_TIMESTAMP = 'heroku.release.creation_timestamp' as const;

/**
 * The CPU architecture the host system is running on.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_ARCH = 'host.arch' as const;

/**
 * Enum value "amd64" for attribute {@link ATTR_HOST_ARCH}.
 */
export const HOST_ARCH_VALUE_AMD64 = 'amd64' as const;

/**
 * Enum value "arm32" for attribute {@link ATTR_HOST_ARCH}.
 */
export const HOST_ARCH_VALUE_ARM32 = 'arm32' as const;

/**
 * Enum value "arm64" for attribute {@link ATTR_HOST_ARCH}.
 */
export const HOST_ARCH_VALUE_ARM64 = 'arm64' as const;

/**
 * Enum value "ia64" for attribute {@link ATTR_HOST_ARCH}.
 */
export const HOST_ARCH_VALUE_IA64 = 'ia64' as const;

/**
 * Enum value "ppc32" for attribute {@link ATTR_HOST_ARCH}.
 */
export const HOST_ARCH_VALUE_PPC32 = 'ppc32' as const;

/**
 * Enum value "ppc64" for attribute {@link ATTR_HOST_ARCH}.
 */
export const HOST_ARCH_VALUE_PPC64 = 'ppc64' as const;

/**
 * Enum value "s390x" for attribute {@link ATTR_HOST_ARCH}.
 */
export const HOST_ARCH_VALUE_S390X = 's390x' as const;

/**
 * Enum value "x86" for attribute {@link ATTR_HOST_ARCH}.
 */
export const HOST_ARCH_VALUE_X86 = 'x86' as const;

/**
 * The amount of level 2 memory cache available to the processor (in Bytes).
 *
 * @example 12288000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_CPU_CACHE_L2_SIZE = 'host.cpu.cache.l2.size' as const;

/**
 * Family or generation of the CPU.
 *
 * @example 6
 * @example PA-RISC 1.1e
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_CPU_FAMILY = 'host.cpu.family' as const;

/**
 * Model identifier. It provides more granular information about the CPU, distinguishing it from other CPUs within the same family.
 *
 * @example 6
 * @example 9000/778/B180L
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_CPU_MODEL_ID = 'host.cpu.model.id' as const;

/**
 * Model designation of the processor.
 *
 * @example 11th Gen Intel(R) Core(TM) i7-1185G7 @ 3.00GHz
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_CPU_MODEL_NAME = 'host.cpu.model.name' as const;

/**
 * Stepping or core revisions.
 *
 * @example 1
 * @example r1p1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_CPU_STEPPING = 'host.cpu.stepping' as const;

/**
 * Processor manufacturer identifier. A maximum 12-character string.
 *
 * @example GenuineIntel
 *
 * @note [CPUID](https://wiki.osdev.org/CPUID) command returns the vendor ID string in EBX, EDX and ECX registers. Writing these to memory in this order results in a 12-character string.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_CPU_VENDOR_ID = 'host.cpu.vendor.id' as const;

/**
 * Unique host ID. For Cloud, this must be the instance_id assigned by the cloud provider. For non-containerized systems, this should be the `machine-id`. See the table below for the sources to use to determine the `machine-id` based on operating system.
 *
 * @example fdbf79e8af94cb7f9e8df36789187052
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_ID = 'host.id' as const;

/**
 * VM image ID or host OS image ID. For Cloud, this value is from the provider.
 *
 * @example ami-07b06b442921831e5
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_IMAGE_ID = 'host.image.id' as const;

/**
 * Name of the VM image or OS install the host was instantiated from.
 *
 * @example infra-ami-eks-worker-node-7d4ec78312
 * @example CentOS-8-x86_64-1905
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_IMAGE_NAME = 'host.image.name' as const;

/**
 * The version string of the VM image or host OS as defined in [Version Attributes](/docs/resource/README.md#version-attributes).
 *
 * @example 0.1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_IMAGE_VERSION = 'host.image.version' as const;

/**
 * Available IP addresses of the host, excluding loopback interfaces.
 *
 * @example ["192.168.1.140", "fe80::abc2:4a28:737a:609e"]
 *
 * @note IPv4 Addresses **MUST** be specified in dotted-quad notation. IPv6 addresses **MUST** be specified in the [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.html) format.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_IP = 'host.ip' as const;

/**
 * Available MAC addresses of the host, excluding loopback interfaces.
 *
 * @example ["AC-DE-48-23-45-67", "AC-DE-48-23-45-67-01-9F"]
 *
 * @note MAC Addresses **MUST** be represented in [IEEE RA hexadecimal form](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/eui.pdf): as hyphen-separated octets in uppercase hexadecimal form from most to least significant.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_MAC = 'host.mac' as const;

/**
 * Name of the host. On Unix systems, it may contain what the hostname command returns, or the fully qualified hostname, or another name specified by the user.
 *
 * @example opentelemetry-test
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_NAME = 'host.name' as const;

/**
 * Type of host. For Cloud, this must be the machine type.
 *
 * @example n1-standard-1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HOST_TYPE = 'host.type' as const;

/**
 * Deprecated, use `client.address` instead.
 *
 * @example "83.164.160.102"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `client.address`.
 */
export const ATTR_HTTP_CLIENT_IP = 'http.client_ip' as const;

/**
 * State of the HTTP connection in the HTTP connection pool.
 *
 * @example active
 * @example idle
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HTTP_CONNECTION_STATE = 'http.connection.state' as const;

/**
 * Enum value "active" for attribute {@link ATTR_HTTP_CONNECTION_STATE}.
 */
export const HTTP_CONNECTION_STATE_VALUE_ACTIVE = 'active' as const;

/**
 * Enum value "idle" for attribute {@link ATTR_HTTP_CONNECTION_STATE}.
 */
export const HTTP_CONNECTION_STATE_VALUE_IDLE = 'idle' as const;

/**
 * Deprecated, use `network.protocol.name` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.protocol.name`.
 */
export const ATTR_HTTP_FLAVOR = 'http.flavor' as const;

/**
 * Enum value "1.0" for attribute {@link ATTR_HTTP_FLAVOR}.
 */
export const HTTP_FLAVOR_VALUE_HTTP_1_0 = '1.0' as const;

/**
 * Enum value "1.1" for attribute {@link ATTR_HTTP_FLAVOR}.
 */
export const HTTP_FLAVOR_VALUE_HTTP_1_1 = '1.1' as const;

/**
 * Enum value "2.0" for attribute {@link ATTR_HTTP_FLAVOR}.
 */
export const HTTP_FLAVOR_VALUE_HTTP_2_0 = '2.0' as const;

/**
 * Enum value "3.0" for attribute {@link ATTR_HTTP_FLAVOR}.
 */
export const HTTP_FLAVOR_VALUE_HTTP_3_0 = '3.0' as const;

/**
 * Enum value "QUIC" for attribute {@link ATTR_HTTP_FLAVOR}.
 */
export const HTTP_FLAVOR_VALUE_QUIC = 'QUIC' as const;

/**
 * Enum value "SPDY" for attribute {@link ATTR_HTTP_FLAVOR}.
 */
export const HTTP_FLAVOR_VALUE_SPDY = 'SPDY' as const;

/**
 * Deprecated, use one of `server.address`, `client.address` or `http.request.header.host` instead, depending on the usage.
 *
 * @example www.example.org
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by one of `server.address`, `client.address` or `http.request.header.host`, depending on the usage.
 */
export const ATTR_HTTP_HOST = 'http.host' as const;

/**
 * Deprecated, use `http.request.method` instead.
 *
 * @example GET
 * @example POST
 * @example HEAD
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `http.request.method`.
 */
export const ATTR_HTTP_METHOD = 'http.method' as const;

/**
 * The size of the request payload body in bytes. This is the number of bytes transferred excluding headers and is often, but not always, present as the [Content-Length](https://www.rfc-editor.org/rfc/rfc9110.html#field.content-length) header. For requests using transport encoding, this should be the compressed size.
 *
 * @example 3495
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HTTP_REQUEST_BODY_SIZE = 'http.request.body.size' as const;

/**
 * The total size of the request in bytes. This should be the total number of bytes sent over the wire, including the request line (HTTP/1.1), framing (HTTP/2 and HTTP/3), headers, and request body if any.
 *
 * @example 1437
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HTTP_REQUEST_SIZE = 'http.request.size' as const;

/**
 * Deprecated, use `http.request.header.<key>` instead.
 *
 * @example 3495
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `http.request.header.<key>`.
 */
export const ATTR_HTTP_REQUEST_CONTENT_LENGTH = 'http.request_content_length' as const;

/**
 * Deprecated, use `http.request.body.size` instead.
 *
 * @example 5493
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `http.request.body.size`.
 */
export const ATTR_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED =
  'http.request_content_length_uncompressed' as const;

/**
 * The size of the response payload body in bytes. This is the number of bytes transferred excluding headers and is often, but not always, present as the [Content-Length](https://www.rfc-editor.org/rfc/rfc9110.html#field.content-length) header. For requests using transport encoding, this should be the compressed size.
 *
 * @example 3495
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HTTP_RESPONSE_BODY_SIZE = 'http.response.body.size' as const;

/**
 * The total size of the response in bytes. This should be the total number of bytes sent over the wire, including the status line (HTTP/1.1), framing (HTTP/2 and HTTP/3), headers, and response body and trailers if any.
 *
 * @example 1437
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HTTP_RESPONSE_SIZE = 'http.response.size' as const;

/**
 * Deprecated, use `http.response.header.<key>` instead.
 *
 * @example 3495
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `http.response.header.<key>`.
 */
export const ATTR_HTTP_RESPONSE_CONTENT_LENGTH = 'http.response_content_length' as const;

/**
 * Deprecated, use `http.response.body.size` instead.
 *
 * @example 5493
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replace by `http.response.body.size`.
 */
export const ATTR_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED =
  'http.response_content_length_uncompressed' as const;

/**
 * Deprecated, use `url.scheme` instead.
 *
 * @example http
 * @example https
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `url.scheme` instead.
 */
export const ATTR_HTTP_SCHEME = 'http.scheme' as const;

/**
 * Deprecated, use `server.address` instead.
 *
 * @example example.com
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `server.address`.
 */
export const ATTR_HTTP_SERVER_NAME = 'http.server_name' as const;

/**
 * Deprecated, use `http.response.status_code` instead.
 *
 * @example 200
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `http.response.status_code`.
 */
export const ATTR_HTTP_STATUS_CODE = 'http.status_code' as const;

/**
 * Deprecated, use `url.path` and `url.query` instead.
 *
 * @example /search?q=OpenTelemetry#SemConv
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Split to `url.path` and `url.query.
 */
export const ATTR_HTTP_TARGET = 'http.target' as const;

/**
 * Deprecated, use `url.full` instead.
 *
 * @example https://www.foo.bar/search?q=OpenTelemetry#SemConv
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `url.full`.
 */
export const ATTR_HTTP_URL = 'http.url' as const;

/**
 * Deprecated, use `user_agent.original` instead.
 *
 * @example CERN-LineMode/2.15 libwww/2.17b3
 * @example Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `user_agent.original`.
 */
export const ATTR_HTTP_USER_AGENT = 'http.user_agent' as const;

/**
 * An identifier for the hardware component, unique within the monitored host
 *
 * @example win32battery_battery_testsysa33_1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HW_ID = 'hw.id' as const;

/**
 * An easily-recognizable name for the hardware component
 *
 * @example eth0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HW_NAME = 'hw.name' as const;

/**
 * Unique identifier of the parent component (typically the `hw.id` attribute of the enclosure, or disk controller)
 *
 * @example dellStorage_perc_0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HW_PARENT = 'hw.parent' as const;

/**
 * The current state of the component
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HW_STATE = 'hw.state' as const;

/**
 * Enum value "degraded" for attribute {@link ATTR_HW_STATE}.
 */
export const HW_STATE_VALUE_DEGRADED = 'degraded' as const;

/**
 * Enum value "failed" for attribute {@link ATTR_HW_STATE}.
 */
export const HW_STATE_VALUE_FAILED = 'failed' as const;

/**
 * Enum value "ok" for attribute {@link ATTR_HW_STATE}.
 */
export const HW_STATE_VALUE_OK = 'ok' as const;

/**
 * Type of the component
 *
 * @note Describes the category of the hardware component for which `hw.state` is being reported. For example, `hw.type=temperature` along with `hw.state=degraded` would indicate that the temperature of the hardware component has been reported as `degraded`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_HW_TYPE = 'hw.type' as const;

/**
 * Enum value "battery" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_BATTERY = 'battery' as const;

/**
 * Enum value "cpu" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_CPU = 'cpu' as const;

/**
 * Enum value "disk_controller" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_DISK_CONTROLLER = 'disk_controller' as const;

/**
 * Enum value "enclosure" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_ENCLOSURE = 'enclosure' as const;

/**
 * Enum value "fan" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_FAN = 'fan' as const;

/**
 * Enum value "gpu" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_GPU = 'gpu' as const;

/**
 * Enum value "logical_disk" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_LOGICAL_DISK = 'logical_disk' as const;

/**
 * Enum value "memory" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_MEMORY = 'memory' as const;

/**
 * Enum value "network" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_NETWORK = 'network' as const;

/**
 * Enum value "physical_disk" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_PHYSICAL_DISK = 'physical_disk' as const;

/**
 * Enum value "power_supply" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_POWER_SUPPLY = 'power_supply' as const;

/**
 * Enum value "tape_drive" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_TAPE_DRIVE = 'tape_drive' as const;

/**
 * Enum value "temperature" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_TEMPERATURE = 'temperature' as const;

/**
 * Enum value "voltage" for attribute {@link ATTR_HW_TYPE}.
 */
export const HW_TYPE_VALUE_VOLTAGE = 'voltage' as const;

/**
 * This attribute represents the state of the application.
 *
 * @note The iOS lifecycle states are defined in the [UIApplicationDelegate documentation](https://developer.apple.com/documentation/uikit/uiapplicationdelegate), and from which the `OS terminology` column values are derived.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_IOS_APP_STATE = 'ios.app.state' as const;

/**
 * Enum value "active" for attribute {@link ATTR_IOS_APP_STATE}.
 */
export const IOS_APP_STATE_VALUE_ACTIVE = 'active' as const;

/**
 * Enum value "background" for attribute {@link ATTR_IOS_APP_STATE}.
 */
export const IOS_APP_STATE_VALUE_BACKGROUND = 'background' as const;

/**
 * Enum value "foreground" for attribute {@link ATTR_IOS_APP_STATE}.
 */
export const IOS_APP_STATE_VALUE_FOREGROUND = 'foreground' as const;

/**
 * Enum value "inactive" for attribute {@link ATTR_IOS_APP_STATE}.
 */
export const IOS_APP_STATE_VALUE_INACTIVE = 'inactive' as const;

/**
 * Enum value "terminate" for attribute {@link ATTR_IOS_APP_STATE}.
 */
export const IOS_APP_STATE_VALUE_TERMINATE = 'terminate' as const;

/**
 * Deprecated. use the `ios.app.state` instead.
 *
 * @note The iOS lifecycle states are defined in the [UIApplicationDelegate documentation](https://developer.apple.com/documentation/uikit/uiapplicationdelegate), and from which the `OS terminology` column values are derived.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Renamed to `ios.app.state`
 */
export const ATTR_IOS_STATE = 'ios.state' as const;

/**
 * Enum value "active" for attribute {@link ATTR_IOS_STATE}.
 */
export const IOS_STATE_VALUE_ACTIVE = 'active' as const;

/**
 * Enum value "background" for attribute {@link ATTR_IOS_STATE}.
 */
export const IOS_STATE_VALUE_BACKGROUND = 'background' as const;

/**
 * Enum value "foreground" for attribute {@link ATTR_IOS_STATE}.
 */
export const IOS_STATE_VALUE_FOREGROUND = 'foreground' as const;

/**
 * Enum value "inactive" for attribute {@link ATTR_IOS_STATE}.
 */
export const IOS_STATE_VALUE_INACTIVE = 'inactive' as const;

/**
 * Enum value "terminate" for attribute {@link ATTR_IOS_STATE}.
 */
export const IOS_STATE_VALUE_TERMINATE = 'terminate' as const;

/**
 * Name of the buffer pool.
 *
 * @example mapped
 * @example direct
 *
 * @note Pool names are generally obtained via [BufferPoolMXBean#getName()](https://docs.oracle.com/en/java/javase/11/docs/api/java.management/java/lang/management/BufferPoolMXBean.html#getName()).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_JVM_BUFFER_POOL_NAME = 'jvm.buffer.pool.name' as const;

/**
 * The name of the cluster.
 *
 * @example opentelemetry-cluster
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_CLUSTER_NAME = 'k8s.cluster.name' as const;

/**
 * A pseudo-ID for the cluster, set to the UID of the `kube-system` namespace.
 *
 * @example 218fc5a9-a5f1-4b54-aa05-46717d0ab26d
 *
 * @note K8s doesn't have support for obtaining a cluster ID. If this is ever
 * added, we will recommend collecting the `k8s.cluster.uid` through the
 * official APIs. In the meantime, we are able to use the `uid` of the
 * `kube-system` namespace as a proxy for cluster ID. Read on for the
 * rationale.
 *
 * Every object created in a K8s cluster is assigned a distinct UID. The
 * `kube-system` namespace is used by Kubernetes itself and will exist
 * for the lifetime of the cluster. Using the `uid` of the `kube-system`
 * namespace is a reasonable proxy for the K8s ClusterID as it will only
 * change if the cluster is rebuilt. Furthermore, Kubernetes UIDs are
 * UUIDs as standardized by
 * [ISO/IEC 9834-8 and ITU-T X.667](https://www.itu.int/ITU-T/studygroups/com17/oid.html).
 * Which states:
 *
 * > If generated according to one of the mechanisms defined in Rec.
 * > ITU-T X.667 | ISO/IEC 9834-8, a UUID is either guaranteed to be
 * > different from all other UUIDs generated before 3603 A.D., or is
 * > extremely likely to be different (depending on the mechanism chosen).
 *
 * Therefore, UIDs between clusters should be extremely unlikely to
 * conflict.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_CLUSTER_UID = 'k8s.cluster.uid' as const;

/**
 * The name of the Container from Pod specification, must be unique within a Pod. Container runtime usually uses different globally unique name (`container.name`).
 *
 * @example redis
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_CONTAINER_NAME = 'k8s.container.name' as const;

/**
 * Number of times the container was restarted. This attribute can be used to identify a particular container (running or stopped) within a container spec.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_CONTAINER_RESTART_COUNT = 'k8s.container.restart_count' as const;

/**
 * Last terminated reason of the Container.
 *
 * @example Evicted
 * @example Error
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_CONTAINER_STATUS_LAST_TERMINATED_REASON =
  'k8s.container.status.last_terminated_reason' as const;

/**
 * The name of the CronJob.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_CRONJOB_NAME = 'k8s.cronjob.name' as const;

/**
 * The UID of the CronJob.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_CRONJOB_UID = 'k8s.cronjob.uid' as const;

/**
 * The name of the DaemonSet.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_DAEMONSET_NAME = 'k8s.daemonset.name' as const;

/**
 * The UID of the DaemonSet.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_DAEMONSET_UID = 'k8s.daemonset.uid' as const;

/**
 * The name of the Deployment.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_DEPLOYMENT_NAME = 'k8s.deployment.name' as const;

/**
 * The UID of the Deployment.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_DEPLOYMENT_UID = 'k8s.deployment.uid' as const;

/**
 * The name of the horizontal pod autoscaler.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_HPA_NAME = 'k8s.hpa.name' as const;

/**
 * The UID of the horizontal pod autoscaler.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_HPA_UID = 'k8s.hpa.uid' as const;

/**
 * The name of the Job.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_JOB_NAME = 'k8s.job.name' as const;

/**
 * The UID of the Job.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_JOB_UID = 'k8s.job.uid' as const;

/**
 * The name of the namespace that the pod is running in.
 *
 * @example default
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_NAMESPACE_NAME = 'k8s.namespace.name' as const;

/**
 * The phase of the K8s namespace.
 *
 * @example active
 * @example terminating
 *
 * @note This attribute aligns with the `phase` field of the
 * [K8s NamespaceStatus](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#namespacestatus-v1-core)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_NAMESPACE_PHASE = 'k8s.namespace.phase' as const;

/**
 * Enum value "active" for attribute {@link ATTR_K8S_NAMESPACE_PHASE}.
 */
export const K8S_NAMESPACE_PHASE_VALUE_ACTIVE = 'active' as const;

/**
 * Enum value "terminating" for attribute {@link ATTR_K8S_NAMESPACE_PHASE}.
 */
export const K8S_NAMESPACE_PHASE_VALUE_TERMINATING = 'terminating' as const;

/**
 * The name of the Node.
 *
 * @example node-1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_NODE_NAME = 'k8s.node.name' as const;

/**
 * The UID of the Node.
 *
 * @example 1eb3a0c6-0477-4080-a9cb-0cb7db65c6a2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_NODE_UID = 'k8s.node.uid' as const;

/**
 * The annotation key-value pairs placed on the Pod, the `<key>` being the annotation name, the value being the annotation value.
 *
 * @example k8s.pod.annotation.kubernetes.io/enforce-mountable-secrets=true
 * @example k8s.pod.annotation.mycompany.io/arch=x64
 * @example k8s.pod.annotation.data=
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_POD_ANNOTATION = (key: string) => `k8s.pod.annotation.${key}`;

/**
 * The label key-value pairs placed on the Pod, the `<key>` being the label name, the value being the label value.
 *
 * @example k8s.pod.label.app=my-app
 * @example k8s.pod.label.mycompany.io/arch=x64
 * @example k8s.pod.label.data=
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_POD_LABEL = (key: string) => `k8s.pod.label.${key}`;

/**
 * Deprecated, use `k8s.pod.label` instead.
 *
 * @example k8s.pod.label.app=my-app
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `k8s.pod.label`.
 */
export const ATTR_K8S_POD_LABELS = (key: string) => `k8s.pod.labels.${key}`;

/**
 * The name of the Pod.
 *
 * @example opentelemetry-pod-autoconf
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_POD_NAME = 'k8s.pod.name' as const;

/**
 * The UID of the Pod.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_POD_UID = 'k8s.pod.uid' as const;

/**
 * The name of the ReplicaSet.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_REPLICASET_NAME = 'k8s.replicaset.name' as const;

/**
 * The UID of the ReplicaSet.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_REPLICASET_UID = 'k8s.replicaset.uid' as const;

/**
 * The name of the replication controller.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_REPLICATIONCONTROLLER_NAME = 'k8s.replicationcontroller.name' as const;

/**
 * The UID of the replication controller.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_REPLICATIONCONTROLLER_UID = 'k8s.replicationcontroller.uid' as const;

/**
 * The name of the resource quota.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_RESOURCEQUOTA_NAME = 'k8s.resourcequota.name' as const;

/**
 * The UID of the resource quota.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_RESOURCEQUOTA_UID = 'k8s.resourcequota.uid' as const;

/**
 * The name of the StatefulSet.
 *
 * @example opentelemetry
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_STATEFULSET_NAME = 'k8s.statefulset.name' as const;

/**
 * The UID of the StatefulSet.
 *
 * @example 275ecb36-5aa8-4c2a-9c47-d8bb681b9aff
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_STATEFULSET_UID = 'k8s.statefulset.uid' as const;

/**
 * The name of the K8s volume.
 *
 * @example volume0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_VOLUME_NAME = 'k8s.volume.name' as const;

/**
 * The type of the K8s volume.
 *
 * @example emptyDir
 * @example persistentVolumeClaim
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_K8S_VOLUME_TYPE = 'k8s.volume.type' as const;

/**
 * Enum value "configMap" for attribute {@link ATTR_K8S_VOLUME_TYPE}.
 */
export const K8S_VOLUME_TYPE_VALUE_CONFIG_MAP = 'configMap' as const;

/**
 * Enum value "downwardAPI" for attribute {@link ATTR_K8S_VOLUME_TYPE}.
 */
export const K8S_VOLUME_TYPE_VALUE_DOWNWARD_API = 'downwardAPI' as const;

/**
 * Enum value "emptyDir" for attribute {@link ATTR_K8S_VOLUME_TYPE}.
 */
export const K8S_VOLUME_TYPE_VALUE_EMPTY_DIR = 'emptyDir' as const;

/**
 * Enum value "local" for attribute {@link ATTR_K8S_VOLUME_TYPE}.
 */
export const K8S_VOLUME_TYPE_VALUE_LOCAL = 'local' as const;

/**
 * Enum value "persistentVolumeClaim" for attribute {@link ATTR_K8S_VOLUME_TYPE}.
 */
export const K8S_VOLUME_TYPE_VALUE_PERSISTENT_VOLUME_CLAIM = 'persistentVolumeClaim' as const;

/**
 * Enum value "secret" for attribute {@link ATTR_K8S_VOLUME_TYPE}.
 */
export const K8S_VOLUME_TYPE_VALUE_SECRET = 'secret' as const;

/**
 * The Linux Slab memory state
 *
 * @example reclaimable
 * @example unreclaimable
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_LINUX_MEMORY_SLAB_STATE = 'linux.memory.slab.state' as const;

/**
 * Enum value "reclaimable" for attribute {@link ATTR_LINUX_MEMORY_SLAB_STATE}.
 */
export const LINUX_MEMORY_SLAB_STATE_VALUE_RECLAIMABLE = 'reclaimable' as const;

/**
 * Enum value "unreclaimable" for attribute {@link ATTR_LINUX_MEMORY_SLAB_STATE}.
 */
export const LINUX_MEMORY_SLAB_STATE_VALUE_UNRECLAIMABLE = 'unreclaimable' as const;

/**
 * The basename of the file.
 *
 * @example audit.log
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_LOG_FILE_NAME = 'log.file.name' as const;

/**
 * The basename of the file, with symlinks resolved.
 *
 * @example uuid.log
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_LOG_FILE_NAME_RESOLVED = 'log.file.name_resolved' as const;

/**
 * The full path to the file.
 *
 * @example /var/log/mysql/audit.log
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_LOG_FILE_PATH = 'log.file.path' as const;

/**
 * The full path to the file, with symlinks resolved.
 *
 * @example /var/lib/docker/uuid.log
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_LOG_FILE_PATH_RESOLVED = 'log.file.path_resolved' as const;

/**
 * The stream associated with the log. See below for a list of well-known values.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_LOG_IOSTREAM = 'log.iostream' as const;

/**
 * Enum value "stderr" for attribute {@link ATTR_LOG_IOSTREAM}.
 */
export const LOG_IOSTREAM_VALUE_STDERR = 'stderr' as const;

/**
 * Enum value "stdout" for attribute {@link ATTR_LOG_IOSTREAM}.
 */
export const LOG_IOSTREAM_VALUE_STDOUT = 'stdout' as const;

/**
 * The complete original Log Record.
 *
 * @example 77 <86>1 2015-08-06T21:58:59.694Z 192.168.2.133 inactive - - - Something happened
 * @example [INFO] 8/3/24 12:34:56 Something happened
 *
 * @note This value **MAY** be added when processing a Log Record which was originally transmitted as a string or equivalent data type AND the Body field of the Log Record does not contain the same value. (e.g. a syslog or a log record read from a file.)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_LOG_RECORD_ORIGINAL = 'log.record.original' as const;

/**
 * A unique identifier for the Log Record.
 *
 * @example 01ARZ3NDEKTSV4RRFFQ69G5FAV
 *
 * @note If an id is provided, other log records with the same id will be considered duplicates and can be removed safely. This means, that two distinguishable log records **MUST** have different values.
 * The id **MAY** be an [Universally Unique Lexicographically Sortable Identifier (ULID)](https://github.com/ulid/spec), but other identifiers (e.g. UUID) may be used as needed.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_LOG_RECORD_UID = 'log.record.uid' as const;

/**
 * Deprecated, use `rpc.message.compressed_size` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `rpc.message.compressed_size`.
 */
export const ATTR_MESSAGE_COMPRESSED_SIZE = 'message.compressed_size' as const;

/**
 * Deprecated, use `rpc.message.id` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `rpc.message.id`.
 */
export const ATTR_MESSAGE_ID = 'message.id' as const;

/**
 * Deprecated, use `rpc.message.type` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `rpc.message.type`.
 */
export const ATTR_MESSAGE_TYPE = 'message.type' as const;

/**
 * Enum value "RECEIVED" for attribute {@link ATTR_MESSAGE_TYPE}.
 */
export const MESSAGE_TYPE_VALUE_RECEIVED = 'RECEIVED' as const;

/**
 * Enum value "SENT" for attribute {@link ATTR_MESSAGE_TYPE}.
 */
export const MESSAGE_TYPE_VALUE_SENT = 'SENT' as const;

/**
 * Deprecated, use `rpc.message.uncompressed_size` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `rpc.message.uncompressed_size`.
 */
export const ATTR_MESSAGE_UNCOMPRESSED_SIZE = 'message.uncompressed_size' as const;

/**
 * The number of messages sent, received, or processed in the scope of the batching operation.
 *
 * @example 0
 * @example 1
 * @example 2
 *
 * @note Instrumentations **SHOULD NOT** set `messaging.batch.message_count` on spans that operate with a single message. When a messaging client library supports both batch and single-message API for the same operation, instrumentations **SHOULD** use `messaging.batch.message_count` for batching APIs and **SHOULD NOT** use it for single-message APIs.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_BATCH_MESSAGE_COUNT = 'messaging.batch.message_count' as const;

/**
 * A unique identifier for the client that consumes or produces a message.
 *
 * @example client-5
 * @example myhost@8742@s8083jm
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_CLIENT_ID = 'messaging.client.id' as const;

/**
 * The name of the consumer group with which a consumer is associated.
 *
 * @example my-group
 * @example indexer
 *
 * @note Semantic conventions for individual messaging systems **SHOULD** document whether `messaging.consumer.group.name` is applicable and what it means in the context of that system.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_CONSUMER_GROUP_NAME = 'messaging.consumer.group.name' as const;

/**
 * A boolean that is true if the message destination is anonymous (could be unnamed or have auto-generated name).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_DESTINATION_ANONYMOUS = 'messaging.destination.anonymous' as const;

/**
 * The message destination name
 *
 * @example MyQueue
 * @example MyTopic
 *
 * @note Destination name **SHOULD** uniquely identify a specific queue, topic or other entity within the broker. If
 * the broker doesn't have such notion, the destination name **SHOULD** uniquely identify the broker.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_DESTINATION_NAME = 'messaging.destination.name' as const;

/**
 * The identifier of the partition messages are sent to or received from, unique within the `messaging.destination.name`.
 *
 * @example "1"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_DESTINATION_PARTITION_ID =
  'messaging.destination.partition.id' as const;

/**
 * The name of the destination subscription from which a message is consumed.
 *
 * @example subscription-a
 *
 * @note Semantic conventions for individual messaging systems **SHOULD** document whether `messaging.destination.subscription.name` is applicable and what it means in the context of that system.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_DESTINATION_SUBSCRIPTION_NAME =
  'messaging.destination.subscription.name' as const;

/**
 * Low cardinality representation of the messaging destination name
 *
 * @example /customers/{customerId}
 *
 * @note Destination names could be constructed from templates. An example would be a destination name involving a user name or product id. Although the destination name in this case is of high cardinality, the underlying template is of low cardinality and can be effectively used for grouping and aggregation.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_DESTINATION_TEMPLATE = 'messaging.destination.template' as const;

/**
 * A boolean that is true if the message destination is temporary and might not exist anymore after messages are processed.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_DESTINATION_TEMPORARY = 'messaging.destination.temporary' as const;

/**
 * Deprecated, no replacement at this time.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated No replacement at this time.
 */
export const ATTR_MESSAGING_DESTINATION_PUBLISH_ANONYMOUS =
  'messaging.destination_publish.anonymous' as const;

/**
 * Deprecated, no replacement at this time.
 *
 * @example MyQueue
 * @example MyTopic
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated No replacement at this time.
 */
export const ATTR_MESSAGING_DESTINATION_PUBLISH_NAME =
  'messaging.destination_publish.name' as const;

/**
 * Deprecated, use `messaging.consumer.group.name` instead.
 *
 * @example "$Default"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `messaging.consumer.group.name`.
 */
export const ATTR_MESSAGING_EVENTHUBS_CONSUMER_GROUP =
  'messaging.eventhubs.consumer.group' as const;

/**
 * The UTC epoch seconds at which the message has been accepted and stored in the entity.
 *
 * @example 1701393730
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_EVENTHUBS_MESSAGE_ENQUEUED_TIME =
  'messaging.eventhubs.message.enqueued_time' as const;

/**
 * The ack deadline in seconds set for the modify ack deadline request.
 *
 * @example 10
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_GCP_PUBSUB_MESSAGE_ACK_DEADLINE =
  'messaging.gcp_pubsub.message.ack_deadline' as const;

/**
 * The ack id for a given message.
 *
 * @example "ack_id"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_GCP_PUBSUB_MESSAGE_ACK_ID =
  'messaging.gcp_pubsub.message.ack_id' as const;

/**
 * The delivery attempt for a given message.
 *
 * @example 2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_GCP_PUBSUB_MESSAGE_DELIVERY_ATTEMPT =
  'messaging.gcp_pubsub.message.delivery_attempt' as const;

/**
 * The ordering key for a given message. If the attribute is not present, the message does not have an ordering key.
 *
 * @example "ordering_key"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_GCP_PUBSUB_MESSAGE_ORDERING_KEY =
  'messaging.gcp_pubsub.message.ordering_key' as const;

/**
 * Deprecated, use `messaging.consumer.group.name` instead.
 *
 * @example "my-group"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `messaging.consumer.group.name`.
 */
export const ATTR_MESSAGING_KAFKA_CONSUMER_GROUP = 'messaging.kafka.consumer.group' as const;

/**
 * Deprecated, use `messaging.destination.partition.id` instead.
 *
 * @example 2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `messaging.destination.partition.id`.
 */
export const ATTR_MESSAGING_KAFKA_DESTINATION_PARTITION =
  'messaging.kafka.destination.partition' as const;

/**
 * Message keys in Kafka are used for grouping alike messages to ensure they're processed on the same partition. They differ from `messaging.message.id` in that they're not unique. If the key is `null`, the attribute **MUST NOT** be set.
 *
 * @example "myKey"
 *
 * @note If the key type is not string, it's string representation has to be supplied for the attribute. If the key has no unambiguous, canonical string form, don't include its value.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_KAFKA_MESSAGE_KEY = 'messaging.kafka.message.key' as const;

/**
 * Deprecated, use `messaging.kafka.offset` instead.
 *
 * @example 42
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `messaging.kafka.offset`.
 */
export const ATTR_MESSAGING_KAFKA_MESSAGE_OFFSET = 'messaging.kafka.message.offset' as const;

/**
 * A boolean that is true if the message is a tombstone.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_KAFKA_MESSAGE_TOMBSTONE = 'messaging.kafka.message.tombstone' as const;

/**
 * The offset of a record in the corresponding Kafka partition.
 *
 * @example 42
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_KAFKA_OFFSET = 'messaging.kafka.offset' as const;

/**
 * The size of the message body in bytes.
 *
 * @example 1439
 *
 * @note This can refer to both the compressed or uncompressed body size. If both sizes are known, the uncompressed
 * body size should be used.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_MESSAGE_BODY_SIZE = 'messaging.message.body.size' as const;

/**
 * The conversation ID identifying the conversation to which the message belongs, represented as a string. Sometimes called "Correlation ID".
 *
 * @example "MyConversationId"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_MESSAGE_CONVERSATION_ID = 'messaging.message.conversation_id' as const;

/**
 * The size of the message body and metadata in bytes.
 *
 * @example 2738
 *
 * @note This can refer to both the compressed or uncompressed size. If both sizes are known, the uncompressed
 * size should be used.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_MESSAGE_ENVELOPE_SIZE = 'messaging.message.envelope.size' as const;

/**
 * A value used by the messaging system as an identifier for the message, represented as a string.
 *
 * @example "452a7c7c7c7048c2f887f61572b18fc2"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_MESSAGE_ID = 'messaging.message.id' as const;

/**
 * Deprecated, use `messaging.operation.type` instead.
 *
 * @example publish
 * @example create
 * @example process
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `messaging.operation.type`.
 */
export const ATTR_MESSAGING_OPERATION = 'messaging.operation' as const;

/**
 * The system-specific name of the messaging operation.
 *
 * @example ack
 * @example nack
 * @example send
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_OPERATION_NAME = 'messaging.operation.name' as const;

/**
 * A string identifying the type of the messaging operation.
 *
 * @note If a custom value is used, it **MUST** be of low cardinality.
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_OPERATION_TYPE = 'messaging.operation.type' as const;

/**
 * Enum value "create" for attribute {@link ATTR_MESSAGING_OPERATION_TYPE}.
 */
export const MESSAGING_OPERATION_TYPE_VALUE_CREATE = 'create' as const;

/**
 * Enum value "deliver" for attribute {@link ATTR_MESSAGING_OPERATION_TYPE}.
 */
export const MESSAGING_OPERATION_TYPE_VALUE_DELIVER = 'deliver' as const;

/**
 * Enum value "process" for attribute {@link ATTR_MESSAGING_OPERATION_TYPE}.
 */
export const MESSAGING_OPERATION_TYPE_VALUE_PROCESS = 'process' as const;

/**
 * Enum value "publish" for attribute {@link ATTR_MESSAGING_OPERATION_TYPE}.
 */
export const MESSAGING_OPERATION_TYPE_VALUE_PUBLISH = 'publish' as const;

/**
 * Enum value "receive" for attribute {@link ATTR_MESSAGING_OPERATION_TYPE}.
 */
export const MESSAGING_OPERATION_TYPE_VALUE_RECEIVE = 'receive' as const;

/**
 * Enum value "send" for attribute {@link ATTR_MESSAGING_OPERATION_TYPE}.
 */
export const MESSAGING_OPERATION_TYPE_VALUE_SEND = 'send' as const;

/**
 * Enum value "settle" for attribute {@link ATTR_MESSAGING_OPERATION_TYPE}.
 */
export const MESSAGING_OPERATION_TYPE_VALUE_SETTLE = 'settle' as const;

/**
 * RabbitMQ message routing key.
 *
 * @example "myKey"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_RABBITMQ_DESTINATION_ROUTING_KEY =
  'messaging.rabbitmq.destination.routing_key' as const;

/**
 * RabbitMQ message delivery tag
 *
 * @example 123
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_RABBITMQ_MESSAGE_DELIVERY_TAG =
  'messaging.rabbitmq.message.delivery_tag' as const;

/**
 * Deprecated, use `messaging.consumer.group.name` instead.
 *
 * @example "myConsumerGroup"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `messaging.consumer.group.name` on the consumer spans. No replacement for producer spans.
 */
export const ATTR_MESSAGING_ROCKETMQ_CLIENT_GROUP = 'messaging.rocketmq.client_group' as const;

/**
 * Model of message consumption. This only applies to consumer spans.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_ROCKETMQ_CONSUMPTION_MODEL =
  'messaging.rocketmq.consumption_model' as const;

/**
 * Enum value "broadcasting" for attribute {@link ATTR_MESSAGING_ROCKETMQ_CONSUMPTION_MODEL}.
 */
export const MESSAGING_ROCKETMQ_CONSUMPTION_MODEL_VALUE_BROADCASTING = 'broadcasting' as const;

/**
 * Enum value "clustering" for attribute {@link ATTR_MESSAGING_ROCKETMQ_CONSUMPTION_MODEL}.
 */
export const MESSAGING_ROCKETMQ_CONSUMPTION_MODEL_VALUE_CLUSTERING = 'clustering' as const;

/**
 * The delay time level for delay message, which determines the message delay time.
 *
 * @example 3
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_ROCKETMQ_MESSAGE_DELAY_TIME_LEVEL =
  'messaging.rocketmq.message.delay_time_level' as const;

/**
 * The timestamp in milliseconds that the delay message is expected to be delivered to consumer.
 *
 * @example 1665987217045
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_ROCKETMQ_MESSAGE_DELIVERY_TIMESTAMP =
  'messaging.rocketmq.message.delivery_timestamp' as const;

/**
 * It is essential for FIFO message. Messages that belong to the same message group are always processed one by one within the same consumer group.
 *
 * @example "myMessageGroup"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_ROCKETMQ_MESSAGE_GROUP = 'messaging.rocketmq.message.group' as const;

/**
 * Key(s) of message, another way to mark message besides message id.
 *
 * @example ["keyA", "keyB"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_ROCKETMQ_MESSAGE_KEYS = 'messaging.rocketmq.message.keys' as const;

/**
 * The secondary classifier of message besides topic.
 *
 * @example "tagA"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_ROCKETMQ_MESSAGE_TAG = 'messaging.rocketmq.message.tag' as const;

/**
 * Type of message.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_ROCKETMQ_MESSAGE_TYPE = 'messaging.rocketmq.message.type' as const;

/**
 * Enum value "delay" for attribute {@link ATTR_MESSAGING_ROCKETMQ_MESSAGE_TYPE}.
 */
export const MESSAGING_ROCKETMQ_MESSAGE_TYPE_VALUE_DELAY = 'delay' as const;

/**
 * Enum value "fifo" for attribute {@link ATTR_MESSAGING_ROCKETMQ_MESSAGE_TYPE}.
 */
export const MESSAGING_ROCKETMQ_MESSAGE_TYPE_VALUE_FIFO = 'fifo' as const;

/**
 * Enum value "normal" for attribute {@link ATTR_MESSAGING_ROCKETMQ_MESSAGE_TYPE}.
 */
export const MESSAGING_ROCKETMQ_MESSAGE_TYPE_VALUE_NORMAL = 'normal' as const;

/**
 * Enum value "transaction" for attribute {@link ATTR_MESSAGING_ROCKETMQ_MESSAGE_TYPE}.
 */
export const MESSAGING_ROCKETMQ_MESSAGE_TYPE_VALUE_TRANSACTION = 'transaction' as const;

/**
 * Namespace of RocketMQ resources, resources in different namespaces are individual.
 *
 * @example "myNamespace"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_ROCKETMQ_NAMESPACE = 'messaging.rocketmq.namespace' as const;

/**
 * Deprecated, use `messaging.destination.subscription.name` instead.
 *
 * @example "subscription-a"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `messaging.destination.subscription.name`.
 */
export const ATTR_MESSAGING_SERVICEBUS_DESTINATION_SUBSCRIPTION_NAME =
  'messaging.servicebus.destination.subscription_name' as const;

/**
 * Describes the [settlement type](https://learn.microsoft.com/azure/service-bus-messaging/message-transfers-locks-settlement#peeklock).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_SERVICEBUS_DISPOSITION_STATUS =
  'messaging.servicebus.disposition_status' as const;

/**
 * Enum value "abandon" for attribute {@link ATTR_MESSAGING_SERVICEBUS_DISPOSITION_STATUS}.
 */
export const MESSAGING_SERVICEBUS_DISPOSITION_STATUS_VALUE_ABANDON = 'abandon' as const;

/**
 * Enum value "complete" for attribute {@link ATTR_MESSAGING_SERVICEBUS_DISPOSITION_STATUS}.
 */
export const MESSAGING_SERVICEBUS_DISPOSITION_STATUS_VALUE_COMPLETE = 'complete' as const;

/**
 * Enum value "dead_letter" for attribute {@link ATTR_MESSAGING_SERVICEBUS_DISPOSITION_STATUS}.
 */
export const MESSAGING_SERVICEBUS_DISPOSITION_STATUS_VALUE_DEAD_LETTER = 'dead_letter' as const;

/**
 * Enum value "defer" for attribute {@link ATTR_MESSAGING_SERVICEBUS_DISPOSITION_STATUS}.
 */
export const MESSAGING_SERVICEBUS_DISPOSITION_STATUS_VALUE_DEFER = 'defer' as const;

/**
 * Number of deliveries that have been attempted for this message.
 *
 * @example 2
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_SERVICEBUS_MESSAGE_DELIVERY_COUNT =
  'messaging.servicebus.message.delivery_count' as const;

/**
 * The UTC epoch seconds at which the message has been accepted and stored in the entity.
 *
 * @example 1701393730
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_SERVICEBUS_MESSAGE_ENQUEUED_TIME =
  'messaging.servicebus.message.enqueued_time' as const;

/**
 * The messaging system as identified by the client instrumentation.
 *
 * @note The actual messaging system may differ from the one known by the client. For example, when using Kafka client libraries to communicate with Azure Event Hubs, the `messaging.system` is set to `kafka` based on the instrumentation's best knowledge.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_MESSAGING_SYSTEM = 'messaging.system' as const;

/**
 * Enum value "activemq" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_ACTIVEMQ = 'activemq' as const;

/**
 * Enum value "aws_sqs" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_AWS_SQS = 'aws_sqs' as const;

/**
 * Enum value "eventgrid" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_EVENTGRID = 'eventgrid' as const;

/**
 * Enum value "eventhubs" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_EVENTHUBS = 'eventhubs' as const;

/**
 * Enum value "gcp_pubsub" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_GCP_PUBSUB = 'gcp_pubsub' as const;

/**
 * Enum value "jms" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_JMS = 'jms' as const;

/**
 * Enum value "kafka" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_KAFKA = 'kafka' as const;

/**
 * Enum value "pulsar" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_PULSAR = 'pulsar' as const;

/**
 * Enum value "rabbitmq" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_RABBITMQ = 'rabbitmq' as const;

/**
 * Enum value "rocketmq" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_ROCKETMQ = 'rocketmq' as const;

/**
 * Enum value "servicebus" for attribute {@link ATTR_MESSAGING_SYSTEM}.
 */
export const MESSAGING_SYSTEM_VALUE_SERVICEBUS = 'servicebus' as const;

/**
 * Deprecated, use `network.local.address`.
 *
 * @example "192.168.0.1"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.local.address`.
 */
export const ATTR_NET_HOST_IP = 'net.host.ip' as const;

/**
 * Deprecated, use `server.address`.
 *
 * @example example.com
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `server.address`.
 */
export const ATTR_NET_HOST_NAME = 'net.host.name' as const;

/**
 * Deprecated, use `server.port`.
 *
 * @example 8080
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `server.port`.
 */
export const ATTR_NET_HOST_PORT = 'net.host.port' as const;

/**
 * Deprecated, use `network.peer.address`.
 *
 * @example "127.0.0.1"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.peer.address`.
 */
export const ATTR_NET_PEER_IP = 'net.peer.ip' as const;

/**
 * Deprecated, use `server.address` on client spans and `client.address` on server spans.
 *
 * @example example.com
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `server.address` on client spans and `client.address` on server spans.
 */
export const ATTR_NET_PEER_NAME = 'net.peer.name' as const;

/**
 * Deprecated, use `server.port` on client spans and `client.port` on server spans.
 *
 * @example 8080
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `server.port` on client spans and `client.port` on server spans.
 */
export const ATTR_NET_PEER_PORT = 'net.peer.port' as const;

/**
 * Deprecated, use `network.protocol.name`.
 *
 * @example amqp
 * @example http
 * @example mqtt
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.protocol.name`.
 */
export const ATTR_NET_PROTOCOL_NAME = 'net.protocol.name' as const;

/**
 * Deprecated, use `network.protocol.version`.
 *
 * @example "3.1.1"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.protocol.version`.
 */
export const ATTR_NET_PROTOCOL_VERSION = 'net.protocol.version' as const;

/**
 * Deprecated, use `network.transport` and `network.type`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Split to `network.transport` and `network.type`.
 */
export const ATTR_NET_SOCK_FAMILY = 'net.sock.family' as const;

/**
 * Enum value "inet" for attribute {@link ATTR_NET_SOCK_FAMILY}.
 */
export const NET_SOCK_FAMILY_VALUE_INET = 'inet' as const;

/**
 * Enum value "inet6" for attribute {@link ATTR_NET_SOCK_FAMILY}.
 */
export const NET_SOCK_FAMILY_VALUE_INET6 = 'inet6' as const;

/**
 * Enum value "unix" for attribute {@link ATTR_NET_SOCK_FAMILY}.
 */
export const NET_SOCK_FAMILY_VALUE_UNIX = 'unix' as const;

/**
 * Deprecated, use `network.local.address`.
 *
 * @example /var/my.sock
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.local.address`.
 */
export const ATTR_NET_SOCK_HOST_ADDR = 'net.sock.host.addr' as const;

/**
 * Deprecated, use `network.local.port`.
 *
 * @example 8080
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.local.port`.
 */
export const ATTR_NET_SOCK_HOST_PORT = 'net.sock.host.port' as const;

/**
 * Deprecated, use `network.peer.address`.
 *
 * @example 192.168.0.1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.peer.address`.
 */
export const ATTR_NET_SOCK_PEER_ADDR = 'net.sock.peer.addr' as const;

/**
 * Deprecated, no replacement at this time.
 *
 * @example /var/my.sock
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Removed.
 */
export const ATTR_NET_SOCK_PEER_NAME = 'net.sock.peer.name' as const;

/**
 * Deprecated, use `network.peer.port`.
 *
 * @example 65531
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.peer.port`.
 */
export const ATTR_NET_SOCK_PEER_PORT = 'net.sock.peer.port' as const;

/**
 * Deprecated, use `network.transport`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `network.transport`.
 */
export const ATTR_NET_TRANSPORT = 'net.transport' as const;

/**
 * Enum value "inproc" for attribute {@link ATTR_NET_TRANSPORT}.
 */
export const NET_TRANSPORT_VALUE_INPROC = 'inproc' as const;

/**
 * Enum value "ip_tcp" for attribute {@link ATTR_NET_TRANSPORT}.
 */
export const NET_TRANSPORT_VALUE_IP_TCP = 'ip_tcp' as const;

/**
 * Enum value "ip_udp" for attribute {@link ATTR_NET_TRANSPORT}.
 */
export const NET_TRANSPORT_VALUE_IP_UDP = 'ip_udp' as const;

/**
 * Enum value "other" for attribute {@link ATTR_NET_TRANSPORT}.
 */
export const NET_TRANSPORT_VALUE_OTHER = 'other' as const;

/**
 * Enum value "pipe" for attribute {@link ATTR_NET_TRANSPORT}.
 */
export const NET_TRANSPORT_VALUE_PIPE = 'pipe' as const;

/**
 * The ISO 3166-1 alpha-2 2-character country code associated with the mobile carrier network.
 *
 * @example "DE"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_CARRIER_ICC = 'network.carrier.icc' as const;

/**
 * The mobile carrier country code.
 *
 * @example "310"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_CARRIER_MCC = 'network.carrier.mcc' as const;

/**
 * The mobile carrier network code.
 *
 * @example "001"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_CARRIER_MNC = 'network.carrier.mnc' as const;

/**
 * The name of the mobile carrier.
 *
 * @example "sprint"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_CARRIER_NAME = 'network.carrier.name' as const;

/**
 * The state of network connection
 *
 * @example close_wait
 *
 * @note Connection states are defined as part of the [rfc9293](https://datatracker.ietf.org/doc/html/rfc9293#section-3.3.2)
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_CONNECTION_STATE = 'network.connection.state' as const;

/**
 * Enum value "close_wait" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_CLOSE_WAIT = 'close_wait' as const;

/**
 * Enum value "closed" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_CLOSED = 'closed' as const;

/**
 * Enum value "closing" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_CLOSING = 'closing' as const;

/**
 * Enum value "established" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_ESTABLISHED = 'established' as const;

/**
 * Enum value "fin_wait_1" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_FIN_WAIT_1 = 'fin_wait_1' as const;

/**
 * Enum value "fin_wait_2" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_FIN_WAIT_2 = 'fin_wait_2' as const;

/**
 * Enum value "last_ack" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_LAST_ACK = 'last_ack' as const;

/**
 * Enum value "listen" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_LISTEN = 'listen' as const;

/**
 * Enum value "syn_received" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_SYN_RECEIVED = 'syn_received' as const;

/**
 * Enum value "syn_sent" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_SYN_SENT = 'syn_sent' as const;

/**
 * Enum value "time_wait" for attribute {@link ATTR_NETWORK_CONNECTION_STATE}.
 */
export const NETWORK_CONNECTION_STATE_VALUE_TIME_WAIT = 'time_wait' as const;

/**
 * This describes more details regarding the connection.type. It may be the type of cell technology connection, but it could be used for describing details about a wifi connection.
 *
 * @example "LTE"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_CONNECTION_SUBTYPE = 'network.connection.subtype' as const;

/**
 * Enum value "cdma" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_CDMA = 'cdma' as const;

/**
 * Enum value "cdma2000_1xrtt" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_CDMA2000_1XRTT = 'cdma2000_1xrtt' as const;

/**
 * Enum value "edge" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_EDGE = 'edge' as const;

/**
 * Enum value "ehrpd" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_EHRPD = 'ehrpd' as const;

/**
 * Enum value "evdo_0" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_EVDO_0 = 'evdo_0' as const;

/**
 * Enum value "evdo_a" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_EVDO_A = 'evdo_a' as const;

/**
 * Enum value "evdo_b" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_EVDO_B = 'evdo_b' as const;

/**
 * Enum value "gprs" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_GPRS = 'gprs' as const;

/**
 * Enum value "gsm" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_GSM = 'gsm' as const;

/**
 * Enum value "hsdpa" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_HSDPA = 'hsdpa' as const;

/**
 * Enum value "hspa" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_HSPA = 'hspa' as const;

/**
 * Enum value "hspap" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_HSPAP = 'hspap' as const;

/**
 * Enum value "hsupa" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_HSUPA = 'hsupa' as const;

/**
 * Enum value "iden" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_IDEN = 'iden' as const;

/**
 * Enum value "iwlan" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_IWLAN = 'iwlan' as const;

/**
 * Enum value "lte" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_LTE = 'lte' as const;

/**
 * Enum value "lte_ca" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_LTE_CA = 'lte_ca' as const;

/**
 * Enum value "nr" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_NR = 'nr' as const;

/**
 * Enum value "nrnsa" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_NRNSA = 'nrnsa' as const;

/**
 * Enum value "td_scdma" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_TD_SCDMA = 'td_scdma' as const;

/**
 * Enum value "umts" for attribute {@link ATTR_NETWORK_CONNECTION_SUBTYPE}.
 */
export const NETWORK_CONNECTION_SUBTYPE_VALUE_UMTS = 'umts' as const;

/**
 * The internet connection type.
 *
 * @example "wifi"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_CONNECTION_TYPE = 'network.connection.type' as const;

/**
 * Enum value "cell" for attribute {@link ATTR_NETWORK_CONNECTION_TYPE}.
 */
export const NETWORK_CONNECTION_TYPE_VALUE_CELL = 'cell' as const;

/**
 * Enum value "unavailable" for attribute {@link ATTR_NETWORK_CONNECTION_TYPE}.
 */
export const NETWORK_CONNECTION_TYPE_VALUE_UNAVAILABLE = 'unavailable' as const;

/**
 * Enum value "unknown" for attribute {@link ATTR_NETWORK_CONNECTION_TYPE}.
 */
export const NETWORK_CONNECTION_TYPE_VALUE_UNKNOWN = 'unknown' as const;

/**
 * Enum value "wifi" for attribute {@link ATTR_NETWORK_CONNECTION_TYPE}.
 */
export const NETWORK_CONNECTION_TYPE_VALUE_WIFI = 'wifi' as const;

/**
 * Enum value "wired" for attribute {@link ATTR_NETWORK_CONNECTION_TYPE}.
 */
export const NETWORK_CONNECTION_TYPE_VALUE_WIRED = 'wired' as const;

/**
 * The network interface name.
 *
 * @example lo
 * @example eth0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_INTERFACE_NAME = 'network.interface.name' as const;

/**
 * The network IO operation direction.
 *
 * @example transmit
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NETWORK_IO_DIRECTION = 'network.io.direction' as const;

/**
 * Enum value "receive" for attribute {@link ATTR_NETWORK_IO_DIRECTION}.
 */
export const NETWORK_IO_DIRECTION_VALUE_RECEIVE = 'receive' as const;

/**
 * Enum value "transmit" for attribute {@link ATTR_NETWORK_IO_DIRECTION}.
 */
export const NETWORK_IO_DIRECTION_VALUE_TRANSMIT = 'transmit' as const;

/**
 * The state of event loop time.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_NODEJS_EVENTLOOP_STATE = 'nodejs.eventloop.state' as const;

/**
 * Enum value "active" for attribute {@link ATTR_NODEJS_EVENTLOOP_STATE}.
 */
export const NODEJS_EVENTLOOP_STATE_VALUE_ACTIVE = 'active' as const;

/**
 * Enum value "idle" for attribute {@link ATTR_NODEJS_EVENTLOOP_STATE}.
 */
export const NODEJS_EVENTLOOP_STATE_VALUE_IDLE = 'idle' as const;

/**
 * The digest of the OCI image manifest. For container images specifically is the digest by which the container image is known.
 *
 * @example sha256:e4ca62c0d62f3e886e684806dfe9d4e0cda60d54986898173c1083856cfda0f4
 *
 * @note Follows [OCI Image Manifest Specification](https://github.com/opencontainers/image-spec/blob/main/manifest.md), and specifically the [Digest property](https://github.com/opencontainers/image-spec/blob/main/descriptor.md#digests).
 * An example can be found in [Example Image Manifest](https://github.com/opencontainers/image-spec/blob/main/manifest.md#example-image-manifest).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OCI_MANIFEST_DIGEST = 'oci.manifest.digest' as const;

/**
 * Parent-child Reference type
 *
 * @note The causal relationship between a child Span and a parent Span.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OPENTRACING_REF_TYPE = 'opentracing.ref_type' as const;

/**
 * Enum value "child_of" for attribute {@link ATTR_OPENTRACING_REF_TYPE}.
 */
export const OPENTRACING_REF_TYPE_VALUE_CHILD_OF = 'child_of' as const;

/**
 * Enum value "follows_from" for attribute {@link ATTR_OPENTRACING_REF_TYPE}.
 */
export const OPENTRACING_REF_TYPE_VALUE_FOLLOWS_FROM = 'follows_from' as const;

/**
 * Unique identifier for a particular build or compilation of the operating system.
 *
 * @example TQ3C.230805.001.B2
 * @example 20E247
 * @example 22621
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OS_BUILD_ID = 'os.build_id' as const;

/**
 * Human readable (not intended to be parsed) OS version information, like e.g. reported by `ver` or `lsb_release -a` commands.
 *
 * @example Microsoft Windows [Version 10.0.18363.778]
 * @example Ubuntu 18.04.1 LTS
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OS_DESCRIPTION = 'os.description' as const;

/**
 * Human readable operating system name.
 *
 * @example iOS
 * @example Android
 * @example Ubuntu
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OS_NAME = 'os.name' as const;

/**
 * The operating system type.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OS_TYPE = 'os.type' as const;

/**
 * Enum value "aix" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_AIX = 'aix' as const;

/**
 * Enum value "darwin" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_DARWIN = 'darwin' as const;

/**
 * Enum value "dragonflybsd" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_DRAGONFLYBSD = 'dragonflybsd' as const;

/**
 * Enum value "freebsd" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_FREEBSD = 'freebsd' as const;

/**
 * Enum value "hpux" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_HPUX = 'hpux' as const;

/**
 * Enum value "linux" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_LINUX = 'linux' as const;

/**
 * Enum value "netbsd" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_NETBSD = 'netbsd' as const;

/**
 * Enum value "openbsd" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_OPENBSD = 'openbsd' as const;

/**
 * Enum value "solaris" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_SOLARIS = 'solaris' as const;

/**
 * Enum value "windows" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_WINDOWS = 'windows' as const;

/**
 * Enum value "z_os" for attribute {@link ATTR_OS_TYPE}.
 */
export const OS_TYPE_VALUE_Z_OS = 'z_os' as const;

/**
 * The version string of the operating system as defined in [Version Attributes](/docs/resource/README.md#version-attributes).
 *
 * @example 14.2.1
 * @example 18.04.1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OS_VERSION = 'os.version' as const;

/**
 * A name uniquely identifying the instance of the OpenTelemetry component within its containing SDK instance.
 *
 * @example otlp_grpc_span_exporter/0
 * @example custom-name
 *
 * @note Implementations **SHOULD** ensure a low cardinality for this attribute, even across application or SDK restarts.
 * E.g. implementations **MUST NOT** use UUIDs as values for this attribute.
 *
 * Implementations **MAY** achieve these goals by following a `<otel.component.type>/<instance-counter>` pattern, e.g. `batching_span_processor/0`.
 * Hereby `otel.component.type` refers to the corresponding attribute value of the component.
 *
 * The value of `instance-counter` **MAY** be automatically assigned by the component and uniqueness within the enclosing SDK instance **MUST** be guaranteed.
 * For example, `<instance-counter>` **MAY** be implemented by using a monotonically increasing counter (starting with `0`), which is incremented every time an
 * instance of the given component type is started.
 *
 * With this implementation, for example the first Batching Span Processor would have `batching_span_processor/0`
 * as `otel.component.name`, the second one `batching_span_processor/1` and so on.
 * These values will therefore be reused in the case of an application restart.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OTEL_COMPONENT_NAME = 'otel.component.name' as const;

/**
 * A name identifying the type of the OpenTelemetry component.
 *
 * @example batching_span_processor
 * @example com.example.MySpanExporter
 *
 * @note If none of the standardized values apply, implementations **SHOULD** use the language-defined name of the type.
 * E.g. for Java the fully qualified classname **SHOULD** be used in this case.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OTEL_COMPONENT_TYPE = 'otel.component.type' as const;

/**
 * Enum value "batching_log_processor" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_BATCHING_LOG_PROCESSOR = 'batching_log_processor' as const;

/**
 * Enum value "batching_span_processor" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_BATCHING_SPAN_PROCESSOR = 'batching_span_processor' as const;

/**
 * Enum value "otlp_grpc_log_exporter" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_OTLP_GRPC_LOG_EXPORTER = 'otlp_grpc_log_exporter' as const;

/**
 * Enum value "otlp_grpc_span_exporter" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_OTLP_GRPC_SPAN_EXPORTER = 'otlp_grpc_span_exporter' as const;

/**
 * Enum value "otlp_http_json_log_exporter" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_OTLP_HTTP_JSON_LOG_EXPORTER =
  'otlp_http_json_log_exporter' as const;

/**
 * Enum value "otlp_http_json_span_exporter" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_OTLP_HTTP_JSON_SPAN_EXPORTER =
  'otlp_http_json_span_exporter' as const;

/**
 * Enum value "otlp_http_log_exporter" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_OTLP_HTTP_LOG_EXPORTER = 'otlp_http_log_exporter' as const;

/**
 * Enum value "otlp_http_span_exporter" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_OTLP_HTTP_SPAN_EXPORTER = 'otlp_http_span_exporter' as const;

/**
 * Enum value "simple_log_processor" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_SIMPLE_LOG_PROCESSOR = 'simple_log_processor' as const;

/**
 * Enum value "simple_span_processor" for attribute {@link ATTR_OTEL_COMPONENT_TYPE}.
 */
export const OTEL_COMPONENT_TYPE_VALUE_SIMPLE_SPAN_PROCESSOR = 'simple_span_processor' as const;

/**
 * Deprecated. Use the `otel.scope.name` attribute
 *
 * @example io.opentelemetry.contrib.mongodb
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Use the `otel.scope.name` attribute.
 */
export const ATTR_OTEL_LIBRARY_NAME = 'otel.library.name' as const;

/**
 * Deprecated. Use the `otel.scope.version` attribute.
 *
 * @example 1.0.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Use the `otel.scope.version` attribute.
 */
export const ATTR_OTEL_LIBRARY_VERSION = 'otel.library.version' as const;

/**
 * The result value of the sampler for this span
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_OTEL_SPAN_SAMPLING_RESULT = 'otel.span.sampling_result' as const;

/**
 * Enum value "DROP" for attribute {@link ATTR_OTEL_SPAN_SAMPLING_RESULT}.
 */
export const OTEL_SPAN_SAMPLING_RESULT_VALUE_DROP = 'DROP' as const;

/**
 * Enum value "RECORD_AND_SAMPLE" for attribute {@link ATTR_OTEL_SPAN_SAMPLING_RESULT}.
 */
export const OTEL_SPAN_SAMPLING_RESULT_VALUE_RECORD_AND_SAMPLE = 'RECORD_AND_SAMPLE' as const;

/**
 * Enum value "RECORD_ONLY" for attribute {@link ATTR_OTEL_SPAN_SAMPLING_RESULT}.
 */
export const OTEL_SPAN_SAMPLING_RESULT_VALUE_RECORD_ONLY = 'RECORD_ONLY' as const;

/**
 * The [`service.name`](/docs/resource/README.md#service) of the remote service. **SHOULD** be equal to the actual `service.name` resource attribute of the remote service if any.
 *
 * @example "AuthTokenCache"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PEER_SERVICE = 'peer.service' as const;

/**
 * Deprecated, use `db.client.connection.pool.name` instead.
 *
 * @example myDataSource
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.client.connection.pool.name`.
 */
export const ATTR_POOL_NAME = 'pool.name' as const;

/**
 * Length of the process.command_args array
 *
 * @example 4
 *
 * @note This field can be useful for querying or performing bucket analysis on how many arguments were provided to start a process. More arguments may be an indication of suspicious activity.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_ARGS_COUNT = 'process.args_count' as const;

/**
 * The command used to launch the process (i.e. the command name). On Linux based systems, can be set to the zeroth string in `proc/[pid]/cmdline`. On Windows, can be set to the first parameter extracted from `GetCommandLineW`.
 *
 * @example cmd/otelcol
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_COMMAND = 'process.command' as const;

/**
 * All the command arguments (including the command/executable itself) as received by the process. On Linux-based systems (and some other Unixoid systems supporting procfs), can be set according to the list of null-delimited strings extracted from `proc/[pid]/cmdline`. For libc-based executables, this would be the full argv vector passed to `main`.
 *
 * @example ["cmd/otecol", "--config=config.yaml"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_COMMAND_ARGS = 'process.command_args' as const;

/**
 * The full command used to launch the process as a single string representing the full command. On Windows, can be set to the result of `GetCommandLineW`. Do not set this if you have to assemble it just for monitoring; use `process.command_args` instead.
 *
 * @example C:\\cmd\\otecol --config="my directory\\config.yaml"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_COMMAND_LINE = 'process.command_line' as const;

/**
 * Specifies whether the context switches for this data point were voluntary or involuntary.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_CONTEXT_SWITCH_TYPE = 'process.context_switch_type' as const;

/**
 * Enum value "involuntary" for attribute {@link ATTR_PROCESS_CONTEXT_SWITCH_TYPE}.
 */
export const PROCESS_CONTEXT_SWITCH_TYPE_VALUE_INVOLUNTARY = 'involuntary' as const;

/**
 * Enum value "voluntary" for attribute {@link ATTR_PROCESS_CONTEXT_SWITCH_TYPE}.
 */
export const PROCESS_CONTEXT_SWITCH_TYPE_VALUE_VOLUNTARY = 'voluntary' as const;

/**
 * Deprecated, use `cpu.mode` instead.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cpu.mode`
 */
export const ATTR_PROCESS_CPU_STATE = 'process.cpu.state' as const;

/**
 * Enum value "system" for attribute {@link ATTR_PROCESS_CPU_STATE}.
 */
export const PROCESS_CPU_STATE_VALUE_SYSTEM = 'system' as const;

/**
 * Enum value "user" for attribute {@link ATTR_PROCESS_CPU_STATE}.
 */
export const PROCESS_CPU_STATE_VALUE_USER = 'user' as const;

/**
 * Enum value "wait" for attribute {@link ATTR_PROCESS_CPU_STATE}.
 */
export const PROCESS_CPU_STATE_VALUE_WAIT = 'wait' as const;

/**
 * The date and time the process was created, in ISO 8601 format.
 *
 * @example 2023-11-21T09:25:34.853Z
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_CREATION_TIME = 'process.creation.time' as const;

/**
 * The GNU build ID as found in the `.note.gnu.build-id` ELF section (hex string).
 *
 * @example c89b11207f6479603b0d49bf291c092c2b719293
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_EXECUTABLE_BUILD_ID_GNU = 'process.executable.build_id.gnu' as const;

/**
 * The Go build ID as retrieved by `go tool buildid <go executable>`.
 *
 * @example foh3mEXu7BLZjsN9pOwG/kATcXlYVCDEFouRMQed_/WwRFB1hPo9LBkekthSPG/x8hMC8emW2cCjXD0_1aY
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_EXECUTABLE_BUILD_ID_GO = 'process.executable.build_id.go' as const;

/**
 * Profiling specific build ID for executables. See the OTel specification for Profiles for more information.
 *
 * @example 600DCAFE4A110000F2BF38C493F5FB92
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_EXECUTABLE_BUILD_ID_HTLHASH =
  'process.executable.build_id.htlhash' as const;

/**
 * "Deprecated, use `process.executable.build_id.htlhash` instead."
 *
 * @example 600DCAFE4A110000F2BF38C493F5FB92
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `process.executable.build_id.htlhash`
 */
export const ATTR_PROCESS_EXECUTABLE_BUILD_ID_PROFILING =
  'process.executable.build_id.profiling' as const;

/**
 * The name of the process executable. On Linux based systems, this **SHOULD** be set to the base name of the target of `/proc/[pid]/exe`. On Windows, this **SHOULD** be set to the base name of `GetProcessImageFileNameW`.
 *
 * @example otelcol
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_EXECUTABLE_NAME = 'process.executable.name' as const;

/**
 * The full path to the process executable. On Linux based systems, can be set to the target of `proc/[pid]/exe`. On Windows, can be set to the result of `GetProcessImageFileNameW`.
 *
 * @example /usr/bin/cmd/otelcol
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_EXECUTABLE_PATH = 'process.executable.path' as const;

/**
 * The exit code of the process.
 *
 * @example 127
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_EXIT_CODE = 'process.exit.code' as const;

/**
 * The date and time the process exited, in ISO 8601 format.
 *
 * @example 2023-11-21T09:26:12.315Z
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_EXIT_TIME = 'process.exit.time' as const;

/**
 * The PID of the process's group leader. This is also the process group ID (PGID) of the process.
 *
 * @example 23
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_GROUP_LEADER_PID = 'process.group_leader.pid' as const;

/**
 * Whether the process is connected to an interactive shell.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_INTERACTIVE = 'process.interactive' as const;

/**
 * The control group associated with the process.
 *
 * @example 1:name=systemd:/user.slice/user-1000.slice/session-3.scope
 * @example 0::/user.slice/user-1000.slice/user@1000.service/tmux-spawn-0267755b-4639-4a27-90ed-f19f88e53748.scope
 *
 * @note Control groups (cgroups) are a kernel feature used to organize and manage process resources. This attribute provides the path(s) to the cgroup(s) associated with the process, which should match the contents of the [/proc/[PID]/cgroup](https://man7.org/linux/man-pages/man7/cgroups.7.html) file.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_LINUX_CGROUP = 'process.linux.cgroup' as const;

/**
 * The username of the user that owns the process.
 *
 * @example root
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_OWNER = 'process.owner' as const;

/**
 * The type of page fault for this data point. Type `major` is for major/hard page faults, and `minor` is for minor/soft page faults.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_PAGING_FAULT_TYPE = 'process.paging.fault_type' as const;

/**
 * Enum value "major" for attribute {@link ATTR_PROCESS_PAGING_FAULT_TYPE}.
 */
export const PROCESS_PAGING_FAULT_TYPE_VALUE_MAJOR = 'major' as const;

/**
 * Enum value "minor" for attribute {@link ATTR_PROCESS_PAGING_FAULT_TYPE}.
 */
export const PROCESS_PAGING_FAULT_TYPE_VALUE_MINOR = 'minor' as const;

/**
 * Parent Process identifier (PPID).
 *
 * @example 111
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_PARENT_PID = 'process.parent_pid' as const;

/**
 * Process identifier (PID).
 *
 * @example 1234
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_PID = 'process.pid' as const;

/**
 * The real user ID (RUID) of the process.
 *
 * @example 1000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_REAL_USER_ID = 'process.real_user.id' as const;

/**
 * The username of the real user of the process.
 *
 * @example operator
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_REAL_USER_NAME = 'process.real_user.name' as const;

/**
 * An additional description about the runtime of the process, for example a specific vendor customization of the runtime environment.
 *
 * @example "Eclipse OpenJ9 Eclipse OpenJ9 VM openj9-0.21.0"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_RUNTIME_DESCRIPTION = 'process.runtime.description' as const;

/**
 * The name of the runtime of this process.
 *
 * @example OpenJDK Runtime Environment
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_RUNTIME_NAME = 'process.runtime.name' as const;

/**
 * The version of the runtime of this process, as returned by the runtime without modification.
 *
 * @example "14.0.2"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_RUNTIME_VERSION = 'process.runtime.version' as const;

/**
 * The saved user ID (SUID) of the process.
 *
 * @example 1002
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_SAVED_USER_ID = 'process.saved_user.id' as const;

/**
 * The username of the saved user.
 *
 * @example operator
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_SAVED_USER_NAME = 'process.saved_user.name' as const;

/**
 * The PID of the process's session leader. This is also the session ID (SID) of the process.
 *
 * @example 14
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_SESSION_LEADER_PID = 'process.session_leader.pid' as const;

/**
 * Process title (proctitle)
 *
 * @example cat /etc/hostname
 * @example xfce4-session
 * @example bash
 *
 * @note In many Unix-like systems, process title (proctitle), is the string that represents the name or command line of a running process, displayed by system monitoring tools like ps, top, and htop.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_TITLE = 'process.title' as const;

/**
 * The effective user ID (EUID) of the process.
 *
 * @example 1001
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_USER_ID = 'process.user.id' as const;

/**
 * The username of the effective user of the process.
 *
 * @example root
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_USER_NAME = 'process.user.name' as const;

/**
 * Virtual process identifier.
 *
 * @example 12
 *
 * @note The process ID within a PID namespace. This is not necessarily unique across all processes on the host but it is unique within the process namespace that the process exists within.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_VPID = 'process.vpid' as const;

/**
 * The working directory of the process.
 *
 * @example /root
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROCESS_WORKING_DIRECTORY = 'process.working_directory' as const;

/**
 * Describes the interpreter or compiler of a single frame.
 *
 * @example cpython
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_PROFILE_FRAME_TYPE = 'profile.frame.type' as const;

/**
 * Enum value "beam" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_BEAM = 'beam' as const;

/**
 * Enum value "cpython" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_CPYTHON = 'cpython' as const;

/**
 * Enum value "dotnet" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_DOTNET = 'dotnet' as const;

/**
 * Enum value "go" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_GO = 'go' as const;

/**
 * Enum value "jvm" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_JVM = 'jvm' as const;

/**
 * Enum value "kernel" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_KERNEL = 'kernel' as const;

/**
 * Enum value "native" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_NATIVE = 'native' as const;

/**
 * Enum value "perl" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_PERL = 'perl' as const;

/**
 * Enum value "php" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_PHP = 'php' as const;

/**
 * Enum value "ruby" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_RUBY = 'ruby' as const;

/**
 * Enum value "rust" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_RUST = 'rust' as const;

/**
 * Enum value "v8js" for attribute {@link ATTR_PROFILE_FRAME_TYPE}.
 */
export const PROFILE_FRAME_TYPE_VALUE_V8JS = 'v8js' as const;

/**
 * The [error codes](https://connectrpc.com//docs/protocol/#error-codes) of the Connect request. Error codes are always string values.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_CONNECT_RPC_ERROR_CODE = 'rpc.connect_rpc.error_code' as const;

/**
 * Enum value "aborted" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_ABORTED = 'aborted' as const;

/**
 * Enum value "already_exists" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_ALREADY_EXISTS = 'already_exists' as const;

/**
 * Enum value "cancelled" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_CANCELLED = 'cancelled' as const;

/**
 * Enum value "data_loss" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_DATA_LOSS = 'data_loss' as const;

/**
 * Enum value "deadline_exceeded" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_DEADLINE_EXCEEDED = 'deadline_exceeded' as const;

/**
 * Enum value "failed_precondition" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_FAILED_PRECONDITION = 'failed_precondition' as const;

/**
 * Enum value "internal" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_INTERNAL = 'internal' as const;

/**
 * Enum value "invalid_argument" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_INVALID_ARGUMENT = 'invalid_argument' as const;

/**
 * Enum value "not_found" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_NOT_FOUND = 'not_found' as const;

/**
 * Enum value "out_of_range" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_OUT_OF_RANGE = 'out_of_range' as const;

/**
 * Enum value "permission_denied" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_PERMISSION_DENIED = 'permission_denied' as const;

/**
 * Enum value "resource_exhausted" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_RESOURCE_EXHAUSTED = 'resource_exhausted' as const;

/**
 * Enum value "unauthenticated" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_UNAUTHENTICATED = 'unauthenticated' as const;

/**
 * Enum value "unavailable" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_UNAVAILABLE = 'unavailable' as const;

/**
 * Enum value "unimplemented" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_UNIMPLEMENTED = 'unimplemented' as const;

/**
 * Enum value "unknown" for attribute {@link ATTR_RPC_CONNECT_RPC_ERROR_CODE}.
 */
export const RPC_CONNECT_RPC_ERROR_CODE_VALUE_UNKNOWN = 'unknown' as const;

/**
 * Connect request metadata, `<key>` being the normalized Connect Metadata key (lowercase), the value being the metadata values.
 *
 * @example rpc.request.metadata.my-custom-metadata-attribute=["1.2.3.4", "1.2.3.5"]
 *
 * @note Instrumentations **SHOULD** require an explicit configuration of which metadata values are to be captured. Including all request metadata values can be a security risk - explicit configuration helps avoid leaking sensitive information.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_CONNECT_RPC_REQUEST_METADATA = (key: string) =>
  `rpc.connect_rpc.request.metadata.${key}`;

/**
 * Connect response metadata, `<key>` being the normalized Connect Metadata key (lowercase), the value being the metadata values.
 *
 * @example rpc.response.metadata.my-custom-metadata-attribute=["attribute_value"]
 *
 * @note Instrumentations **SHOULD** require an explicit configuration of which metadata values are to be captured. Including all response metadata values can be a security risk - explicit configuration helps avoid leaking sensitive information.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_CONNECT_RPC_RESPONSE_METADATA = (key: string) =>
  `rpc.connect_rpc.response.metadata.${key}`;

/**
 * gRPC request metadata, `<key>` being the normalized gRPC Metadata key (lowercase), the value being the metadata values.
 *
 * @example rpc.grpc.request.metadata.my-custom-metadata-attribute=["1.2.3.4", "1.2.3.5"]
 *
 * @note Instrumentations **SHOULD** require an explicit configuration of which metadata values are to be captured. Including all request metadata values can be a security risk - explicit configuration helps avoid leaking sensitive information.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_GRPC_REQUEST_METADATA = (key: string) => `rpc.grpc.request.metadata.${key}`;

/**
 * gRPC response metadata, `<key>` being the normalized gRPC Metadata key (lowercase), the value being the metadata values.
 *
 * @example rpc.grpc.response.metadata.my-custom-metadata-attribute=["attribute_value"]
 *
 * @note Instrumentations **SHOULD** require an explicit configuration of which metadata values are to be captured. Including all response metadata values can be a security risk - explicit configuration helps avoid leaking sensitive information.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_GRPC_RESPONSE_METADATA = (key: string) => `rpc.grpc.response.metadata.${key}`;

/**
 * The [numeric status code](https://github.com/grpc/grpc/blob/v1.33.2/doc/statuscodes.md) of the gRPC request.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_GRPC_STATUS_CODE = 'rpc.grpc.status_code' as const;

/**
 * Enum value 0 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_OK = 0 as const;

/**
 * Enum value 1 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_CANCELLED = 1 as const;

/**
 * Enum value 2 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_UNKNOWN = 2 as const;

/**
 * Enum value 3 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_INVALID_ARGUMENT = 3 as const;

/**
 * Enum value 4 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_DEADLINE_EXCEEDED = 4 as const;

/**
 * Enum value 5 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_NOT_FOUND = 5 as const;

/**
 * Enum value 6 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_ALREADY_EXISTS = 6 as const;

/**
 * Enum value 7 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_PERMISSION_DENIED = 7 as const;

/**
 * Enum value 8 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_RESOURCE_EXHAUSTED = 8 as const;

/**
 * Enum value 9 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_FAILED_PRECONDITION = 9 as const;

/**
 * Enum value 10 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_ABORTED = 10 as const;

/**
 * Enum value 11 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_OUT_OF_RANGE = 11 as const;

/**
 * Enum value 12 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_UNIMPLEMENTED = 12 as const;

/**
 * Enum value 13 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_INTERNAL = 13 as const;

/**
 * Enum value 14 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_UNAVAILABLE = 14 as const;

/**
 * Enum value 15 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_DATA_LOSS = 15 as const;

/**
 * Enum value 16 for attribute {@link ATTR_RPC_GRPC_STATUS_CODE}.
 */
export const RPC_GRPC_STATUS_CODE_VALUE_UNAUTHENTICATED = 16 as const;

/**
 * `error.code` property of response if it is an error response.
 *
 * @example -32700
 * @example 100
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_JSONRPC_ERROR_CODE = 'rpc.jsonrpc.error_code' as const;

/**
 * `error.message` property of response if it is an error response.
 *
 * @example Parse error
 * @example User already exists
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_JSONRPC_ERROR_MESSAGE = 'rpc.jsonrpc.error_message' as const;

/**
 * `id` property of request or response. Since protocol allows id to be int, string, `null` or missing (for notifications), value is expected to be cast to string for simplicity. Use empty string in case of `null` value. Omit entirely if this is a notification.
 *
 * @example 10
 * @example request-7
 * @example
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_JSONRPC_REQUEST_ID = 'rpc.jsonrpc.request_id' as const;

/**
 * Protocol version as in `jsonrpc` property of request/response. Since JSON-RPC 1.0 doesn't specify this, the value can be omitted.
 *
 * @example 2.0
 * @example 1.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_JSONRPC_VERSION = 'rpc.jsonrpc.version' as const;

/**
 * Compressed size of the message in bytes.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_MESSAGE_COMPRESSED_SIZE = 'rpc.message.compressed_size' as const;

/**
 * **MUST** be calculated as two different counters starting from `1` one for sent messages and one for received message.
 *
 * @note This way we guarantee that the values will be consistent between different implementations.
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_MESSAGE_ID = 'rpc.message.id' as const;

/**
 * Whether this is a received or sent message.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_MESSAGE_TYPE = 'rpc.message.type' as const;

/**
 * Enum value "RECEIVED" for attribute {@link ATTR_RPC_MESSAGE_TYPE}.
 */
export const RPC_MESSAGE_TYPE_VALUE_RECEIVED = 'RECEIVED' as const;

/**
 * Enum value "SENT" for attribute {@link ATTR_RPC_MESSAGE_TYPE}.
 */
export const RPC_MESSAGE_TYPE_VALUE_SENT = 'SENT' as const;

/**
 * Uncompressed size of the message in bytes.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_MESSAGE_UNCOMPRESSED_SIZE = 'rpc.message.uncompressed_size' as const;

/**
 * The name of the (logical) method being called, must be equal to the $method part in the span name.
 *
 * @example "exampleMethod"
 *
 * @note This is the logical name of the method from the RPC interface perspective, which can be different from the name of any implementing method/function. The `code.function.name` attribute may be used to store the latter (e.g., method actually executing the call on the server side, RPC client stub method on the client side).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_METHOD = 'rpc.method' as const;

/**
 * The full (logical) name of the service being called, including its package name, if applicable.
 *
 * @example "myservice.EchoService"
 *
 * @note This is the logical name of the service from the RPC interface perspective, which can be different from the name of any implementing class. The `code.namespace` attribute may be used to store the latter (despite the attribute name, it may include a class name; e.g., class with method actually executing the call on the server side, RPC client stub class on the client side).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_SERVICE = 'rpc.service' as const;

/**
 * A string identifying the remoting system. See below for a list of well-known identifiers.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_RPC_SYSTEM = 'rpc.system' as const;

/**
 * Enum value "apache_dubbo" for attribute {@link ATTR_RPC_SYSTEM}.
 */
export const RPC_SYSTEM_VALUE_APACHE_DUBBO = 'apache_dubbo' as const;

/**
 * Enum value "connect_rpc" for attribute {@link ATTR_RPC_SYSTEM}.
 */
export const RPC_SYSTEM_VALUE_CONNECT_RPC = 'connect_rpc' as const;

/**
 * Enum value "dotnet_wcf" for attribute {@link ATTR_RPC_SYSTEM}.
 */
export const RPC_SYSTEM_VALUE_DOTNET_WCF = 'dotnet_wcf' as const;

/**
 * Enum value "grpc" for attribute {@link ATTR_RPC_SYSTEM}.
 */
export const RPC_SYSTEM_VALUE_GRPC = 'grpc' as const;

/**
 * Enum value "java_rmi" for attribute {@link ATTR_RPC_SYSTEM}.
 */
export const RPC_SYSTEM_VALUE_JAVA_RMI = 'java_rmi' as const;

/**
 * A categorization value keyword used by the entity using the rule for detection of this event
 *
 * @example Attempted Information Leak
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SECURITY_RULE_CATEGORY = 'security_rule.category' as const;

/**
 * The description of the rule generating the event.
 *
 * @example Block requests to public DNS over HTTPS / TLS protocols
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SECURITY_RULE_DESCRIPTION = 'security_rule.description' as const;

/**
 * Name of the license under which the rule used to generate this event is made available.
 *
 * @example Apache 2.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SECURITY_RULE_LICENSE = 'security_rule.license' as const;

/**
 * The name of the rule or signature generating the event.
 *
 * @example BLOCK_DNS_over_TLS
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SECURITY_RULE_NAME = 'security_rule.name' as const;

/**
 * Reference URL to additional information about the rule used to generate this event.
 *
 * @example https://en.wikipedia.org/wiki/DNS_over_TLS
 *
 * @note The URL can point to the vendor’s documentation about the rule. If that’s not available, it can also be a link to a more general page describing this type of alert.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SECURITY_RULE_REFERENCE = 'security_rule.reference' as const;

/**
 * Name of the ruleset, policy, group, or parent category in which the rule used to generate this event is a member.
 *
 * @example Standard_Protocol_Filters
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SECURITY_RULE_RULESET_NAME = 'security_rule.ruleset.name' as const;

/**
 * A rule ID that is unique within the scope of a set or group of agents, observers, or other entities using the rule for detection of this event.
 *
 * @example 550e8400-e29b-41d4-a716-446655440000
 * @example 1100110011
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SECURITY_RULE_UUID = 'security_rule.uuid' as const;

/**
 * The version / revision of the rule being used for analysis.
 *
 * @example 1.0.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SECURITY_RULE_VERSION = 'security_rule.version' as const;

/**
 * The string ID of the service instance.
 *
 * @example 627cc493-f310-47de-96bd-71410b7dec09
 *
 * @note **MUST** be unique for each instance of the same `service.namespace,service.name` pair (in other words
 * `service.namespace,service.name,service.instance.id` triplet **MUST** be globally unique). The ID helps to
 * distinguish instances of the same service that exist at the same time (e.g. instances of a horizontally scaled
 * service).
 *
 * Implementations, such as SDKs, are recommended to generate a random Version 1 or Version 4 [RFC
 * 4122](https://www.ietf.org/rfc/rfc4122.txt) UUID, but are free to use an inherent unique ID as the source of
 * this value if stability is desirable. In that case, the ID **SHOULD** be used as source of a UUID Version 5 and
 * **SHOULD** use the following UUID as the namespace: `4d63009a-8d0f-11ee-aad7-4c796ed8e320`.
 *
 * UUIDs are typically recommended, as only an opaque value for the purposes of identifying a service instance is
 * needed. Similar to what can be seen in the man page for the
 * [`/etc/machine-id`](https://www.freedesktop.org/software/systemd/man/latest/machine-id.html) file, the underlying
 * data, such as pod name and namespace should be treated as confidential, being the user's choice to expose it
 * or not via another resource attribute.
 *
 * For applications running behind an application server (like unicorn), we do not recommend using one identifier
 * for all processes participating in the application. Instead, it's recommended each division (e.g. a worker
 * thread in unicorn) to have its own instance.id.
 *
 * It's not recommended for a Collector to set `service.instance.id` if it can't unambiguously determine the
 * service instance that is generating that telemetry. For instance, creating an UUID based on `pod.name` will
 * likely be wrong, as the Collector might not know from which container within that pod the telemetry originated.
 * However, Collectors can set the `service.instance.id` if they can unambiguously determine the service instance
 * for that telemetry. This is typically the case for scraping receivers, as they know the target address and
 * port.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SERVICE_INSTANCE_ID = 'service.instance.id' as const;

/**
 * A namespace for `service.name`.
 *
 * @example Shop
 *
 * @note A string value having a meaning that helps to distinguish a group of services, for example the team name that owns a group of services. `service.name` is expected to be unique within the same namespace. If `service.namespace` is not specified in the Resource then `service.name` is expected to be unique for all services that have no explicit namespace defined (so the empty/unspecified namespace is simply one more valid namespace). Zero-length namespace string is assumed equal to unspecified namespace.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SERVICE_NAMESPACE = 'service.namespace' as const;

/**
 * A unique id to identify a session.
 *
 * @example "00112233-4455-6677-8899-aabbccddeeff"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SESSION_ID = 'session.id' as const;

/**
 * The previous `session.id` for this user, when known.
 *
 * @example "00112233-4455-6677-8899-aabbccddeeff"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SESSION_PREVIOUS_ID = 'session.previous_id' as const;

/**
 * Source address - domain name if available without reverse DNS lookup; otherwise, IP address or Unix domain socket name.
 *
 * @example source.example.com
 * @example 10.1.2.80
 * @example /tmp/my.sock
 *
 * @note When observed from the destination side, and when communicating through an intermediary, `source.address` **SHOULD** represent the source address behind any intermediaries, for example proxies, if it's available.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SOURCE_ADDRESS = 'source.address' as const;

/**
 * Source port number
 *
 * @example 3389
 * @example 2888
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SOURCE_PORT = 'source.port' as const;

/**
 * Deprecated, use `db.client.connection.state` instead.
 *
 * @example idle
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `db.client.connection.state`.
 */
export const ATTR_STATE = 'state' as const;

/**
 * Enum value "idle" for attribute {@link ATTR_STATE}.
 */
export const STATE_VALUE_IDLE = 'idle' as const;

/**
 * Enum value "used" for attribute {@link ATTR_STATE}.
 */
export const STATE_VALUE_USED = 'used' as const;

/**
 * Deprecated, use `cpu.logical_number` instead.
 *
 * @example 1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_CPU_LOGICAL_NUMBER = 'system.cpu.logical_number' as const;

/**
 * Deprecated, use `cpu.mode` instead.
 *
 * @example idle
 * @example interrupt
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `cpu.mode`
 */
export const ATTR_SYSTEM_CPU_STATE = 'system.cpu.state' as const;

/**
 * Enum value "idle" for attribute {@link ATTR_SYSTEM_CPU_STATE}.
 */
export const SYSTEM_CPU_STATE_VALUE_IDLE = 'idle' as const;

/**
 * Enum value "interrupt" for attribute {@link ATTR_SYSTEM_CPU_STATE}.
 */
export const SYSTEM_CPU_STATE_VALUE_INTERRUPT = 'interrupt' as const;

/**
 * Enum value "iowait" for attribute {@link ATTR_SYSTEM_CPU_STATE}.
 */
export const SYSTEM_CPU_STATE_VALUE_IOWAIT = 'iowait' as const;

/**
 * Enum value "nice" for attribute {@link ATTR_SYSTEM_CPU_STATE}.
 */
export const SYSTEM_CPU_STATE_VALUE_NICE = 'nice' as const;

/**
 * Enum value "steal" for attribute {@link ATTR_SYSTEM_CPU_STATE}.
 */
export const SYSTEM_CPU_STATE_VALUE_STEAL = 'steal' as const;

/**
 * Enum value "system" for attribute {@link ATTR_SYSTEM_CPU_STATE}.
 */
export const SYSTEM_CPU_STATE_VALUE_SYSTEM = 'system' as const;

/**
 * Enum value "user" for attribute {@link ATTR_SYSTEM_CPU_STATE}.
 */
export const SYSTEM_CPU_STATE_VALUE_USER = 'user' as const;

/**
 * The device identifier
 *
 * @example (identifier)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_DEVICE = 'system.device' as const;

/**
 * The filesystem mode
 *
 * @example rw, ro
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_FILESYSTEM_MODE = 'system.filesystem.mode' as const;

/**
 * The filesystem mount path
 *
 * @example /mnt/data
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_FILESYSTEM_MOUNTPOINT = 'system.filesystem.mountpoint' as const;

/**
 * The filesystem state
 *
 * @example used
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_FILESYSTEM_STATE = 'system.filesystem.state' as const;

/**
 * Enum value "free" for attribute {@link ATTR_SYSTEM_FILESYSTEM_STATE}.
 */
export const SYSTEM_FILESYSTEM_STATE_VALUE_FREE = 'free' as const;

/**
 * Enum value "reserved" for attribute {@link ATTR_SYSTEM_FILESYSTEM_STATE}.
 */
export const SYSTEM_FILESYSTEM_STATE_VALUE_RESERVED = 'reserved' as const;

/**
 * Enum value "used" for attribute {@link ATTR_SYSTEM_FILESYSTEM_STATE}.
 */
export const SYSTEM_FILESYSTEM_STATE_VALUE_USED = 'used' as const;

/**
 * The filesystem type
 *
 * @example ext4
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_FILESYSTEM_TYPE = 'system.filesystem.type' as const;

/**
 * Enum value "exfat" for attribute {@link ATTR_SYSTEM_FILESYSTEM_TYPE}.
 */
export const SYSTEM_FILESYSTEM_TYPE_VALUE_EXFAT = 'exfat' as const;

/**
 * Enum value "ext4" for attribute {@link ATTR_SYSTEM_FILESYSTEM_TYPE}.
 */
export const SYSTEM_FILESYSTEM_TYPE_VALUE_EXT4 = 'ext4' as const;

/**
 * Enum value "fat32" for attribute {@link ATTR_SYSTEM_FILESYSTEM_TYPE}.
 */
export const SYSTEM_FILESYSTEM_TYPE_VALUE_FAT32 = 'fat32' as const;

/**
 * Enum value "hfsplus" for attribute {@link ATTR_SYSTEM_FILESYSTEM_TYPE}.
 */
export const SYSTEM_FILESYSTEM_TYPE_VALUE_HFSPLUS = 'hfsplus' as const;

/**
 * Enum value "ntfs" for attribute {@link ATTR_SYSTEM_FILESYSTEM_TYPE}.
 */
export const SYSTEM_FILESYSTEM_TYPE_VALUE_NTFS = 'ntfs' as const;

/**
 * Enum value "refs" for attribute {@link ATTR_SYSTEM_FILESYSTEM_TYPE}.
 */
export const SYSTEM_FILESYSTEM_TYPE_VALUE_REFS = 'refs' as const;

/**
 * The memory state
 *
 * @example free
 * @example cached
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_MEMORY_STATE = 'system.memory.state' as const;

/**
 * Enum value "buffers" for attribute {@link ATTR_SYSTEM_MEMORY_STATE}.
 */
export const SYSTEM_MEMORY_STATE_VALUE_BUFFERS = 'buffers' as const;

/**
 * Enum value "cached" for attribute {@link ATTR_SYSTEM_MEMORY_STATE}.
 */
export const SYSTEM_MEMORY_STATE_VALUE_CACHED = 'cached' as const;

/**
 * Enum value "free" for attribute {@link ATTR_SYSTEM_MEMORY_STATE}.
 */
export const SYSTEM_MEMORY_STATE_VALUE_FREE = 'free' as const;

/**
 * Enum value "shared" for attribute {@link ATTR_SYSTEM_MEMORY_STATE}.
 */
export const SYSTEM_MEMORY_STATE_VALUE_SHARED = 'shared' as const;

/**
 * Enum value "used" for attribute {@link ATTR_SYSTEM_MEMORY_STATE}.
 */
export const SYSTEM_MEMORY_STATE_VALUE_USED = 'used' as const;

/**
 * Deprecated, use `network.connection.state` instead.
 *
 * @example close_wait
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Removed, report network connection state with `network.connection.state` attribute
 */
export const ATTR_SYSTEM_NETWORK_STATE = 'system.network.state' as const;

/**
 * Enum value "close" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_CLOSE = 'close' as const;

/**
 * Enum value "close_wait" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_CLOSE_WAIT = 'close_wait' as const;

/**
 * Enum value "closing" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_CLOSING = 'closing' as const;

/**
 * Enum value "delete" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_DELETE = 'delete' as const;

/**
 * Enum value "established" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_ESTABLISHED = 'established' as const;

/**
 * Enum value "fin_wait_1" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_FIN_WAIT_1 = 'fin_wait_1' as const;

/**
 * Enum value "fin_wait_2" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_FIN_WAIT_2 = 'fin_wait_2' as const;

/**
 * Enum value "last_ack" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_LAST_ACK = 'last_ack' as const;

/**
 * Enum value "listen" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_LISTEN = 'listen' as const;

/**
 * Enum value "syn_recv" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_SYN_RECV = 'syn_recv' as const;

/**
 * Enum value "syn_sent" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_SYN_SENT = 'syn_sent' as const;

/**
 * Enum value "time_wait" for attribute {@link ATTR_SYSTEM_NETWORK_STATE}.
 */
export const SYSTEM_NETWORK_STATE_VALUE_TIME_WAIT = 'time_wait' as const;

/**
 * The paging access direction
 *
 * @example in
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_PAGING_DIRECTION = 'system.paging.direction' as const;

/**
 * Enum value "in" for attribute {@link ATTR_SYSTEM_PAGING_DIRECTION}.
 */
export const SYSTEM_PAGING_DIRECTION_VALUE_IN = 'in' as const;

/**
 * Enum value "out" for attribute {@link ATTR_SYSTEM_PAGING_DIRECTION}.
 */
export const SYSTEM_PAGING_DIRECTION_VALUE_OUT = 'out' as const;

/**
 * The memory paging state
 *
 * @example free
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_PAGING_STATE = 'system.paging.state' as const;

/**
 * Enum value "free" for attribute {@link ATTR_SYSTEM_PAGING_STATE}.
 */
export const SYSTEM_PAGING_STATE_VALUE_FREE = 'free' as const;

/**
 * Enum value "used" for attribute {@link ATTR_SYSTEM_PAGING_STATE}.
 */
export const SYSTEM_PAGING_STATE_VALUE_USED = 'used' as const;

/**
 * The memory paging type
 *
 * @example minor
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_PAGING_TYPE = 'system.paging.type' as const;

/**
 * Enum value "major" for attribute {@link ATTR_SYSTEM_PAGING_TYPE}.
 */
export const SYSTEM_PAGING_TYPE_VALUE_MAJOR = 'major' as const;

/**
 * Enum value "minor" for attribute {@link ATTR_SYSTEM_PAGING_TYPE}.
 */
export const SYSTEM_PAGING_TYPE_VALUE_MINOR = 'minor' as const;

/**
 * The process state, e.g., [Linux Process State Codes](https://man7.org/linux/man-pages/man1/ps.1.html#PROCESS_STATE_CODES)
 *
 * @example running
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_SYSTEM_PROCESS_STATUS = 'system.process.status' as const;

/**
 * Enum value "defunct" for attribute {@link ATTR_SYSTEM_PROCESS_STATUS}.
 */
export const SYSTEM_PROCESS_STATUS_VALUE_DEFUNCT = 'defunct' as const;

/**
 * Enum value "running" for attribute {@link ATTR_SYSTEM_PROCESS_STATUS}.
 */
export const SYSTEM_PROCESS_STATUS_VALUE_RUNNING = 'running' as const;

/**
 * Enum value "sleeping" for attribute {@link ATTR_SYSTEM_PROCESS_STATUS}.
 */
export const SYSTEM_PROCESS_STATUS_VALUE_SLEEPING = 'sleeping' as const;

/**
 * Enum value "stopped" for attribute {@link ATTR_SYSTEM_PROCESS_STATUS}.
 */
export const SYSTEM_PROCESS_STATUS_VALUE_STOPPED = 'stopped' as const;

/**
 * Deprecated, use `system.process.status` instead.
 *
 * @example running
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `system.process.status`.
 */
export const ATTR_SYSTEM_PROCESSES_STATUS = 'system.processes.status' as const;

/**
 * Enum value "defunct" for attribute {@link ATTR_SYSTEM_PROCESSES_STATUS}.
 */
export const SYSTEM_PROCESSES_STATUS_VALUE_DEFUNCT = 'defunct' as const;

/**
 * Enum value "running" for attribute {@link ATTR_SYSTEM_PROCESSES_STATUS}.
 */
export const SYSTEM_PROCESSES_STATUS_VALUE_RUNNING = 'running' as const;

/**
 * Enum value "sleeping" for attribute {@link ATTR_SYSTEM_PROCESSES_STATUS}.
 */
export const SYSTEM_PROCESSES_STATUS_VALUE_SLEEPING = 'sleeping' as const;

/**
 * Enum value "stopped" for attribute {@link ATTR_SYSTEM_PROCESSES_STATUS}.
 */
export const SYSTEM_PROCESSES_STATUS_VALUE_STOPPED = 'stopped' as const;

/**
 * The name of the auto instrumentation agent or distribution, if used.
 *
 * @example parts-unlimited-java
 *
 * @note Official auto instrumentation agents and distributions **SHOULD** set the `telemetry.distro.name` attribute to
 * a string starting with `opentelemetry-`, e.g. `opentelemetry-java-instrumentation`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TELEMETRY_DISTRO_NAME = 'telemetry.distro.name' as const;

/**
 * The version string of the auto instrumentation agent or distribution, if used.
 *
 * @example 1.2.3
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TELEMETRY_DISTRO_VERSION = 'telemetry.distro.version' as const;

/**
 * The fully qualified human readable name of the [test case](https://wikipedia.org/wiki/Test_case).
 *
 * @example org.example.TestCase1.test1
 * @example example/tests/TestCase1.test1
 * @example ExampleTestCase1_test1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TEST_CASE_NAME = 'test.case.name' as const;

/**
 * The status of the actual test case result from test execution.
 *
 * @example pass
 * @example fail
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TEST_CASE_RESULT_STATUS = 'test.case.result.status' as const;

/**
 * Enum value "fail" for attribute {@link ATTR_TEST_CASE_RESULT_STATUS}.
 */
export const TEST_CASE_RESULT_STATUS_VALUE_FAIL = 'fail' as const;

/**
 * Enum value "pass" for attribute {@link ATTR_TEST_CASE_RESULT_STATUS}.
 */
export const TEST_CASE_RESULT_STATUS_VALUE_PASS = 'pass' as const;

/**
 * The human readable name of a [test suite](https://wikipedia.org/wiki/Test_suite).
 *
 * @example TestSuite1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TEST_SUITE_NAME = 'test.suite.name' as const;

/**
 * The status of the test suite run.
 *
 * @example success
 * @example failure
 * @example skipped
 * @example aborted
 * @example timed_out
 * @example in_progress
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TEST_SUITE_RUN_STATUS = 'test.suite.run.status' as const;

/**
 * Enum value "aborted" for attribute {@link ATTR_TEST_SUITE_RUN_STATUS}.
 */
export const TEST_SUITE_RUN_STATUS_VALUE_ABORTED = 'aborted' as const;

/**
 * Enum value "failure" for attribute {@link ATTR_TEST_SUITE_RUN_STATUS}.
 */
export const TEST_SUITE_RUN_STATUS_VALUE_FAILURE = 'failure' as const;

/**
 * Enum value "in_progress" for attribute {@link ATTR_TEST_SUITE_RUN_STATUS}.
 */
export const TEST_SUITE_RUN_STATUS_VALUE_IN_PROGRESS = 'in_progress' as const;

/**
 * Enum value "skipped" for attribute {@link ATTR_TEST_SUITE_RUN_STATUS}.
 */
export const TEST_SUITE_RUN_STATUS_VALUE_SKIPPED = 'skipped' as const;

/**
 * Enum value "success" for attribute {@link ATTR_TEST_SUITE_RUN_STATUS}.
 */
export const TEST_SUITE_RUN_STATUS_VALUE_SUCCESS = 'success' as const;

/**
 * Enum value "timed_out" for attribute {@link ATTR_TEST_SUITE_RUN_STATUS}.
 */
export const TEST_SUITE_RUN_STATUS_VALUE_TIMED_OUT = 'timed_out' as const;

/**
 * Current "managed" thread ID (as opposed to OS thread ID).
 *
 * @example 42
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_THREAD_ID = 'thread.id' as const;

/**
 * Current thread name.
 *
 * @example "main"
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_THREAD_NAME = 'thread.name' as const;

/**
 * String indicating the [cipher](https://datatracker.ietf.org/doc/html/rfc5246#appendix-A.5) used during the current connection.
 *
 * @example TLS_RSA_WITH_3DES_EDE_CBC_SHA
 * @example TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256
 *
 * @note The values allowed for `tls.cipher` **MUST** be one of the `Descriptions` of the [registered TLS Cipher Suits](https://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#table-tls-parameters-4).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CIPHER = 'tls.cipher' as const;

/**
 * PEM-encoded stand-alone certificate offered by the client. This is usually mutually-exclusive of `client.certificate_chain` since this value also exists in that list.
 *
 * @example MII...
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_CERTIFICATE = 'tls.client.certificate' as const;

/**
 * Array of PEM-encoded certificates that make up the certificate chain offered by the client. This is usually mutually-exclusive of `client.certificate` since that value should be the first certificate in the chain.
 *
 * @example ["MII...", "MI..."]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_CERTIFICATE_CHAIN = 'tls.client.certificate_chain' as const;

/**
 * Certificate fingerprint using the MD5 digest of DER-encoded version of certificate offered by the client. For consistency with other hash values, this value should be formatted as an uppercase hash.
 *
 * @example 0F76C7F2C55BFD7D8E8B8F4BFBF0C9EC
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_HASH_MD5 = 'tls.client.hash.md5' as const;

/**
 * Certificate fingerprint using the SHA1 digest of DER-encoded version of certificate offered by the client. For consistency with other hash values, this value should be formatted as an uppercase hash.
 *
 * @example 9E393D93138888D288266C2D915214D1D1CCEB2A
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_HASH_SHA1 = 'tls.client.hash.sha1' as const;

/**
 * Certificate fingerprint using the SHA256 digest of DER-encoded version of certificate offered by the client. For consistency with other hash values, this value should be formatted as an uppercase hash.
 *
 * @example 0687F666A054EF17A08E2F2162EAB4CBC0D265E1D7875BE74BF3C712CA92DAF0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_HASH_SHA256 = 'tls.client.hash.sha256' as const;

/**
 * Distinguished name of [subject](https://datatracker.ietf.org/doc/html/rfc5280#section-4.1.2.6) of the issuer of the x.509 certificate presented by the client.
 *
 * @example CN=Example Root CA, OU=Infrastructure Team, DC=example, DC=com
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_ISSUER = 'tls.client.issuer' as const;

/**
 * A hash that identifies clients based on how they perform an SSL/TLS handshake.
 *
 * @example d4e5b18d6b55c71272893221c96ba240
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_JA3 = 'tls.client.ja3' as const;

/**
 * Date/Time indicating when client certificate is no longer considered valid.
 *
 * @example 2021-01-01T00:00:00.000Z
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_NOT_AFTER = 'tls.client.not_after' as const;

/**
 * Date/Time indicating when client certificate is first considered valid.
 *
 * @example 1970-01-01T00:00:00.000Z
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_NOT_BEFORE = 'tls.client.not_before' as const;

/**
 * Deprecated, use `server.address` instead.
 *
 * @example opentelemetry.io
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Replaced by `server.address`.
 */
export const ATTR_TLS_CLIENT_SERVER_NAME = 'tls.client.server_name' as const;

/**
 * Distinguished name of subject of the x.509 certificate presented by the client.
 *
 * @example CN=myclient, OU=Documentation Team, DC=example, DC=com
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_SUBJECT = 'tls.client.subject' as const;

/**
 * Array of ciphers offered by the client during the client hello.
 *
 * @example ["TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CLIENT_SUPPORTED_CIPHERS = 'tls.client.supported_ciphers' as const;

/**
 * String indicating the curve used for the given cipher, when applicable
 *
 * @example secp256r1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_CURVE = 'tls.curve' as const;

/**
 * Boolean flag indicating if the TLS negotiation was successful and transitioned to an encrypted tunnel.
 *
 * @example true
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_ESTABLISHED = 'tls.established' as const;

/**
 * String indicating the protocol being tunneled. Per the values in the [IANA registry](https://www.iana.org/assignments/tls-extensiontype-values/tls-extensiontype-values.xhtml#alpn-protocol-ids), this string should be lower case.
 *
 * @example http/1.1
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_NEXT_PROTOCOL = 'tls.next_protocol' as const;

/**
 * Normalized lowercase protocol name parsed from original string of the negotiated [SSL/TLS protocol version](https://docs.openssl.org/1.1.1/man3/SSL_get_version/#return-values)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_PROTOCOL_NAME = 'tls.protocol.name' as const;

/**
 * Enum value "ssl" for attribute {@link ATTR_TLS_PROTOCOL_NAME}.
 */
export const TLS_PROTOCOL_NAME_VALUE_SSL = 'ssl' as const;

/**
 * Enum value "tls" for attribute {@link ATTR_TLS_PROTOCOL_NAME}.
 */
export const TLS_PROTOCOL_NAME_VALUE_TLS = 'tls' as const;

/**
 * Numeric part of the version parsed from the original string of the negotiated [SSL/TLS protocol version](https://docs.openssl.org/1.1.1/man3/SSL_get_version/#return-values)
 *
 * @example 1.2
 * @example 3
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_PROTOCOL_VERSION = 'tls.protocol.version' as const;

/**
 * Boolean flag indicating if this TLS connection was resumed from an existing TLS negotiation.
 *
 * @example true
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_RESUMED = 'tls.resumed' as const;

/**
 * PEM-encoded stand-alone certificate offered by the server. This is usually mutually-exclusive of `server.certificate_chain` since this value also exists in that list.
 *
 * @example MII...
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_CERTIFICATE = 'tls.server.certificate' as const;

/**
 * Array of PEM-encoded certificates that make up the certificate chain offered by the server. This is usually mutually-exclusive of `server.certificate` since that value should be the first certificate in the chain.
 *
 * @example ["MII...", "MI..."]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_CERTIFICATE_CHAIN = 'tls.server.certificate_chain' as const;

/**
 * Certificate fingerprint using the MD5 digest of DER-encoded version of certificate offered by the server. For consistency with other hash values, this value should be formatted as an uppercase hash.
 *
 * @example 0F76C7F2C55BFD7D8E8B8F4BFBF0C9EC
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_HASH_MD5 = 'tls.server.hash.md5' as const;

/**
 * Certificate fingerprint using the SHA1 digest of DER-encoded version of certificate offered by the server. For consistency with other hash values, this value should be formatted as an uppercase hash.
 *
 * @example 9E393D93138888D288266C2D915214D1D1CCEB2A
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_HASH_SHA1 = 'tls.server.hash.sha1' as const;

/**
 * Certificate fingerprint using the SHA256 digest of DER-encoded version of certificate offered by the server. For consistency with other hash values, this value should be formatted as an uppercase hash.
 *
 * @example 0687F666A054EF17A08E2F2162EAB4CBC0D265E1D7875BE74BF3C712CA92DAF0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_HASH_SHA256 = 'tls.server.hash.sha256' as const;

/**
 * Distinguished name of [subject](https://datatracker.ietf.org/doc/html/rfc5280#section-4.1.2.6) of the issuer of the x.509 certificate presented by the client.
 *
 * @example CN=Example Root CA, OU=Infrastructure Team, DC=example, DC=com
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_ISSUER = 'tls.server.issuer' as const;

/**
 * A hash that identifies servers based on how they perform an SSL/TLS handshake.
 *
 * @example d4e5b18d6b55c71272893221c96ba240
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_JA3S = 'tls.server.ja3s' as const;

/**
 * Date/Time indicating when server certificate is no longer considered valid.
 *
 * @example 2021-01-01T00:00:00.000Z
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_NOT_AFTER = 'tls.server.not_after' as const;

/**
 * Date/Time indicating when server certificate is first considered valid.
 *
 * @example 1970-01-01T00:00:00.000Z
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_NOT_BEFORE = 'tls.server.not_before' as const;

/**
 * Distinguished name of subject of the x.509 certificate presented by the server.
 *
 * @example CN=myserver, OU=Documentation Team, DC=example, DC=com
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_TLS_SERVER_SUBJECT = 'tls.server.subject' as const;

/**
 * Domain extracted from the `url.full`, such as "opentelemetry.io".
 *
 * @example www.foo.bar
 * @example opentelemetry.io
 * @example 3.12.167.2
 * @example [1080:0:0:0:8:800:200C:417A]
 *
 * @note In some cases a URL may refer to an IP and/or port directly, without a domain name. In this case, the IP address would go to the domain field. If the URL contains a [literal IPv6 address](https://www.rfc-editor.org/rfc/rfc2732#section-2) enclosed by `[` and `]`, the `[` and `]` characters should also be captured in the domain field.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_URL_DOMAIN = 'url.domain' as const;

/**
 * The file extension extracted from the `url.full`, excluding the leading dot.
 *
 * @example png
 * @example gz
 *
 * @note The file extension is only set if it exists, as not every url has a file extension. When the file name has multiple extensions `example.tar.gz`, only the last one should be captured `gz`, not `tar.gz`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_URL_EXTENSION = 'url.extension' as const;

/**
 * Unmodified original URL as seen in the event source.
 *
 * @example https://www.foo.bar/search?q=OpenTelemetry#SemConv
 * @example search?q=OpenTelemetry
 *
 * @note In network monitoring, the observed URL may be a full URL, whereas in access logs, the URL is often just represented as a path. This field is meant to represent the URL as it was observed, complete or not.
 * `url.original` might contain credentials passed via URL in form of `https://username:password@www.example.com/`. In such case password and username **SHOULD NOT** be redacted and attribute's value **SHOULD** remain the same.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_URL_ORIGINAL = 'url.original' as const;

/**
 * Port extracted from the `url.full`
 *
 * @example 443
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_URL_PORT = 'url.port' as const;

/**
 * The highest registered url domain, stripped of the subdomain.
 *
 * @example example.com
 * @example foo.co.uk
 *
 * @note This value can be determined precisely with the [public suffix list](https://publicsuffix.org/). For example, the registered domain for `foo.example.com` is `example.com`. Trying to approximate this by simply taking the last two labels will not work well for TLDs such as `co.uk`.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_URL_REGISTERED_DOMAIN = 'url.registered_domain' as const;

/**
 * The subdomain portion of a fully qualified domain name includes all of the names except the host name under the registered_domain. In a partially qualified domain, or if the qualification level of the full name cannot be determined, subdomain contains all of the names below the registered domain.
 *
 * @example east
 * @example sub2.sub1
 *
 * @note The subdomain portion of `www.east.mydomain.co.uk` is `east`. If the domain has multiple levels of subdomain, such as `sub2.sub1.example.com`, the subdomain field should contain `sub2.sub1`, with no trailing period.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_URL_SUBDOMAIN = 'url.subdomain' as const;

/**
 * The low-cardinality template of an [absolute path reference](https://www.rfc-editor.org/rfc/rfc3986#section-4.2).
 *
 * @example /users/{id}
 * @example /users/:id
 * @example /users?id={id}
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_URL_TEMPLATE = 'url.template' as const;

/**
 * The effective top level domain (eTLD), also known as the domain suffix, is the last part of the domain name. For example, the top level domain for example.com is `com`.
 *
 * @example com
 * @example co.uk
 *
 * @note This value can be determined precisely with the [public suffix list](https://publicsuffix.org/).
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_URL_TOP_LEVEL_DOMAIN = 'url.top_level_domain' as const;

/**
 * User email address.
 *
 * @example a.einstein@example.com
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_EMAIL = 'user.email' as const;

/**
 * User's full name
 *
 * @example Albert Einstein
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_FULL_NAME = 'user.full_name' as const;

/**
 * Unique user hash to correlate information for a user in anonymized form.
 *
 * @example 364fc68eaf4c8acec74a4e52d7d1feaa
 *
 * @note Useful if `user.id` or `user.name` contain confidential information and cannot be used.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_HASH = 'user.hash' as const;

/**
 * Unique identifier of the user.
 *
 * @example S-1-5-21-202424912787-2692429404-2351956786-1000
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_ID = 'user.id' as const;

/**
 * Short name or login/username of the user.
 *
 * @example a.einstein
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_NAME = 'user.name' as const;

/**
 * Array of user roles at the time of the event.
 *
 * @example ["admin", "reporting_user"]
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_ROLES = 'user.roles' as const;

/**
 * Name of the user-agent extracted from original. Usually refers to the browser's name.
 *
 * @example Safari
 * @example YourApp
 *
 * @note [Example](https://www.whatsmyua.info) of extracting browser's name from original string. In the case of using a user-agent for non-browser products, such as microservices with multiple names/versions inside the `user_agent.original`, the most significant name **SHOULD** be selected. In such a scenario it should align with `user_agent.version`
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_AGENT_NAME = 'user_agent.name' as const;

/**
 * Human readable operating system name.
 *
 * @example iOS
 * @example Android
 * @example Ubuntu
 *
 * @note For mapping user agent strings to OS names, libraries such as [ua-parser](https://github.com/ua-parser) can be utilized.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_AGENT_OS_NAME = 'user_agent.os.name' as const;

/**
 * The version string of the operating system as defined in [Version Attributes](/docs/resource/README.md#version-attributes).
 *
 * @example 14.2.1
 * @example 18.04.1
 *
 * @note For mapping user agent strings to OS versions, libraries such as [ua-parser](https://github.com/ua-parser) can be utilized.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_AGENT_OS_VERSION = 'user_agent.os.version' as const;

/**
 * Specifies the category of synthetic traffic, such as tests or bots.
 *
 * @note This attribute **MAY** be derived from the contents of the `user_agent.original` attribute. Components that populate the attribute are responsible for determining what they consider to be synthetic bot or test traffic. This attribute can either be set for self-identification purposes, or on telemetry detected to be generated as a result of a synthetic request. This attribute is useful for distinguishing between genuine client traffic and synthetic traffic generated by bots or tests.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_AGENT_SYNTHETIC_TYPE = 'user_agent.synthetic.type' as const;

/**
 * Enum value "bot" for attribute {@link ATTR_USER_AGENT_SYNTHETIC_TYPE}.
 */
export const USER_AGENT_SYNTHETIC_TYPE_VALUE_BOT = 'bot' as const;

/**
 * Enum value "test" for attribute {@link ATTR_USER_AGENT_SYNTHETIC_TYPE}.
 */
export const USER_AGENT_SYNTHETIC_TYPE_VALUE_TEST = 'test' as const;

/**
 * Version of the user-agent extracted from original. Usually refers to the browser's version
 *
 * @example 14.1.2
 * @example 1.0.0
 *
 * @note [Example](https://www.whatsmyua.info) of extracting browser's version from original string. In the case of using a user-agent for non-browser products, such as microservices with multiple names/versions inside the `user_agent.original`, the most significant version **SHOULD** be selected. In such a scenario it should align with `user_agent.name`
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_USER_AGENT_VERSION = 'user_agent.version' as const;

/**
 * The type of garbage collection.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_V8JS_GC_TYPE = 'v8js.gc.type' as const;

/**
 * Enum value "incremental" for attribute {@link ATTR_V8JS_GC_TYPE}.
 */
export const V8JS_GC_TYPE_VALUE_INCREMENTAL = 'incremental' as const;

/**
 * Enum value "major" for attribute {@link ATTR_V8JS_GC_TYPE}.
 */
export const V8JS_GC_TYPE_VALUE_MAJOR = 'major' as const;

/**
 * Enum value "minor" for attribute {@link ATTR_V8JS_GC_TYPE}.
 */
export const V8JS_GC_TYPE_VALUE_MINOR = 'minor' as const;

/**
 * Enum value "weakcb" for attribute {@link ATTR_V8JS_GC_TYPE}.
 */
export const V8JS_GC_TYPE_VALUE_WEAKCB = 'weakcb' as const;

/**
 * The name of the space type of heap memory.
 *
 * @note Value can be retrieved from value `space_name` of [`v8.getHeapSpaceStatistics()`](https://nodejs.org/api/v8.html#v8getheapspacestatistics)
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_V8JS_HEAP_SPACE_NAME = 'v8js.heap.space.name' as const;

/**
 * Enum value "code_space" for attribute {@link ATTR_V8JS_HEAP_SPACE_NAME}.
 */
export const V8JS_HEAP_SPACE_NAME_VALUE_CODE_SPACE = 'code_space' as const;

/**
 * Enum value "large_object_space" for attribute {@link ATTR_V8JS_HEAP_SPACE_NAME}.
 */
export const V8JS_HEAP_SPACE_NAME_VALUE_LARGE_OBJECT_SPACE = 'large_object_space' as const;

/**
 * Enum value "map_space" for attribute {@link ATTR_V8JS_HEAP_SPACE_NAME}.
 */
export const V8JS_HEAP_SPACE_NAME_VALUE_MAP_SPACE = 'map_space' as const;

/**
 * Enum value "new_space" for attribute {@link ATTR_V8JS_HEAP_SPACE_NAME}.
 */
export const V8JS_HEAP_SPACE_NAME_VALUE_NEW_SPACE = 'new_space' as const;

/**
 * Enum value "old_space" for attribute {@link ATTR_V8JS_HEAP_SPACE_NAME}.
 */
export const V8JS_HEAP_SPACE_NAME_VALUE_OLD_SPACE = 'old_space' as const;

/**
 * The ID of the change (pull request/merge request/changelist) if applicable. This is usually a unique (within repository) identifier generated by the VCS system.
 *
 * @example 123
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_CHANGE_ID = 'vcs.change.id' as const;

/**
 * The state of the change (pull request/merge request/changelist).
 *
 * @example open
 * @example closed
 * @example merged
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_CHANGE_STATE = 'vcs.change.state' as const;

/**
 * Enum value "closed" for attribute {@link ATTR_VCS_CHANGE_STATE}.
 */
export const VCS_CHANGE_STATE_VALUE_CLOSED = 'closed' as const;

/**
 * Enum value "merged" for attribute {@link ATTR_VCS_CHANGE_STATE}.
 */
export const VCS_CHANGE_STATE_VALUE_MERGED = 'merged' as const;

/**
 * Enum value "open" for attribute {@link ATTR_VCS_CHANGE_STATE}.
 */
export const VCS_CHANGE_STATE_VALUE_OPEN = 'open' as const;

/**
 * Enum value "wip" for attribute {@link ATTR_VCS_CHANGE_STATE}.
 */
export const VCS_CHANGE_STATE_VALUE_WIP = 'wip' as const;

/**
 * The human readable title of the change (pull request/merge request/changelist). This title is often a brief summary of the change and may get merged in to a ref as the commit summary.
 *
 * @example Fixes broken thing
 * @example feat: add my new feature
 * @example [chore] update dependency
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_CHANGE_TITLE = 'vcs.change.title' as const;

/**
 * The type of line change being measured on a branch or change.
 *
 * @example added
 * @example removed
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_LINE_CHANGE_TYPE = 'vcs.line_change.type' as const;

/**
 * Enum value "added" for attribute {@link ATTR_VCS_LINE_CHANGE_TYPE}.
 */
export const VCS_LINE_CHANGE_TYPE_VALUE_ADDED = 'added' as const;

/**
 * Enum value "removed" for attribute {@link ATTR_VCS_LINE_CHANGE_TYPE}.
 */
export const VCS_LINE_CHANGE_TYPE_VALUE_REMOVED = 'removed' as const;

/**
 * The group owner within the version control system.
 *
 * @example my-org
 * @example myteam
 * @example business-unit
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_OWNER_NAME = 'vcs.owner.name' as const;

/**
 * The name of the version control system provider.
 *
 * @example github
 * @example gitlab
 * @example gittea
 * @example bitbucket
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_PROVIDER_NAME = 'vcs.provider.name' as const;

/**
 * Enum value "bitbucket" for attribute {@link ATTR_VCS_PROVIDER_NAME}.
 */
export const VCS_PROVIDER_NAME_VALUE_BITBUCKET = 'bitbucket' as const;

/**
 * Enum value "github" for attribute {@link ATTR_VCS_PROVIDER_NAME}.
 */
export const VCS_PROVIDER_NAME_VALUE_GITHUB = 'github' as const;

/**
 * Enum value "gitlab" for attribute {@link ATTR_VCS_PROVIDER_NAME}.
 */
export const VCS_PROVIDER_NAME_VALUE_GITLAB = 'gitlab' as const;

/**
 * Enum value "gittea" for attribute {@link ATTR_VCS_PROVIDER_NAME}.
 */
export const VCS_PROVIDER_NAME_VALUE_GITTEA = 'gittea' as const;

/**
 * The name of the [reference](https://git-scm.com/docs/gitglossary#def_ref) such as **branch** or **tag** in the repository.
 *
 * @example my-feature-branch
 * @example tag-1-test
 *
 * @note `base` refers to the starting point of a change. For example, `main`
 * would be the base reference of type branch if you've created a new
 * reference of type branch from it and created new commits.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REF_BASE_NAME = 'vcs.ref.base.name' as const;

/**
 * The revision, literally [revised version](https://www.merriam-webster.com/dictionary/revision), The revision most often refers to a commit object in Git, or a revision number in SVN.
 *
 * @example 9d59409acf479dfa0df1aa568182e43e43df8bbe28d60fcf2bc52e30068802cc
 * @example main
 * @example 123
 * @example HEAD
 *
 * @note `base` refers to the starting point of a change. For example, `main`
 * would be the base reference of type branch if you've created a new
 * reference of type branch from it and created new commits. The
 * revision can be a full [hash value (see
 * glossary)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf),
 * of the recorded change to a ref within a repository pointing to a
 * commit [commit](https://git-scm.com/docs/git-commit) object. It does
 * not necessarily have to be a hash; it can simply define a [revision
 * number](https://svnbook.red-bean.com/en/1.7/svn.tour.revs.specifiers.html)
 * which is an integer that is monotonically increasing. In cases where
 * it is identical to the `ref.base.name`, it **SHOULD** still be included.
 * It is up to the implementer to decide which value to set as the
 * revision based on the VCS system and situational context.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REF_BASE_REVISION = 'vcs.ref.base.revision' as const;

/**
 * The type of the [reference](https://git-scm.com/docs/gitglossary#def_ref) in the repository.
 *
 * @example branch
 * @example tag
 *
 * @note `base` refers to the starting point of a change. For example, `main`
 * would be the base reference of type branch if you've created a new
 * reference of type branch from it and created new commits.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REF_BASE_TYPE = 'vcs.ref.base.type' as const;

/**
 * Enum value "branch" for attribute {@link ATTR_VCS_REF_BASE_TYPE}.
 */
export const VCS_REF_BASE_TYPE_VALUE_BRANCH = 'branch' as const;

/**
 * Enum value "tag" for attribute {@link ATTR_VCS_REF_BASE_TYPE}.
 */
export const VCS_REF_BASE_TYPE_VALUE_TAG = 'tag' as const;

/**
 * The name of the [reference](https://git-scm.com/docs/gitglossary#def_ref) such as **branch** or **tag** in the repository.
 *
 * @example my-feature-branch
 * @example tag-1-test
 *
 * @note `head` refers to where you are right now; the current reference at a
 * given time.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REF_HEAD_NAME = 'vcs.ref.head.name' as const;

/**
 * The revision, literally [revised version](https://www.merriam-webster.com/dictionary/revision), The revision most often refers to a commit object in Git, or a revision number in SVN.
 *
 * @example 9d59409acf479dfa0df1aa568182e43e43df8bbe28d60fcf2bc52e30068802cc
 * @example main
 * @example 123
 * @example HEAD
 *
 * @note `head` refers to where you are right now; the current reference at a
 * given time.The revision can be a full [hash value (see
 * glossary)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf),
 * of the recorded change to a ref within a repository pointing to a
 * commit [commit](https://git-scm.com/docs/git-commit) object. It does
 * not necessarily have to be a hash; it can simply define a [revision
 * number](https://svnbook.red-bean.com/en/1.7/svn.tour.revs.specifiers.html)
 * which is an integer that is monotonically increasing. In cases where
 * it is identical to the `ref.head.name`, it **SHOULD** still be included.
 * It is up to the implementer to decide which value to set as the
 * revision based on the VCS system and situational context.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REF_HEAD_REVISION = 'vcs.ref.head.revision' as const;

/**
 * The type of the [reference](https://git-scm.com/docs/gitglossary#def_ref) in the repository.
 *
 * @example branch
 * @example tag
 *
 * @note `head` refers to where you are right now; the current reference at a
 * given time.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REF_HEAD_TYPE = 'vcs.ref.head.type' as const;

/**
 * Enum value "branch" for attribute {@link ATTR_VCS_REF_HEAD_TYPE}.
 */
export const VCS_REF_HEAD_TYPE_VALUE_BRANCH = 'branch' as const;

/**
 * Enum value "tag" for attribute {@link ATTR_VCS_REF_HEAD_TYPE}.
 */
export const VCS_REF_HEAD_TYPE_VALUE_TAG = 'tag' as const;

/**
 * The type of the [reference](https://git-scm.com/docs/gitglossary#def_ref) in the repository.
 *
 * @example branch
 * @example tag
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REF_TYPE = 'vcs.ref.type' as const;

/**
 * Enum value "branch" for attribute {@link ATTR_VCS_REF_TYPE}.
 */
export const VCS_REF_TYPE_VALUE_BRANCH = 'branch' as const;

/**
 * Enum value "tag" for attribute {@link ATTR_VCS_REF_TYPE}.
 */
export const VCS_REF_TYPE_VALUE_TAG = 'tag' as const;

/**
 * Deprecated, use `vcs.change.id` instead.
 *
 * @example 123
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Deprecated, use `vcs.change.id` instead.
 */
export const ATTR_VCS_REPOSITORY_CHANGE_ID = 'vcs.repository.change.id' as const;

/**
 * Deprecated, use `vcs.change.title` instead.
 *
 * @example Fixes broken thing
 * @example feat: add my new feature
 * @example [chore] update dependency
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Deprecated, use `vcs.change.title` instead.
 */
export const ATTR_VCS_REPOSITORY_CHANGE_TITLE = 'vcs.repository.change.title' as const;

/**
 * The human readable name of the repository. It **SHOULD NOT** include any additional identifier like Group/SubGroup in GitLab or organization in GitHub.
 *
 * @example semantic-conventions
 * @example my-cool-repo
 *
 * @note Due to it only being the name, it can clash with forks of the same
 * repository if collecting telemetry across multiple orgs or groups in
 * the same backends.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REPOSITORY_NAME = 'vcs.repository.name' as const;

/**
 * Deprecated, use `vcs.ref.head.name` instead.
 *
 * @example my-feature-branch
 * @example tag-1-test
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Deprecated, use `vcs.ref.head.name` instead.
 */
export const ATTR_VCS_REPOSITORY_REF_NAME = 'vcs.repository.ref.name' as const;

/**
 * Deprecated, use `vcs.ref.head.revision` instead.
 *
 * @example 9d59409acf479dfa0df1aa568182e43e43df8bbe28d60fcf2bc52e30068802cc
 * @example main
 * @example 123
 * @example HEAD
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Deprecated, use `vcs.ref.head.revision` instead.
 */
export const ATTR_VCS_REPOSITORY_REF_REVISION = 'vcs.repository.ref.revision' as const;

/**
 * Deprecated, use `vcs.ref.head.type` instead.
 *
 * @example branch
 * @example tag
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 *
 * @deprecated Deprecated, use `vcs.ref.head.type` instead.
 */
export const ATTR_VCS_REPOSITORY_REF_TYPE = 'vcs.repository.ref.type' as const;

/**
 * Enum value "branch" for attribute {@link ATTR_VCS_REPOSITORY_REF_TYPE}.
 */
export const VCS_REPOSITORY_REF_TYPE_VALUE_BRANCH = 'branch' as const;

/**
 * Enum value "tag" for attribute {@link ATTR_VCS_REPOSITORY_REF_TYPE}.
 */
export const VCS_REPOSITORY_REF_TYPE_VALUE_TAG = 'tag' as const;

/**
 * The [canonical URL](https://support.google.com/webmasters/answer/10347851?hl=en#:~:text=A%20canonical%20URL%20is%20the,Google%20chooses%20one%20as%20canonical.) of the repository providing the complete HTTP(S) address in order to locate and identify the repository through a browser.
 *
 * @example https://github.com/opentelemetry/open-telemetry-collector-contrib
 * @example https://gitlab.com/my-org/my-project/my-projects-project/repo
 *
 * @note In Git Version Control Systems, the canonical URL **SHOULD NOT** include
 * the `.git` extension.
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REPOSITORY_URL_FULL = 'vcs.repository.url.full' as const;

/**
 * The type of revision comparison.
 *
 * @example ahead
 * @example behind
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_VCS_REVISION_DELTA_DIRECTION = 'vcs.revision_delta.direction' as const;

/**
 * Enum value "ahead" for attribute {@link ATTR_VCS_REVISION_DELTA_DIRECTION}.
 */
export const VCS_REVISION_DELTA_DIRECTION_VALUE_AHEAD = 'ahead' as const;

/**
 * Enum value "behind" for attribute {@link ATTR_VCS_REVISION_DELTA_DIRECTION}.
 */
export const VCS_REVISION_DELTA_DIRECTION_VALUE_BEHIND = 'behind' as const;

/**
 * Additional description of the web engine (e.g. detailed version and edition information).
 *
 * @example WildFly Full 21.0.0.Final (WildFly Core 13.0.1.Final) - 2.2.2.Final
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_WEBENGINE_DESCRIPTION = 'webengine.description' as const;

/**
 * The name of the web engine.
 *
 * @example WildFly
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_WEBENGINE_NAME = 'webengine.name' as const;

/**
 * The version of the web engine.
 *
 * @example 21.0.0
 *
 * @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
 */
export const ATTR_WEBENGINE_VERSION = 'webengine.version' as const;
