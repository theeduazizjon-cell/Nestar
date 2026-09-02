import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/types/dto/member/member.input';
import { Member, Members } from '../../libs/types/dto/member/member';
import { MemberStatus, MemberType } from '../../libs/types/enums/member.enum';
import { Message } from '../../libs/types/enums/common.enum';
import { AuthService } from '../auth/auth/auth.service';
import { ObjectId } from 'mongoose';
import { MemberUpdate } from '../../libs/types/dto/member/member.update';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/types/enums/view.enum';
import { Direction } from '../../libs/types/enums/common.enum';

// DEFINING APIS 


@Injectable()
export class MemberService {
    constructor(@InjectModel("Member") private readonly memberModel: Model<Member>,
    private authService: AuthService,
    private viewService: ViewService,
) {}

    // DEFINE 
    public async signup(input: MemberInput): Promise<Member> {
        // Password hashing |
        input.memberPassword = await this.authService.hashPassword(input.memberPassword);
        try {
        const result = await this.memberModel.create(input);
        // Authentication via TOKEN | 
        const accessToken = await this.authService.createToken(result);
        return result;
        }catch(err){
            console.log("Error, Service.model:", err instanceof Error ? err.message : err);
            throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
        }
    }

    // DEFINE
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

    // DEFINE 
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

    // DEFINE 
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

        // meLiked
        // meFollowed

        return targetMember;
    }

    // DEFINE 
    public async getAgents(memberId: ObjectId, input: AgentsInquiry): Promise<Members> {
        const { text } = input.search ?? {};
        const match: T = { memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE };
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
        console.log('match:', match);

        const result = await this.memberModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [{ $skip: (input.page! - 1) * input.limit! }, { $limit: input.limit! }],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();
        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }

    // DEFINE 
    public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
        const { memberStatus, memberType, text } = input.search ?? {};
        const match: T = {};
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        if (memberStatus) match.memberStatus = memberStatus;
        if (memberType) match.memberType = memberType;
        if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
        console.log('match:', match);

        const result = await this.memberModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [{ $skip: (input.page! - 1) * input.limit! }, { $limit: input.limit! }],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();
        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }

    // DEFINE 
    public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
        const result: Member | null = await this.memberModel
            .findOneAndUpdate({ _id: input._id }, input, { new: true })
            .exec();
        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
        return result;
    }

    public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
        const { _id, targetKey, modifier } = input;
        const result: Member | null = await this.memberModel
            .findByIdAndUpdate(
                { _id: _id },
                {
                    $inc: { [targetKey]: modifier },
                },
                { new: true },
            )
            .exec();
        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        return result;
    }
}


