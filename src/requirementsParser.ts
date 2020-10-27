import BotcmdPlugin from './index';

export default class AttachmentParser {
  botcmdPlugin: BotcmdPlugin;
  requirementsTypes = new Map<string, any>();

  constructor(botcmdPlugin) {
    this.botcmdPlugin = botcmdPlugin;
    this.add('chat', ctx => ctx.isChat ? [false, null] : [true, '💬 Эту команду можно использовать только в конференциях.']);
    this.add('ls', ctx => ctx.isChat ? [true, '💬 Эту команду можно использовать только в личных сообщениях.'] : [false, null]);
  }

  add(slug: string, func: any) {
    if (this.requirementsTypes[slug]) {
      throw Error(`Type '${slug}' already exists.`);
    }

    this.requirementsTypes[slug] = func;
    return this;
  }

  get(slug: string) {
    const func = this.requirementsTypes[slug];
    if (!func) {
      throw Error(`Type ${slug} not found.`);
    }

    return func;
  }

  processRequirement(ctx, requirement) {
    const func = this.get(requirement.type);
    return func(ctx, requirement);
  }

  async parse (ctx) {
    const entries: [string, any][] = Object.entries(ctx.command.requirements);
    const results = await Promise.all(entries.map(v => this.processRequirement(ctx, v[1])));
    const isFail = results.find((v, i) => !entries[i][1].optional && v[0]);
    if (isFail) {
      return isFail;
    }

    return [
      false,
      Object.fromEntries(entries.map((v, i) => [v[0], results[i][1]]).filter((v, i) => !results[i][0]))
    ];
  }
}
