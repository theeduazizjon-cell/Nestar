import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginInput, MemberInput } from '../../libs/types/dto/member/member.input';
import { Member } from '../../libs/types/dto/member/member';
import { MemberStatus } from '../../libs/types/enums/member.enum';
import { Message } from '../../libs/types/enums/common.enum';
import { AuthService } from '../auth/auth/auth.service';
import { ObjectId } from 'mongoose';
import { MemberUpdate } from '../../libs/types/dto/member/member.update';
import { T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/types/enums/view.enum';

@Injectable()
export class MemberService {
    constructor(@InjectModel("Member") private readonly memberModel: Model<Member>,
    private authService: AuthService,
    private viewService: ViewService,
) {}

    public async signup(input: MemberInput): Promise<Member> {
        // Password hashing |
        input.memberPassword = await this.authService.hashPassword(input.memberPassword);
        try {
        const result = await this.memberModel.create(input);
        // Authentication via TOKEN | 
        const accessToken = await this.authService.createToken(result);
        return result;
        }catch(err){
            console.log("Error, Service.model:", err.message);
            throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
        }
    }

    public async login(input: LoginInput): Promise<Member> {
        const {memberNick, memberPassword} = input;
        const response: Member = await this.memberModel
        .findOne({memberNick: memberNick})
        .select('+memberPassword')
        .exec();

        if(!response || response.memberStatus === MemberStatus.DELETE) {
            throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
        } else if(response.memberStatus === MemberStatus.BLOCK) {
            throw new InternalServerErrorException(Message.BLOCKED_USER);
        }

        // Comparing passwords |
        const isMatch = await this.authService.comparePassword(input.memberPassword, response.memberPassword);
        if(!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);
        response.accessToken = await this.authService.createToken(response);

        return response; 
    }

    public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
        const result: Member | null = await this.memberModel
            .findOneAndUpdate(
                {
                    _id: memberId,
                    memberStatus: MemberStatus.ACTIVE,
                },
                input,
                { new: true },
            )
            .exec();
        if (!result) throw new InternalServerErrorException(Message.UPLOAD_FAILED);

        result.accessToken = await this.authService.createToken(result);
        return result;
    }

    public async getMember(memberId: ObjectId, targetId: ObjectId): Promise<Member> {
        const search: T = {
            _id: targetId,
            memberStatus: {
                $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
            },
        };
        const targetMember = await this.memberModel.findOne(search).lean().exec();
        if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        if (memberId) {
            const viewInput = { memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER };
            const newView = await this.viewService.recordView(viewInput);
            if (newView) {
                await this.memberModel.findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true }).exec();
                targetMember.memberViews++;
            }
        }

        return targetMember;
    }

    public async getAllMembersByAdmin(): Promise<string> {
        return 'getAllMembersByAdmin executed!';
    }

    public async updateMemberByAdmin(): Promise<string> {
        return 'updateMemberByAdmin executed!';
    }
}


