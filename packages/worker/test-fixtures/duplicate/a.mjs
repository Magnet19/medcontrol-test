export default {
  id: 'dup',
  name: 'A',
  description: 'a',
  formats: ['xlsx'],
  parametersSchema: null,
  async generate() { return '/tmp/a'; },
};
