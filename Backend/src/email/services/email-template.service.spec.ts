import { EmailTemplateService } from './email-template.service';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn(async (entity) => ({ id: 'tpl-1', ...entity })),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    };
    service = new EmailTemplateService(mockRepo);
  });

  it('should interpolate dynamic variables correctly', () => {
    const template = '<h1>Hello {{user.name}}!</h1><p>Enjoy {{offer.discount}} off with code {{offer.code}}</p>';
    const context = {
      user: { name: 'Sarah Connor' },
      offer: { discount: '50%', code: 'CYBER50' },
    };

    const result = service.render(template, context);
    expect(result).toBe('<h1>Hello Sarah Connor!</h1><p>Enjoy 50% off with code CYBER50</p>');
  });

  it('should leave unmatched variables intact', () => {
    const template = 'Hello {{user.name}}, your code is {{unknown.code}}';
    const context = { user: { name: 'Alex' } };
    const result = service.render(template, context);
    expect(result).toBe('Hello Alex, your code is {{unknown.code}}');
  });
});
