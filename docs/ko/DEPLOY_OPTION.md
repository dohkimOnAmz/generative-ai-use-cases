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

예를 들어, 의미적 청킹으로 변경하려면 주석을 해제하고 다음과 같이 지정합니다:

```typescript
// packages/cdk/lib/rag-knowledge-base-stack.ts
// 의미적 청킹
chunkingConfiguration: {
  chunkingStrategy: 'SEMANTIC',
  semanticChunkingConfiguration: {
    maxTokens: 300,
    bufferSize: 0,
    breakpointPercentileThreshold: 95,
  },
},
```

그런 다음 [변경사항 적용을 위한 Knowledge Base 또는 OpenSearch Service 재생성](./DEPLOY_OPTION.md#recreating-knowledge-base-or-opensearch-service-to-apply-changes) 장을 참조하여 변경사항을 적용합니다.

#### 변경사항 적용을 위한 Knowledge Base 또는 OpenSearch Service 재생성

[Knowledge Base 청킹 전략](./DEPLOY_OPTION.md#changing-chunking-strategy) 또는 다음 OpenSearch Service 매개변수의 경우, 변경 후 `npm run cdk:deploy`를 실행해도 변경사항이 반영되지 않습니다:

- `embeddingModelId`
- `ragKnowledgeBaseStandbyReplicas`
- `ragKnowledgeBaseAdvancedParsing`
- `ragKnowledgeBaseAdvancedParsingModelId`

변경사항을 적용하려면 다음 단계에 따라 기존 Knowledge Base 관련 리소스를 삭제하고 재생성합니다:

1. `ragKnowledgeBaseEnabled`를 false로 설정하고 배포
2. [CloudFormation](https://console.aws.amazon.com/cloudformation/home) 열기 (지역 확인), RagKnowledgeBaseStack 클릭
3. 우측 상단의 Delete를 클릭하여 RagKnowledgeBaseStack 삭제  
   **이렇게 하면 S3 버킷과 RAG 파일이 삭제되어 일시적으로 RAG 채팅을 사용할 수 없게 됩니다**
4. 매개변수 또는 청킹 전략 변경
5. RagKnowledgeBaseStack 삭제가 완료된 후 `npm run cdk:deploy`로 재배포

RagKnowledgeBaseStack 삭제와 함께 **RAG 채팅용 S3 버킷과 그 안에 저장된 RAG 파일이 삭제됩니다**.
S3 버킷에 RAG 파일을 업로드한 경우 백업하고 재배포 후 다시 업로드하세요.
또한 앞서 언급한 단계에 따라 데이터 소스를 다시 동기화하세요.

#### 관리 콘솔에서 OpenSearch Service 인덱스 확인 방법

기본적으로 관리 콘솔에서 OpenSearch Service의 Indexes 탭을 열면 `User does not have permissions for the requested resource`라는 오류 메시지가 표시됩니다.
이는 데이터 액세스 정책이 관리 콘솔에 로그인한 IAM 사용자를 허용하지 않기 때문입니다.
다음 단계에 따라 필요한 권한을 수동으로 추가하세요:

1. [OpenSearch Service](https://console.aws.amazon.com/aos/home?#opensearch/collections) 열기 (지역 확인), generative-ai-use-cases-jp 클릭
2. 페이지 하단의 generative-ai-use-cases-jp라는 Associated policy 클릭
3. 우측 상단의 Edit 클릭
4. 페이지 중간의 Select principals 섹션에서 Add principals 클릭, IAM User/Role 등 (관리 콘솔에 로그인한 권한) 추가
5. Save

저장 후 잠시 기다린 다음 다시 액세스해 보세요.

#### 메타데이터 필터 구성

필터 설정은 [packages/common/src/custom/rag-knowledge-base.ts](/packages/common/src/custom/rag-knowledge-base.ts)에서 구성할 수 있습니다. 필요에 따라 사용자 정의하세요.

- `dynamicFilters`: 애플리케이션 측에서 동적으로 필터를 생성하고 적용합니다. (예: 부서와 같은 사용자 속성을 기반으로 필터 생성 및 적용) 현재 Claude Sonnet 3.5만 지원합니다. (할당량으로 인해 스로틀링이 발생할 수 있음) Cognito Groups 또는 SAML IdP Groups를 Attributes에 매핑하여 사용할 수도 있습니다. (자세한 내용은 [Microsoft Entra ID와 SAML 통합](./SAML_WITH_ENTRA_ID.md) 참조)
- `implicitFilters`: 지정된 경우 LLM이 사용자 질문을 기반으로 지정된 메타데이터에 대한 필터를 생성하고 적용합니다. (예: 사용자 질문에 언급된 연도로 필터링하여 해당 연도의 데이터만 검색) 빈 배열인 경우 필터가 적용되지 않습니다.
- `hiddenStaticExplicitFilters`: 애플리케이션 수준에서 필터를 적용합니다. (예: 기밀로 분류된 데이터 제외)
- `userDefinedExplicitFilters`: 애플리케이션 UI에 표시되는 필터를 정의합니다.

### Agent Chat 사용 사례 활성화

Agent Chat 사용 사례에서는 다음을 수행할 수 있습니다:

- 데이터 시각화, 코드 실행, 데이터 분석을 위한 Code Interpreter 사용
- Amazon Bedrock용 Agents를 사용한 작업 실행
- Amazon Bedrock용 Knowledge Bases의 벡터 데이터베이스 참조

Agents는 `modelRegion`에 지정된 지역에 생성됩니다. 아래에 언급된 `agentEnabled: true` 옵션은 Code Interpreter 에이전트와 검색 에이전트를 생성하기 위한 것입니다. 수동으로 생성된 Agents를 추가할 때는 `agentEnabled: true`가 필요하지 않습니다.

#### Code Interpreter Agent 배포

Code Interpreter를 사용하여 데이터 시각화, 코드 실행, 데이터 분석 등을 수행할 수 있습니다.

Code Interpreter 에이전트는 Agent를 활성화할 때 배포됩니다.

`agentEnabled`를 `true`로 설정합니다. (기본값은 `false`)

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    agentEnabled: true,
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "agentEnabled": true
  }
}
```

#### Search Agent 배포

API에 연결하여 최신 정보를 참조하여 응답하는 Agent를 생성합니다. Agent를 사용자 정의하여 다른 작업을 추가하고 여러 Agent를 생성하여 전환할 수 있습니다.

사용 가능한 기본 검색 에이전트는 [Brave Search API의 Data for AI](https://brave.com/search/api/) 또는 [Tavily의 Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search)입니다. 다른 API와 함께 사용할 수 있도록 API를 사용자 정의하는 것도 가능합니다. Brave Search API는 무료 플랜에서도 신용카드 설정이 필요합니다.

> [!NOTE]
> Agent Chat 사용 사례를 활성화하면 Agent Chat 사용 사례에서만 외부 API로 데이터를 전송합니다. (기본적으로 Brave Search API 또는 Tavily Search) 다른 사용 사례는 AWS 내에서 완전히 계속 사용할 수 있습니다. 활성화하기 전에 내부 정책과 API 서비스 약관을 확인하세요.

`agentEnabled`와 `searchAgentEnabled`를 `true`로 설정하고 (기본값은 `false`) 필수 필드를 설정합니다.

- `searchEngine`: 사용할 검색 엔진을 지정합니다. `Brave` 또는 `Tavily`를 사용할 수 있습니다.
- `searchApiKey`: 검색 엔진의 API 키를 지정합니다.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    agentEnabled: true,
    searchAgentEnabled: true,
    searchEngine: 'Brave' or 'Tavily',
    searchApiKey: '<Search Engine API Key>',
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "agentEnabled": true,
    "searchAgentEnabled": true,
    "searchEngine": "Brave" or "Tavily",
    "searchApiKey": "<Search Engine API Key>"
  }
}
```

변경 후 `npm run cdk:deploy`로 재배포하여 변경사항을 적용합니다. 이렇게 하면 기본 검색 엔진 Agent가 배포됩니다.

> [!NOTE]
> 검색 에이전트를 활성화한 후 비활성화하려면 `searchAgentEnabled: false`로 설정하고 재배포합니다. 이렇게 하면 검색 에이전트가 비활성화되지만 `WebSearchAgentStack` 자체는 남아있습니다. 완전히 제거하려면 관리 콘솔을 열고 `modelRegion`의 CloudFormation에서 `WebSearchAgentStack` 스택을 삭제하세요.

#### 수동으로 생성된 Agents 추가

기본 Agents 외에 수동으로 생성된 Agents를 등록하려면 `agents`에 추가 Agents를 추가합니다. Agents는 `modelRegion`에 생성되어야 합니다.

> [!NOTE]
> `agentEnabled: true`는 Code Interpreter 에이전트와 검색 에이전트를 생성하는 옵션이므로 수동으로 생성된 Agents를 추가할 때는 필요하지 않습니다.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    agents: [
      {
        displayName: 'MyCustomAgent',
        agentId: 'XXXXXXXXX',
        aliasId: 'YYYYYYYY',
      },
    ],
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "agents": [
      {
        "displayName": "MyCustomAgent",
        "agentId": "XXXXXXXXX",
        "aliasId": "YYYYYYYY"
      }
    ]
  }
}
```

`packages/cdk/lib/construct/agent.ts`를 수정하여 새 Agents를 정의할 수도 있습니다. CDK에서 정의된 Agents를 사용하는 경우 `agentEnabled: true`로 설정합니다.

#### Amazon Bedrock Agent용 Knowledge Bases 배포

Amazon Bedrock용 Knowledge Bases와 통합되는 에이전트를 수동으로 생성하고 등록할 수도 있습니다.

먼저 [Amazon Bedrock용 Knowledge Bases 문서](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-create.html)를 참조하여 [지식 베이스 AWS 콘솔](https://console.aws.amazon.com/bedrock/home?#/knowledge-bases)에서 지식 베이스를 생성합니다. `modelRegion`과 동일한 지역에 생성합니다.

다음으로 [에이전트 AWS 콘솔](https://console.aws.amazon.com/bedrock/home?#/agents)에서 Agent를 수동으로 생성합니다. 설정은 대부분 기본값으로 유지하고, Agent 프롬프트에는 아래 예제를 참조하여 프롬프트를 입력합니다. 작업 그룹은 설정하지 않고 진행하여 이전 단계에서 생성한 지식 베이스를 등록하고 아래 예제를 참조하여 프롬프트를 입력합니다.
```
Agent 프롬프트 예제: 당신은 지시에 응답하는 어시스턴트입니다. 지시에 따라 정보를 검색하고 내용을 바탕으로 적절히 응답하세요. 정보에 언급되지 않은 것에 대해서는 답변하지 마세요. 여러 번 검색할 수 있습니다.
Knowledge Base 프롬프트 예제: 키워드로 검색하여 정보를 얻습니다. 연구, X에 대해 묻기, 요약과 같은 작업에 사용할 수 있습니다. 대화에서 검색 키워드를 추측하세요. 검색 결과에는 관련성이 낮은 내용이 포함될 수 있으므로 답변할 때는 관련성이 높은 내용만 참조하세요. 여러 번 실행할 수 있습니다.
```

생성된 Agent에서 Alias를 생성하고 `agentId`와 `aliasId`를 복사하여 다음 형식으로 추가합니다. `displayName`을 UI에 표시할 이름으로 설정합니다. 또한 `agentEnabled`를 `true`로 설정합니다.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    agentEnabled: true,
    agents: [
      {
        displayName: 'Knowledge Base',
        agentId: 'XXXXXXXXX',
        aliasId: 'YYYYYYYY',
      },
    ],
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "agentEnabled": true,
    "agents": [
      {
        "displayName": "Knowledge Base",
        "agentId": "XXXXXXXXX",
        "aliasId": "YYYYYYYY"
      }
    ]
  }
}
```

