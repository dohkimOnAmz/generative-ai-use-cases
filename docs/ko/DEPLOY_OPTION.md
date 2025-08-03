# 배포 옵션

## 구성 방법

GenU를 사용하면 parameter.ts 또는 AWS CDK context를 통해 설정을 변경할 수 있습니다.

**여러 환경에 대한 설정을 정의할 수 있으므로 새 환경을 구축할 때는 parameter.ts를 사용하는 것을 권장합니다. 하위 호환성을 위해 매개변수는 context > parameter.ts 순서로 검색됩니다.**

**Context 사용 시: CDK context는 '-c'로 지정할 수 있지만, 코드 변경이 없으므로 프론트엔드 빌드가 트리거되지 않습니다. 이 자산의 경우 cdk.json에서 모든 설정을 변경하는 것을 권장합니다.**

### parameter.ts 값 변경 방법

[packages/cdk/parameter.ts](/packages/cdk/parameter.ts)의 값을 변경하여 설정을 구성합니다.

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    ragEnabled: false,
    // 필요에 따라 다른 매개변수 사용자 정의
  },
  staging: {
    ragEnabled: false,
    // 필요에 따라 다른 매개변수 사용자 정의
  },
  prod: {
    ragEnabled: true,
    // 필요에 따라 다른 매개변수 사용자 정의
  },
};
```

CDK context의 `env`로 지정된 환경이 `parameter.ts`에 정의되어 있으면 `parameter.ts`의 값이 우선됩니다. 지정된 `env` 환경이 `parameter.ts`에 정의되지 않은 경우 context 값으로 환경이 생성됩니다.

[packages/cdk/cdk.json](/packages/cdk/cdk.json)의 `context`에서 `env`를 지정하거나 `-c`로 `env`를 전환할 수 있습니다.

```json
// cdk.json
{
  "context": {
    "env": "dev"
  }
}
```

```bash
# cdk.json context.env에 지정된 env로 배포
npm run cdk:deploy

# 환경을 prod로 설정하여 배포
npm run cdk:deploy -- -c env=prod
```

로컬에서 개발할 때는 다음과 같이 `env`를 지정합니다:

```bash
# cdk.json context.env에 지정된 백엔드를 사용하여 로컬 개발
npm run web:devw

# dev2 환경 백엔드를 사용하여 로컬 개발
npm run web:devw --env=dev2
```

### cdk.json 값 변경 방법

[packages/cdk/cdk.json](/packages/cdk/cdk.json)의 context 아래 값을 변경하여 설정을 구성합니다. 예를 들어, `"ragEnabled": true`로 설정하면 RAG 채팅 사용 사례가 활성화됩니다. context 값을 설정한 후 다음 명령으로 재배포하여 설정을 적용합니다:

```bash
npm run cdk:deploy
```

## 사용 사례 구성

### RAG Chat (Amazon Kendra) 사용 사례 활성화

`ragEnabled`를 `true`로 설정합니다. (기본값은 `false`)

검색 성능을 향상시킬 수 있는 선호 언어로 `kendraIndexLanguage`를 설정할 수도 있습니다.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    ragEnabled: true,
    kendraIndexLanguage: 'en',
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "ragEnabled": true,
    "kendraIndexLanguage": "en"
  }
}
}
```

변경 후 `npm run cdk:deploy`로 재배포하여 변경사항을 적용합니다. `/packages/cdk/rag-docs/docs`에 저장된 데이터는 Kendra 데이터 소스용 S3 버킷에 자동으로 업로드됩니다. (`logs`로 시작하는 파일은 동기화되지 않습니다.)

> [!NOTE]
> 기본적으로 Amazon Bedrock 사용자 가이드(일본어)와 Amazon Nova 사용자 가이드(영어)가 샘플 데이터로 `/packages/cdk/rag-docs/docs`에 저장되어 있습니다.

다음으로 다음 단계에 따라 Kendra 데이터 소스 동기화를 수행합니다:

