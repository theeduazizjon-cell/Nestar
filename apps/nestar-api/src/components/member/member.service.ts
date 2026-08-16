import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MemberService {
    constructor(@InjectModel("Member") private readonly memberModel: Model<null>) {}

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


