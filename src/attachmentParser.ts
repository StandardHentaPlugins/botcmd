import BotcmdPlugin from './index.js';

export default class AttachmentParser {
  botcmdPlugin: BotcmdPlugin;
  convertTypes = new Map<string, any>();
  history = {};

  constructor(botcmdPlugin) {
    this.botcmdPlugin = botcmdPlugin;
  }

  bindHistory() {
    this.botcmdPlugin.henta.vk.updates.on('message', (ctx, next) => {
      this.pushHistory(ctx.peerId, ctx.attachments);
      return next();
    });
  }

  getHistory(peerId) {
    return this.history[peerId] || [];
  }

  pushHistory(peerId, data) {
    const peerHistory = this.getHistory(peerId);
    peerHistory.push(...data);
    this.history[peerId] = peerHistory.splice(-20);
  }

  add(slug: string, func: () => {}) {
    if (this.convertTypes[slug]) {
      throw Error(`Type '${slug}' already exists.`);
    }

    this.convertTypes[slug] = func;
    return this;
  }

  get(slug: string) {
    const func = this.convertTypes[slug];
    if (!func) {
      throw Error(`Type ${slug} not found.`);
    }

    return func;
  }

  // Шайтан-машина требует рефакторинга.
  async parse (ctx, attList: Object, returnPromise = false) {
    if (!attList) {
      return;
    }

    const msgAttachs = [...ctx.attachments];
    if (ctx.hasReplyMessage) {
      msgAttachs.push(...ctx.replyMessage.attachments);
    }

    if (ctx.hasForwards) {
      ctx.forwards.forEach(v => msgAttachs.push(...v.attachments));
    }

    msgAttachs.push(...[...this.getHistory(ctx.peerId)].reverse());

    const params = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(attList)) {
      const attachment = msgAttachs.find(v => v.type === value.type);
      if (!attachment && !value.optional) {
        const atts = Object.values(attList);
        const names = {
          photo: 'Фотография',
          audio_message: 'Голосовое сообщение',
          sticker: 'Стикер'
        };

        return [true, [
          '📎 Эту команду нужно использовать с вложениями:',
          ...atts.map((v, i) => `${i + 1}) ${names[v.type] || v.type}.`)
        ].join('\n')];
      }

      msgAttachs.splice(msgAttachs.indexOf(attachment), 1);
      params[key] = value.to ? () => this.get(value.to)(attachment) : attachment;
      if (value.to && !returnPromise) {
        params[key] = await params[key];
      }
    }

    return [false, params];
  }
}