#### Agents 인라인 표시

기본적으로 Agents는 "Agent Chat" 사용 사례 내에서 선택할 수 있습니다. 인라인 표시 옵션을 활성화하면 "Agent Chat" 사용 사례가 더 이상 표시되지 않고 사용 가능한 모든 Agents가 다른 사용 사례처럼 표시됩니다. 유효한 Agents가 있을 때 `inlineAgents`를 `true`로 설정합니다.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    inlineAgents: true,
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "inlineAgents": true
  }
}
```

### MCP Chat 사용 사례 활성화

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/introduction)는 LLM 모델을 외부 데이터 및 도구와 연결하는 프로토콜입니다.
GenU에서는 [Strands Agents](https://strandsagents.com/latest/)를 사용하여 MCP 호환 도구를 실행하는 채팅 사용 사례를 제공합니다.
MCP 채팅 사용 사례를 활성화하려면 `docker` 명령을 실행할 수 있어야 합니다.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    mcpEnabled: true,
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "mcpEnabled": true
  }
}
```

사용할 MCP 서버는 [packages/cdk/mcp-api/mcp.json](/packages/cdk/mcp-api/mcp.json)에 정의됩니다.
기본적으로 정의된 것 외에 다른 도구를 추가하려면 mcp.json을 수정하세요.