1. [Amazon Kendra 콘솔](https://console.aws.amazon.com/kendra/home) 열기
2. generative-ai-use-cases-index 클릭
3. Data sources 클릭
4. "s3-data-source" 클릭
5. Sync now 클릭

Sync run history의 Status / Summary가 Completed로 표시되면 프로세스가 완료됩니다. S3에 저장된 파일이 동기화되어 Kendra를 통해 검색할 수 있습니다.

#### 기존 Amazon Kendra 인덱스 사용

기존 Kendra 인덱스를 사용할 때는 `ragEnabled`가 여전히 `true`여야 합니다.

`kendraIndexArn`에 인덱스 ARN을 지정합니다. 기존 Kendra 인덱스와 함께 S3 데이터 소스를 사용하는 경우 `kendraDataSourceBucketName`에 버킷 이름을 지정합니다.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    kendraIndexArn: '<Kendra Index ARN>',
    kendraDataSourceBucketName: '<Kendra S3 Data Source Bucket Name>',
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "kendraIndexArn": "<Kendra Index ARN>",
    "kendraDataSourceBucketName": "<Kendra S3 Data Source Bucket Name>"
  }
}
```

변경 후 `npm run cdk:deploy`로 재배포하여 변경사항을 적용합니다.

`<Kendra Index ARN>`은 다음 형식을 가집니다:

```
arn:aws:kendra:<Region>:<AWS Account ID>:index/<Index ID>
```

예를 들어:

```
arn:aws:kendra:ap-northeast-1:333333333333:index/77777777-3333-4444-aaaa-111111111111
```

### RAG Chat (Knowledge Base) 사용 사례 활성화

`ragKnowledgeBaseEnabled`를 `true`로 설정합니다. (기본값은 `false`)  
기존 Knowledge Base가 있는 경우 `ragKnowledgeBaseId`를 지식 베이스 ID로 설정합니다. (`null`인 경우 OpenSearch Serverless 지식 베이스가 생성됩니다)

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    ragKnowledgeBaseEnabled: true,
    ragKnowledgeBaseId: 'XXXXXXXXXX',
    ragKnowledgeBaseStandbyReplicas: false,
    ragKnowledgeBaseAdvancedParsing: false,
    ragKnowledgeBaseAdvancedParsingModelId:
      'anthropic.claude-3-sonnet-20240229-v1:0',
    embeddingModelId: 'amazon.titan-embed-text-v2:0',
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "ragKnowledgeBaseEnabled": true,
    "ragKnowledgeBaseId": "XXXXXXXXXX",
    "ragKnowledgeBaseStandbyReplicas": false,
    "ragKnowledgeBaseAdvancedParsing": false,
    "ragKnowledgeBaseAdvancedParsingModelId": "anthropic.claude-3-sonnet-20240229-v1:0",
    "embeddingModelId": "amazon.titan-embed-text-v2:0",
    "rerankingModelId": "amazon.rerank-v1:0",
    "queryDecompositionEnabled": true
  }
}
```

`ragKnowledgeBaseStandbyReplicas`는 자동으로 생성되는 OpenSearch Serverless의 중복성과 관련됩니다:

- `false`: 개발 및 테스트 목적에 적합합니다. 단일 AZ에서 실행되어 OCU 비용이 절반으로 줄어듭니다.
- `true`: 프로덕션 환경에 적합합니다. 여러 AZ에서 실행되어 고가용성을 제공합니다.

`embeddingModelId`는 임베딩에 사용되는 모델입니다. 현재 다음 모델이 지원됩니다:

```
"amazon.titan-embed-text-v1"
"amazon.titan-embed-text-v2:0"
"cohere.embed-multilingual-v3"
"cohere.embed-english-v3"
```

`rerankingModelId`는 재순위에 사용되는 모델입니다. 현재 다음 모델이 지원됩니다: (기본값은 `null`)

```
"amazon.rerank-v1:0"
"cohere.rerank-v3-5:0"
```

`queryDecompositionEnabled`는 쿼리 분해를 활성화합니다. (기본값은 `false`)

변경 후 `npm run cdk:deploy`로 재배포하여 변경사항을 적용합니다. Knowledge Base는 `modelRegion`에 지정된 지역에 배포됩니다. 다음 사항에 유의하세요:

