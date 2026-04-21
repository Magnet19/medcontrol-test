export default {
  id: 'dup',
  name: 'B',
  description: 'b',
  formats: ['pdf'],
  parametersSchema: null,
  async generate() { return '/tmp/b'; },
};
