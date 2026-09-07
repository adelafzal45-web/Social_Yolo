import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Image Processing Backend API is Running 🚀';
  }
}