**하지만 현재 MCP 서버와 그 구성에는 다음과 같은 제약이 있습니다:**

- MCP 서버는 AWS Lambda에서 실행되므로 파일 쓰기가 불가능합니다. (`/tmp`에 쓰기는 가능하지만 파일을 검색할 수 없습니다.)
- MCP 서버는 `uvx` 또는 `npx`로 실행 가능해야 합니다.
- MCP 클라이언트는 stdio만 사용할 수 있습니다.
- 현재 멀티모달 요청은 지원되지 않습니다.
- API 키를 동적으로 얻어 환경 변수로 설정하는 메커니즘이 아직 구현되지 않았습니다.
- 사용자가 사용할 MCP 서버를 선택하는 메커니즘이 아직 구현되지 않았습니다. (현재 mcp.json에 정의된 모든 도구가 사용됩니다.)
- mcp.json에서 `command`, `args`, `env`를 구성할 수 있습니다. 구체적인 예제는 다음과 같습니다:

```json
{
  "mcpServers": {
    "SERVER_NAME": {
      "command": "uvx",
      "args": ["SERVER_ARG"]
      "env": {
        "YOUR_API_KEY": "xxx"
      }
    }
  }
}
```

### Flow Chat 사용 사례 활성화

Flow Chat 사용 사례에서는 생성된 Flows를 호출할 수 있습니다.

