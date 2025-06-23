import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ProcessedStackInput } from './stack-input';
import { aws_bedrock as bedrock } from 'aws-cdk-lib';

export interface ModelInferenceProfilesStackProps extends StackProps {
  readonly params: ProcessedStackInput;
}

export class ModelInferenceProfilesStack extends Stack {
  private inferenceProfiles: Record<
    string,
    bedrock.CfnApplicationInferenceProfile
  > = {};

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
          `Model${modelId.modelId.replace(/[.:]/g, '-')}`,
          {
            modelId: modelId.modelId,
          }
        );

        const inferenceProfile = new bedrock.CfnApplicationInferenceProfile(
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
        this.inferenceProfiles[modelId.modelId] = inferenceProfile;
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
          `Model${modelId.modelId.replace(/[.:]/g, '-')}`,
          {
            modelId: modelId.modelId,
          }
        );

        const inferenceProfile = new bedrock.CfnApplicationInferenceProfile(
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
        this.inferenceProfiles[modelId.modelId] = inferenceProfile;
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
          `Model${modelId.modelId.replace(/[.:]/g, '-')}`,
          {
            modelId: modelId.modelId,
          }
        );

        const inferenceProfile = new bedrock.CfnApplicationInferenceProfile(
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
        this.inferenceProfiles[modelId.modelId] = inferenceProfile;
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
          `Model${modelId.modelId.replace(/[.:]/g, '-')}`,
          {
            modelId: modelId.modelId,
          }
        );

        const inferenceProfile = new bedrock.CfnApplicationInferenceProfile(
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
        this.inferenceProfiles[modelId.modelId] = inferenceProfile;
      }
    });
  }

  getInferenceProfileId(modelId: string): string {
    const inferenceProfile = this.inferenceProfiles[modelId];
    if (inferenceProfile) {
      return inferenceProfile.attrInferenceProfileId;
    }
    // For cross-region models, return the original modelId
    else {
      return modelId;
    }
  }
}
