import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getAdminInfo(): string {
    return 'Admin module is working!';
  }
}