`flows` 배열을 추가하거나 편집합니다.

[Amazon Bedrock Flows AWS 콘솔](https://console.aws.amazon.com/bedrock/home#/flows)에서 Flows를 수동으로 생성합니다. 그런 다음 Alias를 생성하고 생성된 Flow의 `flowId`, `aliasId`, `flowName`을 추가합니다. `description`에는 사용자 입력을 유도하는 설명을 작성합니다. 이 설명은 Flow 채팅 텍스트 상자에 표시됩니다. 예제는 다음과 같습니다:

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    flows: [
      {
        flowId: 'XXXXXXXXXX',
        aliasId: 'YYYYYYYYYY',
        flowName: 'WhatIsItFlow',
        description:
          'This flow searches the web for any keyword and returns an explanation. Please enter text',
      },
    ],
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "flows": [
      {
        "flowId": "XXXXXXXXXX",
        "aliasId": "YYYYYYYYYY",
        "flowName": "WhatIsItFlow",
        "description": "This flow searches the web for any keyword and returns an explanation. Please enter text"
      },
      {
        "flowId": "ZZZZZZZZZZ",
        "aliasId": "OOOOOOOOOO",
        "flowName": "RecipeFlow",
        "description": "Creates a recipe based on the given JSON.\nPlease enter like {\"dish\": \"curry rice\", \"people\": 3}."
      },
      {
        "flowId": "PPPPPPPPPP",
        "aliasId": "QQQQQQQQQQQ",
        "flowName": "TravelPlanFlow",
        "description": "Creates a travel plan based on the given array.\nPlease enter like [{\"place\": \"Tokyo\", \"day\": 3}, {\"place\": \"Osaka\", \"day\": 2}]."
      }
    ]
  }
}
```

### Voice Chat 사용 사례 활성화

> [!NOTE]
> 음성 채팅의 응답 속도는 애플리케이션의 지역(GenerativeAiUseCasesStack이 배포된 지역)에 크게 영향을 받습니다. 응답에 지연이 있는 경우 사용자가 애플리케이션의 지역과 물리적으로 가까운 곳에 있는지 확인하세요.

`speechToSpeechModelIds`에 하나 이상의 모델을 정의하면 활성화됩니다.
`speechToSpeechModelIds`에 대해서는 [Amazon Bedrock 모델 변경](#change-amazon-bedrock-models)을 참조하세요.
기본값은 [packages/cdk/lib/stack-input.ts](/packages/cdk/lib/stack-input.ts)를 참조하세요.

### Image Generation 사용 사례 활성화

`imageGenerationModelIds`에 하나 이상의 모델을 정의하면 활성화됩니다.
`imageGenerationModelIds`에 대해서는 [Amazon Bedrock 모델 변경](#change-amazon-bedrock-models)을 참조하세요.
기본값은 [packages/cdk/lib/stack-input.ts](/packages/cdk/lib/stack-input.ts)를 참조하세요.

### Video Generation 사용 사례 활성화

`videoGenerationModelIds`에 하나 이상의 모델을 정의하면 활성화됩니다.
`videoGenerationModelIds`에 대해서는 [Amazon Bedrock 모델 변경](#change-amazon-bedrock-models)을 참조하세요.
기본값은 [packages/cdk/lib/stack-input.ts](/packages/cdk/lib/stack-input.ts)를 참조하세요.
### Video Analysis 사용 사례 활성화

비디오 분석 사용 사례에서는 비디오 이미지 프레임과 텍스트를 입력하여 LLM이 이미지 내용을 분석하도록 합니다.
비디오 분석 사용 사례를 활성화하는 직접적인 옵션은 없지만 매개변수에서 멀티모달 모델이 활성화되어야 합니다.

2025/03 기준으로 멀티모달 모델은 다음과 같습니다:

```
"anthropic.claude-3-5-sonnet-20241022-v2:0",
"anthropic.claude-3-5-sonnet-20240620-v1:0",
"anthropic.claude-3-opus-20240229-v1:0",
"anthropic.claude-3-sonnet-20240229-v1:0",
"anthropic.claude-3-haiku-20240307-v1:0",
"us.anthropic.claude-opus-4-20250514-v1:0",
"us.anthropic.claude-sonnet-4-20250514-v1:0",
"us.anthropic.claude-3-7-sonnet-20250219-v1:0",
"us.anthropic.claude-3-5-sonnet-20240620-v1:0",
"us.anthropic.claude-3-opus-20240229-v1:0",
"us.anthropic.claude-3-sonnet-20240229-v1:0",
"us.anthropic.claude-3-haiku-20240307-v1:0",
"eu.anthropic.claude-sonnet-4-20250514-v1:0",
"eu.anthropic.claude-3-7-sonnet-20250219-v1:0",
"eu.anthropic.claude-3-5-sonnet-20240620-v1:0",
"eu.anthropic.claude-3-sonnet-20240229-v1:0",
"eu.anthropic.claude-3-haiku-20240307-v1:0",
"apac.anthropic.claude-sonnet-4-20250514-v1:0",
"apac.anthropic.claude-3-7-sonnet-20250219-v1:0",
"apac.anthropic.claude-3-haiku-20240307-v1:0",
"apac.anthropic.claude-3-sonnet-20240229-v1:0",
"apac.anthropic.claude-3-5-sonnet-20240620-v1:0",
"apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
"us.meta.llama4-maverick-17b-instruct-v1:0",
"us.meta.llama4-scout-17b-instruct-v1:0",
"us.meta.llama3-2-90b-instruct-v1:0",
"us.meta.llama3-2-11b-instruct-v1:0",
"us.mistral.pixtral-large-2502-v1:0",
"eu.mistral.pixtral-large-2502-v1:0",
"amazon.nova-pro-v1:0",
"amazon.nova-lite-v1:0",
"us.amazon.nova-premier-v1:0",
"us.amazon.nova-pro-v1:0",
"us.amazon.nova-lite-v1:0",
"eu.amazon.nova-pro-v1:0",
"eu.amazon.nova-lite-v1:0",
"apac.amazon.nova-pro-v1:0",
"apac.amazon.nova-lite-v1:0"
```

이 중 최소 하나는 `modelIds`에 정의되어야 합니다.
자세한 내용은 [Amazon Bedrock 모델 변경](#change-amazon-bedrock-models)을 참조하세요.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    modelIds: ['anthropic.claude-3-sonnet-20240229-v1:0'],
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "modelIds": ["anthropic.claude-3-sonnet-20240229-v1:0"]
  }
}
```

