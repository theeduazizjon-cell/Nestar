import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberService {
    public async signup(): Promise<string> {
        return 'signup excecuted';
    }

    public async login(): Promise<string> {
        return 'login excecuted';
    }

    public async updateMember(): Promise<string> {
        return 'updateMember excecuted';
    }

    public async getMember(): Promise<string> {
        return 'getMember excecuted';
    }
}
