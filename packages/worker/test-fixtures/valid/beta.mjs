export default {
  id: 'beta',
  name: 'Beta',
  description: 'beta report',
  formats: ['pdf'],
  parametersSchema: {
    period: { type: 'string', label: 'Period', required: false, default: 'week' },
  },
  async generate(ctx) {
    return `/tmp/${ctx.taskId}-beta.pdf`;
  },
};