- `modelRegion` 지역의 `modelIds`에 최소 하나의 모델이 정의되어야 합니다.
- `embeddingModelId` 모델이 `modelRegion` 지역의 Bedrock에서 활성화되어야 합니다.
- `rerankingModelId` 모델이 `modelRegion` 지역의 Bedrock에서 활성화되어야 합니다.
- `npm run cdk:deploy`를 실행하기 전에 `modelRegion` 지역에서 AWS CDK Bootstrap이 완료되어야 합니다.

```bash
# Bootstrap 명령 예제 (modelRegion이 us-east-1인 경우)
npx -w packages/cdk cdk bootstrap --region us-east-1
```

배포 중에 `/packages/cdk/rag-docs/docs`에 저장된 데이터는 Knowledge Base 데이터 소스용 S3 버킷에 자동으로 업로드됩니다. (`logs`로 시작하는 파일은 동기화되지 않습니다.)

> [!NOTE]
> 기본적으로 Amazon Bedrock 사용자 가이드(일본어)와 Amazon Nova 사용자 가이드(영어)가 샘플 데이터로 `/packages/cdk/rag-docs/docs`에 저장되어 있습니다.

배포가 완료된 후 다음 단계에 따라 Knowledge Base 데이터 소스를 동기화합니다:

1. [Knowledge Base 콘솔](https://console.aws.amazon.com/bedrock/home#/knowledge-bases) 열기
2. generative-ai-use-cases-jp 클릭
3. s3-data-source를 선택하고 Sync 클릭

Status가 Available이 되면 프로세스가 완료됩니다. S3에 저장된 파일이 수집되어 Knowledge Base를 통해 검색할 수 있습니다.

> [!NOTE]
> RAG Chat (Knowledge Base)를 활성화한 후 다시 비활성화하려면 `ragKnowledgeBaseEnabled: false`로 설정하고 재배포합니다. 이렇게 하면 RAG Chat (Knowledge Base)가 비활성화되지만 `RagKnowledgeBaseStack` 자체는 남아있습니다. 완전히 제거하려면 관리 콘솔을 열고 modelRegion의 CloudFormation에서 `RagKnowledgeBaseStack` 스택을 삭제하세요.

#### 고급 파싱 활성화

[고급 파싱 기능](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking-parsing.html#kb-advanced-parsing)을 활성화할 수 있습니다. 고급 파싱은 파일의 테이블과 그래프와 같은 비구조화된 데이터에서 정보를 분석하고 추출하는 기능입니다. 파일의 텍스트 외에 테이블과 그래프에서 추출된 데이터를 추가하여 RAG 정확도를 향상시킬 수 있습니다.

- `ragKnowledgeBaseAdvancedParsing`: 고급 파싱을 활성화하려면 `true`로 설정
- `ragKnowledgeBaseAdvancedParsingModelId`: 정보 추출에 사용되는 모델 ID 지정
  - 지원되는 모델 (2024/08 기준)
    - `anthropic.claude-3-sonnet-20240229-v1:0`
    - `anthropic.claude-3-haiku-20240307-v1:0`

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    ragKnowledgeBaseEnabled: true,
    ragKnowledgeBaseId: 'XXXXXXXXXX',
    ragKnowledgeBaseStandbyReplicas: false,
    ragKnowledgeBaseAdvancedParsing: true,
    ragKnowledgeBaseAdvancedParsingModelId:
      'anthropic.claude-3-sonnet-20240229-v1:0',
    embeddingModelId: 'amazon.titan-embed-text-v2:0',
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "ragKnowledgeBaseEnabled": true,
    "ragKnowledgeBaseId": "XXXXXXXXXX",
    "ragKnowledgeBaseStandbyReplicas": false,
    "ragKnowledgeBaseAdvancedParsing": true,
    "ragKnowledgeBaseAdvancedParsingModelId": "anthropic.claude-3-sonnet-20240229-v1:0",
    "embeddingModelId": "amazon.titan-embed-text-v2:0"
  }
}
```

#### 청킹 전략 변경

[rag-knowledge-base-stack.ts](/packages/cdk/lib/rag-knowledge-base-stack.ts)에는 chunkingConfiguration을 지정하는 섹션이 있습니다.
주석을 해제하고 [CDK 문서](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_bedrock.CfnDataSource.ChunkingConfigurationProperty.html) 또는 [CloudFormation 문서](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking-parsing.html)를 참조하여 원하는 청킹 전략으로 변경하세요.
