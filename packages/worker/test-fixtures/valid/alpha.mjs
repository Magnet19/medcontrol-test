export default {
  id: 'alpha',
  name: 'Alpha',
  description: 'alpha report',
  formats: ['xlsx'],
  parametersSchema: null,
  async generate(ctx) {
    return `/tmp/${ctx.taskId}-alpha.xlsx`;
  },
};
