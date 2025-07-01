import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CfnApplicationInferenceProfile,
  FoundationModel,
} from 'aws-cdk-lib/aws-bedrock';
import { ProcessedStackInput } from './stack-input';

export interface ApplicationInferenceProfileStackProps extends StackProps {
  readonly params: ProcessedStackInput;
}

export class ApplicationInferenceProfileStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ApplicationInferenceProfileStackProps
  ) {
    super(scope, id, props);
    const params = props.params;
    const currentRegion = props.env?.region;

    for (const modelId of params.modelIds) {
      if (
        modelId.region === currentRegion &&
        !modelId.modelId.startsWith('us.') &&
        !modelId.modelId.startsWith('apac.') &&
        !modelId.modelId.startsWith('eu.')
      ) {
        const inferenceProfileNamePrefix = modelId.modelId
          .replace(/\./g, '-')
          .replace(/:/g, '-');
        const model = FoundationModel.fromFoundationModelId(
          this,
          `FoundationModel${inferenceProfileNamePrefix}`,
          {
            modelId: modelId.modelId,
          }
        );
        // const applicationInferenceProfile = new CfnApplicationInferenceProfile(
        new CfnApplicationInferenceProfile(
          this,
          `ApplicationInferenceProfile${model.modelId}`,
          {
            inferenceProfileName: `${inferenceProfileNamePrefix}${params.env}`,
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
    }

    console.log(params.modelIds);
    // console.log(params.imageGenerationModelIds);
    // console.log(params.videoGenerationModelIds);
    // console.log(params.speechToSpeechModelIds);
    console.log(params.region);
    console.log(params.account);
  }
}
