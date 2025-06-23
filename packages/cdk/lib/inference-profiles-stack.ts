import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ProcessedStackInput } from './stack-input';
import { aws_bedrock as bedrock } from 'aws-cdk-lib';

export interface ModelInferenceProfilesStackProps extends StackProps {
  readonly params: ProcessedStackInput;
}

export class ModelInferenceProfilesStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ModelInferenceProfilesStackProps
  ) {
    super(scope, id, props);
    const params = props.params;
    params.modelIds.forEach((modelId) => {
      if (
        modelId.region == props.env?.region &&
        !(
          // Exclude cross-region inference as inference profiles cannot be created in this case
          (
            modelId.modelId.startsWith('us.') ||
            modelId.modelId.startsWith('eu.') ||
            modelId.modelId.startsWith('apac.')
          )
        )
      ) {
        const model = bedrock.FoundationModel.fromFoundationModelId(
          this,
          'Model',
          {
            modelId: modelId.modelId,
          }
        );

        new bedrock.CfnApplicationInferenceProfile(
          this,
          `applicationInferenceProfile${modelId.modelId.replace(/[.:]/g, '-')}`,
          {
            inferenceProfileName: `${modelId.modelId.replace(/[.:]/g, '-')}GenU`,
            modelSource: {
              copyFrom: model.modelArn,
            },
            tags: [
              {
                key: 'Name',
                value: 'GenU',
              },
            ],
          }
        );
      }
    });

    params.imageGenerationModelIds.forEach((modelId) => {
      if (
        modelId.region == props.env?.region &&
        !(
          // Exclude cross-region inference as inference profiles cannot be created in this case
          (
            modelId.modelId.startsWith('us.') ||
            modelId.modelId.startsWith('eu.') ||
            modelId.modelId.startsWith('apac.')
          )
        )
      ) {
        const model = bedrock.FoundationModel.fromFoundationModelId(
          this,
          'Model',
          {
            modelId: modelId.modelId,
          }
        );

        new bedrock.CfnApplicationInferenceProfile(
          this,
          `applicationInferenceProfile${modelId.modelId.replace(/[.:]/g, '-')}`,
          {
            inferenceProfileName: `${modelId.modelId.replace(/[.:]/g, '-')}GenU`,
            modelSource: {
              copyFrom: model.modelArn,
            },
            tags: [
              {
                key: 'Name',
                value: 'GenU',
              },
            ],
          }
        );
      }
    });

    params.videoGenerationModelIds.forEach((modelId) => {
      if (
        modelId.region == props.env?.region &&
        !(
          // Exclude cross-region inference as inference profiles cannot be created in this case
          (
            modelId.modelId.startsWith('us.') ||
            modelId.modelId.startsWith('eu.') ||
            modelId.modelId.startsWith('apac.')
          )
        )
      ) {
        const model = bedrock.FoundationModel.fromFoundationModelId(
          this,
          'Model',
          {
            modelId: modelId.modelId,
          }
        );

        new bedrock.CfnApplicationInferenceProfile(
          this,
          `applicationInferenceProfile${modelId.modelId.replace(/[.:]/g, '-')}`,
          {
            inferenceProfileName: `${modelId.modelId.replace(/[.:]/g, '-')}GenU`,
            modelSource: {
              copyFrom: model.modelArn,
            },
            tags: [
              {
                key: 'Name',
                value: 'GenU',
              },
            ],
          }
        );
      }
    });

    params.speechToSpeechModelIds.forEach((modelId) => {
      if (
        modelId.region == props.env?.region &&
        !(
          // Exclude cross-region inference as inference profiles cannot be created in this case
          (
            modelId.modelId.startsWith('us.') ||
            modelId.modelId.startsWith('eu.') ||
            modelId.modelId.startsWith('apac.')
          )
        )
      ) {
        const model = bedrock.FoundationModel.fromFoundationModelId(
          this,
          'Model',
          {
            modelId: modelId.modelId,
          }
        );

        new bedrock.CfnApplicationInferenceProfile(
          this,
          `applicationInferenceProfile${modelId.modelId.replace(/[.:]/g, '-')}`,
          {
            inferenceProfileName: `${modelId.modelId.replace(/[.:]/g, '-')}GenU`,
            modelSource: {
              copyFrom: model.modelArn,
            },
            tags: [
              {
                key: 'Name',
                value: 'GenU',
              },
            ],
          }
        );
      }
    });
  }
}
