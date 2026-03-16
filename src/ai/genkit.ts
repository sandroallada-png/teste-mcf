// @ts-nocheck
'use server';

import {genkit, googleAI} from 'genkit';
import {genkitEval} from 'genkitx-eval';
import {googleCloud} from 'genkitx-google-cloud';

const projectId = process.env.GCLOUD_PROJECT;

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
    genkitEval(),
    ...(projectId
      ? [
          googleCloud({
            projectId,
          }),
        ]
      : []),
  ],
  flowStateStore: 'googleCloud',
  traceStore: 'googleCloud',
  evaluator: 'genkit-eval-google-cloud',
});
