import { createEmptyForm, createUid } from './elements';
import type { IssueForm } from './types';

export interface StarterTemplate {
  key: string;
  label: string;
  description: string;
  create: () => IssueForm;
}

const field = () => ({ uid: createUid(), description: '', required: false });

function bugReport(): IssueForm {
  return {
    settings: {
      name: 'Bug report',
      description: 'Report something that does not work as expected.',
      title: '[Bug]: ',
      labels: ['bug', 'triage'],
      assignees: [],
      projects: [],
      type: '',
    },
    elements: [
      {
        uid: createUid(),
        type: 'markdown',
        value: 'Thanks for taking the time to fill out this bug report!',
      },
      {
        ...field(),
        type: 'textarea',
        id: 'what-happened',
        label: 'What happened?',
        description: 'Also tell us what you expected to happen.',
        placeholder: 'Tell us what you see!',
        value: '',
        render: '',
        minLength: null,
        required: true,
      },
      {
        ...field(),
        type: 'textarea',
        id: 'steps',
        label: 'Steps to reproduce',
        placeholder: '1. Go to ...\n2. Click on ...\n3. See error',
        value: '',
        render: '',
        minLength: null,
        required: true,
      },
      {
        ...field(),
        type: 'input',
        id: 'version',
        label: 'Version',
        description: 'Which version are you running?',
        placeholder: 'e.g. 1.2.3',
        value: '',
        minLength: null,
      },
      {
        ...field(),
        type: 'dropdown',
        id: 'browsers',
        label: 'Which browsers are you seeing the problem on?',
        multiple: true,
        options: ['Firefox', 'Chrome', 'Safari', 'Microsoft Edge'],
        default: null,
      },
      {
        ...field(),
        type: 'textarea',
        id: 'logs',
        label: 'Relevant log output',
        description: 'Will be formatted as code automatically, no need for backticks.',
        placeholder: '',
        value: '',
        render: 'shell',
        minLength: null,
      },
      {
        ...field(),
        type: 'checkboxes',
        id: 'terms',
        label: 'Code of Conduct',
        description: 'By submitting this issue, you agree to follow our Code of Conduct.',
        options: [{ label: "I agree to follow this project's Code of Conduct", required: true }],
      },
    ],
  };
}

function featureRequest(): IssueForm {
  return {
    settings: {
      name: 'Feature request',
      description: 'Suggest an idea for this project.',
      title: '[Feature]: ',
      labels: ['enhancement'],
      assignees: [],
      projects: [],
      type: '',
    },
    elements: [
      {
        ...field(),
        type: 'textarea',
        id: 'problem',
        label: 'Is your feature request related to a problem?',
        description: 'A clear and concise description of what the problem is.',
        placeholder: "I'm always frustrated when ...",
        value: '',
        render: '',
        minLength: null,
        required: true,
      },
      {
        ...field(),
        type: 'textarea',
        id: 'solution',
        label: 'Describe the solution you would like',
        placeholder: '',
        value: '',
        render: '',
        minLength: null,
        required: true,
      },
      {
        ...field(),
        type: 'textarea',
        id: 'alternatives',
        label: 'Alternatives you have considered',
        placeholder: '',
        value: '',
        render: '',
        minLength: null,
      },
      {
        ...field(),
        type: 'dropdown',
        id: 'priority',
        label: 'How important is this for you?',
        multiple: false,
        options: ['Nice to have', 'Important', 'Critical'],
        default: 0,
      },
    ],
  };
}

function documentation(): IssueForm {
  return {
    settings: {
      name: 'Documentation',
      description: 'Report missing or wrong documentation.',
      title: '[Docs]: ',
      labels: ['documentation'],
      assignees: [],
      projects: [],
      type: '',
    },
    elements: [
      {
        ...field(),
        type: 'input',
        id: 'page',
        label: 'Page URL',
        description: 'Link to the page with the problem.',
        placeholder: 'https://',
        value: '',
        minLength: null,
        required: true,
      },
      {
        ...field(),
        type: 'textarea',
        id: 'problem',
        label: 'What is wrong or missing?',
        placeholder: '',
        value: '',
        render: '',
        minLength: null,
        required: true,
      },
      {
        ...field(),
        type: 'upload',
        id: 'screenshots',
        label: 'Screenshots',
        description: 'Optional screenshots that show the problem.',
        accept: '.png,.jpg,.jpeg,.gif',
      },
    ],
  };
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    key: 'blank',
    label: 'Blank form',
    description: 'Start from scratch.',
    create: createEmptyForm,
  },
  {
    key: 'bug',
    label: 'Bug report',
    description: 'Description, steps to reproduce, version, logs.',
    create: bugReport,
  },
  {
    key: 'feature',
    label: 'Feature request',
    description: 'Problem, proposed solution, alternatives.',
    create: featureRequest,
  },
  {
    key: 'docs',
    label: 'Documentation',
    description: 'Page URL, problem, screenshots.',
    create: documentation,
  },
];
