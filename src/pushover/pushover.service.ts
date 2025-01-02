import { Injectable } from '@nestjs/common';

@Injectable()
export class PushoverService {
  private readonly push: any;

  constructor() {
    const Push = require('pushover-notifications');
    this.push = new Push({
      token: process.env.PUSHOVER_KEY,
      user: process.env.PUSHOVER_USER,
    });
  }
  async sendNotification(data: {
    title: string;
    message: string;
  }): Promise<void> {
    const msg = {
      title: data.title,
      message: data.message,
    };

    return new Promise((resolve, reject) => {
      this.push.send(msg, (err: any, result: any) => {
        if (err) {
          console.error('Pushover notification error:', err);
          reject(err);
        } else {
          console.log('Pushover notification sent:', result);
          resolve(result);
        }
      });
    });
  }
}