### 프롬프트 최적화 도구 활성화

프롬프트 최적화 도구는 입력 프롬프트를 지정된 모델에 최적화된 형태로 변환합니다.
프롬프트 최적화 도구를 활성화하는 직접적인 옵션은 없지만 매개변수 설정이 다음 두 조건을 충족해야 합니다:

- `modelRegion`: Amazon Bedrock 프롬프트 최적화가 지원되는 지역
- `modelIds`: Amazon Bedrock 프롬프트 최적화에서 지원하는 모델이 최소 하나 지정됨

프롬프트 최적화 지원 상태는 [이 링크](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management-optimize.html)를 참조하세요.

### 특정 사용 사례 숨기기

다음 옵션으로 사용 사례를 숨길 수 있습니다.
지정하지 않거나 false로 설정하면 사용 사례가 표시됩니다.

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    hiddenUseCases: {
      generate: true, // 텍스트 생성 숨기기
      summarize: true, // 요약 숨기기
      writer: true, // 글쓰기 숨기기
      translate: true, // 번역 숨기기
      webContent: true, // 웹 콘텐츠 추출 숨기기
      image: true, // 이미지 생성 숨기기
      video: true, // 비디오 생성 숨기기
      videoAnalyzer: true, // 비디오 분석 숨기기
      diagram: true, // 다이어그램 생성 숨기기
      meetingMinutes: true, // 회의록 생성 숨기기
      voiceChat: true, // 음성 채팅 숨기기
    },
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "hiddenUseCases": {
      "generate": true,
      "summarize": true,
      "writer": true,
      "translate": true,
      "webContent": true,
      "image": true,
      "video": true,
      "videoAnalyzer": true,
      "diagram": true,
      "meetingMinutes": true,
      "voiceChat": true
    }
  }
}
```

## Use Case Builder 구성

Use Case Builder는 기본적으로 활성화되어 있으며 배포 후 화면에 표시되는 "Builder Mode" 옵션에서 액세스할 수 있습니다. Use Case Builder를 비활성화하려면 매개변수 `useCaseBuilderEnabled`에 `false`를 지정합니다. (기본값은 `true`)

**[parameter.ts](/packages/cdk/parameter.ts) 편집**

```typescript
// parameter.ts
const envs: Record<string, Partial<StackInput>> = {
  dev: {
    useCaseBuilderEnabled: false,
  },
};
```

**[packages/cdk/cdk.json](/packages/cdk/cdk.json) 편집**

```json
// cdk.json
{
  "context": {
    "useCaseBuilderEnabled": false
  }
}
```

## Amazon Bedrock 모델 변경

`parameter.ts` 또는 `cdk.json`에서 `modelRegion`, `modelIds`, `imageGenerationModelIds`, `videoGenerationModelIds`, `speechToSpeechModelIds`를 사용하여 모델 지역과 모델을 지정합니다. `modelIds`, `imageGenerationModelIds`, `videoGenerationModelIds`, `speechToSpeechModelIds`의 경우 지정된 지역에서 사용 가능한 모델 중에서 사용하려는 모델 목록을 지정합니다. AWS 문서에서 [모델 목록](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)과 [지역별 모델 지원](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html)을 제공합니다.

이 솔루션은 [교차 지역 추론](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference-support.html) 모델도 지원합니다. 교차 지역 추론 모델은 `{us|eu|apac}.{model-provider}.{model-name}`으로 표현되며 `{us|eu|apac}` 접두사가 modelRegion에 지정된 지역과 일치해야 합니다.

(예) `modelRegion`이 `us-east-1`인 경우 `us.anthropic.claude-3-5-sonnet-20240620-v1:0`은 가능하지만 `eu.anthropic.claude-3-5-sonnet-20240620-v1:0`은 불가능합니다.

이 솔루션은 다음 텍스트 생성 모델을 지원합니다:

```
"anthropic.claude-3-5-sonnet-20241022-v2:0",
"anthropic.claude-3-5-haiku-20241022-v1:0",
"anthropic.claude-3-5-sonnet-20240620-v1:0",
"anthropic.claude-3-opus-20240229-v1:0",
"anthropic.claude-3-sonnet-20240229-v1:0",
"anthropic.claude-3-haiku-20240307-v1:0",
"us.anthropic.claude-opus-4-20250514-v1:0",
"us.anthropic.claude-sonnet-4-20250514-v1:0",
"us.anthropic.claude-3-7-sonnet-20250219-v1:0",
"us.anthropic.claude-3-5-sonnet-20241022-v2:0",
"us.anthropic.claude-3-5-haiku-20241022-v1:0",
"us.anthropic.claude-3-5-sonnet-20240620-v1:0",
"us.anthropic.claude-3-opus-20240229-v1:0",
"us.anthropic.claude-3-sonnet-20240229-v1:0",
"us.anthropic.claude-3-haiku-20240307-v1:0",
"eu.anthropic.claude-sonnet-4-20250514-v1:0",
"eu.anthropic.claude-3-7-sonnet-20250219-v1:0",
"eu.anthropic.claude-3-5-sonnet-20240620-v1:0",
"eu.anthropic.claude-3-sonnet-20240229-v1:0",
"eu.anthropic.claude-3-haiku-20240307-v1:0",
"apac.anthropic.claude-sonnet-4-20250514-v1:0",
"apac.anthropic.claude-3-7-sonnet-20250219-v1:0",
"apac.anthropic.claude-3-haiku-20240307-v1:0",
"apac.anthropic.claude-3-sonnet-20240229-v1:0",
"apac.anthropic.claude-3-5-sonnet-20240620-v1:0",
"apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
"us.deepseek.r1-v1:0",
"us.writer.palmyra-x5-v1:0",
